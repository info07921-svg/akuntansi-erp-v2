const db = require("../config/database");

/**
 * Seeder Chart of Accounts (CoA) Default
 * Kode akun dibuat unik dengan format:
 * perusahaanId + kode dasar
 *
 * Contoh:
 * Perusahaan 1  -> 11001, 11101, 11201
 * Perusahaan 2  -> 21001, 21101, 21201
 * Perusahaan 15 -> 151001, 151101, 151201
 */

const seedDefaultAccounts = async (conn, perusahaanId) => {
  const defaultAccounts = [
    { base: "1001", nama_akun: "Kas Utama & Bank", tipe: "KAS" },
    { base: "1101", nama_akun: "Piutang Usaha", tipe: "ASET" },
    { base: "1201", nama_akun: "Persediaan Barang Dagang", tipe: "ASET" },
    { base: "2001", nama_akun: "Hutang Usaha", tipe: "KEWAJIBAN" },
    { base: "2101", nama_akun: "Pendapatan Ditangguhkan", tipe: "KEWAJIBAN" },
    { base: "3001", nama_akun: "Modal Pemilik", tipe: "MODAL" },
    { base: "4001", nama_akun: "Pendapatan Penjualan", tipe: "PENDAPATAN" },
    { base: "5001", nama_akun: "Harga Pokok Penjualan (HPP)", tipe: "BEBAN" },
    { base: "6001", nama_akun: "Beban Operasional & Gaji", tipe: "BEBAN" },
  ];

  const insertQuery = `
    INSERT INTO akun
    (perusahaan_id, kode_akun, nama_akun, tipe)
    VALUES (?, ?, ?, ?)
  `;

  for (const akun of defaultAccounts) {
    // Membuat kode akun unik
    const kodeAkun = `${perusahaanId}${akun.base}`;

    // Cek apakah akun sudah ada
    const [exist] = await conn.query(
      `SELECT id
       FROM akun
       WHERE perusahaan_id = ?
       AND kode_akun = ?`,
      [perusahaanId, kodeAkun]
    );

    if (exist.length === 0) {
      await conn.query(insertQuery, [
        perusahaanId,
        kodeAkun,
        akun.nama_akun,
        akun.tipe,
      ]);
    }
  }
};

module.exports = { seedDefaultAccounts };