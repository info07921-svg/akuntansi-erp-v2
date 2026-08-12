const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const akuntansiController = require("../controllers/akuntansiController");
const { verifyToken } = require("../middleware/authMiddleware");

// Seluruh route ekspor & laporan dilindungi token auth
router.use(verifyToken);

// Helper fallback untuk fungsi ekspor Excel
const getHandler = (fnName) => {
  if (exportController && typeof exportController[fnName] === "function") {
    return exportController[fnName];
  }
  return (req, res) => {
    res.status(501).json({
      success: false,
      message: `Fungsi ${fnName} belum diimplementasikan di exportController.`
    });
  };
};

// 1. ROUTE UTAMA BUKU BESAR (Mengarahkan ke akuntansiController)
router.get("/buku-besar", akuntansiController.getBukuBesar);
router.get("/buku-besar/:akun_id", akuntansiController.getBukuBesar);

// 2. ROUTE EKSPOR EXCEL LAPORAN LAINNYA
router.get("/neraca-saldo", getHandler("exportNeracaSaldo"));
router.get("/laba-rugi", getHandler("exportLabaRugi"));
router.get("/neraca", getHandler("exportNeraca"));
router.get("/piutang", getHandler("exportPiutang"));
router.get("/hutang", getHandler("exportHutang"));

module.exports = router;