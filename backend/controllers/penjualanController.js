const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const db = require("../config/database");
const { createJurnal } = require("../utils/jurnalhelper");
const { auditLog } = require("../utils/auditLog");

// Memanggil helper pajak secara aman
let getPPNAktif = async () => ({ tarif: 11, status: "AKTIF" });
try {
  const pajakHelper = require("../helpers/pajakHelper");
  if (pajakHelper && pajakHelper.getPPNAktif) {
    getPPNAktif = pajakHelper.getPPNAktif;
  }
} catch (e) {
  console.log("Menjalankan fallback PPN 11%");
}
// ==========================================================================
// 1. FITUR: TAMBAH PENJUALAN BARU
// ==========================================================================
exports.createPenjualan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { customer_id, metode_pembayaran, status_pembayaran, jatuh_tempo, items } = req.body;
    
    const perusahaan_id = req.user?.perusahaan_id || 1;
    let user_id = req.user?.id || req.user?.user_id || req.user;

    if (typeof user_id === 'object' && user_id !== null) {
      user_id = user_id.id || user_id.user_id || 1;
    }
    user_id = parseInt(user_id, 10) || 1;

    if (!items || items.length === 0) {
      throw new Error("Detail barang penjualan kosong.");
    }

    const invoice = "INV-" + Date.now();
    let subtotal = 0;
    let totalLaba = 0;

    for (const item of items) {
      const [barang] = await conn.query(
        "SELECT * FROM barang WHERE id = ? AND perusahaan_id = ?", 
        [item.barang_id, perusahaan_id]
      );
      
      if (barang.length === 0) {
        throw new Error("Barang tidak ditemukan atau bukan milik perusahaan Anda.");
      }

      const dataBarang = barang[0];
      if (dataBarang.status_barang !== "AKTIF") {
        throw new Error(`${dataBarang.nama_barang} berstatus NON-AKTIF.`);
      }
      if (dataBarang.stok < item.qty) {
        throw new Error(`Stok untuk barang ${dataBarang.nama_barang} tidak mencukupi.`);
      }

      const hargaJualAktif = Number(item.harga_jual || dataBarang.harga_jual);
      const hargaBeliAktif = Number(dataBarang.harga_beli || 0);

      subtotal += hargaJualAktif * Number(item.qty);
      totalLaba += (hargaJualAktif - hargaBeliAktif) * Number(item.qty);
    }

    // Ambil tarif PPN aktif milik perusahaan ini (dengan fallback 11% jika belum diatur)
    const ppnAktif = await getPPNAktif(conn, perusahaan_id);
    const tarifPPN = Number(ppnAktif?.tarif ?? 11);
    const totalPajak = Math.round(subtotal * (tarifPPN / 100) * 100) / 100;
    const grandTotal = subtotal + totalPajak;

    const isKredit = String(metode_pembayaran).toUpperCase() === "KREDIT" || String(status_pembayaran).toUpperCase() === "KREDIT" || String(status_pembayaran).toUpperCase() === "BELUM_LUNAS";
    // PERBAIKAN: kolom `status_pembayaran` di tabel `penjualan` bertipe VARCHAR(100),
    // bukan angka. Sebelumnya kode ini menyimpan 0/1 (angka) ke kolom teks tersebut,
    // sehingga nilainya tidak konsisten dengan konvensi status di tabel lain
    // (mis. `piutang.status` = 'BELUM_LUNAS'/'LUNAS'/'DIBATALKAN'). Sekarang disamakan.
    const stringStatusBayar = isKredit ? "BELUM_LUNAS" : "LUNAS";
    const stringMetodeBayar = isKredit ? "KREDIT" : (metode_pembayaran || "TUNAI");
    const cleanCustomerId = (customer_id && customer_id !== "0" && customer_id !== "") ? customer_id : null;

    const [resultPenjualan] = await conn.query(
      `INSERT INTO penjualan (perusahaan_id, invoice, customer_id, tanggal, dpp, subtotal, ppn_persen, ppn, total, metode_pembayaran, status_pembayaran, jatuh_tempo, status_transaksi) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
      [perusahaan_id, invoice, cleanCustomerId, subtotal, subtotal, tarifPPN, totalPajak, grandTotal, stringMetodeBayar, stringStatusBayar, (isKredit ? jatuh_tempo : null)]
    );
 
    const penjualanId = resultPenjualan.insertId;

    for (const item of items) {
      const [barang] = await conn.query("SELECT * FROM barang WHERE id = ?", [item.barang_id]);
      const dataBarang = barang[0];
      
      const hargaJualAktif = Number(item.harga_jual || dataBarang.harga_jual);
      const hargaBeliAktif = Number(dataBarang.harga_beli || 0);
      const itemSubtotal = hargaJualAktif * Number(item.qty);
      const itemLaba = (hargaJualAktif - hargaBeliAktif) * Number(item.qty);

      await conn.query(
        `INSERT INTO detail_penjualan (penjualan_id, barang_id, qty, harga_beli, harga_jual, subtotal, laba) 
         VALUES (?, ?, ?, ?, ?, ?, ? )`,
        [penjualanId, item.barang_id, item.qty, hargaBeliAktif, hargaJualAktif, itemSubtotal, itemLaba]
      );

      const stokSebelum = Number(dataBarang.stok);
      const stokSesudah = stokSebelum - Number(item.qty);

      await conn.query(
        "UPDATE barang SET stok = ? WHERE id = ? AND perusahaan_id = ?",
        [stokSesudah, item.barang_id, perusahaan_id]
      );

      await conn.query(
        `INSERT INTO histori_stok (barang_id, tipe, qty, stok_sebelum, stok_sesudah, keterangan) VALUES (?, 'KELUAR', ?, ?, ?, ?)`,
        [item.barang_id, item.qty, stokSebelum, stokSesudah, `Penjualan Invoice ${invoice}`]
      );
    }

    if (isKredit) {
      await conn.query(
        `INSERT INTO piutang (penjualan_id, customer_id, total_piutang, sisa_piutang, status, jatuh_tempo) 
         VALUES (?, ?, ?, ?, 'BELUM_LUNAS', ?)`,
        [penjualanId, cleanCustomerId, grandTotal, grandTotal, jatuh_tempo || null]
      );
    }

    // OTOMATISASI JURNAL DENGAN PENCARIAN FLEKSIBELL KODE AKUN
    if (typeof createJurnal === "function") {
      const [rowsKas] = await conn.query(
        "SELECT id, kode_akun FROM akun WHERE (tipe = 'KAS' OR kode_akun LIKE '141%' OR kode_akun LIKE '111%') AND (perusahaan_id = ? OR perusahaan_id IS NULL) LIMIT 1",
        [perusahaan_id]);
      const [rowsPendapatan] = await conn.query(
        "SELECT id, kode_akun FROM akun WHERE (tipe = 'PENDAPATAN' OR kode_akun LIKE '144%' OR kode_akun LIKE '411%') AND (perusahaan_id = ? OR perusahaan_id IS NULL) LIMIT 1",
        [perusahaan_id]);
      const [rowsPiutang] = await conn.query(
        "SELECT id, kode_akun FROM akun WHERE (nama_akun LIKE '%Piutang%' OR kode_akun LIKE '1411%' OR kode_akun LIKE '1112%') AND (perusahaan_id = ? OR perusahaan_id IS NULL) LIMIT 1",
        [perusahaan_id]);

      const akunKas = rowsKas[0] || { id: 1, kode_akun: "141001" };
      const akunPendapatan = rowsPendapatan[0] || { id: 2, kode_akun: "144001" };
      const akunPiutang = rowsPiutang[0] || { id: 3, kode_akun: "141101" };

      const akunJurnalRows = !isKredit
        ? [
          { akun_id: akunKas.id, kode_akun: akunKas.kode_akun, debit: grandTotal, kredit: 0 },
          { akun_id: akunPendapatan.id, kode_akun: akunPendapatan.kode_akun, debit: 0, kredit: grandTotal }
        ]
        : [
          { akun_id: akunPiutang.id, kode_akun: akunPiutang.kode_akun, debit: grandTotal, kredit: 0 },
          { akun_id: akunPendapatan.id, kode_akun: akunPendapatan.kode_akun, debit: 0, kredit: grandTotal }
        ];

      await createJurnal(conn, {
        tanggal: new Date(),
        ref_tipe: "PENJUALAN",
        ref_id: penjualanId,
        keterangan: `Penjualan Barang Dagang No. ${invoice}`,
        perusahaan_id,
        details: akunJurnalRows
      });
    }

    if (typeof auditLog === "function") {
      await auditLog(conn, user_id, "CREATE", "penjualan", penjualanId, `Menerbitkan Invoice Penjualan ${invoice} senilai Rp ${grandTotal.toLocaleString('id-ID')}`);
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: `Invoice Penjualan ${invoice} berhasil diterbitkan.`,
      id: penjualanId,
      invoice,
      subtotal,
      ppn: totalPajak,
      total: grandTotal,
      totalLaba
    });

  } catch (error) {
    await conn.rollback();
    console.error("Error Create Penjualan:", error);
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// ==========================================================================
// 2. FITUR: PEMBATALAN (CANCEL) INVOICE PENJUALAN (HAPUS JURNAL & KEMBALIKAN STOK)
// ==========================================================================
exports.cancelPenjualan = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { perusahaan_id, id: user_id } = req.user || { perusahaan_id: 1, id: 1 };

    const [penjualan] = await conn.query(
      "SELECT * FROM penjualan WHERE id = ? AND perusahaan_id = ?", 
      [id, perusahaan_id]
    );
    
    if (penjualan.length === 0) throw new Error("Transaksi tidak ditemukan.");

    const dataPenjualan = penjualan[0];
    if (dataPenjualan.status_transaksi === "DIBATALKAN") {
      throw new Error("Transaksi ini sudah berstatus dibatalkan sebelumnya.");
    }

    const [detail] = await conn.query("SELECT * FROM detail_penjualan WHERE penjualan_id = ?", [id]);
    
    // 1. Kembalikan Stok Barang & Catat Histori Card
    for (const item of detail) {
      const [barang] = await conn.query("SELECT stok FROM barang WHERE id = ?", [item.barang_id]);
      if (barang.length > 0) {
        const stokSebelum = Number(barang[0].stok);
        const stokSesudah = stokSebelum + Number(item.qty);

        await conn.query(
          "UPDATE barang SET stok = ? WHERE id = ? AND perusahaan_id = ?", 
          [stokSesudah, item.barang_id, perusahaan_id]
        );

        await conn.query(
          `INSERT INTO histori_stok (barang_id, tipe, qty, stok_sebelum, stok_sesudah, keterangan) VALUES (?, 'MASUK', ?, ?, ?, ?)`,
          [item.barang_id, item.qty, stokSebelum, stokSesudah, `Cancel Penjualan ${dataPenjualan.invoice}`]
        );
      }
    }

    // 2. Ubah Status Transaksi & Piutang
    await conn.query("UPDATE penjualan SET status_transaksi = 'DIBATALKAN' WHERE id = ?", [id]);
    await conn.query("UPDATE piutang SET status = 'DIBATALKAN', sisa_piutang = 0 WHERE penjualan_id = ?", [id]);

    // 3. PERBAIKAN BUG: Hapus Posting Jurnal Transaksi Ini Agar Tidak Mengotori Buku Besar!
    const [jurnal] = await conn.query(`SELECT id FROM jurnal WHERE ref_tipe = 'PENJUALAN' AND ref_id = ?`, [id]);
    if (jurnal.length > 0) {
      for (const j of jurnal) {
        await conn.query(`DELETE FROM detail_jurnal WHERE jurnal_id = ?`, [j.id]);
        await conn.query(`DELETE FROM jurnal WHERE id = ?`, [j.id]);
      }
    }

    if (typeof auditLog === "function") {
      await auditLog(conn, user_id, "UPDATE", "penjualan", id, `Membatalkan Invoice Penjualan ${dataPenjualan.invoice}`);
    }

    await conn.commit();
    return res.json({ success: true, message: "Transaksi penjualan berhasil dibatalkan dan pos jurnal telah dibersihkan." });
  } catch (error) {
    await conn.rollback();
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// ==========================================================================
// 3. FITUR LAINNYA (RIWAYAT, DETAIL, BAYAR PIUTANG, DASHBOARD, EXCEL, PDF)
// ==========================================================================
exports.getAllPenjualan = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const [rows] = await db.query(
      `SELECT p.*, IFNULL(c.nama_customer, 'Pelanggan Umum / Cash') AS nama_customer 
       FROM penjualan p 
       LEFT JOIN customer c ON c.id = p.customer_id 
       WHERE p.perusahaan_id = ? 
       ORDER BY p.id DESC`,
      [perusahaan_id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDetailPenjualan = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    const [header] = await db.query(
      `SELECT p.*, IFNULL(c.nama_customer, 'Pelanggan Umum / Cash') AS nama_customer, c.telepon, c.alamat
       FROM penjualan p 
       LEFT JOIN customer c ON c.id = p.customer_id
       WHERE p.id = ? AND p.perusahaan_id = ?`,
      [id, perusahaan_id]
    );

    if (header.length === 0) {
      return res.status(404).json({ success: false, message: "Dokumen invoice tidak ditemukan." });
    }

    const info = header[0];
    let catatanPiutang = null;
    const isKredit = String(info.status_pembayaran).toUpperCase() === "BELUM_LUNAS" || String(info.metode_pembayaran).toUpperCase() === "KREDIT";
    const textStatusPembayaran = isKredit ? "KREDIT" : "LUNAS";

    if (isKredit) {
      catatanPiutang = {
        sisa_tagihan: info.total,
        status_pelunasan: "BELUM DIBAYAR (PIUTANG USAHA)"
      };
    }

    const [items] = await db.query(
      `SELECT dp.*, b.nama_barang, b.kode_barang 
       FROM detail_penjualan dp
       JOIN barang b ON b.id = dp.barang_id
       WHERE dp.penjualan_id = ? ORDER BY dp.id ASC`,
      [id]
    );

    return res.json({
      success: true,
      penjualan: {
        ...info,
        pajak: info.ppn, 
        status_pembayaran: textStatusPembayaran,
        informasi_tambahan_piutang: catatanPiutang
      },
      detail: items
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.bayarPiutang = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { jumlah_bayar, metode_pembayaran, catatan } = req.body;
    const { id: user_id, perusahaan_id } = req.user || { id: 1 };

    if (!jumlah_bayar || Number(jumlah_bayar) <= 0) {
      return res.status(400).json({ success: false, error: "Jumlah pembayaran harus lebih besar dari 0" });
    }

    // PERBAIKAN BUG KEAMANAN: pastikan piutang ini benar-benar milik perusahaan yang sedang login
    // (sebelumnya query ini tidak memfilter perusahaan_id sama sekali, sehingga user dari
    // perusahaan lain berpotensi membayar/mengubah piutang milik perusahaan lain)
    const [piutang] = await conn.query(
      `SELECT pi.* FROM piutang pi
       JOIN penjualan pe ON pe.id = pi.penjualan_id
       WHERE pi.id = ? AND pe.perusahaan_id = ?`,
      [id, perusahaan_id]
    );
    if (piutang.length === 0) {
      return res.status(404).json({ success: false, error: "Data rekam piutang tidak ditemukan." });
    }

    const dataPiutang = piutang[0];
    if (dataPiutang.status === "LUNAS" || dataPiutang.status === "DIBATALKAN") {
      return res.status(400).json({ success: false, error: "Piutang sudah lunas atau berkas transaksi telah dibatalkan." });
    }

    const sisaBaru = Number(dataPiutang.sisa_piutang) - Number(jumlah_bayar);
    if (sisaBaru < 0) {
      return res.status(400).json({ success: false, error: "Jumlah bayar melebihi sisa tagihan piutang aktif." });
    }

    await conn.query(
      `INSERT INTO pembayaran_piutang (piutang_id, jumlah_bayar, metode_pembayaran, catatan) VALUES (?, ?, ?, ?)`,
      [id, jumlah_bayar, metode_pembayaran || "TRANSFER", catatan || null]
    );

    const statusPiutang = sisaBaru <= 0 ? "LUNAS" : "BELUM_LUNAS";
    await conn.query(
      `UPDATE piutang SET sisa_piutang = ?, status = ? WHERE id = ?`,
      [sisaBaru, statusPiutang, id]
    );

    if (typeof createJurnal === "function") {
      // PERBAIKAN BUG: akun_id sebelumnya di-hardcode (1 dan 3), padahal ID akun
      // berbeda-beda per perusahaan (multi-tenant). Sekarang dicari secara dinamis
      // sama seperti pada createPenjualan.
      const [rowsKas] = await conn.query(
        "SELECT id, kode_akun FROM akun WHERE (tipe = 'KAS' OR kode_akun LIKE '141%' OR kode_akun LIKE '111%') AND (perusahaan_id = ? OR perusahaan_id IS NULL) LIMIT 1",
        [perusahaan_id]);
      const [rowsPiutang] = await conn.query(
        "SELECT id, kode_akun FROM akun WHERE (nama_akun LIKE '%Piutang%' OR kode_akun LIKE '1411%' OR kode_akun LIKE '1112%') AND (perusahaan_id = ? OR perusahaan_id IS NULL) LIMIT 1",
        [perusahaan_id]);

      const akunKas = rowsKas[0] || { id: 1, kode_akun: "141001" };
      const akunPiutang = rowsPiutang[0] || { id: 3, kode_akun: "141101" };

      await createJurnal(conn, {
        tanggal: new Date(),
        ref_tipe: "PEMBAYARAN_PIUTANG",
        ref_id: id,
        keterangan: `Pembayaran Piutang #${id} - Ket: ${catatan || 'Tanpa Catatan'}`,
        perusahaan_id,
        details: [
          { akun_id: akunKas.id, kode_akun: akunKas.kode_akun, debit: Number(jumlah_bayar), kredit: 0 },
          { akun_id: akunPiutang.id, kode_akun: akunPiutang.kode_akun, debit: 0, kredit: Number(jumlah_bayar) }
        ]
      });
    }

    if (statusPiutang === "LUNAS") {
      await conn.query(
        `UPDATE penjualan SET status_pembayaran = 'LUNAS', tanggal_pelunasan = NOW() WHERE id = ?`,
        [dataPiutang.penjualan_id]
      );
    }

    await conn.commit();
    return res.status(200).json({ 
      success: true, 
      message: "Pembayaran piutang berhasil disimpan!",
      sisa_piutang: sisaBaru, 
      status: statusPiutang 
    });

  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message || "Gagal memproses pembayaran piutang" });
  } finally {
    conn.release();
  }
};

