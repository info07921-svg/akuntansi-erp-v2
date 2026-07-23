const db = require("../config/database");

// ==========================================================================
// 1. SEEDING / TEMPLATE AKUN BAWAAN OTOMATIS SAAT USER / PERUSAHAAN BARU TERDAFTAR
// ==========================================================================
exports.initDefaultAkun = async (perusahaan_id, conn) => {
  const dbClient = conn || db;
  const defaultAccounts = [
    { kode: "1101", nama: "Kas Utama", tipe: "ASET" },
    { kode: "1201", nama: "Piutang Usaha", tipe: "ASET" },
    { kode: "2101", nama: "Hutang Usaha", tipe: "KEWAJIBAN" },
    { kode: "2102", nama: "Pendapatan Ditangguhkan (Piutang Tempo)", tipe: "KEWAJIBAN" },
    { kode: "3101", nama: "Modal Pemilik", tipe: "MODAL" },
    { kode: "4101", nama: "Pendapatan Penjualan", tipe: "PENDAPATAN" },
    { kode: "5101", nama: "Beban Pembelian", tipe: "BEBAN" },
    { kode: "6101", nama: "Beban Operasional Umum", tipe: "BEBAN" }
  ];

  for (const acc of defaultAccounts) {
    const [existing] = await dbClient.query("SELECT id FROM akun WHERE kode_akun = ? AND perusahaan_id = ?", [acc.kode, perusahaan_id]);
    if (existing.length === 0) {
      await dbClient.query("INSERT INTO akun (perusahaan_id, kode_akun, nama_akun, tipe) VALUES (?, ?, ?, ?)", [perusahaan_id, acc.kode, acc.nama, acc.tipe]);
    }
  }
};

exports.getAllAkun = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const [rows] = await db.query(`SELECT * FROM akun WHERE perusahaan_id = ? ORDER BY kode_akun ASC`, [perusahaan_id]);
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAkun = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const { kode_akun, nama_akun, tipe } = req.body;

    if (!kode_akun || !nama_akun || !tipe) {
      return res.status(400).json({ success: false, message: "Kode, nama, dan tipe akun wajib diisi." });
    }

    const [existing] = await db.query("SELECT id FROM akun WHERE kode_akun = ? AND perusahaan_id = ?", [kode_akun, perusahaan_id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Kode akun tersebut sudah terdaftar." });
    }

    await db.query(`INSERT INTO akun (perusahaan_id, kode_akun, nama_akun, tipe) VALUES (?, ?, ?, ?)`, [perusahaan_id, kode_akun, nama_akun, tipe.toUpperCase()]);
    return res.status(201).json({ success: true, message: "Akun perkiraan baru berhasil didaftarkan." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================================================
// 3. HAPUS AKUN (PROTEKSI: BLOK AKUN VITAL BAWAAN & AKUN BER-MUTASI)
// ==========================================================================
exports.deleteAkun = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    // A. Proteksi Kode Akun Vital Sistem ERP
    const [akunData] = await db.query("SELECT kode_akun FROM akun WHERE id = ? AND perusahaan_id = ?", [id, perusahaan_id]);
    if (akunData.length > 0) {
      const protectedCodes = ["1101", "1201", "2101", "2102", "3101", "4101", "5101", "6101"];
      if (protectedCodes.includes(akunData[0].kode_akun)) {
        return res.status(400).json({
          success: false,
          message: "Gagal! Akun bawaan sistem (Default Template) terkunci dan wajib ada untuk otomatisasi transaksi keuangan."
        });
      }
    }

    // B. Cek keterikatan riwayat di Buku Besar Jurnal demi validitas audit
    const [jurnalCheck] = await db.query(
      `SELECT dj.id FROM detail_jurnal dj 
       JOIN jurnal j ON j.id = dj.jurnal_id 
       WHERE dj.akun_id = ? AND j.perusahaan_id = ? LIMIT 1`,
      [id, perusahaan_id]
    );

    if (jurnalCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Gagal! Akun ini tidak boleh dihapus karena sudah memiliki riwayat mutasi transaksi keuangan."
      });
    }

    const [result] = await db.query("DELETE FROM akun WHERE id = ? AND perusahaan_id = ?", [id, perusahaan_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Akun tidak ditemukan." });
    }

    return res.json({ success: true, message: "Akun berhasil dihapus dari daftar perusahaan." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};