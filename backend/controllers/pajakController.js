// controllers/pajakController.js
const db = require("../config/database");

// Ambil semua riwayat pajak
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM pengaturan_pajak ORDER BY berlaku_mulai DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Buat pengaturan pajak baru
exports.create = async (req, res) => {
  try {
    const { nama_pajak, tarif, berlaku_mulai } = req.body;
    await db.query(
      "INSERT INTO pengaturan_pajak (nama_pajak, tarif, berlaku_mulai, aktif) VALUES (?, ?, ?, 0)",
      [nama_pajak, tarif, berlaku_mulai]
    );
    res.json({ success: true, message: "Pengaturan pajak berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fungsi untuk Mengaktifkan Pajak (Set Aktif = 1, sisanya 0)
exports.setAktif = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    // 1. Matikan semua pajak
    await conn.query("UPDATE pengaturan_pajak SET aktif = 0");
    // 2. Aktifkan yang dipilih
    await conn.query("UPDATE pengaturan_pajak SET aktif = 1 WHERE id = ?", [id]);

    await conn.commit();
    res.json({ success: true, message: "Pajak aktif berhasil diperbarui" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// Ambil Pajak Aktif
exports.getPPNAktif = async (req, res) => {
  try {
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };

    // Ambil hanya 1 record pajak PPN yang berstatus AKTIF milik perusahaan
    const [rows] = await db.query(
      `SELECT * FROM pajak 
       WHERE (perusahaan_id = ? OR perusahaan_id IS NULL) 
         AND (UPPER(status) = 'AKTIF' OR is_active = 1)
       ORDER BY id DESC LIMIT 1`,
      [perusahaan_id]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: { tarif: 11, nama_pajak: "PPN 11%", status: "AKTIF" } });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};