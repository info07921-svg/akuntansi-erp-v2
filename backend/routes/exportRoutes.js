const express = require("express");
const router = express.Router();

const exportController =
require("../controllers/exportController");

const {
  verifyToken
} = require("../middleware/authMiddleware");

router.get(
  "/neraca-saldo",
  verifyToken,
  exportController.exportNeracaSaldo
);

router.get(
  "/laba-rugi",
  verifyToken,
  exportController.exportLabaRugi
);

router.get(
  "/neraca",
  verifyToken,
  exportController.exportNeraca
);

router.get(
  "/buku-besar",
  verifyToken,
  exportController.exportBukuBesar
);

module.exports = router;