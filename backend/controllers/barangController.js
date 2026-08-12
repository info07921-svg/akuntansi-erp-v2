const db = require("../config/database");

// ==========================================
// GET ALL BARANG (Isolasi per Perusahaan)
// ==========================================
const getBarang = async (req, res) => {
  try {
    // Ambil perusahaan_id dari token JWT user yang login
    const { perusahaan_id } = req.user;

    const [rows] = await db.query(`
      SELECT
        barang.*,
        kategori_barang.nama_kategori
      FROM barang
      LEFT JOIN kategori_barang
        ON barang.kategori_id = kategori_barang.id
      WHERE barang.perusahaan_id = ?
      ORDER BY barang.id DESC
    `, [perusahaan_id]);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data barang"
    });
  }
};

// ==========================================
// GET BARANG BY ID (Proteksi Akses Silang)
// ==========================================
const getBarangById = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    // Pastikan barang yang dicari benar-benar milik perusahaan yang login
    const [rows] = await db.query(
      `SELECT * FROM barang WHERE id = ? AND perusahaan_id = ?`,
      [id, perusahaan_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data barang tidak ditemukan atau Anda tidak memiliki akses"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail barang"
    });
  }
};

// ==========================================
// CREATE BARANG (Otomatis Sematkan perusahaan_id)
// ==========================================
const createBarang = async (req, res) => {
  try {
    const {
      kategori_id,
      kode_barang,
      nama_barang,
      satuan,
      harga_beli,
      harga_jual,
      stok,
      stok_cadangan
    } = req.body;
    
    const { perusahaan_id } = req.user;

    if (!kode_barang || !nama_barang || !harga_beli || !harga_jual) {
      return res.status(400).json({
        success: false,
        message: "Field utama wajib diisi"
      });
    }

    // Cek apakah kode barang sudah terpakai di perusahaan yang sama
    const [cekKode] = await db.query(
      "SELECT id FROM barang WHERE kode_barang = ? AND perusahaan_id = ?",
      [kode_barang, perusahaan_id]
    );

    if (cekKode.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Kode barang sudah digunakan di perusahaan Anda"
      });
    }

    await db.query(
      `
      INSERT INTO barang 
      (perusahaan_id, kategori_id, kode_barang, nama_barang, satuan, harga_beli, harga_jual, stok, stok_cadangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        perusahaan_id,
        kategori_id || null,
        kode_barang,
        nama_barang,
        satuan || "Pcs",
        harga_beli,
        harga_jual,
        stok || 0,
        stok_cadangan || 0
      ]
    );

    res.json({
      success: true,
      message: "Barang berhasil ditambahkan"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan barang"
    });
  }
};

// ==========================================
// UPDATE BARANG (Validasi Kepemilikan)
// ==========================================
const updateBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kategori_id,
      kode_barang,
      nama_barang,
      satuan,
      harga_beli,
      harga_jual,
      stok,
      stok_cadangan
    } = req.body;
    
    const { perusahaan_id } = req.user;

    // Pastikan barang tersebut milik perusahaan ini sebelum diupdate
    const [cekBarang] = await db.query(
      "SELECT id FROM barang WHERE id = ? AND perusahaan_id = ?",
      [id, perusahaan_id]
    );

    if (cekBarang.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk mengubah barang ini"
      });
    }

    // Cek duplikasi kode barang dengan baris lain di perusahaan yang sama
    if (kode_barang) {
      const [cekKode] = await db.query(
        "SELECT id FROM barang WHERE kode_barang = ? AND perusahaan_id = ? AND id != ?",
        [kode_barang, perusahaan_id, id]
      );
      if (cekKode.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Kode barang tersebut sudah digunakan oleh produk lain"
        });
      }
    }

    await db.query(
      `
      UPDATE barang
      SET
        kategori_id = ?,
        kode_barang = ?,
        nama_barang = ?,
        satuan = ?,
        harga_beli = ?,
        harga_jual = ?,
        stok = ?,
        stok_cadangan = ?
      WHERE id = ? AND perusahaan_id = ?
      `,
      [
        kategori_id || null,
        kode_barang,
        nama_barang,
        satuan,
        harga_beli,
        harga_jual,
        stok,
        stok_cadangan,
        id,
        perusahaan_id
      ]
    );

    res.json({
      success: true,
      message: "Data barang berhasil diperbarui"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui data barang"
    });
  }
};

// ==========================================
// MANAGE STOCK CADANGAN (Proteksi Parameter)
// ==========================================
const kelolaCadangan = async (req, res) => {
  try {
    const { id } = req.params;
    const { aksi, jumlah } = req.body;
    const { perusahaan_id } = req.user;

    if (!aksi || !jumlah || jumlah <= 0) {
      return res.status(400).json({
        success: false,
        message: "Aksi dan jumlah yang valid wajib ditentukan"
      });
    }

    // Ambil data barang & pastikan kepemilikannya sah
    const [rows] = await db.query(
      "SELECT stok, stok_cadangan FROM barang WHERE id = ? AND perusahaan_id = ?",
      [id, perusahaan_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak atau barang tidak ditemukan"
      });
    }

    let stok = Number(rows[0].stok);
    let stokCadangan = Number(rows[0].stok_cadangan);

    if (aksi === "MASUK_CADANGAN") {
      if (stok < jumlah) {
        return res.status(400).json({
          success: false,
          message: "Stok toko tidak mencukupi untuk dipindahkan ke cadangan"
        });
      }
      stok -= Number(jumlah);
      stokCadangan += Number(jumlah);
    } else if (aksi === "KELUAR_CADANGAN") {
      if (stokCadangan < jumlah) {
        return res.status(400).json({
          success: false,
          message: "Stok cadangan tidak mencukupi"
        });
      }
      stok += Number(jumlah);
      stokCadangan -= Number(jumlah);
    } else {
      return res.status(400).json({
        success: false,
        message: "Aksi tidak dikenali"
      });
    }

    await db.query(
      `
      UPDATE barang
      SET stok = ?, stok_cadangan = ?
      WHERE id = ? AND perusahaan_id = ?
      `,
      [stok, stokCadangan, id, perusahaan_id]
    );

    res.json({
      success: true,
      message: "Stok cadangan berhasil diperbarui"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengelola stok cadangan"
    });
  }
};

// ==========================================
// DELETE BARANG (Validasi Kepemilikan)
// ==========================================
const deleteBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    // Pastikan barang tersebut milik perusahaan ini sebelum dihapus
    const [cekBarang] = await db.query(
      "SELECT id FROM barang WHERE id = ? AND perusahaan_id = ?",
      [id, perusahaan_id]
    );

    if (cekBarang.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki otorisasi menghapus barang ini"
      });
    }

    await db.query("DELETE FROM barang WHERE id = ? AND perusahaan_id = ?", [id, perusahaan_id]);

    res.json({
      success: true,
      message: "Barang berhasil dihapus"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus barang"
    });
  }
};

module.exports = {
  getBarang,
  getBarangById,
  createBarang,
  updateBarang,
  kelolaCadangan,
  deleteBarang
};