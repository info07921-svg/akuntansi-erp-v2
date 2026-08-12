const express =
require("express");

const router =
express.Router();

const customerController =
require(
  "../controllers/customerController"
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
  customerController.getAllCustomer
);


// ======================
// CREATE
// ======================

router.post(
  "/",
  verifyToken,
  customerController.createCustomer
);


// ======================
// UPDATE
// ======================

router.put(
  "/:id",
  verifyToken,
  customerController.updateCustomer
);


// ======================
// DELETE
// ======================

router.delete(
  "/:id",
  verifyToken,
  customerController.deleteCustomer
);

module.exports =
router;