exports.getAllPiutang = async (req, res) => {
  try {
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };
    const [rows] = await db.query(
      `SELECT 
        pi.id,
        pi.penjualan_id,
        pi.customer_id,
        pi.total_piutang,
        pi.sisa_piutang,
        pi.status,
        c.nama_customer, 
        pe.invoice, 
        pe.tanggal AS created_at, 
        pe.jatuh_tempo 
       FROM piutang pi
       LEFT JOIN customer c ON c.id = pi.customer_id
       LEFT JOIN penjualan pe ON pe.id = pi.penjualan_id
       WHERE pe.perusahaan_id = ? 
       ORDER BY pi.id DESC`,
      [perusahaan_id]
    );
    return res.json(rows); 
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.printInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const [header] = await db.query(
      `SELECT p.*, IFNULL(c.nama_customer, 'Pelanggan Umum / Cash') AS nama_customer,
              IFNULL(c.telepon, '-') AS telp_customer, IFNULL(c.alamat, '-') AS alamat_customer
       FROM penjualan p LEFT JOIN customer c ON c.id = p.customer_id WHERE p.id = ?`,
      [id]
    );

    if (header.length === 0) return res.status(404).send("Dokumen Invoice Tidak Ditemukan.");
    const info = header[0];

    const isKredit = String(info.status_pembayaran).toUpperCase() === "BELUM_LUNAS" || String(info.metode_pembayaran).toUpperCase() === "KREDIT";
    const textStatusPembayaran = isKredit ? "KREDIT" : "LUNAS";
    const subtotalNilai = info.subtotal || info.dpp || info.total;

    const [perusahaan] = await db.query("SELECT nama_perusahaan, alamat, telepon FROM perusahaan WHERE id = ?", [info.perusahaan_id]);
    const namaPT = perusahaan.length > 0 ? perusahaan[0].nama_perusahaan : "INSTANSI PERUSAHAAN ERP";
    const alamatPT = perusahaan.length > 0 ? perusahaan[0].alamat || "-" : "-";

    const [items] = await db.query(
      `SELECT dp.*, b.nama_barang, b.kode_barang FROM detail_penjualan dp JOIN barang b ON b.id = dp.barang_id WHERE dp.penjualan_id = ?`, 
      [id]
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${info.invoice}.pdf"`);
    doc.pipe(res);

    // Header Perusahaan & Judul Invoice
    doc.rect(0, 0, 595.28, 12).fill("#1e293b");
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#1e3a8a").text(namaPT.toUpperCase(), 40, 35);
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(alamatPT, 40, 55, { width: 250 });
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#0f172a").text("INVOICE", 420, 35, { align: "right" });
    
    doc.moveTo(40, 85).lineTo(555, 85).lineWidth(1).strokeColor("#e2e8f0").stroke();

    // Informasi Customer & Metadata Invoice
    const topMetadataY = 105;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("DITERBITKAN KEPADA:", 40, topMetadataY);
    doc.font("Helvetica").fillColor("#475569")
       .text(info.nama_customer, 40, topMetadataY + 15, { bold: true })
       .text(info.alamat_customer, 40, topMetadataY + 28, { width: 230 })
       .text(`Telp: ${info.telp_customer}`, 40, doc.y + 4);

    let metaY = topMetadataY;
    const drawMetaRow = (label, value) => {
      doc.font("Helvetica-Bold").fillColor("#475569").text(label, 320, metaY);
      doc.font("Helvetica").fillColor("#0f172a").text(`:  ${value}`, 410, metaY);
      metaY += 15;
    };
    drawMetaRow("No. Invoice", info.invoice);
    drawMetaRow("Tanggal", new Date(info.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }));
    drawMetaRow("Metode Bayar", textStatusPembayaran);
    drawMetaRow("Status Berkas", info.status_transaksi || "APPROVED");

    // Header Tabel Items
    let currentY = 200;
    doc.rect(40, currentY, 515, 22).fill("#f1f5f9");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e293b");
    doc.text("KODE", 45, currentY + 6);
    doc.text("DESKRIPSI ITEM PRODUK", 120, currentY + 6);
    doc.text("QTY", 340, currentY + 6, { align: "center", width: 40 });
    doc.text("HARGA", 390, currentY + 6, { align: "right", width: 70 });
    doc.text("TOTAL (IDR)", 470, currentY + 6, { align: "right", width: 80 });
    
    currentY += 22;

    // Loop Item Produk (Perbaikan warna teks diatur di dalam loop)
    items.forEach((item, index) => {
      // Menggambar background zebra striping untuk baris ganjil
      if (index % 2 === 1) {
        doc.rect(40, currentY, 515, 20).fill("#f8fafc");
      }

      // Kunci/Reset warna teks kembali ke abu-abu gelap agar tidak mengikuti warna fill background
      doc.font("Helvetica").fontSize(9).fillColor("#334155");

      // Cetak teks item
      doc.text(item.kode_barang || "-", 45, currentY + 5);
      doc.text(item.nama_barang, 120, currentY + 5);
      doc.text(`${item.qty}`, 340, currentY + 5, { align: "center", width: 40 });
      doc.text(`Rp ${Number(item.harga_jual).toLocaleString("id-ID")}`, 390, currentY + 5, { align: "right", width: 70 });
      doc.text(`Rp ${Number(item.subtotal || item.total_harga).toLocaleString("id-ID")}`, 470, currentY + 5, { align: "right", width: 80 });

      currentY += 20;
    });

    // Ringkasan Subtotal, PPN, & Total Net
    currentY += 15;
    const drawSummaryRow = (label, value, isBold = false) => {
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(isBold ? "#0f172a" : "#475569");
      doc.text(label, 320, currentY, { width: 120, align: "right" });
      doc.text(value, 450, currentY, { width: 100, align: "right" });
      currentY += 16;
    };
    
    drawSummaryRow("Subtotal :", `Rp ${Number(subtotalNilai).toLocaleString("id-ID")}`);
    drawSummaryRow("PPN Keluar :", `Rp ${Number(info.ppn).toLocaleString("id-ID")}`);
    doc.moveTo(340, currentY + 2).lineTo(555, currentY + 2).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
    currentY += 6;
    drawSummaryRow("TOTAL NET :", `Rp ${Number(info.total).toLocaleString("id-ID")}`, true);

    // Footer Dokumen
    doc.font("Helvetica-Oblique").fontSize(8).fillColor("#94a3b8").text("Catatan: Dokumen ini sah dan diproses otomatis melalui ERP System.", 40, 720, { width: 320 });
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text("Bagian Keuangan,", 440, 700, { align: "center", width: 115 });
    doc.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).send("Gagal memproses berkas PDF.");
  }
};
exports.exportPenjualanExcel = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const [rows] = await db.query(
      `SELECT p.invoice, p.tanggal, IFNULL(c.nama_customer, 'Umum') AS nama_customer, 
              p.metode_pembayaran, p.status_pembayaran, p.subtotal, p.ppn, p.total 
       FROM penjualan p LEFT JOIN customer c ON c.id = p.customer_id 
       WHERE p.perusahaan_id = ? ORDER BY p.id DESC`,
      [perusahaan_id]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Penjualan");

    worksheet.columns = [
      { header: "Invoice", key: "invoice", width: 22 },
      { header: "Tanggal", key: "tanggal", width: 18 },
      { header: "Nama Customer", key: "nama_customer", width: 25 },
      { header: "Metode Pembayaran", key: "metode_pembayaran", width: 18 },
      { header: "Status Pembayaran", key: "status_pembayaran", width: 22 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "PPN", key: "ppn", width: 15 },
      { header: "Total Omset Net", key: "total", width: 18 }
    ];

    rows.forEach(row => worksheet.addRow(row));
    worksheet.getRow(1).font = { bold: true };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Laporan_Penjualan.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.dashboardERP = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;

    const [penjualan] = await db.query(
      `SELECT 
        COUNT(*) AS total_transaksi, 
        COALESCE(SUM(total), 0) AS total_penjualan,
        COALESCE(SUM(subtotal), 0) AS total_pendapatan
       FROM penjualan 
       WHERE perusahaan_id = ? AND status_transaksi != 'DIBATALKAN'`,
      [perusahaan_id]
    );

    const [laba] = await db.query(
      `SELECT COALESCE(SUM(dp.laba), 0) AS total_laba 
       FROM detail_penjualan dp 
       JOIN penjualan p ON p.id = dp.penjualan_id 
       WHERE p.perusahaan_id = ? AND p.status_transaksi != 'DIBATALKAN'`,
      [perusahaan_id]
    );

    const valOmset = Number(penjualan[0].total_penjualan) || 0;
    const valNet = Number(penjualan[0].total_pendapatan) || valOmset;
    const valLaba = Number(laba[0].total_laba) || valNet;

    const summaryPayload = {
      kas: valOmset,
      kas_bank: valOmset,
      total_kas: valOmset,
      modal: 0,
      modal_disetor: 0,
      pendapatan: valNet,
      total_pendapatan: valNet,
      beban: 0,
      beban_pengeluaran: 0,
      laba: valLaba,
      laba_bersih: valLaba,
      total_transaksi: penjualan[0].total_transaksi || 0,
      total_penjualan: valOmset
    };

    return res.json({
      success: true,
      data: summaryPayload,
      summary: summaryPayload,
      ...summaryPayload
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.grafikPenjualan = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;

    const [harian] = await db.query(
      `SELECT DATE(tanggal) AS tanggal, COUNT(*) AS total_transaksi, COALESCE(SUM(subtotal), 0) AS total_penjualan 
       FROM penjualan WHERE perusahaan_id = ? AND status_transaksi != 'DIBATALKAN' GROUP BY DATE(tanggal) ORDER BY tanggal ASC`, 
      [perusahaan_id]
    );
    const [bulanan] = await db.query(
      `SELECT DATE_FORMAT(tanggal, '%Y-%m') AS bulan, COUNT(*) AS total_transaksi, COALESCE(SUM(subtotal), 0) AS total_penjualan 
       FROM penjualan WHERE perusahaan_id = ? AND status_transaksi != 'DIBATALKAN' GROUP BY DATE_FORMAT(tanggal, '%Y-%m') ORDER BY bulan ASC`, 
      [perusahaan_id]
    );
    const [tahunan] = await db.query(
      `SELECT YEAR(tanggal) AS tahun, COUNT(*) AS total_transaksi, COALESCE(SUM(subtotal), 0) AS total_penjualan 
       FROM penjualan WHERE perusahaan_id = ? AND status_transaksi != 'DIBATALKAN' GROUP BY YEAR(tanggal) ORDER BY tahun ASC`, 
      [perusahaan_id]
    );

    return res.json({ success: true, harian, bulanan, tahunan });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};