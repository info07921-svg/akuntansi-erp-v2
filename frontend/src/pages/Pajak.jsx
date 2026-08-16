import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPercentage, FaPlus } from "react-icons/fa";
import "../styles/erp.css";

export default function Pajak() {
  const [listPajak, setListPajak] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama_pajak: "PPN", tarif: "", berlaku_mulai: "" });

  const loadData = async () => {
    try {
      const res = await api.get("/pajak");
      // Menangani balasan baik berbentuk Array langsung [...] maupun objek { data: [...] }
      if (Array.isArray(res.data)) {
        setListPajak(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setListPajak(res.data.data);
      } else {
        setListPajak([]);
      }
    } catch (err) {
      console.error("Gagal memuat data pajak:", err);
      setListPajak([]);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  const handleAktifkan = async (id) => {
    if (window.confirm("Aktifkan pengaturan pajak ini? Pajak lain akan dinonaktifkan.")) {
      try {
        await api.put(`/pajak/aktifkan/${id}`);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || "Gagal mengubah pajak aktif");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/pajak", form);
      setShowModal(false);
      setForm({ nama_pajak: "PPN", tarif: "", berlaku_mulai: "" });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Gagal menyimpan data");
    }
  };

  // Helper aman format tanggal YYYY-MM-DD ke DD/MM/YYYY
  const formatTanggal = (dateStr) => {
    if (!dateStr) return "-";
    const parts = String(dateStr).split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><FaPercentage /> Pengaturan Pajak (PPN)</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Update Tarif Pajak
        </button>
      </div>

      <div className="page-card">
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Nama Pajak</th>
                <th>Tarif (%)</th>
                <th>Berlaku Mulai</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listPajak.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                    Belum ada data pengaturan pajak.
                  </td>
                </tr>
              ) : (
                listPajak.map((p) => {
                  const isAktif = Number(p.aktif) === 1 || String(p.status).toUpperCase() === "AKTIF";
                  return (
                    <tr key={p.id} style={{ background: isAktif ? "#f0fdf4" : "transparent" }}>
                      <td><strong>{p.nama_pajak}</strong></td>
                      <td>{Number(p.tarif).toFixed(2)}%</td>
                      <td>{formatTanggal(p.berlaku_mulai)}</td>
                      <td>
                        {isAktif ? (
                          <span className="badge-active">AKTIF</span>
                        ) : (
                          <span className="badge-inactive">NON-AKTIF</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {!isAktif && (
                          <button className="btn-success" onClick={() => handleAktifkan(p.id)}>
                            Aktifkan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Buat Pengaturan Pajak Baru</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Pajak</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={form.nama_pajak} 
                    onChange={(e) => setForm({ ...form, nama_pajak: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Persentase Tarif (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control"
                    placeholder="Contoh: 12"
                    value={form.tarif} 
                    onChange={(e) => setForm({ ...form, tarif: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai Berlaku</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={form.berlaku_mulai} 
                    onChange={(e) => setForm({ ...form, berlaku_mulai: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Pengaturan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}