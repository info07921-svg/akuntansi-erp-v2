const db = require("../config/database");

exports.addKasModal = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { tipe, akun_kas_id, akun_tujuan_id, nominal, keterangan, tanggal } = req.body;
    const { perusahaan_id } = req.user; // Diambil aman dari JWT Token penanda login

    // 1. Validasi Input Utama
    if (!tipe || !akun_kas_id || !akun_tujuan_id || !nominal) {
      return res.status(400).json({ 
        success: false, 
        message: "Data input tidak lengkap. Semua field utama wajib diisi." 
      });
    }

    if (!perusahaan_id) {
      return res.status(401).json({
        success: false,
        message: "Otorisasi gagal. Identitas perusahaan tidak ditemukan."
      });
    }

    // Validasi Nominal tidak boleh minus atau nol
    const rillNominal = Number(nominal);
    if (isNaN(rillNominal) || rillNominal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Nominal transaksi harus berupa angka dan lebih besar dari nol."
      });
    }

    // Validasi agar akun sumber dan tujuan tidak sama
    if (akun_kas_id === akun_tujuan_id) {
      return res.status(400).json({
        success: false,
        message: "Kesalahan Jurnal Ganda! Akun utama dan akun lawan tidak boleh sama."
      });
    }

    // 2. Cek Eksistensi dan Tipe Akun di Database
    const [cekKas] = await conn.query("SELECT tipe FROM akun WHERE id = ? AND perusahaan_id = ?", [akun_kas_id, perusahaan_id]);
    const [cekTujuan] = await conn.query("SELECT tipe FROM akun WHERE id = ? AND perusahaan_id = ?", [akun_tujuan_id, perusahaan_id]);
    
    if (cekKas.length === 0 || cekTujuan.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Salah satu atau kedua akun tidak ditemukan di database perusahaan Anda."
      });
    }

    const tipeAkunKas = cekKas[0].tipe?.toUpperCase();
    const tipeAkunTujuan = cekTujuan[0].tipe?.toUpperCase();

    const tglJurnal = tanggal ? `${tanggal} 00:00:00` : new Date().toISOString().slice(0, 19).replace('T', ' ');
    const deskripsi = keterangan || `Pencatatan transaksi ${tipe.toLowerCase()}`;
    const tipeUpper = tipe.toUpperCase();

    // 3. INSERT KE HEADER UTAMA: TABEL `jurnal`
    const [jurnalResult] = await conn.query(
      `INSERT INTO jurnal (perusahaan_id, tanggal, ref_tipe, ref_id, keterangan, status) 
       VALUES (?, ?, ?, 0, ?, 'APPROVED')`,
      [perusahaan_id, tglJurnal, tipeUpper, deskripsi]
    );
    const jurnalId = jurnalResult.insertId;

    // ====================================================================
    // 4. SELEKSI ALUR DEBIT-KREDIT BERDASARKAN PARAMETER TABEL JURNAL ERP
    // ====================================================================
    
    if (tipeUpper === "MODAL") {
      // KONDISI A: SETOR MODAL (Normal)
      if (tipeAkunTujuan === "MODAL") {
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, 0)", [jurnalId, akun_kas_id, rillNominal]);
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, 0, ?)", [jurnalId, akun_tujuan_id, rillNominal]);
      } 
      // KONDISI B: SETOR MODAL (Terbalik Posisi Dropdown)
      else if (tipeAkunKas === "MODAL" && (tipeAkunTujuan === "KAS" || tipeAkunTujuan === "BANK" || tipeAkunTujuan === "KEWAJIBAN")) {
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, 0)", [jurnalId, akun_tujuan_id, rillNominal]); 
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, 0, ?)", [jurnalId, akun_kas_id, rillNominal]);   
      }
      // KONDISI C: TARIK MODAL / PRIVE (Eksplisit)
      else if ((tipeAkunKas === "KAS" || tipeAkunKas === "BANK") && tipeAkunTujuan === "MODAL") {
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, 0)", [jurnalId, akun_tujuan_id, rillNominal]);
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, 0, ?)", [jurnalId, akun_kas_id, rillNominal]);
      }
      else if (tipeAkunKas === "MODAL" && (tipeAkunTujuan === "KAS" || tipeAkunTujuan === "BANK")) {
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, 0)", [jurnalId, akun_kas_id, rillNominal]);
        await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, 0, ?)", [jurnalId, akun_tujuan_id, rillNominal]);
      }
      else {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: "Kombinasi kelompok akun tidak valid untuk jenis transaksi MODAL/PRIVE."
        });
      }

    } else if (tipeUpper === "KAS_MASUK") {
      // KAS_MASUK: Akun Utama (Kas/Bank) bertambah di DEBIT, Akun Lawan di KREDIT
      await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, 0)", [jurnalId, akun_kas_id, rillNominal]);
      await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, 0, ?)", [jurnalId, akun_tujuan_id, rillNominal]);

    } else if (tipeUpper === "KAS_KELUAR") {
      // KAS_KELUAR: Akun Lawan bertambah/terbeban di DEBIT, Akun Utama (Kas/Bank) berkurang di KREDIT
      await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, 0)", [jurnalId, akun_tujuan_id, rillNominal]);
      await conn.query("INSERT INTO detail_jurnal (jurnal_id, akun_id, debit, kredit) VALUES (?, ?, 0, ?)", [jurnalId, akun_kas_id, rillNominal]);

    } else {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Tipe transaksi tidak didukung oleh sistem akuntansi."
      });
    }

    // Sinkronisasi ref_id dengan id jurnal yang baru dibuat
    await conn.query("UPDATE jurnal SET ref_id = ? WHERE id = ?", [jurnalId, jurnalId]);

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: `Transaksi ${tipe.replace("_", " ")} berhasil dibukukan ke dalam Buku Besar Jurnal.`
    });

  } catch (error) {
    await conn.rollback();
    console.error("ERP Jurnal Error: ", error);
    return res.status(500).json({ 
      success: false, 
      message: "Gagal memproses transaksi akuntansi: " + error.message 
    });
  } finally {
    conn.release();
  }
};