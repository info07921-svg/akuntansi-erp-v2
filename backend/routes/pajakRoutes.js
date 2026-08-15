// routes/pajakRoutes.js
const express = require("express");
const router = express.Router();
const pajakController = require("../controllers/pajakController");

// Rute pajak murni (middleware auth dipasang di level server.js atau controller)
router.get("/", pajakController.getAll);
router.post("/", pajakController.create);
router.get("/aktif", pajakController.getPPNAktif);
router.put("/aktifkan/:id", pajakController.setAktif);

module.exports = router;