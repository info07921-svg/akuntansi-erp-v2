const express = require("express");
const router = express.Router();

// 1. Impor Controller
const penjualanController = require("../controllers/penjualanController");

// 2. Impor Middleware & Validasi agar tidak Undefined jika struktur file auth berbeda
const authMiddleware = require("../middleware/authMiddleware");
const checkPeriode = require("../middleware/checkPeriode") || ((req, res, next) => next());

// Cek apakah verifyToken diekspor sebagai properti objek atau langsung fungsi utama
const verifyToken = authMiddleware && typeof authMiddleware.verifyToken === "function"
  ? authMiddleware.verifyToken 
  : (typeof authMiddleware === "function" ? authMiddleware : (req, res, next) => next());

// Helper untuk memastikan fungsi controller ada sebelum dipasang ke router (Anti-Crash)
const safeHandler = (handlerName) => {
  if (typeof penjualanController[handlerName] !== "function") {
    // Jika fungsi tidak ada di controller, buat fungsi kosong darurat agar server tidak crash
    return (req, res) => res.status(500).json({ 
      success: false, 
      error: `Fungsi exports.${handlerName} belum dibuat atau hilang di penjualanController.js` 
    });
  }
  return penjualanController[handlerName];
};

// ==========================================================================
// KELOMPOK RUTE PENJUALAN UTAMA
// ==========================================================================

// Analytics & Utilities (Harus di atas)
router.get("/dashboard", verifyToken, safeHandler("dashboardERP"));
router.get("/grafik", verifyToken, safeHandler("grafikPenjualan"));
router.get("/export/excel", verifyToken, safeHandler("exportPenjualanExcel"));
router.get("/invoice/:id", safeHandler("printInvoice"));

// KELOMPOK RUTE KARTU PIUTANG USAHA (Dipindah ke atas agar aman dari /:id)
router.get("/piutang", verifyToken, safeHandler("getAllPiutang"));
router.get("/piutang/:id", verifyToken, safeHandler("getDetailPiutang"));
router.post("/piutang/:id/bayar", verifyToken, checkPeriode, safeHandler("bayarPiutang"));

// Rute Standar Penjualan
router.get("/", verifyToken, safeHandler("getAllPenjualan"));
router.post("/", verifyToken, checkPeriode, safeHandler("createPenjualan"));
router.put("/cancel/:id", verifyToken, checkPeriode, safeHandler("cancelPenjualan"));

// Rute Dinamis Generik (Wajib Paling Bawah)
router.get("/:id", verifyToken, safeHandler("getDetailPenjualan"));

module.exports = router;