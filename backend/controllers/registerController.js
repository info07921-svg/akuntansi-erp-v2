const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { seedDefaultAccounts } = require("../utils/accountSeeder"); // <-- 1. Import helper seeder baru

exports.register = async (req, res) => {
  const {
    nama_perusahaan,
    username,
    password
  } = req.body;
  // PERBAIKAN BUG: kolom pada tabel `users` bernama `nama` (lihat authController.js
  // yang membaca `user.nama` saat login), bukan `nama_lengkap`. Sebelumnya field ini
  // disimpan sebagai `nama_lengkap`, sehingga setelah registrasi & login nama user
  // selalu kosong/undefined (atau query akan gagal jika kolom `nama_lengkap` tidak ada).
  // Menerima kedua nama field dari body agar kompatibel dengan form lama maupun baru.
  const nama = req.body.nama || req.body.nama_lengkap;

  if (
    !nama_perusahaan ||
    !nama ||
    !username ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Semua field wajib diisi"
    });
  }

  // PERBAIKAN BUG: validasi input dipindahkan ke atas, sebelum membuka transaksi DB.
  // Sebelumnya, jika validasi gagal setelah beginTransaction() dipanggil, fungsi langsung
  // return tanpa commit/rollback -> koneksi dikembalikan ke pool dalam kondisi transaksi
  // masih "menggantung", berpotensi menyebabkan locking/kebocoran koneksi di production.
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

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
        nama,
        role,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        perusahaan_id,
        username,
        hashPassword,
        nama,
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