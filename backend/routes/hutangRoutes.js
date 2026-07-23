const express = require("express");
const router = express.Router();
const hutangController = require("../controllers/hutangController");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================================================
// MANAJEMEN HUTANG DAGANG & OTOMATISASI DOUBLE-ENTRY JURNAL
// ==========================================================================

// 1. Mengambil Daftar Hutang Usaha Aktif
router.get(
  "/",
  verifyToken, // WAJIB ADA: Mencegah Error 500 saat frontend (Hutang.jsx) memuat halaman awal
  hutangController.getAllHutang
);

// 2. Memproses Transaksi Pembayaran / Cicilan Hutang Usaha
router.post(
  "/:id/bayar",
  verifyToken, // Mengunci parameter akuntansi dinamis agar mengurangi uang kas milik perusahaan pendaftar
  hutangController.bayarHutang
);

module.exports = router;