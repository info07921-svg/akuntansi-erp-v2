const db = require("../config/database");
const { auditLog } = require('../utils/auditLog');

/**
 * Buat Jurnal Manual
 */
exports.createManual = async (req, res) => {

  const conn = await db.getConnection();

  try {
    // Mengambil perusahaan_id dari token user yang login (di-set oleh authMiddleware)
    const { perusahaan_id } = req.user;

    if (!perusahaan_id) {
      return res.status(400).json({
        success: false,
        message: "Identitas perusahaan tidak valid atau Anda belum login."
      });
    }

    const {
      tanggal,
      keterangan,
      detail,
      details // Ditambahkan toleransi jika frontend mengirimkan properti bernama 'details'
    } = req.body;

    // Memastikan baris detail jurnal terbaca dengan baik dari frontend
    const rowsJurnal = detail || details;

    if (!rowsJurnal || rowsJurnal.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Minimal harus mengisi 2 baris detail jurnal (Debit & Kredit)"
      });
    }

    let totalDebit = 0;
    let totalKredit = 0;

    rowsJurnal.forEach(item => {
      totalDebit += Number(item.debit || 0);
      totalKredit += Number(item.kredit || 0);
    });

    // Validasi aturan dasar double-entry akuntansi
    if (Math.abs(totalDebit - totalKredit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Total debit (${totalDebit}) dan kredit (${totalKredit}) tidak balance / seimbang.`
      });
    }

    await conn.beginTransaction();

    // 1. Insert data ke Header Jurnal (Menambahkan kolom perusahaan_id)
    const [jurnal] = await conn.query(
      `
      INSERT INTO jurnal
      (
        perusahaan_id,
        tanggal,
        ref_tipe,
        ref_id,
        keterangan,
        status
      )
      VALUES
      (
        ?,
        ?,
        'MANUAL',
        0,
        ?,
        'APPROVED'
      )
      `,
      [
        perusahaan_id,
        tanggal,
        keterangan
      ]
    );

    const jurnalId = jurnal.insertId;

    // 2. Insert data ke Detail Jurnal Mutasi
    for (const item of rowsJurnal) {
      // Memastikan ID Akun dikirim dengan benar sebagai nilai integer angka
      if (!item.akun_id) {
        throw new Error("Terdapat baris jurnal yang belum memilih akun perkiraan.");
      }

      await conn.query(
        `
        INSERT INTO detail_jurnal
        (
          jurnal_id,
          akun_id,
          debit,
          kredit
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          jurnalId,
          item.akun_id,
          Number(item.debit || 0),
          Number(item.kredit || 0)
        ]
      );
    }

    await conn.commit();
    
    return res.status(201).json({
      success: true,
      message: "Jurnal manual berhasil diposting dan saldo pembukuan telah diperbarui."
    });

  } catch (err) {
    await conn.rollback();
    console.error("Error Create Manual Jurnal:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Terjadi kesalahan saat memproses penyimpanan jurnal."
    });
  } finally {
    conn.release();
  }
};

/**
 * Ambil Semua Jurnal Milik Perusahaan Terkait
 */
exports.getAllJurnal = async (req, res) => {
  try {
    const { perusahaan_id } = req.user;

    const [rows] = await db.query(`
      SELECT * FROM jurnal 
      WHERE perusahaan_id = ? 
      ORDER BY tanggal DESC, id DESC
    `, [perusahaan_id]);

    res.json({
      success: true,
      jurnal: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Ambil Detail Isi Jurnal Berdasarkan ID Jurnal
 */
exports.getJurnalById = async (req, res) => {
  try {
    const { jurnalId } = req.params;
    const { perusahaan_id } = req.user;

    const [header] = await db.query(`
      SELECT *
      FROM jurnal
      WHERE id = ? AND perusahaan_id = ?
    `, [jurnalId, perusahaan_id]);

    if (!header.length) {
      return res.status(404).json({
        success: false,
        message: "Data jurnal tidak ditemukan atau Anda tidak memiliki hak akses."
      });
    }

    const [detail] = await db.query(`
      SELECT
        dj.id,
        dj.akun_id,
        a.kode_akun,
        a.nama_akun,
        dj.debit,
        dj.kredit
      FROM detail_jurnal dj
      JOIN akun a ON a.id = dj.akun_id
      WHERE dj.jurnal_id = ?
      ORDER BY dj.id
    `, [jurnalId]);

    res.json({
      success: true,
      jurnal: header[0],
      detail
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Verifikasi / Approve Jurnal (Opsi Tambahan)
 */
exports.approveJurnal = async (req, res) => {
  try {
    const { id } = req.params;
    const { perusahaan_id } = req.user;

    await db.query(`
      UPDATE jurnal
      SET status='APPROVED'
      WHERE id=? AND perusahaan_id=?
    `, [id, perusahaan_id]);

    res.json({
      success: true,
      message: 'Status jurnal berhasil disetujui (Approved).'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};