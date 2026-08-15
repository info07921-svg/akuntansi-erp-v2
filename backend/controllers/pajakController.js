// controllers/pajakController.js
const db = require("../config/database");

// 1. Ambil semua daftar pajak (Tabel: pajak)
// 1. Ambil semua daftar pajak (Versi Langsung Array)
exports.getAll = async (req, res) => {
  try {
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };
    const [rows] = await db.query(
      "SELECT * FROM pajak WHERE (perusahaan_id = ? OR perusahaan_id IS NULL) ORDER BY id DESC",
      [perusahaan_id]
    );
    // Return array langsung agar tidak crash saat di-.map() di frontend React
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 2. Buat pengaturan pajak baru
// 2. Buat pengaturan pajak baru (Fix 500 Error di POST /api/pajak)
exports.create = async (req, res) => {
  try {
    const { nama_pajak, tarif, berlaku_mulai } = req.body;
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };

    // Pastikan nilai terisi dengan aman
    const namaStr = nama_pajak || "PPN";
    const tarifNum = Number(tarif) || 0;
    const tglMulai = berlaku_mulai || new Date().toISOString().split("T")[0];

    // Menggunakan kueri adaptif (Mendukung struktur tabel 'pajak' dengan/tanpa kolom berlaku_mulai)
    try {
      await db.query(
        "INSERT INTO pajak (perusahaan_id, nama_pajak, tarif, berlaku_mulai, status) VALUES (?, ?, ?, ?, 'NON-AKTIF')",
        [perusahaan_id, namaStr, tarifNum, tglMulai]
      );
    } catch (sqlErr) {
      // Fallback jika kolom berlaku_mulai belum ada di tabel MySQL
      await db.query(
        "INSERT INTO pajak (perusahaan_id, nama_pajak, tarif, status) VALUES (?, ?, ?, 'NON-AKTIF')",
        [perusahaan_id, namaStr, tarifNum]
      );
    }

    return res.json({ success: true, message: "Pengaturan pajak berhasil ditambahkan" });
  } catch (err) {
    console.error("Gagal membuat pajak baru:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Mengaktifkan Pajak PPN (Set status = 'AKTIF' untuk yang dipilih, sisanya 'NON-AKTIF')
exports.setAktif = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };

    // Matikan status semua pajak milik perusahaan
    await conn.query(
      "UPDATE pajak SET status = 'NON-AKTIF' WHERE (perusahaan_id = ? OR perusahaan_id IS NULL)",
      [perusahaan_id]
    );

    // Aktifkan pajak yang dipilih
    await conn.query(
      "UPDATE pajak SET status = 'AKTIF' WHERE id = ? AND (perusahaan_id = ? OR perusahaan_id IS NULL)",
      [id, perusahaan_id]
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

// 4. Ambil 1 Pajak PPN Aktif untuk Frontend / Transaksi
exports.getPPNAktif = async (req, res) => {
  try {
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };

    const [rows] = await db.query(
      `SELECT * FROM pajak 
       WHERE (perusahaan_id = ? OR perusahaan_id IS NULL) 
         AND (UPPER(status) = 'AKTIF' OR status = '1')
       ORDER BY id DESC LIMIT 1`,
      [perusahaan_id]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: { tarif: 11, nama_pajak: "PPN 11%", status: "AKTIF" } });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};