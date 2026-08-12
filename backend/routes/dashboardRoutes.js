const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Menggunakan middleware proteksi identitas token perusahaan login
const { verifyToken } = require("../middleware/authMiddleware");

// Endpoint penarik ringkasan data terpusat
router.get("/summary", verifyToken, dashboardController.getDashboardSummary);

module.exports = router;