const express = require("express");
const router = express.Router();

const jurnalController = require("../controllers/jurnalController");

// Import middleware verifikasi token yang Anda gunakan
const { verifyToken } = require("../middleware/authMiddleware");
const checkPeriode = require("../middleware/checkPeriode");

/**
 * 1. Ambil Semua Data Jurnal (Multi-Tenant)
 * Pemanggilan disesuaikan dari 'getAll' menjadi 'getAllJurnal'
 */
router.get(
  "/",
  verifyToken,
  jurnalController.getAllJurnal
);

/**
 * 2. Ambil Detail Isi Jurnal Berdasarkan ID Jurnal
 * Pemanggilan disesuaikan dari 'getById' menjadi 'getJurnalById'
 * Parameter diubah menjadi :jurnalId agar sinkron dengan req.params di controller
 */
router.get(
  "/:jurnalId",
  verifyToken,
  jurnalController.getJurnalById
);

/**
 * 3. Posting Jurnal Manual (Double Entry)
 */
router.post(
  "/jurnal-manual",
  verifyToken,
  checkPeriode,
  jurnalController.createManual
);

/**
 * 4. Verifikasi / Setujui Jurnal (Approved)
 * Parameter disesuaikan menjadi :id sesuai req.params.id di controller
 */
router.put(
  '/approve/:id',
  verifyToken, // Ditambahkan token security agar tidak sembarang orang bisa approve via URL API
  jurnalController.approveJurnal
);

module.exports = router;