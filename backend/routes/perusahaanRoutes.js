const router = require("express").Router();

const {
  getPerusahaan
} = require("../controllers/perusahaanController");

router.get("/", getPerusahaan);

module.exports = router;