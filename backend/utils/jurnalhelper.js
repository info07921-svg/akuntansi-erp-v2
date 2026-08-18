const db = require("../config/database");

const createJurnal = async (
  conn,
  {
    tanggal = null,
    ref_tipe,
    ref_id,
    keterangan,
    perusahaan_id,
    status = "APPROVED",
    details
  }
) => {
  try {

    // Validasi wajib: setiap jurnal HARUS terikat ke satu perusahaan (multi-tenant)
    if (!perusahaan_id) {
      throw new Error(
        "perusahaan_id wajib dikirim saat membuat jurnal (multi-tenant safety)"
      );
    }

    // Validasi debit = kredit
    // (dibulatkan ke 2 desimal untuk menghindari selisih floating point,
    //  misal 0.1 + 0.2 !== 0.3 di JavaScript)

    const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

    const totalDebit = round2(
      details.reduce(
        (sum, item) =>
          sum + Number(item.debit || 0),
        0
      )
    );

    const totalKredit = round2(
      details.reduce(
        (sum, item) =>
          sum + Number(item.kredit || 0),
        0
      )
    );

    if (totalDebit !== totalKredit) {
      throw new Error(
        "Total debit dan kredit harus sama"
      );
    }

    // Simpan jurnal

    const [jurnalResult] =
      await conn.query(
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
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          perusahaan_id,
          tanggal || new Date(),
          ref_tipe,
          ref_id,
          keterangan,
          status
        ]
      );

    const jurnalId =
      jurnalResult.insertId;

    // Simpan detail jurnal

    for (const item of details) {

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
          item.debit || 0,
          item.kredit || 0
        ]
      );

    }

    return jurnalId;

  } catch (error) {
    throw error;
  }
};

module.exports = {
  createJurnal
};