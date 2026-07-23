const db = require("../config/database");

async function getPPNAktif(conn) {
  const [rows] = await conn.query(`
    SELECT *
    FROM pengaturan_pajak
    WHERE nama_pajak = 'PPN'
      AND aktif = 1
    ORDER BY berlaku_mulai DESC
    LIMIT 1
  `);

  return rows[0] || null;
}

module.exports = {
  getPPNAktif
};