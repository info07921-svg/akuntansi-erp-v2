const express =
require("express");

const router =
express.Router();

const kategoriController =
require(
  "../controllers/kategoriController"
);

const {
  verifyToken
} = require(
  "../middleware/authMiddleware"
);


// ======================
// GET ALL
// ======================

router.get(
  "/",
  verifyToken,
  kategoriController.getAllKategori
);


// ======================
// CREATE
// ======================

router.post(
  "/",
  verifyToken,
  kategoriController.createKategori
);


// ======================
// UPDATE
// ======================

router.put(
  "/:id",
  verifyToken,
  kategoriController.updateKategori
);


// ======================
// DELETE
// ======================

router.delete(
  "/:id",
  verifyToken,
  kategoriController.deleteKategori
);

module.exports =
router;