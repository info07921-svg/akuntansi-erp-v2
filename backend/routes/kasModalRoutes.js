const express = require("express");
const router = express.Router();
const kasModalController = require("../controllers/kasModalController");

// Mengimpor middleware pengunci token login pengguna ERP
const { verifyToken } = require("../middleware/authMiddleware");

// Mengarahkan endpoint utama POST /api/kas-modal dengan proteksi keamanan login
router.post("/", verifyToken, kasModalController.addKasModal);

module.exports = router;