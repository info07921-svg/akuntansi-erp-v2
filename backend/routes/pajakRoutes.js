// routes/pajakRoutes.js
const express = require("express");
const router = express.Router();
const pajakController = require("../controllers/pajakController");

// Impor middleware autentikasi JWT Anda
const authMiddleware = require("../middleware/authMiddleware"); 

// Lindungi setiap rute dengan authMiddleware agar req.user otomatis terisi
router.get("/", authMiddleware, pajakController.getAll);
router.post("/", authMiddleware, pajakController.create);
router.get("/aktif", authMiddleware, pajakController.getPPNAktif);
router.put("/aktifkan/:id", authMiddleware, pajakController.setAktif);

module.exports = router;