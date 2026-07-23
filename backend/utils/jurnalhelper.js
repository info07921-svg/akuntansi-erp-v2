const db = require("../config/database");

const createJurnal = async (
  conn,
  {
    tanggal = null,
    ref_tipe,
    ref_id,
    keterangan,
    details
  }
) => {
  try {

    // Validasi debit = kredit

    const totalDebit =
      details.reduce(
        (sum, item) =>
          sum + Number(item.debit || 0),
        0
      );

    const totalKredit =
      details.reduce(
        (sum, item) =>
          sum + Number(item.kredit || 0),
        0
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
          tanggal,
          ref_tipe,
          ref_id,
          keterangan
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          tanggal || new Date(),
          ref_tipe,
          ref_id,
          keterangan
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