const db = require("../config/database");

/**
 * Mengambil tarif PPN yang berstatus AKTIF sesuai perusahaan_id user
 * @param {Object} conn - Opsi koneksi database transaksi (opsional)
 * @param {Number} perusahaanId - ID Perusahaan user yang login
 */
exports.getPPNAktif = async (conn, perusahaanId) => {
  const queryRunner = conn || db;
  try {
    // Jika perusahaanId tidak dikirim/invalid, kembalikan default 11% tanpa query agar tidak salah sasaran
    if (!perusahaanId) {
      return { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 };
    }

    // Ambil hanya pajak berstatus aktif milik perusahaan user yang bersangkutan
    const [rows] = await queryRunner.query(
      `SELECT * FROM pengaturan_pajak 
       WHERE aktif = 1 AND perusahaan_id = ?
       ORDER BY id DESC LIMIT 1`,
      [perusahaanId]
    );

    if (rows && rows.length > 0) {
      return rows[0];
    }
    
    // Fallback jika belum ada pajak yang diaktifkan di perusahaan tersebut
    return { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 };
  } catch (err) {
    console.error("Gagal mengambil PPN aktif dari helper:", err.message);
    return { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 };
  }
};