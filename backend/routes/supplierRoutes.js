const express =
require("express");

const router =
express.Router();

const supplierController =
require(
  "../controllers/supplierController"
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
  supplierController.getAllSupplier
);


// ======================
// CREATE
// ======================

router.post(
  "/",
  verifyToken,
  supplierController.createSupplier
);


// ======================
// UPDATE
// ======================

router.put(
  "/:id",
  verifyToken,
  supplierController.updateSupplier
);


// ======================
// DELETE
// ======================

router.delete(
  "/:id",
  verifyToken,
  supplierController.deleteSupplier
);

module.exports =
router;