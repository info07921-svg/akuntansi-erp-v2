const db = require("../config/database");

exports.auditLog = async (
  user_id,
  aktivitas,
  tabel,
  data_id,
  keterangan
) => {
  try {
    // -------------------------------------------------------------
    // FIX: PAKSA user_id MENJADI ANGKA INTEGER MURNI
    // -------------------------------------------------------------
    let cleanUserId = user_id;

    if (typeof cleanUserId === "object" && cleanUserId !== null) {
      cleanUserId = cleanUserId.id || cleanUserId.user_id || cleanUserId.id_user || 1;
    }

    cleanUserId = parseInt(cleanUserId, 10) || 1;
    // -------------------------------------------------------------

    await db.query(
      `
      INSERT INTO audit_log
      (
        user_id,
        aktivitas,
        tabel,
        data_id,
        keterangan
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        cleanUserId, // ✅ Menggunakan cleanUserId yang sudah aman
        aktivitas,
        tabel,
        data_id,
        keterangan
      ]
    );
  } catch (err) {
    console.error("Gagal mencatat audit log:", err.message);
    // Di-catch agar error audit log tidak membatalkan/menggagalkan transaksi utama
  }
};