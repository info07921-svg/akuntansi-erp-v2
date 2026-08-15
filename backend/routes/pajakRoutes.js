// routes/pajakRoutes.js
const express = require("express");
const router = express.Router();
const pajakController = require("../controllers/pajakController");

// Rute standar tanpa parameter middleware yang kosong
router.get("/", pajakController.getAll);
router.post("/", pajakController.create);
router.get("/aktif", pajakController.getPPNAktif);
router.put("/aktifkan/:id", pajakController.setAktif);

module.exports = router;