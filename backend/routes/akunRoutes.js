const express = require("express");
const router = express.Router();
const akunController = require("../controllers/akunController");
const { verifyToken } = require("../middleware/authMiddleware");

// Endpoint manajemen Chart of Accounts (CoA)
router.get("/", verifyToken, akunController.getAllAkun);
router.post("/", verifyToken, akunController.createAkun);
router.delete("/:id", verifyToken, akunController.deleteAkun);

module.exports = router;