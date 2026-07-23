const db = require("../config/database");

// =====================================
// BUKU BESAR
// GET /api/laporan/buku-besar/:akun_id
// =====================================

exports.bukuBesar = async (req, res) => {

  try {



    const akun_id = req.params.akun_id;

    // CEK AKUN

    const [akun] = await db.query(
      `
      SELECT *
      FROM akun
      WHERE id = ?
      `,
      [akun_id]
    );

    if (akun.length === 0) {

      return res.status(404).json({
        success: false,
        error: "Akun tidak ditemukan"
      });

    }

    // MUTASI

    const [rows] = await db.query(
      `
      SELECT

      j.tanggal,
      j.ref_tipe,
      j.ref_id,
      j.keterangan,

      dj.debit,
      dj.kredit

      FROM detail_jurnal dj

      INNER JOIN jurnal j
      ON j.id = dj.jurnal_id

      WHERE dj.akun_id = ?

      ORDER BY
      j.tanggal ASC,
      dj.id ASC
      `,
      [akun_id]
    );

    let saldo = 0;

    const mutasi = rows.map(item => {

      const tipe =
      akun[0].kelompok;

        if(
         tipe==="ASET" ||
         tipe==="BEBAN"
        ){
         saldo += debit-kredit;
        }else{
         saldo += kredit-debit;
        }

      saldo +=
        Number(item.debit)
        -
        Number(item.kredit);

      return {

        tanggal:
        item.tanggal,

        ref_tipe:
        item.ref_tipe,

        ref_id:
        item.ref_id,

        keterangan:
        item.keterangan,

        debit:
        item.debit,

        kredit:
        item.kredit,

        saldo

      };

    });

    res.json({

      success: true,

      akun: akun[0],

      saldo_akhir: saldo,

      total_transaksi:
      mutasi.length,

      mutasi

    });

  } catch (err) {

    res.status(500).json({

      success: false,
      error: err.message

    });

  }

};


// =====================================
// NERACA SALDO
// GET /api/laporan/neraca-saldo
// =====================================

exports.neracaSaldo = async (req, res) => {

  try {

    const [rows] = await db.query(
      `
      SELECT

      a.id,
      a.kode_akun,
      a.nama_akun,

      COALESCE(
        SUM(dj.debit),
        0
      ) AS total_debit,

      COALESCE(
        SUM(dj.kredit),
        0
      ) AS total_kredit

      FROM akun a

      LEFT JOIN detail_jurnal dj
      ON dj.akun_id = a.id

      GROUP BY

      a.id,
      a.kode_akun,
      a.nama_akun

      ORDER BY
      a.kode_akun ASC
      `
    );

    let grandDebit = 0;
    let grandKredit = 0;

    rows.forEach(item => {

      grandDebit +=
      Number(item.total_debit);

      grandKredit +=
      Number(item.total_kredit);

    });

    res.json({

      success: true,

      total_data:
      rows.length,

      total_debit:
      grandDebit,

      total_kredit:
      grandKredit,

      balance:
      grandDebit === grandKredit,

      data: rows

    });

  } catch (err) {

    res.status(500).json({

      success: false,
      error: err.message

    });

  }

};


// =====================================
// LABA RUGI
// GET /api/laporan/laba-rugi
// =====================================

exports.labaRugi = async (req, res) => {

  try {

    // PENJUALAN

    const [penjualan] =
    await db.query(
      `
      SELECT

      COALESCE(
        SUM(dj.kredit - dj.debit),
        0
      ) AS total

      FROM detail_jurnal dj

      INNER JOIN akun a
      ON a.id = dj.akun_id

      WHERE a.kode_akun = '411'
      `
    );

    // PEMBELIAN

    const [pembelian] =
    await db.query(
      `
      SELECT

      COALESCE(
        SUM(dj.debit - dj.kredit),
        0
      ) AS total

      FROM detail_jurnal dj

      INNER JOIN akun a
      ON a.id = dj.akun_id

      WHERE a.kode_akun = '511'
      `
    );

    const totalPenjualan =
    Number(penjualan[0].total);

    const totalPembelian =
    Number(pembelian[0].total);

    const labaKotor =
      totalPenjualan
      -
      totalPembelian;

    res.json({

      success: true,

      penjualan:
      totalPenjualan,

      pembelian:
      totalPembelian,

      laba_kotor:
      labaKotor

    });

  } catch (err) {

    res.status(500).json({

      success: false,
      error: err.message

    });

  }

};