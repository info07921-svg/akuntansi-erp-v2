const db = require("../config/database");

/**
 * Mengambil tarif PPN yang berstatus AKTIF
 * @param {Object} conn - Opsi koneksi database transaksi (opsional)
 */
exports.getPPNAktif = async (conn) => {
  const queryRunner = conn || db;
  try {
    // FIX: Tambahkan filter WHERE status = 'AKTIF' agar hanya mengambil pajak aktif terbaru
    const [rows] = await queryRunner.query(
      `SELECT * FROM pajak 
       WHERE (UPPER(status) = 'AKTIF' OR status = '1' OR is_active = 1) 
         AND (tipe = 'PPN' OR jenis = 'PPN' OR nama_pajak LIKE '%PPN%')
       ORDER BY id DESC LIMIT 1`
    );

    if (rows && rows.length > 0) {
      return rows[0];
    }
    
    // Fallback default jika tabel pajak kosong / tidak ada yang aktif
    return { tarif: 11, status: "AKTIF" };
  } catch (err) {
    console.error("Gagal mengambil PPN aktif:", err.message);
    return { tarif: 11, status: "AKTIF" };
  }
};