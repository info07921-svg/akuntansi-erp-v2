const ExcelJS = require("exceljs");
const db = require("../config/database");

// Helper untuk mengirimkan file Excel sebagai stream response
const sendExcelResponse = async (res, workbook, filename) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${filename}.xlsx`
  );
  await workbook.xlsx.write(res);
  res.end();
};

// 1. Export Neraca Saldo
exports.exportNeracaSaldo = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;

    const [rows] = await db.query(`
      SELECT a.kode_akun, a.nama_akun,
             COALESCE(SUM(dj.debit), 0) AS total_debit,
             COALESCE(SUM(dj.kredit), 0) AS total_kredit
      FROM akun a
      LEFT JOIN detail_jurnal dj ON dj.akun_id = a.id
      WHERE a.perusahaan_id = ?
      GROUP BY a.id, a.kode_akun, a.nama_akun
      ORDER BY a.kode_akun ASC
    `, [perusahaan_id]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Neraca Saldo");
    sheet.columns = [
      { header: "Kode Akun", key: "kode_akun", width: 15 },
      { header: "Nama Akun", key: "nama_akun", width: 30 },
      { header: "Debit (Rp)", key: "total_debit", width: 20 },
      { header: "Kredit (Rp)", key: "total_kredit", width: 20 },
    ];
    rows.forEach(r => sheet.addRow(r));
    sheet.getRow(1).font = { bold: true };

    await sendExcelResponse(res, workbook, "Laporan_Neraca_Saldo");
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Export / Query Buku Besar (Dukungan Tampil Semua Akun Maupun Spesifik Akun)
exports.bukuBesar = async (req, res) => {
  try {
    const akun_id = req.params.akun_id || req.query.akun_id;
    const { tanggal_awal, tanggal_akhir } = req.query;
    const { perusahaan_id } = req.user;

    let sqlParams = [];
    let sqlWhere = [];

    // Filter berdasarkan tenant/perusahaan
    if (perusahaan_id) {
      sqlWhere.push("(j.perusahaan_id = ? OR j.perusahaan_id IS NULL)");
      sqlParams.push(perusahaan_id);
    }

    let tipeAkun = "";
    let infoAkun = null;

    // Jika user memilih 1 akun spesifik
    if (akun_id && akun_id !== "") {
      const [akun] = await db.query(
        `SELECT * FROM akun WHERE (id = ? OR kode_akun = ?) AND (perusahaan_id = ? OR perusahaan_id IS NULL)`,
        [akun_id, akun_id, perusahaan_id]
      );

      if (akun.length > 0) {
        infoAkun = akun[0];
        tipeAkun = String(akun[0].tipe || "").toUpperCase();
        sqlWhere.push("dj.akun_id = ?");
        sqlParams.push(akun[0].id);
      }
    }

    // Filter berdasarkan rentang tanggal
    if (tanggal_awal) {
      sqlWhere.push("j.tanggal >= ?");
      sqlParams.push(`${tanggal_awal} 00:00:00`);
    }

    if (tanggal_akhir) {
      sqlWhere.push("j.tanggal <= ?");
      sqlParams.push(`${tanggal_akhir} 23:59:59`);
    }

    const whereClause = sqlWhere.length > 0 ? `WHERE ${sqlWhere.join(" AND ")}` : "";

    // Query Utama Mutasi Jurnal
    const [rows] = await db.query(
      `SELECT 
        j.tanggal,
        j.ref_tipe,
        j.ref_id,
        j.keterangan,
        dj.debit,
        dj.kredit,
        a.kode_akun,
        a.nama_akun,
        a.tipe AS tipe_akun
       FROM detail_jurnal dj
       INNER JOIN jurnal j ON j.id = dj.jurnal_id
       INNER JOIN akun a ON a.id = dj.akun_id
       ${whereClause}
       ORDER BY j.tanggal ASC, dj.id ASC`,
      sqlParams
    );

    let saldo = 0;
    const formattedData = rows.map(item => {
      const debitVal = Number(item.debit) || 0;
      const kreditVal = Number(item.kredit) || 0;
      const currentTipe = String(item.tipe_akun || tipeAkun).toUpperCase();

      if (["KAS", "BANK", "ASET", "BEBAN"].includes(currentTipe)) {
        saldo += (debitVal - kreditVal);
      } else {
        saldo += (kreditVal - debitVal);
      }

      return {
        tanggal: item.tanggal,
        kode_akun: item.kode_akun,
        nama_akun: item.nama_akun,
        ref_tipe: item.ref_tipe,
        ref_id: item.ref_id,
        keterangan: item.keterangan,
        debit: debitVal,
        kredit: kreditVal,
        debet: debitVal,
        saldo: saldo,
        saldo_berjalan: saldo
      };
    });

    return res.json({
      success: true,
      akun: infoAkun,
      saldo_akhir: saldo,
      total_transaksi: formattedData.length,
      data: formattedData,
      mutasi: formattedData
    });

  } catch (err) {
    console.error("Gagal memuat Buku Besar di LaporanController:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Export Laba Rugi
exports.exportLabaRugi = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;

    const [penjualan] = await db.query(`
      SELECT COALESCE(SUM(dj.kredit - dj.debit), 0) AS total
      FROM detail_jurnal dj 
      INNER JOIN akun a ON a.id = dj.akun_id 
      WHERE a.kode_akun LIKE '4%' AND a.perusahaan_id = ?
    `, [perusahaan_id]);

    const [pembelian] = await db.query(`
      SELECT COALESCE(SUM(dj.debit - dj.kredit), 0) AS total
      FROM detail_jurnal dj 
      INNER JOIN akun a ON a.id = dj.akun_id 
      WHERE a.kode_akun LIKE '5%' AND a.perusahaan_id = ?
    `, [perusahaan_id]);

    const totalPenjualan = Number(penjualan[0]?.total || 0);
    const totalPembelian = Number(pembelian[0]?.total || 0);
    const labaKotor = totalPenjualan - totalPembelian;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laba Rugi");
    sheet.columns = [
      { header: "Keterangan", key: "item", width: 35 },
      { header: "Nilai (Rp)", key: "nilai", width: 20 },
    ];
    sheet.addRow({ item: "Total Pendapatan / Penjualan", nilai: totalPenjualan });
    sheet.addRow({ item: "Total Beban / Pembelian HPP", nilai: totalPembelian });
    sheet.addRow({ item: "LABA RUGI BERSIH", nilai: labaKotor });
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(4).font = { bold: true };

    await sendExcelResponse(res, workbook, "Laporan_Laba_Rugi");
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 4. Export Neraca
exports.exportNeraca = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;

    const [rows] = await db.query(`
      SELECT a.kode_akun, a.nama_akun, a.tipe,
             COALESCE(SUM(dj.debit), 0) AS total_debit,
             COALESCE(SUM(dj.kredit), 0) AS total_kredit
      FROM akun a
      LEFT JOIN detail_jurnal dj ON dj.akun_id = a.id
      WHERE a.perusahaan_id = ?
      GROUP BY a.id, a.kode_akun, a.nama_akun, a.tipe
      ORDER BY a.kode_akun ASC
    `, [perusahaan_id]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Neraca Keuangan");
    sheet.columns = [
      { header: "Kode Akun", key: "kode_akun", width: 15 },
      { header: "Nama Akun", key: "nama_akun", width: 30 },
      { header: "Tipe Akun", key: "tipe", width: 18 },
      { header: "Debit (Rp)", key: "total_debit", width: 18 },
      { header: "Kredit (Rp)", key: "total_kredit", width: 18 },
    ];
    rows.forEach(r => sheet.addRow(r));
    sheet.getRow(1).font = { bold: true };

    await sendExcelResponse(res, workbook, "Laporan_Neraca_Keuangan");
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Export Piutang Usaha
exports.exportPiutang = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;

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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Piutang Usaha");
    sheet.columns = [
      { header: "ID Piutang", key: "id", width: 12 },
      { header: "Invoice Penjualan", key: "invoice", width: 22 },
      { header: "Nama Customer", key: "nama_customer", width: 25 },
      { header: "Total Tagihan (Rp)", key: "total_piutang", width: 20 },
      { header: "Sisa Tagihan (Rp)", key: "sisa_piutang", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Jatuh Tempo", key: "jatuh_tempo", width: 18 },
    ];
    rows.forEach(r => sheet.addRow(r));
    sheet.getRow(1).font = { bold: true };

    await sendExcelResponse(res, workbook, "Rekap_Piutang_Usaha");
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Export Hutang Dagang
exports.exportHutang = async (req, res) => {
  try {
    const perusahaan_id = req.user?.perusahaan_id || 1;

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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Hutang Dagang");
    sheet.columns = [
      { header: "ID Hutang", key: "id", width: 12 },
      { header: "Faktur Barang Masuk", key: "nomor_faktur", width: 22 },
      { header: "Nama Supplier", key: "nama_supplier", width: 25 },
      { header: "Total Hutang (Rp)", key: "total_hutang", width: 20 },
      { header: "Sisa Hutang (Rp)", key: "sisa_hutang", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Jatuh Tempo", key: "jatuh_tempo", width: 18 },
    ];
    rows.forEach(r => sheet.addRow(r));
    sheet.getRow(1).font = { bold: true };

    await sendExcelResponse(res, workbook, "Rekap_Hutang_Dagang");
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};