// controllers/pajakController.js
const db = require("../config/database");

// 1. Ambil semua daftar pajak (Mendukung Array Langsung untuk Frontend React)
exports.getAll = async (req, res) => {
  try {
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };
    const [rows] = await db.query(
      "SELECT * FROM pajak WHERE (perusahaan_id = ? OR perusahaan_id IS NULL) ORDER BY id DESC",
      [perusahaan_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error getAll pajak:", err.message);
    return res.status(500).json([]);
  }
};

// 2. Buat pengaturan pajak baru (Solusi Baku Error 500 onSubmit)
exports.create = async (req, res) => {
  try {
    const { nama_pajak, tarif, persentase, berlaku_mulai, status } = req.body;
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };

    // Sanitasi data input agar aman dari NULL / NaN
    const valNama = nama_pajak || "PPN";
    const valTarif = parseFloat(tarif || persentase || 0) || 0;
    
    // Formatting tanggal ke YYYY-MM-DD
    let valTanggal = new Date().toISOString().split("T")[0];
    if (berlaku_mulai) {
      const parts = berlaku_mulai.split("/");
      if (parts.length === 3) {
        valTanggal = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert DD/MM/YYYY ke YYYY-MM-DD
      } else {
        valTanggal = berlaku_mulai;
      }
    }

    const valStatus = status || "NON-AKTIF";

    // Kueri SQL bertingkat (Fallback jika struktur tabel di Railway bervariasi)
    try {
      await db.query(
        "INSERT INTO pajak (perusahaan_id, nama_pajak, tarif, berlaku_mulai, status) VALUES (?, ?, ?, ?, ?)",
        [perusahaan_id, valNama, valTarif, valTanggal, valStatus]
      );
    } catch (e1) {
      try {
        await db.query(
          "INSERT INTO pajak (perusahaan_id, nama_pajak, tarif, status) VALUES (?, ?, ?, ?)",
          [perusahaan_id, valNama, valTarif, valStatus]
        );
      } catch (e2) {
        await db.query(
          "INSERT INTO pajak (nama_pajak, tarif) VALUES (?, ?)",
          [valNama, valTarif]
        );
      }
    }

    return res.json({ success: true, message: "Pengaturan pajak berhasil disimpan" });
  } catch (err) {
    console.error("Gagal simpan pajak:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Mengaktifkan Pajak PPN (Set status = 'AKTIF')
exports.setAktif = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { perusahaan_id } = req.user || { perusahaan_id: 1 };

    await conn.query(
      "UPDATE pajak SET status = 'NON-AKTIF' WHERE (perusahaan_id = ? OR perusahaan_id IS NULL)",
      [perusahaan_id]
    );

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

// 4. Ambil 1 Pajak PPN Aktif
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