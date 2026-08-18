// routes/pajakRoutes.js
const express = require("express");
const router = express.Router();
const pajakController = require("../controllers/pajakController");
const { verifyToken } = require("../middleware/authMiddleware");

// PERBAIKAN BUG: rute ini sebelumnya tidak dilindungi verifyToken sama sekali,
// sehingga siapa pun (tanpa login) bisa membaca/mengubah pengaturan pajak, dan
// req.user (dibutuhkan untuk multi-tenant scoping) selalu undefined.
router.get("/", verifyToken, pajakController.getAll);
router.post("/", verifyToken, pajakController.create);
router.get("/aktif", verifyToken, pajakController.getAktif);
router.put("/aktifkan/:id", verifyToken, pajakController.setAktif); // Rute baru

module.exports = router;