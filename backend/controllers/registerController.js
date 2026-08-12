const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { seedDefaultAccounts } = require("../utils/accountSeeder"); // <-- 1. Import helper seeder baru

exports.register = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const {
      nama_perusahaan,
      nama_lengkap,
      username,
      password
    } = req.body;

    if (
      !nama_perusahaan ||
      !nama_lengkap ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi"
      });
    }

    const [cekUser] = await conn.query(
      "SELECT id FROM users WHERE username=?",
      [username]
    );

    if (cekUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan"
      });
    }

    // Buat perusahaan baru
    const [perusahaan] = await conn.query(
      `
      INSERT INTO perusahaan
      (
        nama_perusahaan,
        status
      )
      VALUES (?, ?)
      `,
      [
        nama_perusahaan,
        "AKTIF"
      ]
    );

    const perusahaan_id = perusahaan.insertId;

    // Hash password
    const hashPassword = await bcrypt.hash(
      password,
      10
    );

    // Buat owner yang terikat dengan perusahaan_id
    await conn.query(
      `
      INSERT INTO users
      (
        perusahaan_id,
        username,
        password,
        nama_lengkap,
        role,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        perusahaan_id,
        username,
        hashPassword,
        nama_lengkap,
        "OWNER",
        "AKTIF"
      ]
    );

    // <-- 2. SUNTIKKAN AKUN STANDAR AKUNTANSI OTOMATIS DISINI
    await seedDefaultAccounts(conn, perusahaan_id);

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: "Registrasi perusahaan berhasil! Akun perkiraan bawaan umum siap digunakan."
    });

  } catch (error) {
    await conn.rollback();
    console.error("Error Register:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mendaftar"
    });
  } finally {
    conn.release();
  }
};