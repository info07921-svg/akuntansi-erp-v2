const express = require("express");
const router = express.Router();
const {
  getBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  kelolaCadangan
} = require("../controllers/barangController");

// Import middleware token verification
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// ROUTING CRUD BARANG (Diproteksi verifyToken)
// ==========================================

// GET ALL BARANG (Hanya mengambil barang milik perusahaan yang login)
router.get("/", verifyToken, getBarang);

// GET BARANG BY ID
router.get("/:id", verifyToken, getBarangById);

// CREATE BARANG
router.post("/", verifyToken, createBarang);

// UPDATE BARANG
router.put("/:id", verifyToken, updateBarang);

// KELOLA STOCK CADANGAN BARANG
// Catatan: Jika di frontend Anda memanggil endpoint '/:id/cadangan' menggunakan method PUT,
// pastikan baris di bawah ini sesuai dengan method (PUT/POST) yang dikirim dari React.
router.put("/:id/cadangan", verifyToken, kelolaCadangan);

// DELETE BARANG
router.delete("/:id", verifyToken, deleteBarang);

module.exports = router;