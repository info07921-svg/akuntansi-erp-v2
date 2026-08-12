const db = require("../config/database");

// ==========================================
// GET ALL SUPPLIER (Isolasi per Perusahaan)
// ==========================================
const getAllSupplier = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;

    const [rows] = await db.query(
      `SELECT * FROM supplier WHERE perusahaan_id = ? ORDER BY id DESC`,
      [perusahaan_id]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Get Supplier Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal mengambil data supplier" 
    });
  }
};

// ==========================================
// CREATE SUPPLIER (Otomatis Ikat perusahaan_id)
// ==========================================
const createSupplier = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const { nama_supplier, telepon, alamat, email } = req.body;

    if (!nama_supplier) {
      return res.status(400).json({ 
        success: false, 
        message: "Nama supplier wajib diisi" 
      });
    }

    await db.query(
      `INSERT INTO supplier (perusahaan_id, nama_supplier, telepon, alamat, email, status) 
       VALUES (?, ?, ?, ?, ?, 'AKTIF')`,
      [perusahaan_id, nama_supplier, telepon || null, alamat || null, email || null]
    );

    res.status(201).json({
      success: true,
      message: "Supplier berhasil didaftarkan"
    });
  } catch (error) {
    console.error("Create Supplier Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal menambahkan supplier" 
    });
  }
};

// ==========================================
// UPDATE SUPPLIER (Validasi Kepemilikan)
// ==========================================
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;
    const { nama_supplier, telepon, alamat, email, status } = req.body;

    if (!nama_supplier) {
      return res.status(400).json({ 
        success: false, 
        message: "Nama supplier wajib diisi" 
      });
    }

    const [result] = await db.query(
      `UPDATE supplier 
       SET nama_supplier = ?, telepon = ?, alamat = ?, email = ?, status = ? 
       WHERE id = ? AND perusahaan_id = ?`,
      [nama_supplier, telepon || null, alamat || null, email || null, status || 'AKTIF', id, perusahaan_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Anda tidak memiliki akses untuk mengubah data supplier ini" 
      });
    }

    res.json({
      success: true,
      message: "Supplier berhasil diperbarui"
    });
  } catch (error) {
    console.error("Update Supplier Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal memperbarui data supplier" 
    });
  }
};

// ==========================================
// DELETE SUPPLIER (Validasi Kepemilikan)
// ==========================================
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    const [result] = await db.query(
      `DELETE FROM supplier WHERE id = ? AND perusahaan_id = ?`,
      [id, perusahaan_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Anda tidak memiliki akses untuk menghapus supplier ini" 
      });
    }

    res.json({
      success: true,
      message: "Supplier berhasil dihapus"
    });
  } catch (error) {
    console.error("Delete Supplier Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal menghapus data supplier" 
    });
  }
};

module.exports = {
  getAllSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
};