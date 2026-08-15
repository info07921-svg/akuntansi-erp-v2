// controllers/pajakController.js
const db = require("../config/database");

// 1. Ambil semua riwayat pajak milik perusahaan user
exports.getAll = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;
    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak WHERE perusahaan_id = ? OR perusahaan_id IS NULL ORDER BY id DESC",
      [perusahaan_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error getAll pajak:", err.message);
    return res.status(500).json([]);
  }
};

// 2. Buat pengaturan pajak baru khusus untuk perusahaan user
exports.create = async (req, res) => {
  try {
    const { nama_pajak, tarif, persentase, berlaku_mulai } = req.body;
    const perusahaan_id = req.user?.perusahaan_id || 1;

    const valNama = nama_pajak || "PPN";
    const valTarif = parseFloat(tarif || persentase || 11) || 11;
    
    let valTanggal = new Date().toISOString().split("T")[0];
    if (berlaku_mulai) {
      const parts = String(berlaku_mulai).split("/");
      if (parts.length === 3) {
        valTanggal = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        valTanggal = berlaku_mulai;
      }
    }

    try {
      await db.query(
        "INSERT INTO pengaturan_pajak (perusahaan_id, nama_pajak, tarif, berlaku_mulai, aktif) VALUES (?, ?, ?, ?, 0)",
        [perusahaan_id, valNama, valTarif, valTanggal]
      );
    } catch (e) {
      // Fallback jika kolom perusahaan_id belum ada di tabel
      await db.query(
        "INSERT INTO pengaturan_pajak (nama_pajak, tarif, berlaku_mulai, aktif) VALUES (?, ?, ?, 0)",
        [valNama, valTarif, valTanggal]
      );
    }

    return res.json({ success: true, message: "Pengaturan pajak berhasil ditambahkan" });
  } catch (err) {
    console.error("Gagal simpan pajak:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Mengaktifkan Pajak KHUSUS perusahaan user saja
exports.setAktif = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const perusahaan_id = req.user?.perusahaan_id || 1;

    // Matikan semua pajak HANYA milik perusahaan ini
    await conn.query(
      "UPDATE pengaturan_pajak SET aktif = 0 WHERE perusahaan_id = ? OR perusahaan_id IS NULL",
      [perusahaan_id]
    );
    
    // Aktifkan pajak pilihan HANYA untuk perusahaan ini
    await conn.query(
      "UPDATE pengaturan_pajak SET aktif = 1 WHERE id = ? AND (perusahaan_id = ? OR perusahaan_id IS NULL)",
      [id, perusahaan_id]
    );

    await conn.commit();
    return res.json({ success: true, message: "Pajak aktif berhasil diperbarui untuk perusahaan Anda" });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
};

// 4. Ambil 1 Pajak PPN Aktif KHUSUS milik perusahaan user
exports.getPPNAktif = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;

    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak WHERE aktif = 1 AND (perusahaan_id = ? OR perusahaan_id IS NULL) ORDER BY id DESC LIMIT 1",
      [perusahaan_id]
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: true, data: { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 } });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};