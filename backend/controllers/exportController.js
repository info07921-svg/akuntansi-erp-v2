const ExcelJS = require("exceljs");
const db = require("../config/database");

function setupWorksheet(sheet, title, subtitle = "") {

  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = title;

  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = subtitle;

  sheet.getCell("A1").font = {
    bold: true,
    size: 16
  };

  sheet.getCell("A2").font = {
    size: 11
  };

  sheet.getCell("A1").alignment = {
    horizontal: "center"
  };

  sheet.getCell("A2").alignment = {
    horizontal: "center"
  };

}

function styleHeaderRow(row) {

  row.font = {
    bold: true,
    color: {
      argb: "FFFFFF"
    }
  };

  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1F4E78"
    }
  };

  row.alignment = {
    horizontal: "center"
  };

}

function styleCurrencyColumn(sheet, columnIndex) {

  sheet.getColumn(columnIndex).numFmt =
    '"Rp" #,##0';

}

function addBorder(row) {

  row.eachCell(cell => {

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };

  });

}
/*
|--------------------------------------------------------------------------
| Helper Filter Periode
|--------------------------------------------------------------------------
*/

function getDateFilter(req) {
  const { awal, akhir } = req.query;

  if (awal && akhir) {
    return {
      clause: "WHERE j.tanggal BETWEEN ? AND ?",
      params: [awal, akhir]
    };
  }

  return {
    clause: "",
    params: []
  };
}

/*
|--------------------------------------------------------------------------
| EXPORT NERACA SALDO
|--------------------------------------------------------------------------
*/

