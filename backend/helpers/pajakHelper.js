const db = require("../config/database");

/**
 * Mengambil tarif PPN yang berstatus AKTIF sesuai perusahaan_id user
 * @param {Object} conn - Opsi koneksi database transaksi (opsional)
 * @param {Number} perusahaanId - ID Perusahaan (default: 14)
 */
exports.getPPNAktif = async (conn, perusahaanId = 14) => {
  const queryRunner = conn || db;
  try {
    // Ambil hanya pajak berstatus aktif (aktif = 1) milik perusahaan user
    const [rows] = await queryRunner.query(
      `SELECT * FROM pengaturan_pajak 
       WHERE aktif = 1 
         AND (perusahaan_id = ? OR perusahaan_id IS NULL)
       ORDER BY id DESC LIMIT 1`,
      [perusahaanId]
    );

    if (rows && rows.length > 0) {
      return rows[0];
    }
    
    // Fallback default jika tidak ada pajak aktif di database
    return { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 };
  } catch (err) {
    console.error("Gagal mengambil PPN aktif dari helper:", err.message);
    return { tarif: 11, nama_pajak: "PPN 11%", aktif: 1 };
  }
};