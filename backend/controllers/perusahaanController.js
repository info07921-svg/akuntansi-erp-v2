const db = require("../config/database");

exports.getPerusahaan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id,nama_perusahaan
      FROM perusahaan
      WHERE status='AKTIF'
      ORDER BY nama_perusahaan
    `);

    res.json(rows);

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};