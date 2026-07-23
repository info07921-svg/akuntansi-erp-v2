const express =
require("express");

const router =
express.Router();

const laporanController =
require("../controllers/laporanController");

router.get(
  "/buku-besar/:akun_id",
  laporanController.bukuBesar
);

router.get(
  "/neraca-saldo",
  laporanController.neracaSaldo
);

router.get(
  "/laba-rugi",
  laporanController.labaRugi
);

module.exports =
router;