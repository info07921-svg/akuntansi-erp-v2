// routes/pajakRoutes.js
const express = require("express");
const router = express.Router();
const pajakController = require("../controllers/pajakController");

router.get("/", pajakController.getAll);
router.post("/", pajakController.create);
// FIX: Disamakan nama fungsinya dengan getPPNAktif di controller
router.get("/aktif", pajakController.getPPNAktif);
router.put("/aktifkan/:id", pajakController.setAktif);

module.exports = router;