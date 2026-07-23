const express = require("express");
const router = express.Router();

const akuntansiController = require("../controllers/akuntansiController");
const kasModalController = require("../controllers/kasModalController");
const { verifyToken } = require("../middleware/authMiddleware");

// 1. TRANSAKSI KAS & MODAL AWAL
router.post("/kas-modal", verifyToken, kasModalController.addKasModal);

// 2. LAPORAN FINANSIAL
router.get("/buku-besar", verifyToken, akuntansiController.getBukuBesar);
router.get("/neraca-saldo", verifyToken, akuntansiController.getNeracaSaldo);
router.get("/laba-rugi", verifyToken, akuntansiController.getLabaRugi);
router.get("/neraca", verifyToken, akuntansiController.getNeraca);

// 3. TUTUP BUKU & PERIODE
router.post("/tutup-buku", verifyToken, akuntansiController.tutupBuku);
router.get("/tutup-buku", verifyToken, akuntansiController.getTutupBuku);
router.post("/tutup-periode", verifyToken, akuntansiController.tutupPeriode);
router.get("/tutup-periode", verifyToken, akuntansiController.getTutupPeriode);

// 4. MANAGEMENT JURNAL MANUAL
router.post("/jurnal-manual", verifyToken, akuntansiController.createJurnalManual);
router.get("/jurnal-manual", verifyToken, akuntansiController.getJurnalManual);
router.get("/jurnal-manual/:id", verifyToken, akuntansiController.getDetailJurnalManual);
router.put("/jurnal-manual/:id", verifyToken, akuntansiController.updateJurnalManual); // <-- Aman dieksekusi sekarang!
router.delete("/jurnal-manual/:id", verifyToken, akuntansiController.deleteJurnalManual);

// 5. EXPORT ENGINE (EXCEL)
router.get("/export-neraca", verifyToken, akuntansiController.exportNeraca);
router.get("/export-neraca-saldo", verifyToken, akuntansiController.exportNeracaSaldo);
router.get("/export-buku-besar", verifyToken, akuntansiController.exportBukuBesar);
router.get("/export-laba-rugi", verifyToken, akuntansiController.exportLabaRugi);

module.exports = router;