const db = require("../config/database");

// ==========================================
// GET ALL CUSTOMER (Isolasi per Perusahaan)
// ==========================================
const getAllCustomer = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;

    const [rows] = await db.query(
      `SELECT * FROM customer WHERE perusahaan_id = ? ORDER BY id DESC`,
      [perusahaan_id]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Get Customer Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal mengambil data pelanggan" 
    });
  }
};

// ==========================================
// CREATE CUSTOMER (Otomatis Ikat perusahaan_id)
// ==========================================
const createCustomer = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const { nama_customer, telepon, alamat, email, jenis_customer } = req.body;

    if (!nama_customer) {
      return res.status(400).json({ 
        success: false, 
        message: "Nama pelanggan wajib diisi" 
      });
    }

    await db.query(
      `INSERT INTO customer (perusahaan_id, nama_customer, telepon, alamat, email, jenis_customer, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'AKTIF')`,
      [perusahaan_id, nama_customer, telepon || null, alamat || null, email || null, jenis_customer || 'UMUM']
    );

    res.status(201).json({
      success: true,
      message: "Customer berhasil didaftarkan"
    });
  } catch (error) {
    console.error("Create Customer Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal menambahkan pelanggan baru" 
    });
  }
};

// ==========================================
// UPDATE CUSTOMER (Validasi Kepemilikan)
// ==========================================
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;
    const { nama_customer, telepon, alamat, email, jenis_customer, status } = req.body;

    if (!nama_customer) {
      return res.status(400).json({ 
        success: false, 
        message: "Nama pelanggan wajib diisi" 
      });
    }

    const [result] = await db.query(
      `UPDATE customer 
       SET nama_customer = ?, telepon = ?, alamat = ?, email = ?, jenis_customer = ?, status = ? 
       WHERE id = ? AND perusahaan_id = ?`,
      [nama_customer, telepon || null, alamat || null, email || null, jenis_customer || 'UMUM', status || 'AKTIF', id, perusahaan_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Anda tidak memiliki akses untuk mengubah data pelanggan ini" 
      });
    }

    res.json({
      success: true,
      message: "Data pelanggan berhasil diperbarui"
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal memperbarui data pelanggan" 
    });
  }
};

// ==========================================
// DELETE CUSTOMER (Validasi Kepemilikan)
// ==========================================
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    const [result] = await db.query(
      `DELETE FROM customer WHERE id = ? AND perusahaan_id = ?`,
      [id, perusahaan_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Anda tidak memiliki akses untuk menghapus pelanggan ini" 
      });
    }

    res.json({
      success: true,
      message: "Pelanggan berhasil dihapus dari sistem"
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal menghapus data pelanggan" 
    });
  }
};

module.exports = {
  getAllCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};