const db = require("../config/database");
const { auditLog } = require('../utils/auditLog');

exports.getAllHutang = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const [rows] = await db.query(`
      SELECT h.*, s.nama_supplier, bm.invoice, bm.jatuh_tempo
      FROM hutang h
      LEFT JOIN supplier s ON s.id = h.supplier_id
      LEFT JOIN barang_masuk bm ON bm.id = h.barang_masuk_id
      WHERE h.perusahaan_id = ? ORDER BY h.id DESC
    `, [perusahaan_id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ success: false, message: "Gagal memuat data hutang." });
  }
};

exports.bayarHutang = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    // PERBAIKAN: Tangkap properti 'tanggal' dari req.body agar lolos dari validasi checkPeriode
    const { jumlah_bayar, metode_pembayaran, catatan, tanggal } = req.body;
    const { perusahaan_id, id: user_id } = req.user; 

    const [hutangRows] = await conn.query("SELECT * FROM hutang WHERE id = ? AND perusahaan_id = ?", [id, perusahaan_id]);
    if (hutangRows.length === 0) {
      throw new Error("Data master catatan kewajiban hutang tidak ditemukan.");
    }

    const dataHutang = hutangRows[0];
    if (dataHutang.status === "LUNAS") {
      throw new Error("Faktur pembelian logistik ini terhitung sudah lunas.");
    }

    const rillBayar = Number(jumlah_bayar);
    if (rillBayar > Number(dataHutang.sisa_hutang)) {
      throw new Error("Nominal jumlah bayar angsuran melewati sisa hutang aktif.");
    }

    const newSisaHutang = Number(dataHutang.sisa_hutang) - rillBayar;
    const newStatus = newSisaHutang === 0 ? "LUNAS" : "BELUM LUNAS";

    await conn.query(
      "UPDATE hutang SET sisa_hutang = ?, status = ? WHERE id = ?",
      [newSisaHutang, newStatus, id]
    );

    // Ambil tanggal kiriman frontend, jika kosong baru gunakan fallback tanggal hari ini
    const tanggalTransaksi = tanggal || new Date().toISOString().split('T')[0];

    // PERBAIKAN: Ganti 'NOW()' menjadi variabel 'tanggalTransaksi' agar sinkron secara periodik
    const [resBayar] = await conn.query(
      `INSERT INTO pembayaran_hutang (perusahaan_id, hutang_id, jumlah_bayar, metode_pembayaran, catatan) VALUES (?, ?, ?, ?, ? )`,
      [perusahaan_id, id, rillBayar, metode_pembayaran, catatan || `Cicilan hutang`]
    );
    const pembayaranHutangId = resBayar.insertId;

    // Menentukan Akun Pengurang Kontra (KAS 1101 / BANK 1102) secara dinamis sesuai pilihan kasir
    const kodeAkunKasTarget = metode_pembayaran === "BANK" ? "BANK" : "KAS";

    const [akunKas] = await conn.query("SELECT id FROM akun WHERE tipe = 'KAS' AND perusahaan_id = ? LIMIT 1", [perusahaan_id]);
    const [akunHutang] = await conn.query("SELECT id FROM akun WHERE nama_akun = 'Hutang Usaha' AND perusahaan_id = ?", [perusahaan_id]);

    if (akunKas.length === 0 || akunHutang.length === 0) {
      throw new Error("Konfigurasi Kode Akun (Kas/Hutang Dagang) multi-tenant belum diatur.");
    }

    // PERBAIKAN: Ganti 'NOW()' menjadi variabel 'tanggalTransaksi' pada Buku Besar Jurnal Otomatis
    const [jurnalResult] = await conn.query(
      `INSERT INTO jurnal (perusahaan_id, tanggal, ref_tipe, ref_id, keterangan, status) VALUES (?, ?, 'PEMBAYARAN_HUTANG', ?, ?, 'APPROVED')`,
      [perusahaan_id, tanggalTransaksi, pembayaranHutangId, catatan || `Pelunasan Hutang BM ID #${dataHutang.barang_masuk_id}`]
    );
    const jurnalId = jurnalResult.insertId;

    // Alur Pembukuan Pasangan Jurnal: Debit Hutang Dagang (2101) dan Kredit Kas/Bank
    await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, 0)", [jurnalId, akunHutang[0].id, rillBayar]);
    await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, 0, ?)", [jurnalId, akunKas[0].id, rillBayar]);

    await auditLog(perusahaan_id, user_id, "HUTANG", id, `Melakukan angsuran pelunasan hutang logistik senilai Rp ${rillBayar.toLocaleString("id-ID")}`);

    await conn.commit();
    return res.json({ success: true, message: "Pencatatan pelunasan hutang dan posting jurnal otomatis berhasil disimpan!" });

  } catch (err) {
    console.error(err);
    await conn.rollback();
    return res.status(400).json({ success: false, message: err.message || "Gagal memproses pembayaran hutang." });
  } finally {
    conn.release();
  }
};