const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { verifyToken } = require("../middleware/authMiddleware");

// 1. Terapkan middleware verifyToken untuk seluruh rute ekspor
router.use(verifyToken);

// 2. Helper fallback agar server tidak crash jika ada fungsi yang belum siap
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

// 3. Daftarkan seluruh 6 rute ekspor Excel
router.get("/neraca-saldo", getHandler("exportNeracaSaldo"));
router.get("/buku-besar", getHandler("exportBukuBesar"));
router.get("/laba-rugi", getHandler("exportLabaRugi"));
router.get("/neraca", getHandler("exportNeraca"));
router.get("/piutang", getHandler("exportPiutang")); // 👈 Rute Piutang Tambahan
router.get("/hutang", getHandler("exportHutang"));   // 👈 Rute Hutang Tambahan

module.exports = router;