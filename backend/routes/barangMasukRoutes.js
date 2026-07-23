const express = require("express");
const router = express.Router();

// PERBAIKAN UTAMA: Jalur path diperbaiki dari double controllers menjadi tunggal
const barangMasukController = require("../controllers/barangMasukController");
const { verifyToken } = require("../middleware/authMiddleware");

// 1. Ambil semua data master barang masuk milik perusahaan (Multi-Tenant)
router.get("/", verifyToken, barangMasukController.getAllBarangMasuk);

// 2. Buat dokumen pembelian logistik baru
router.post("/", verifyToken, barangMasukController.createBarangMasuk);

// 3. Ambil rincian detail item logistik berdasarkan ID faktur belanja (Gunakan :id)
router.get("/:id", verifyToken, barangMasukController.getBarangMasukById);

// 4. ROUTE CANCEL: Mengantisipasi nama fungsi cancel pada controller Anda
// Jika nama fungsi di controller Anda berbeda (misal handleCancelTransaksi), otomatis disesuaikan agar tidak crash
router.put("/:id/cancel", verifyToken, barangMasukController.cancelBarangMasuk || barangMasukController.handleCancelTransaksi || ((req, res) => {
  res.status(501).json({ success: false, message: "Fungsi cancel belum diexport di controller backend Anda." });
})); 

// 5. ROUTE PRINT PDF: Mengantisipasi nama fungsi cetak PDF pada controller Anda
router.get("/:id/pdf", barangMasukController.generatePDF || barangMasukController.downloadPDF || ((req, res) => {
  res.status(501).json({ success: false, message: "Fungsi cetak PDF belum diexport di controller backend Anda." });
}));

module.exports = router;