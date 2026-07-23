const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { seedDefaultAccounts } = require("../utils/accountSeeder"); // Import seeder helper

// ==========================================================================
// 1. LOGIN USER & TENANT DETECT
// ==========================================================================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await db.query(
      `SELECT users.*, perusahaan.nama_perusahaan
       FROM users
       LEFT JOIN perusahaan ON users.perusahaan_id = perusahaan.id
       WHERE username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    // Token membawa payload perusahaan_id untuk proteksi multi-tenant
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        perusahaan_id: user.perusahaan_id
      },
      process.env.JWT_SECRET || "SECRET_KEY_ERP",
      { expiresIn: "24h" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        perusahaan_id: user.perusahaan_id,
        nama_perusahaan: user.nama_perusahaan
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================================================
// 2. REGISTER PERUSAHAAN BARU + AUTOMATIC DEFAULT COA SEEDING
// ==========================================================================
exports.register = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { nama_perusahaan, nama, username, password } = req.body;

    if (!nama_perusahaan || !nama || !username || !password) {
      return res.status(400).json({ success: false, message: "Semua field pendaftaran wajib diisi." });
    }

    // Cek apakah username sudah terpakai
    const [existUser] = await conn.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existUser.length > 0) {
      return res.status(400).json({ success: false, message: "Username sudah digunakan oleh orang lain." });
    }

    // 1. Insert ke tabel perusahaan
    const [resultCompany] = await conn.query(
      `INSERT INTO perusahaan (nama_perusahaan, created_at) VALUES (?, NOW())`,
      [nama_perusahaan]
    );
    const perusahaanId = resultCompany.insertId;

    // 2. Hash Password Security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert ke tabel users sebagai owner/admin perusahaan tersebut
    await conn.query(
      `INSERT INTO users (perusahaan_id, nama, username, password, role) VALUES (?, ?, ?, ?, 'ADMIN')`,
      [perusahaanId, nama, username, hashedPassword]
    );

    // 4. OTOMATISASI GENERATE AKUN DEFAULT KEUANGAN (KAS, PIUTANG, PENDAPATAN, DLL)
    await seedDefaultAccounts(conn, perusahaanId);

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: "Registrasi perusahaan dan administrator sukses. Akun bawaan umum akuntansi siap digunakan."
    });

  } catch (error) {
    await conn.rollback();
    console.error("Registration Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};