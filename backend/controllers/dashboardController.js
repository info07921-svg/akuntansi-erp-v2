const db = require("../config/database");

exports.getDashboardSummary = async (req, res) => {
  try {
    const { perusahaan_id } = req.user; 

    if (!perusahaan_id) {
      return res.status(400).json({
        success: false,
        message: "Identitas perusahaan tidak ditemukan atau Anda belum login."
      });
    }

    // 1. HITUNG TOTAL ASET (MENGGABUNGKAN TIPE 'KAS' DAN 'ASET')
    // Menghitung Kas + Bank + Piutang + Persediaan Barang
    const [asetResult] = await db.query(`
      SELECT COALESCE(SUM(dj.debit - dj.kredit), 0) AS total_aset
      FROM detail_jurnal dj
      JOIN akun a ON a.id = dj.akun_id
      JOIN jurnal j ON j.id = dj.jurnal_id
      WHERE UPPER(a.tipe) IN ('KAS', 'ASET') AND j.status = 'APPROVED' AND j.perusahaan_id = ?
    `, [perusahaan_id]);

    // 2. Hitung Saldo Setoran Modal Awal (Tipe MODAL)
    const [modalResult] = await db.query(`
      SELECT COALESCE(SUM(dj.kredit - dj.debit), 0) AS total_modal_awal
      FROM detail_jurnal dj
      JOIN akun a ON a.id = dj.akun_id
      JOIN jurnal j ON j.id = dj.jurnal_id
      WHERE UPPER(a.tipe) = 'MODAL' AND j.status = 'APPROVED' AND j.perusahaan_id = ?
    `, [perusahaan_id]);

    // 3. Hitung Total Pendapatan Murni (Tipe PENDAPATAN)
    const [pendapatanResult] = await db.query(`
      SELECT COALESCE(SUM(dj.kredit - dj.debit), 0) AS total_pendapatan
      FROM detail_jurnal dj
      JOIN akun a ON a.id = dj.akun_id
      JOIN jurnal j ON j.id = dj.jurnal_id
      WHERE UPPER(a.tipe) = 'PENDAPATAN' AND j.status = 'APPROVED' AND j.perusahaan_id = ?
    `, [perusahaan_id]);

    // 4. Hitung Total Pengeluaran / Beban Murni (Tipe BEBAN)
    const [bebanResult] = await db.query(`
      SELECT COALESCE(SUM(dj.debit - dj.kredit), 0) AS total_beban
      FROM detail_jurnal dj
      JOIN akun a ON a.id = dj.akun_id
      JOIN jurnal j ON j.id = dj.jurnal_id
      WHERE UPPER(a.tipe) = 'BEBAN' AND j.status = 'APPROVED' AND j.perusahaan_id = ?
    `, [perusahaan_id]);

    // 5. Informasi alert logistik: Stok barang yang menipis
    const [stokResult] = await db.query(`
      SELECT id, kode_barang, nama_barang, stok, status_barang 
      FROM barang 
      WHERE stok <= 10 AND status_barang = 'AKTIF' AND perusahaan_id = ?
      ORDER BY stok ASC 
      LIMIT 5
    `, [perusahaan_id]);

    // 6. Hitung statistik operasional dasar untuk counter widget info dashboard
    const [salesCount] = await db.query("SELECT COUNT(*) AS total FROM penjualan WHERE status_transaksi != 'DIBATALKAN' AND perusahaan_id = ?", [perusahaan_id]);
    const [purchaseCount] = await db.query("SELECT COUNT(*) AS total FROM barang_masuk WHERE status_transaksi != 'DIBATALKAN' AND perusahaan_id = ?", [perusahaan_id]);
    const [customerCount] = await db.query("SELECT COUNT(*) AS total FROM customer WHERE perusahaan_id = ?", [perusahaan_id]);

    // PERBAIKAN BARIS 75: Sekarang menggunakan asetResult[0] secara sinkron
    const total_aset = Number(asetResult[0]?.total_aset || 0);
    const modal_awal = Number(modalResult[0]?.total_modal_awal || 0);
    const pendapatan = Number(pendapatanResult[0]?.total_pendapatan || 0);
    const pengeluaran = Number(bebanResult[0]?.total_beban || 0);
    
    const profit = pendapatan - pengeluaran; 
    const total_modal_berjalan = modal_awal + profit; 

    return res.json({
      success: true,
      data: {
        total_kas: total_aset, // Variabel properti tetap bernama total_kas agar state frontend tidak pecah
        total_modal: total_modal_berjalan,
        total_pendapatan: pendapatan,
        total_pengeluaran: pengeluaran,
        profit: profit, 
        stok_menipis: stokResult,
        operasional: {
          username_admin: req.user?.username || "Administrator",
          jumlah_penjualan: salesCount[0]?.total || 0,
          jumlah_pembelian: purchaseCount[0]?.total || 0,
          jumlah_customer: customerCount[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Gagal memproses data rangkuman dashboard."
    });
  }
};