exports.exportNeracaSaldo = async (req, res) => {
  try {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Neraca Saldo");

    const [rows] = await db.query(`
      SELECT
        a.kode_akun,
        a.nama_akun,
        a.tipe,
        COALESCE(SUM(dj.debit),0) AS total_debit,
        COALESCE(SUM(dj.kredit),0) AS total_kredit
      FROM akun a
      LEFT JOIN detail_jurnal dj
        ON dj.akun_id = a.id
      GROUP BY a.id
      ORDER BY a.kode_akun
    `);

    sheet.columns = [
      { header: "Kode Akun", key: "kode_akun", width: 15 },
      { header: "Nama Akun", key: "nama_akun", width: 35 },
      { header: "Tipe", key: "tipe", width: 20 },
      { header: "Debit", key: "total_debit", width: 20 },
      { header: "Kredit", key: "total_kredit", width: 20 }
    ];

    setupWorksheet(
  sheet,
  "NERACA SALDO",
  "Periode Laporan"
);

styleHeaderRow(sheet.getRow(5));

    rows.forEach(item => {

  const row = sheet.addRow([
    item.kode_akun,
    item.nama_akun,
    item.tipe,
    Number(item.total_debit),
    Number(item.total_kredit)
  ]);

  addBorder(row);

});

    styleCurrencyColumn(sheet, 4);
styleCurrencyColumn(sheet, 5);

sheet.autoFilter = {
  from: "A5",
  to: "E5"
};

sheet.views = [
  {
    state: "frozen",
    ySplit: 5
  }
];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=neraca_saldo.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
};

/*
|--------------------------------------------------------------------------
| EXPORT LABA RUGI
|--------------------------------------------------------------------------
*/

exports.exportLabaRugi = async (req, res) => {

  try {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laba Rugi");

    const { clause, params } = getDateFilter(req);

    const pendapatanSql = `
      SELECT
        a.nama_akun,
        SUM(dj.kredit - dj.debit) AS total
      FROM jurnal j
      JOIN detail_jurnal dj
        ON dj.jurnal_id = j.id
      JOIN akun a
        ON a.id = dj.akun_id
      ${clause}
      ${clause ? "AND" : "WHERE"} a.tipe = 'PENDAPATAN'
      GROUP BY a.id
    `;

    const bebanSql = `
      SELECT
        a.nama_akun,
        SUM(dj.debit - dj.kredit) AS total
      FROM jurnal j
      JOIN detail_jurnal dj
        ON dj.jurnal_id = j.id
      JOIN akun a
        ON a.id = dj.akun_id
      ${clause}
      ${clause ? "AND" : "WHERE"} a.tipe = 'BEBAN'
      GROUP BY a.id
    `;

    const [pendapatan] =
      await db.query(pendapatanSql, params);

    const [beban] =
      await db.query(bebanSql, params);

    let totalPendapatan = 0;
    let totalBeban = 0;
const awal =
  req.query.awal || "-";

const akhir =
  req.query.akhir || "-";

setupWorksheet(
  sheet,
  "LAPORAN LABA RUGI",
  `${awal} s/d ${akhir}`
);

    sheet.addRow(["PENDAPATAN"]);

    pendapatan.forEach(item => {

      totalPendapatan += Number(item.total);

      sheet.addRow([
        item.nama_akun,
        Number(item.total)
      ]);

    });

    sheet.addRow([
      "TOTAL PENDAPATAN",
      totalPendapatan
    ]);

    sheet.addRow([]);

    sheet.addRow(["BEBAN"]);

    beban.forEach(item => {

      totalBeban += Number(item.total);

      sheet.addRow([
        item.nama_akun,
        Number(item.total)
      ]);

    });

    sheet.addRow([
      "TOTAL BEBAN",
      totalBeban
    ]);

    sheet.addRow([]);

    sheet.addRow([
      "LABA BERSIH",
      totalPendapatan - totalBeban
    ]);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=laba_rugi.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
};

/*
|--------------------------------------------------------------------------
| EXPORT NERACA
|--------------------------------------------------------------------------
*/

exports.exportNeraca = async (req, res) => {

  try {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Neraca");

    const [akun] = await db.query(`
      SELECT
        a.kode_akun,
        a.nama_akun,
        a.tipe,
        COALESCE(SUM(dj.debit),0) debit,
        COALESCE(SUM(dj.kredit),0) kredit
      FROM akun a
      LEFT JOIN detail_jurnal dj
        ON dj.akun_id = a.id
      GROUP BY a.id
      ORDER BY a.kode_akun
    `);

    let totalAset = 0;
    let totalKewajiban = 0;
    let totalModal = 0;

  setupWorksheet(
  sheet,
  "NERACA",
  "Laporan Posisi Keuangan"
);

    sheet.addRow(["ASET"]);

    akun
      .filter(a => a.tipe === "ASET")
      .forEach(a => {

        const saldo =
          Number(a.debit) -
          Number(a.kredit);

        totalAset += saldo;

        sheet.addRow([
          a.nama_akun,
          saldo
        ]);

      });

    sheet.addRow([
      "TOTAL ASET",
      totalAset
    ]);

    sheet.addRow([]);

    sheet.addRow(["KEWAJIBAN"]);

    akun
      .filter(a => a.tipe === "KEWAJIBAN")
      .forEach(a => {

        const saldo =
          Number(a.kredit) -
          Number(a.debit);

        totalKewajiban += saldo;

        sheet.addRow([
          a.nama_akun,
          saldo
        ]);

      });

    sheet.addRow([
      "TOTAL KEWAJIBAN",
      totalKewajiban
    ]);

    sheet.addRow([]);

    sheet.addRow(["MODAL"]);

    akun
      .filter(a => a.tipe === "MODAL")
      .forEach(a => {

        const saldo =
          Number(a.kredit) -
          Number(a.debit);

        totalModal += saldo;

        sheet.addRow([
          a.nama_akun,
          saldo
        ]);

      });

    sheet.addRow([
      "TOTAL MODAL",
      totalModal
    ]);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=neraca.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
};

/*
|--------------------------------------------------------------------------
| EXPORT BUKU BESAR
|--------------------------------------------------------------------------
*/

exports.exportBukuBesar = async (req, res) => {

  try {

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Buku Besar");

    const { clause, params } = getDateFilter(req);

    const [rows] = await db.query(`
      SELECT
        j.tanggal,
        a.kode_akun,
        a.nama_akun,
        dj.debit,
        dj.kredit,
        j.keterangan
      FROM detail_jurnal dj
      JOIN jurnal j
        ON j.id = dj.jurnal_id
      JOIN akun a
        ON a.id = dj.akun_id
      ${clause}
      ORDER BY j.tanggal ASC
    `, params);

    sheet.columns = [
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "Kode Akun", key: "kode_akun", width: 15 },
      { header: "Nama Akun", key: "nama_akun", width: 30 },
      { header: "Debit", key: "debit", width: 20 },
      { header: "Kredit", key: "kredit", width: 20 },
      { header: "Keterangan", key: "keterangan", width: 40 },
      { header: "Saldo", key: "saldo", width: 20 }
    ];

    let saldo = 0;

rows.forEach(item => {

  saldo +=
    Number(item.debit) -
    Number(item.kredit);

  const row = sheet.addRow({
    tanggal: item.tanggal,
    kode_akun: item.kode_akun,
    nama_akun: item.nama_akun,
    debit: Number(item.debit),
    kredit: Number(item.kredit),
    keterangan: item.keterangan,
    saldo: saldo
  });

  addBorder(row);

});

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=buku_besar.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
};