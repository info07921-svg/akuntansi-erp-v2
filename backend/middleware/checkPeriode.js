const db = require("../config/database");

module.exports = async (req, res, next) => {
  try {
    // PROTEKSI AMAN: Cek apakah req.body ada sebelum membaca properti 'tanggal'
    // Jika req.body tidak mengirimkan tanggal (seperti proses cancel), gunakan waktu saat ini (new Date())
    const tanggal = req.body && req.body.tanggal ? req.body.tanggal : new Date();

    const periode = new Date(tanggal)
      .toISOString()
      .slice(0, 7);

    const [cek] = await db.query(`
       SELECT *
       FROM periode_akuntansi
       WHERE periode=?
       AND status='CLOSED'
     `, [periode]);

    if (cek.length) {
      return res.status(400).json({
        success: false,
        message: "Periode akuntansi untuk bulan ini sudah ditutup, transaksi tidak dapat diproses!"
      });
    }

    next();
  } catch (error) {
    console.error("Error pada checkPeriode middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memverifikasi status periode buku akuntansi."
    });
  }
};