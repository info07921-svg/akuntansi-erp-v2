// routes/pajakRoutes.js
const express = require("express");
const router = express.Router();
const pajakController = require("../controllers/pajakController");

router.get("/", pajakController.getAll);
router.post("/", pajakController.create);
router.get("/aktif", pajakController.getAktif);
router.put("/aktifkan/:id", pajakController.setAktif); // Rute baru

module.exports = router;