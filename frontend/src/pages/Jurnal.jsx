import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  FaBook, 
  FaPlus, 
  FaRegCalendarAlt, 
  FaSearch, 
  FaEye, 
  FaCheckCircle, 
  FaExclamationTriangle 
} from "react-icons/fa";
import "../styles/erp.css";

export default function Jurnal() {
  const navigate = useNavigate();
  const [jurnalList, setJurnalList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [filter, setFilter] = useState({
    tanggal_awal: "",
    tanggal_akhir: ""
  });

  // State untuk melihat detail modal entries
  const [selectedJurnal, setSelectedJurnal] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchJurnal();
  }, []);

  const fetchJurnal = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.tanggal_awal) params.tanggal_awal = filter.tanggal_awal;
      if (filter.tanggal_akhir) params.tanggal_akhir = filter.tanggal_akhir;

      // Mengambil data dari endpoint backend akuntansiRoutes (getJurnalManual)
      const res = await api.get("/akuntansi/jurnal-manual", { params });
      const data = res.data?.data || res.data || [];
      setJurnalList(data);
    } catch (err) {
      console.error("Gagal memuat daftar jurnal:", err);
      alert("Gagal mengambil data daftar jurnal memorial.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJurnal();
  };

  const lihatDetailJurnal = async (id) => {
    try {
      const res = await api.get(`/akuntansi/jurnal-manual/${id}`);
      if (res.data?.success) {
        setSelectedJurnal(res.data.jurnal);
        setDetailRows(res.data.detail || []);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Gagal memuat detail transaksi:", err);
      alert("Detail jurnal tidak dapat ditemukan.");
    }
  };

  // Helper formatting rupiah
  const formatRupiah = (num) => {
    return "Rp " + Number(num || 0).toLocaleString("id-ID");
  };

  return (
    <div className="page-container">
      {/* HEADER UTAMA */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaBook style={{ color: "#0284c7" }} /> Buku Jurnal Umum (Memorial)
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
            Histori pencatatan transaksi double-entry, penyesuaian saldo perkiraan, dan penutupan buku.
          </p>
        </div>
        
        {/* TOMBOL ADD NEW ENTRIES */}
        <button 
          className="btn-primary" 
          onClick={() => navigate("/jurnalmanual")}
          style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px" }}
        >
          <FaPlus /> Buat Jurnal Baru
        </button>
      </div>

      {/* FILTER PENCARIAN TANGGAL */}
      <div className="page-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <form onSubmit={handleSearch} className="form-row-inline" style={{ margin: 0, alignItems: "flex-end", gap: "16px" }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label" style={{ fontSize: "12px" }}>Dari Tanggal</label>
            <input 
              type="date" 
              name="tanggal_awal" 
              value={filter.tanggal_awal} 
              onChange={handleFilterChange} 
            />
          </div>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label" style={{ fontSize: "12px" }}>Sampai Tanggal</label>
            <input 
              type="date" 
              name="tanggal_akhir" 
              value={filter.tanggal_akhir} 
              onChange={handleFilterChange} 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ height: "38px", background: "#334155", padding: "0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaSearch /> Filter
          </button>
        </form>
      </div>

      {/* TABEL DATA UTAMA */}
      <div className="page-card" style={{ padding: "0", overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="erp-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: "80px", textAlign: "center" }}>ID Jurnal</th>
                <th style={{ width: "150px" }}>Tanggal</th>
                <th style={{ width: "120px" }}>Tipe Ref</th>
                <th>Keterangan / Memo</th>
                <th style={{ width: "130px", textAlign: "center" }}>Status</th>
                <th style={{ width: "100px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Sedang memuat riwayat jurnal perkiraan...
                  </td>
                </tr>
              ) : jurnalList.length > 0 ? (
                jurnalList.map((row) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: "center", fontWeight: "600" }}>#{row.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                        <FaRegCalendarAlt style={{ color: "#94a3b8" }} />
                        {new Date(row.tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <span className="badge-role" style={{ background: row.ref_tipe === "MANUAL" ? "#f1f5f9" : "#e0f2fe", color: row.ref_tipe === "MANUAL" ? "#475569" : "#0369a1" }}>
                        {row.ref_tipe}
                      </span>
                    </td>
                    <td style={{ fontWeight: "500", color: "#1e293b" }}>{row.keterangan}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        background: "#dcfce7", color: "#16a34a", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700"
                      }}>
                        <FaCheckCircle /> POSTED
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: "6px 12px", background: "#0284c7", margin: 0, display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={() => lihatDetailJurnal(row.id)}
                      >
                        <FaEye /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Tidak ada transaksi akuntansi memorial yang ditemukan pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL WINDOW DETAIL DOUBLE ENTRY (ERP GLASSMORPHISM MODEL) */}
      {showModal && selectedJurnal && (
        <div className="modal-backdrop" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.4)", zIndex: 999, backdropFilter: "blur(4px)" }}>
          <div className="modal-content" style={{ background: "#ffffff", borderRadius: "8px", width: "750px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>Rincian Pos Ayat Jurnal #{selectedJurnal.id}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
            </div>

            {/* Modal Body Info */}
            <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Tanggal Pembukuan:</span>
                <strong>{new Date(selectedJurnal.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                
                <span style={{ color: "#64748b" }}>Catatan Memo/Keterangan:</span>
                <span style={{ color: "#1e293b", fontWeight: "500" }}>{selectedJurnal.keterangan}</span>
              </div>
            </div>

            {/* Modal Table Detail Rows */}
            <div style={{ padding: "20px" }}>
              <table className="erp-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Kode Akun</th>
                    <th>Nama Rekening Perkiraan</th>
                    <th style={{ width: "160px", textAlign: "right" }}>Debet</th>
                    <th style={{ width: "160px", textAlign: "right" }}>Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((item, idx) => (
                    <tr key={idx}>
                      <td><code>{item.kode_akun}</code></td>
                      {/* Memberi inden teks jika baris berupa Kredit agar rapi dibaca layaknya akuntan konvensional */}
                      <td style={{ paddingLeft: item.kredit > 0 ? "25px" : "12px", color: item.kredit > 0 ? "#475569" : "#0f172a" }}>
                        {item.nama_akun}
                      </td>
                      <td style={{ textAlign: "right", color: "#15803d", fontWeight: item.debit > 0 ? "600" : "400" }}>
                        {item.debit > 0 ? formatRupiah(item.debit) : "-"}
                      </td>
                      <td style={{ textAlign: "right", color: "#b91c1c", fontWeight: item.kredit > 0 ? "600" : "400" }}>
                        {item.kredit > 0 ? formatRupiah(item.kredit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ margin: 0 }}>
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}