// controllers/pajakController.js
const db = require("../config/database");

// 1. Ambil semua riwayat pajak untuk tabel Frontend React
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak ORDER BY id DESC"
    );
    // Mengembalikan array langsung agar komponen React tidak error .map()
    return res.json(rows);
  } catch (err) {
    console.error("Error getAll pajak:", err.message);
    return res.status(500).json([]);
  }
};

// 2. Buat pengaturan pajak baru
exports.create = async (req, res) => {
  try {
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

    // Insert sesuai kolom: id, nama_pajak, tarif, berlaku_mulai, aktif (default 0)
    await db.query(
      "INSERT INTO pengaturan_pajak (nama_pajak, tarif, berlaku_mulai, aktif) VALUES (?, ?, ?, 0)",
      [valNama, valTarif, valTanggal]
    );

    return res.json({ success: true, message: "Pengaturan pajak berhasil ditambahkan" });
  } catch (err) {
    console.error("Gagal simpan pajak:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Mengaktifkan Pajak (Set aktif = 1 pada ID terpilih, sisanya 0)
exports.setAktif = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    // Matikan semua pajak
    await conn.query("UPDATE pengaturan_pajak SET aktif = 0");
    // Aktifkan pajak pilihan user
    await conn.query("UPDATE pengaturan_pajak SET aktif = 1 WHERE id = ?", [id]);

    await conn.commit();
    return res.json({ success: true, message: "Pajak aktif berhasil diperbarui" });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
};

// 4. Ambil 1 Pajak PPN Aktif (Untuk kalkulasi transaksi Penjualan)
exports.getPPNAktif = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM pengaturan_pajak WHERE aktif = 1 ORDER BY id DESC LIMIT 1"
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: true, data: { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 } });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};