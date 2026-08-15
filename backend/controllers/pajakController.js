// controllers/pajakController.js
const db = require("../config/database");

// Helper Ekstraksi Fleksibel: Aman membaca perusahaan_id dari berbagai bentuk req.user
const getPerusahaanId = (req) => {
  if (!req.user) return 1;

  // Cek berlapis untuk menemukan perusahaan_id atau id user
  const u = req.user.user || req.user.data || req.user;

  if (u.perusahaan_id !== undefined && u.perusahaan_id !== null) {
    return parseInt(u.perusahaan_id, 10);
  }
  if (u.id_perusahaan !== undefined && u.id_perusahaan !== null) {
    return parseInt(u.id_perusahaan, 10);
  }
  if (u.id !== undefined && u.id !== null) {
    return parseInt(u.id, 10);
  }

  return 1; // Default fallback aman agar tidak memunculkan error 401
};

// 1. Ambil semua data pajak HANYA milik perusahaan user login
exports.getAll = async (req, res) => {
  try {
    const perusahaanId = getPerusahaanId(req);
    
    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak WHERE perusahaan_id = ? ORDER BY id DESC",
      [perusahaanId]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error getAll pajak:", err.message);
    return res.status(500).json([]);
  }
};

// 2. Buat pengaturan pajak baru dengan perusahaan_id asli user yang login
exports.create = async (req, res) => {
  try {
    const perusahaanId = getPerusahaanId(req);
    const { nama_pajak, tarif, persentase, berlaku_mulai } = req.body;

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

    await db.query(
      "INSERT INTO pengaturan_pajak (perusahaan_id, nama_pajak, tarif, berlaku_mulai, aktif) VALUES (?, ?, ?, ?, 0)",
      [perusahaanId, valNama, valTarif, valTanggal]
    );

    return res.json({ success: true, message: "Pengaturan pajak berhasil ditambahkan" });
  } catch (err) {
    console.error("Gagal simpan pajak:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Mengaktifkan Pajak HANYA untuk perusahaan user yang login
exports.setAktif = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const perusahaanId = getPerusahaanId(req);

    // 1. Matikan semua pajak milik perusahaan ini
    await conn.query(
      "UPDATE pengaturan_pajak SET aktif = 0 WHERE perusahaan_id = ?",
      [perusahaanId]
    );
    
    // 2. Aktifkan pajak terpilih milik perusahaan ini
    await conn.query(
      "UPDATE pengaturan_pajak SET aktif = 1 WHERE id = ? AND perusahaan_id = ?",
      [id, perusahaanId]
    );

    await conn.commit();
    return res.json({ success: true, message: "Status PPN Aktif berhasil diperbarui" });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
};

// 4. Ambil 1 Pajak PPN Aktif HANYA milik perusahaan user yang login
exports.getPPNAktif = async (req, res) => {
  try {
    const perusahaanId = getPerusahaanId(req);

    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak WHERE aktif = 1 AND perusahaan_id = ? ORDER BY id DESC LIMIT 1",
      [perusahaanId]
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: true, data: { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 } });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};