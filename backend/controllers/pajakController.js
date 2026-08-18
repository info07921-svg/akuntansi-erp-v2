// controllers/pajakController.js
const db = require("../config/database");

// PERBAIKAN BUG MULTI-TENANT: Sebelumnya seluruh query di file ini TIDAK memfilter
// perusahaan_id sama sekali (bahkan rute-nya juga tidak dilindungi verifyToken),
// sehingga:
//  1. Data pengaturan pajak semua perusahaan tercampur/bocor antar tenant.
//  2. helpers/pajakHelper.js (dipakai saat membuat invoice) mencari
//     "WHERE aktif = 1 AND perusahaan_id = ?" -> baris yang dibuat tanpa perusahaan_id
//     TIDAK PERNAH ketemu, sehingga PPN selalu fallback ke default & tidak bisa diubah.
//  3. setAktif mematikan (aktif=0) pajak milik SEMUA perusahaan sekaligus.
// Sekarang semua query di-scope ke req.user.perusahaan_id.

// Ambil semua riwayat pajak milik perusahaan yang login
exports.getAll = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak WHERE perusahaan_id = ? ORDER BY berlaku_mulai DESC",
      [perusahaan_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Buat pengaturan pajak baru untuk perusahaan yang login
exports.create = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const { nama_pajak, tarif, berlaku_mulai } = req.body;

    if (!nama_pajak || tarif === undefined || tarif === null || !berlaku_mulai) {
      return res.status(400).json({ success: false, error: "nama_pajak, tarif, dan berlaku_mulai wajib diisi" });
    }

    await db.query(
      "INSERT INTO pengaturan_pajak (perusahaan_id, nama_pajak, tarif, berlaku_mulai, aktif) VALUES (?, ?, ?, ?, 0)",
      [perusahaan_id, nama_pajak, tarif, berlaku_mulai]
    );
    res.json({ success: true, message: "Pengaturan pajak berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fungsi untuk Mengaktifkan Pajak (Set Aktif = 1, sisanya 0) HANYA milik perusahaan yang login
exports.setAktif = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    // Pastikan pajak yang ingin diaktifkan benar-benar milik perusahaan ini
    const [cek] = await conn.query(
      "SELECT id FROM pengaturan_pajak WHERE id = ? AND perusahaan_id = ?",
      [id, perusahaan_id]
    );
    if (cek.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Pengaturan pajak tidak ditemukan." });
    }

    // 1. Matikan semua pajak milik perusahaan ini saja
    await conn.query("UPDATE pengaturan_pajak SET aktif = 0 WHERE perusahaan_id = ?", [perusahaan_id]);
    // 2. Aktifkan yang dipilih
    await conn.query("UPDATE pengaturan_pajak SET aktif = 1 WHERE id = ? AND perusahaan_id = ?", [id, perusahaan_id]);

    await conn.commit();
    res.json({ success: true, message: "Pajak aktif berhasil diperbarui" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// Ambil pajak yang saat ini aktif milik perusahaan yang login
exports.getAktif = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak WHERE aktif = 1 AND perusahaan_id = ? LIMIT 1",
      [perusahaan_id]
    );
    if (rows.length === 0) {
      return res.json({ nama_pajak: "PPN", tarif: 11 }); // Fallback
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};