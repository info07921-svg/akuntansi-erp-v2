const db = require("../config/database");

exports.auditLog = async (
  user_id,
  aktivitas,
  tabel,
  data_id,
  keterangan
) => {

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
      user_id,
      aktivitas,
      tabel,
      data_id,
      keterangan
    ]
  );

};