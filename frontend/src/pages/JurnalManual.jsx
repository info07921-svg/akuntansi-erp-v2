import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPlus, FaTrash, FaSave, FaRegCalendarAlt, FaBook, FaBalanceScale } from "react-icons/fa";
import "../styles/erp.css";

export default function JurnalManual() {
  const [akunList, setAkunList] = useState([]);
  
  // State Utama Dokumen Jurnal Manual
  const [formHeader, setFormHeader] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: ""
  });

  // State Multi-Rows Detail Jurnal
  const [jurnalItems, setJurnalItems] = useState([
    { akun_id: "", debit: 0, kredit: 0 },
    { akun_id: "", debit: 0, kredit: 0 }
  ]);

  useEffect(() => {
    loadDaftarAkun();
  }, []);

  const loadDaftarAkun = async () => {
    try {
      const res = await api.get("/akun");
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData)) {
        setAkunList(rawData);
      }
    } catch (err) {
      console.error("Gagal memuat Chart of Accounts:", err);
    }
  };

  const handleHeaderChange = (e) => {
    setFormHeader({ ...formHeader, [e.target.name]: e.target.value });
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...jurnalItems];
    
    if (field === "akun_id") {
      updatedRows[index][field] = value;
    } else {
      const nominal = value === "" ? 0 : parseFloat(value);
      updatedRows[index][field] = nominal;

      if (field === "debit" && nominal > 0) {
        updatedRows[index]["kredit"] = 0;
      } else if (field === "kredit" && nominal > 0) {
        updatedRows[index]["debit"] = 0;
      }
    }
    setJurnalItems(updatedRows);
  };

  const handleAddRow = () => {
    setJurnalItems([...jurnalItems, { akun_id: "", debit: 0, kredit: 0 }]);
  };

  const handleRemoveRow = (index) => {
    if (jurnalItems.length <= 2) {
      alert("Jurnal akuntansi double-entry memerlukan minimal 2 baris transaksi.");
      return;
    }
    setJurnalItems(jurnalItems.filter((_, i) => i !== index));
  };

  const totalDebit = jurnalItems.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalKredit = jurnalItems.reduce((sum, item) => sum + (item.kredit || 0), 0);
  const isBalanced = totalDebit === totalKredit && totalDebit > 0;

  const handleSubmitJurnal = async (e) => {
    e.preventDefault();

    if (!formHeader.keterangan.trim()) {
      alert("Harap isi deskripsi/keterangan jurnal penyesuaian terlebih dahulu.");
      return;
    }

    if (!isBalanced) {
      alert(`Jurnal Tidak Seimbang!`);
      return;
    }

    const payload = {
      tanggal: formHeader.tanggal,
      keterangan: formHeader.keterangan,
      details: jurnalItems.map(item => ({
        akun_id: parseInt(item.akun_id),
        debit: item.debit,
        kredit: item.kredit
      }))
    };

    try {
  // SINKRONISASI AKTIF: Menggunakan rute resmi yang terdaftar di akuntansiRoutes.js
  const res = await api.post("/jurnal/jurnal-manual", payload); //   DIUBAH KE JURNAL-MANUAL
  
  if (res.data?.success || res.status === 200) {
    alert("Jurnal Memorial Manual berhasil dibukukan!");
    setFormHeader({ 
      tanggal: new Date().toISOString().split("T")[0], 
      keterangan: "" 
    });
    setJurnalItems([
      { akun_id: "", debit: 0, kredit: 0 },
      { akun_id: "", debit: 0, kredit: 0 }
    ]);
  }
} catch (err) {
  console.error("Gagal memposting jurnal:", err);
  alert("Gagal memproses penyesuaian. Pastikan koneksi server aman.");
}
  };

  return (
    <div className="page-container">
      {/* HEADER MASTER MODUL */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaBook style={{ color: "#0284c7" }} /> Pencatatan Jurnal Manual (Memorial)
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
            Modul entry penyesuaian saldo perkiraan akun, koreksi laporan keuangan, dan transaksi non-kasir.
          </p>
        </div>
      </div>

      {/* PANEL DATA HEADER - PENERAPAN FORM-ROW-INLINE & ERP.CSS */}
      <div className="page-card" style={{ padding: "20px" }}>
        <div className="form-row-inline" style={{ margin: 0, gap: "20px" }}>
          <div className="form-group" style={{ flex: "1", margin: 0 }}>
            <label className="form-label">
              <FaRegCalendarAlt style={{ marginRight: "6px" }} /> Tanggal Transaksi Jurnal
            </label>
            <input 
              type="date" 
              name="tanggal" 
              value={formHeader.tanggal} 
              onChange={handleHeaderChange}
              required 
            />
          </div>
          <div className="form-group" style={{ flex: "2", margin: 0 }}>
            <label className="form-label">Deskripsi Memo / Keterangan Jurnal</label>
            <input 
              type="text" 
              name="keterangan" 
              placeholder="Contoh: Penyesuaian beban penyusutan inventaris kantor bulan ini" 
              value={formHeader.keterangan} 
              onChange={handleHeaderChange}
              required 
            />
          </div>
        </div>
      </div>

      {/* TABEL BARIS DOUBLE ENTRY */}
      <div className="page-card" style={{ padding: "0", overflow: "hidden", marginTop: "20px" }}>
        <div className="table-responsive">
          <table className="erp-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>No</th>
                <th>Rekening Perkiraan Akun</th>
                <th style={{ width: "200px", textAlign: "right" }}>Debet (Rp)</th>
                <th style={{ width: "200px", textAlign: "right" }}>Kredit (Rp)</th>
                <th style={{ width: "70px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jurnalItems.map((row, index) => (
                <tr key={index}>
                  <td style={{ textAlign: "center", fontWeight: "600", color: "#64748b", verticalAlign: "middle" }}>
                    {index + 1}
                  </td>
                  {/* PENERAPAN INTEGRASI SELECTION INPUT KELAS DATABASE ERP */}
                  <td style={{ verticalAlign: "middle", padding: "8px 12px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <select
                        value={row.akun_id}
                        onChange={(e) => handleRowChange(index, "akun_id", e.target.value)}
                        style={{ width: "100%", height: "38px" }}
                      >
                        <option value="">-- Pilih Rekening Akun --</option>
                        {akunList.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{a.kode_akun}] — {a.nama_akun} ({a.tipe})
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td style={{ verticalAlign: "middle", padding: "8px 12px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.debit === 0 ? "" : row.debit}
                        onChange={(e) => handleRowChange(index, "debit", e.target.value)}
                        style={{ textAlign: "right", fontWeight: "600", color: "#15803d", height: "38px" }}
                      />
                    </div>
                  </td>
                  <td style={{ verticalAlign: "middle", padding: "8px 12px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.kredit === 0 ? "" : row.kredit}
                        onChange={(e) => handleRowChange(index, "kredit", e.target.value)}
                        style={{ textAlign: "right", fontWeight: "600", color: "#b91c1c", height: "38px" }}
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: "8px 12px", margin: 0, display: "inline-flex", alignItems: "center" }}
                      onClick={() => handleRemoveRow(index)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOTTOM UTILITY & TRACKER BALANCE */}
        <div style={{ padding: "16px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <button
              type="button"
              className="btn-primary"
              style={{ background: "#475569" }}
              onClick={handleAddRow}
            >
              <FaPlus /> Tambah Alokasi Baris
            </button>
          </div>

          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Total Debet:</div>
              <strong style={{ fontSize: "14px", color: "#15803d" }}>Rp {totalDebit.toLocaleString("id-ID")}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Total Kredit:</div>
              <strong style={{ fontSize: "14px", color: "#b91c1c" }}>Rp {totalKredit.toLocaleString("id-ID")}</strong>
            </div>

            <div style={{ borderLeft: "1px solid #cbd5e1", paddingLeft: "20px", display: "flex", alignItems: "center" }}>
              {isBalanced ? (
                <span style={{ background: "#dcfce7", color: "#16a34a", padding: "6px 14px", border_radius: "20px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaBalanceScale /> JURNAL BALANCE
                </span>
              ) : (
                <span style={{ background: "#fee2e2", color: "#ef4444", padding: "6px 14px", border_radius: "20px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaBalanceScale /> UNBALANCED ({Math.abs(totalDebit - totalKredit).toLocaleString("id-ID")})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PANEL TOMBOL POSTING */}
      <div style={{ textAlign: "right", marginTop: "16px" }}>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmitJurnal}
          disabled={!isBalanced}
          style={{
            padding: "12px 24px",
            fontSize: "14px",
            display: "inline-flex",
            justifyContent: "center",
            opacity: !isBalanced ? 0.5 : 1,
            cursor: !isBalanced ? "not-allowed" : "pointer"
          }}
        >
          <FaSave style={{ marginRight: "8px" }} /> Amankan & Posting Jurnal Penyesuaian
        </button>
      </div>
    </div>
  );
}