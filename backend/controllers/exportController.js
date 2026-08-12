const ExcelJS = require("exceljs");
const db = require("../config/database");

// =================================------------------------------------------
// HELPER STYLING & FORMATTING
// =================================------------------------------------------

function setupWorksheet(sheet, title, subtitle = "") {
  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = title;

  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = subtitle;

  sheet.getCell("A1").font = { bold: true, size: 16 };
  sheet.getCell("A2").font = { size: 11 };

  sheet.getCell("A1").alignment = { horizontal: "center" };
  sheet.getCell("A2").alignment = { horizontal: "center" };
}

function styleHeaderRow(row) {
  row.font = { bold: true, color: { argb: "FFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E78" }
  };
  row.alignment = { horizontal: "center" };
}

function styleCurrencyColumn(sheet, columnIndex) {
  sheet.getColumn(columnIndex).numFmt = '"Rp" #,##0';
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

function getDateFilter(req) {
  const { awal, akhir } = req.query;
  if (awal && akhir) {
    return {
      clause: "WHERE j.tanggal BETWEEN ? AND ?",
      params: [awal, akhir]
    };
  }
  return { clause: "", params: [] };
}

// =================================------------------------------------------
// 1. EXPORT NERACA SALDO
// =================================------------------------------------------
exports.exportNeracaSaldo = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;
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
      LEFT JOIN detail_jurnal dj ON dj.akun_id = a.id
      WHERE a.perusahaan_id = ?
      GROUP BY a.id, a.kode_akun, a.nama_akun, a.tipe
      ORDER BY a.kode_akun ASC
    `, [perusahaan_id]);

    sheet.columns = [
      { header: "Kode Akun", key: "kode_akun", width: 15 },
      { header: "Nama Akun", key: "nama_akun", width: 35 },
      { header: "Tipe", key: "tipe", width: 20 },
      { header: "Debit", key: "total_debit", width: 20 },
      { header: "Kredit", key: "total_kredit", width: 20 }
    ];

    setupWorksheet(sheet, "NERACA SALDO", "Periode Laporan");
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

    sheet.autoFilter = { from: "A5", to: "E5" };
    sheet.views = [{ state: "frozen", ySplit: 5 }];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=neraca_saldo.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =================================------------------------------------------
// 2. EXPORT LABA RUGI
// =================================------------------------------------------
exports.exportLabaRugi = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laba Rugi");

    const { clause, params } = getDateFilter(req);
    const whereClause = clause ? `${clause} AND j.perusahaan_id = ?` : "WHERE j.perusahaan_id = ?";
    const queryParams = [...params, perusahaan_id];

    const pendapatanSql = `
      SELECT a.nama_akun, SUM(dj.kredit - dj.debit) AS total
      FROM jurnal j
      JOIN detail_jurnal dj ON dj.jurnal_id = j.id
      JOIN akun a ON a.id = dj.akun_id
      ${whereClause} AND a.tipe = 'PENDAPATAN'
      GROUP BY a.id, a.nama_akun
    `;

    const bebanSql = `
      SELECT a.nama_akun, SUM(dj.debit - dj.kredit) AS total
      FROM jurnal j
      JOIN detail_jurnal dj ON dj.jurnal_id = j.id
      JOIN akun a ON a.id = dj.akun_id
      ${whereClause} AND a.tipe = 'BEBAN'
      GROUP BY a.id, a.nama_akun
    `;

    const [pendapatan] = await db.query(pendapatanSql, queryParams);
    const [beban] = await db.query(bebanSql, queryParams);

    let totalPendapatan = 0;
    let totalBeban = 0;
    const awal = req.query.awal || "-";
    const akhir = req.query.akhir || "-";

    setupWorksheet(sheet, "LAPORAN LABA RUGI", `${awal} s/d ${akhir}`);

    sheet.addRow(["PENDAPATAN"]);
    pendapatan.forEach(item => {
      totalPendapatan += Number(item.total);
      sheet.addRow([item.nama_akun, Number(item.total)]);
    });
    sheet.addRow(["TOTAL PENDAPATAN", totalPendapatan]);
    sheet.addRow([]);

    sheet.addRow(["BEBAN"]);
    beban.forEach(item => {
      totalBeban += Number(item.total);
      sheet.addRow([item.nama_akun, Number(item.total)]);
    });
    sheet.addRow(["TOTAL BEBAN", totalBeban]);
    sheet.addRow([]);

    sheet.addRow(["LABA BERSIH", totalPendapatan - totalBeban]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=laba_rugi.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =================================------------------------------------------
// 3. EXPORT NERACA
// =================================------------------------------------------
exports.exportNeraca = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;
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
      LEFT JOIN detail_jurnal dj ON dj.akun_id = a.id
      WHERE a.perusahaan_id = ?
      GROUP BY a.id, a.kode_akun, a.nama_akun, a.tipe
      ORDER BY a.kode_akun
    `, [perusahaan_id]);

    let totalAset = 0;
    let totalKewajiban = 0;
    let totalModal = 0;

    setupWorksheet(sheet, "NERACA", "Laporan Posisi Keuangan");

    sheet.addRow(["ASET"]);
    akun.filter(a => a.tipe === "ASET").forEach(a => {
      const saldo = Number(a.debit) - Number(a.kredit);
      totalAset += saldo;
      sheet.addRow([a.nama_akun, saldo]);
    });
    sheet.addRow(["TOTAL ASET", totalAset]);
    sheet.addRow([]);

    sheet.addRow(["KEWAJIBAN"]);
    akun.filter(a => a.tipe === "KEWAJIBAN").forEach(a => {
      const saldo = Number(a.kredit) - Number(a.debit);
      totalKewajiban += saldo;
      sheet.addRow([a.nama_akun, saldo]);
    });
    sheet.addRow(["TOTAL KEWAJIBAN", totalKewajiban]);
    sheet.addRow([]);

    sheet.addRow(["MODAL"]);
    akun.filter(a => a.tipe === "MODAL").forEach(a => {
      const saldo = Number(a.kredit) - Number(a.debit);
      totalModal += saldo;
      sheet.addRow([a.nama_akun, saldo]);
    });
    sheet.addRow(["TOTAL MODAL", totalModal]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=neraca.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =================================------------------------------------------
// 4. EXPORT BUKU BESAR
// =================================------------------------------------------
exports.exportBukuBesar = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Buku Besar");

    const { clause, params } = getDateFilter(req);
    const whereClause = clause ? `${clause} AND j.perusahaan_id = ?` : "WHERE j.perusahaan_id = ?";
    const queryParams = [...params, perusahaan_id];

    const [rows] = await db.query(`
      SELECT
        j.tanggal,
        a.kode_akun,
        a.nama_akun,
        dj.debit,
        dj.kredit,
        j.keterangan
      FROM detail_jurnal dj
      JOIN jurnal j ON j.id = dj.jurnal_id
      JOIN akun a ON a.id = dj.akun_id
      ${whereClause}
      ORDER BY j.tanggal ASC
    `, queryParams);

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
      saldo += Number(item.debit) - Number(item.kredit);
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

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=buku_besar.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =================================------------------------------------------
// 5. EXPORT KARTU PIUTANG USAHA (TAMBAHAN BARU)
// =================================------------------------------------------
exports.exportPiutang = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Piutang Usaha");

    const [rows] = await db.query(`
      SELECT 
        pi.id, 
        IFNULL(pe.invoice, '-') AS invoice, 
        IFNULL(c.nama_customer, 'Pelanggan Umum') AS nama_customer, 
        pi.total_piutang, 
        pi.sisa_piutang, 
        pi.status, 
        IFNULL(pi.jatuh_tempo, '-') AS jatuh_tempo
      FROM piutang pi
      LEFT JOIN customer c ON c.id = pi.customer_id
      LEFT JOIN penjualan pe ON pe.id = pi.penjualan_id
      WHERE pe.perusahaan_id = ? OR pi.customer_id IN (SELECT id FROM customer WHERE perusahaan_id = ?)
      ORDER BY pi.id DESC
    `, [perusahaan_id, perusahaan_id]);

    sheet.columns = [
      { header: "ID Piutang", key: "id", width: 12 },
      { header: "Invoice Penjualan", key: "invoice", width: 22 },
      { header: "Nama Customer", key: "nama_customer", width: 25 },
      { header: "Total Tagihan (Rp)", key: "total_piutang", width: 20 },
      { header: "Sisa Tagihan (Rp)", key: "sisa_piutang", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Jatuh Tempo", key: "jatuh_tempo", width: 18 }
    ];

    setupWorksheet(sheet, "REKAP PIUTANG USAHA", "Kartu Tagihan Pelanggan");
    styleHeaderRow(sheet.getRow(5));

    rows.forEach(item => {
      const row = sheet.addRow([
        item.id,
        item.invoice,
        item.nama_customer,
        Number(item.total_piutang),
        Number(item.sisa_piutang),
        item.status,
        item.jatuh_tempo
      ]);
      addBorder(row);
    });

    styleCurrencyColumn(sheet, 4);
    styleCurrencyColumn(sheet, 5);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=rekap_piutang.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// =================================------------------------------------------
// 6. EXPORT KARTU HUTANG DAGANG (TAMBAHAN BARU)
// =================================------------------------------------------
exports.exportHutang = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Hutang Dagang");

    const [rows] = await db.query(`
      SELECT 
        h.id, 
        COALESCE(bm.invoice, '-') AS nomor_faktur, 
        IFNULL(s.nama_supplier, 'Supplier Umum') AS nama_supplier, 
        h.total_hutang, 
        h.sisa_hutang, 
        h.status, 
        IFNULL(h.jatuh_tempo, '-') AS jatuh_tempo
      FROM hutang h
      LEFT JOIN supplier s ON s.id = h.supplier_id
      LEFT JOIN barang_masuk bm ON bm.id = h.barang_masuk_id
      WHERE h.perusahaan_id = ?
      ORDER BY h.id DESC
    `, [perusahaan_id]);

    sheet.columns = [
      { header: "ID Hutang", key: "id", width: 12 },
      { header: "Faktur Barang Masuk", key: "nomor_faktur", width: 22 },
      { header: "Nama Supplier", key: "nama_supplier", width: 25 },
      { header: "Total Hutang (Rp)", key: "total_hutang", width: 20 },
      { header: "Sisa Hutang (Rp)", key: "sisa_hutang", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Jatuh Tempo", key: "jatuh_tempo", width: 18 }
    ];

    setupWorksheet(sheet, "REKAP HUTANG DAGANG", "Kartu Kewajiban Supplier");
    styleHeaderRow(sheet.getRow(5));

    rows.forEach(item => {
      const row = sheet.addRow([
        item.id,
        item.nomor_faktur,
        item.nama_supplier,
        Number(item.total_hutang),
        Number(item.sisa_hutang),
        item.status,
        item.jatuh_tempo
      ]);
      addBorder(row);
    });

    styleCurrencyColumn(sheet, 4);
    styleCurrencyColumn(sheet, 5);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=rekap_hutang.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};