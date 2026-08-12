const db = require("../config/database");

exports.getDashboardSummary = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;

    if (!perusahaan_id) {
      return res.status(400).json({ success: false, message: "Identitas perusahaan tidak ditemukan." });
    }

    // 1. Ambil Penjualan Berdasarkan Perusahaan (Mendukung APPROVED & SELESAI)
    const [salesSummary] = await db.query(`
      SELECT 
        COUNT(*) AS total_transaksi, 
        COALESCE(SUM(total), 0) AS total_omset,
        COALESCE(SUM(subtotal), 0) AS total_pendapatan
      FROM penjualan 
      WHERE perusahaan_id = ? AND status_transaksi != 'DIBATALKAN'
    `, [perusahaan_id]);

    // 2. Hitung Laba Penjualan
    const [labaSummary] = await db.query(`
      SELECT COALESCE(SUM(dp.laba), 0) AS total_laba
      FROM detail_penjualan dp
      JOIN penjualan p ON p.id = dp.penjualan_id
      WHERE p.perusahaan_id = ? AND p.status_transaksi != 'DIBATALKAN'
    `, [perusahaan_id]);

    // 3. Stok Menipis
    const [stokResult] = await db.query(`
      SELECT id, kode_barang, nama_barang, stok, status_barang 
      FROM barang 
      WHERE stok <= 10 AND status_barang = 'AKTIF' AND perusahaan_id = ?
      ORDER BY stok ASC LIMIT 5
    `, [perusahaan_id]);

    // 4. Statistik Operasional
    const [purchaseCount] = await db.query("SELECT COUNT(*) AS total FROM barang_masuk WHERE status_transaksi != 'DIBATALKAN' AND perusahaan_id = ?", [perusahaan_id]);
    const [customerCount] = await db.query("SELECT COUNT(*) AS total FROM customer WHERE perusahaan_id = ?", [perusahaan_id]);

    const omset = Number(salesSummary[0]?.total_omset || 0);
    const pendapatan = Number(salesSummary[0]?.total_pendapatan || 0) || omset;
    const laba = Number(labaSummary[0]?.total_laba || 0) || omset;

    const summaryPayload = {
      total_kas: omset,
      kas: omset,
      total_modal: 0,
      modal: 0,
      total_pendapatan: pendapatan,
      pendapatan: pendapatan,
      total_pengeluaran: 0,
      beban: 0,
      profit: laba,
      laba_bersih: laba,
      stok_menipis: stokResult,
      operasional: {
        username_admin: req.user?.username || "Administrator",
        jumlah_penjualan: salesSummary[0]?.total_transaksi || 0,
        jumlah_pembelian: purchaseCount[0]?.total || 0,
        jumlah_customer: customerCount[0]?.total || 0
      }
    };

    return res.json({
      success: true,
      data: summaryPayload,
      summary: summaryPayload
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};