const db = require("../config/database");
const PDFDocument = require("pdfkit");
const { createJurnal } = require("../utils/jurnalHelper");

// ==========================================================================
// 1. CREATE BARANG MASUK (MENGGUNAKAN INDIKATOR ANGKA 0/1 SESUAI DB ANDA)
// ==========================================================================
exports.createBarangMasuk = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { perusahaan_id } = req.user; 
    const { supplier_id, status_pembayaran, jatuh_tempo, items } = req.body;

    if (!items || items.length === 0) {
      throw new Error("Detail barang belanjaan kosong.");
    }

    // SINKRONISASI ANGKA: Jika input dari frontend adalah "KREDIT", simpan angka 0 ke DB, jika tidak simpan 1 (LUNAS)
    const numericStatusBayar = String(status_pembayaran).toUpperCase() === "KREDIT" ? 0 : 1;

    const invoice = "BM-" + Date.now();
    let total_belanja = 0;

    for (const item of items) {
      const [masterBarang] = await conn.query(
        "SELECT nama_barang, harga_beli FROM barang WHERE id = ? AND perusahaan_id = ?",
        [item.barang_id, perusahaan_id]
      );
      if (masterBarang.length === 0) {
        throw new Error(`Barang dengan ID ${item.barang_id} tidak terdaftar.`);
      }
      total_belanja += Number(item.harga_beli) * Number(item.qty);
    }

    const cleanSupplierId = (supplier_id && supplier_id !== "0" && supplier_id !== "") ? supplier_id : null;

    // INSERT BARANG MASUK (numericStatusBayar dimasukkan ke kolom status_pembayaran)
    const [result] = await conn.query(
      `INSERT INTO barang_masuk (perusahaan_id, invoice, supplier_id, tanggal, total, status_pembayaran, jatuh_tempo, status_transaksi) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?, 'APPROVED')`,
      [perusahaan_id, invoice, cleanSupplierId, total_belanja, numericStatusBayar, (numericStatusBayar === 0 ? jatuh_tempo : null)]
    );

    const barangMasukId = result.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO detail_barang_masuk (barang_masuk_id, barang_id, qty, harga_beli) VALUES (?, ?, ?, ?)` ,
        [barangMasukId, item.barang_id, item.qty, item.harga_beli]
      );
      await conn.query(
        "UPDATE barang SET stok = stok + ? WHERE id = ? AND perusahaan_id = ?",
        [item.qty, item.barang_id, perusahaan_id]
      );
    }

    // CATAT KE TABEL HUTANG JIKA ANGKA ADALAH 0 (KREDIT)
    if (numericStatusBayar === 0) {
      await conn.query(
        `INSERT INTO hutang (perusahaan_id, barang_masuk_id, supplier_id, total_hutang, sisa_hutang, status, jatuh_tempo) 
         VALUES (?, ?, ?, ?, ?, 'BELUM_LUNAS', ?)`,
        [perusahaan_id, barangMasukId, cleanSupplierId, total_belanja, total_belanja, jatuh_tempo || null]
      );
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: `Dokumen Barang Masuk ${invoice} berhasil diterbitkan.`,
      id: barangMasukId
    });

  } catch (error) {
    await conn.rollback();
    console.error("Error Barang Masuk:", error);
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};



// ==========================================================================
// 2. GET ALL BARANG MASUK
// ==========================================================================
exports.getAllBarangMasuk = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;
    const [rows] = await db.query(
      `SELECT bm.*, IFNULL(s.nama_supplier, 'Umum / Tanpa Supplier') AS nama_supplier 
       FROM barang_masuk bm 
       LEFT JOIN supplier s ON s.id = bm.supplier_id
       WHERE bm.perusahaan_id = ? ORDER BY bm.id DESC`,
      [perusahaan_id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================================================
// 3. GET DETAIL BY ID (MEMBACA ANGKA 0/1 DARI DATABASE)
// ==========================================================================
exports.getBarangMasukById = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    const [header] = await db.query(
      `SELECT bm.*, IFNULL(s.nama_supplier, 'Umum / Tanpa Supplier') AS nama_supplier 
       FROM barang_masuk bm 
       LEFT JOIN supplier s ON s.id = bm.supplier_id
       WHERE bm.id = ? AND bm.perusahaan_id = ?`,
      [id, perusahaan_id]
    );

    if (header.length === 0) {
      return res.status(404).json({ success: false, message: "Dokumen tidak ditemukan." });
    }

    const info = header[0];
    let catatanHutang = null;

    // KONVERSI ANGKA KE TEKS: Jika database bernilai 0, maka status_pembayaran diubah menjadi string "KREDIT"
    const textStatusPembayaran = Number(info.status_pembayaran) === 0 ? "KREDIT" : "LUNAS";

    if (textStatusPembayaran === "KREDIT") {
      catatanHutang = {
        sisa_tagihan: info.total,
        status_pelunasan: "BELUM DIBAYAR (HUTANG USAHA)"
      };
    }

    const [items] = await db.query(
      `SELECT dbm.*, b.nama_barang, b.kode_barang 
       FROM detail_barang_masuk dbm
       JOIN barang b ON b.id = dbm.barang_id
       WHERE dbm.barang_masuk_id = ? ORDER BY dbm.id ASC`,
      [id]
    );

    return res.json({
      success: true,
      barang_masuk: {
        ...info,
        status_pembayaran: textStatusPembayaran, // Ditimpa dengan string agar frontend tidak bingung membaca angka 0
        informasi_tambahan_hutang: catatanHutang
      },
      detail: items
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================================================
// 4. CANCEL TRANSAKSI
// ==========================================================================
exports.cancelBarangMasuk = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    const [transaksi] = await conn.query(
      "SELECT * FROM barang_masuk WHERE id = ? AND perusahaan_id = ?",
      [id, perusahaan_id]
    );

    if (transaksi.length === 0) throw new Error("Data transaksi tidak ditemukan.");

    const [items] = await conn.query("SELECT barang_id, qty FROM detail_barang_masuk WHERE barang_masuk_id = ?", [id]);

    for (const item of items) {
      await conn.query(
        "UPDATE barang SET stok = GREATEST(stok - ?, 0) WHERE id = ? AND perusahaan_id = ?",
        [item.qty, item.barang_id, perusahaan_id]
      );
    }

    await conn.query("UPDATE barang_masuk SET status_transaksi = 'DIBATALKAN' WHERE id = ?", [id]);
    await conn.commit();
    
    return res.json({
      success: true,
      message: "Transaksi berhasil dibatalkan. Stok gudang berhasil ditarik kembali."
    });

  } catch (error) {
    await conn.rollback();
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
};

// ==========================================================================
// 5. CETAK NOTA PDF (MEMBACA ANGKA 0/1 DARI DATABASE)
// ==========================================================================
exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const [header] = await db.query(
      `SELECT bm.*, IFNULL(s.nama_supplier, 'Umum / Tanpa Supplier') AS nama_supplier,
              IFNULL(s.telepon, '-') AS telp_supplier, IFNULL(s.alamat, '-') AS alamat_supplier
       FROM barang_masuk bm 
       LEFT JOIN supplier s ON s.id = bm.supplier_id
       WHERE bm.id = ?`,
      [id]
    );

    if (header.length === 0) return res.status(404).send("Dokumen Tidak Ditemukan.");
    const info = header[0];

    // Deteksi berbasis angka biner database Anda
    const isKredit = Number(info.status_pembayaran) === 0;
    const textStatusPembayaran = isKredit ? "KREDIT" : "LUNAS";
    const keteranganHutangPDF = isKredit ? `BELUM DIBAYAR (Sisa: Rp ${Number(info.total).toLocaleString("id-ID")})` : "LUNAS (CASH)";

    const [perusahaan] = await db.query("SELECT nama_perusahaan, alamat FROM perusahaan WHERE id = ?", [info.perusahaan_id]);
    const namaPT = perusahaan.length > 0 ? perusahaan[0].nama_perusahaan : "INSTANSI PERUSAHAAN ERP";
    const alamatPT = perusahaan.length > 0 ? perusahaan[0].alamat || "-" : "-";

    const [items] = await db.query(
      `SELECT dbm.*, b.nama_barang, b.kode_barang FROM detail_barang_masuk dbm 
       JOIN barang b ON b.id = dbm.barang_id WHERE dbm.barang_masuk_id = ?`, [id]
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${info.invoice}.pdf"`);
    doc.pipe(res);

    doc.font("Helvetica-Bold").fontSize(14).fillColor("#1e3a8a").text(namaPT.toUpperCase(), 40, 40);
    doc.font("Helvetica").fontSize(9).fillColor("#475569").text(alamatPT, 40, 58, { width: 250 });
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text("FAKTUR BARANG MASUK", 320, 40, { align: "right" });
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0284c7").text(info.invoice, 320, 60, { align: "right" });
    
    doc.moveTo(40, 85).lineTo(555, 85).lineWidth(2).strokeColor("#1e3a8a").stroke();

    const topMetadataY = 100;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("INFORMASI FAKTUR", 40, topMetadataY);
    doc.font("Helvetica").fillColor("#64748b")
       .text(`Tanggal Terima : ${new Date(info.tanggal).toLocaleDateString("id-ID")}`, 40, topMetadataY + 15)
       .text(`Metode Bayar   : ${textStatusPembayaran}`, 40, topMetadataY + 28)
       .text(`Jatuh Tempo    : ${info.jatuh_tempo ? new Date(info.jatuh_tempo).toLocaleDateString("id-ID") : "-"}`, 40, topMetadataY + 41);

    doc.font("Helvetica-Bold").fillColor("#334155").text("MITRA SUPPLIER / VENDOR", 320, topMetadataY);
    doc.font("Helvetica").fillColor("#64748b")
       .text(`Nama Vendor    : ${info.nama_supplier}`, 320, topMetadataY + 15)
       .text(`Status Berkas  : ${info.status_transaksi || "APPROVED"}`, 320, topMetadataY + 28)
       .text(`Keterangan     : ${keteranganHutangPDF}`, 320, topMetadataY + 41, { width: 230 });

    let currentY = 170;
    doc.rect(40, currentY, 515, 22).fill("#f1f5f9");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e293b");
    doc.text("KODE", 50, currentY + 6);
    doc.text("NAMA KOMODITAS BARANG", 130, currentY + 6);
    doc.text("QTY", 360, currentY + 6, { align: "center", width: 50 });
    doc.text("HARGA SATUAN", 420, currentY + 6, { align: "right", width: 125 });
    
    currentY += 22;
    doc.font("Helvetica").fontSize(9).fillColor("#334155");
    items.forEach((item, index) => {
      if (index % 2 === 1) doc.rect(40, currentY, 515, 20).fill("#f8fafc");
      doc.text(item.kode_barang || "-", 50, currentY + 5);
      doc.text(item.nama_barang, 130, currentY + 5);
      doc.text(`${item.qty} Pcs`, 360, currentY + 5, { align: "center", width: 50 });
      doc.text(`Rp ${Number(item.harga_beli).toLocaleString("id-ID")}`, 420, currentY + 5, { align: "right", width: 125 });
      currentY += 20;
    });

    doc.rect(300, currentY + 10, 255, 25).fill("#e2e8f0");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e3a8a");
    doc.text("TOTAL BELANJA :", 310, currentY + 18);
    doc.text(`Rp ${Number(info.total).toLocaleString("id-ID")}`, 420, currentY + 18, { align: "right", width: 125 });

    doc.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).send("Gagal mencetak dokumen PDF.");
  }
};
