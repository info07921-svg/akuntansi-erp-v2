import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPercentage, FaPlus, FaCheckCircle, FaHistory, FaCalendarAlt } from "react-icons/fa";
import "../styles/erp.css";

export default function Pajak() {
  const [listPajak, setListPajak] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama_pajak: "PPN", tarif: "", berlaku_mulai: "" });

  const loadData = async () => {
    try {
      const res = await api.get("/pajak");
      setListPajak(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAktifkan = async (id) => {
    if (window.confirm("Aktifkan pengaturan pajak ini? Pajak lain akan dinonaktifkan.")) {
      try {
        await api.put(`/pajak/aktifkan/${id}`);
        loadData();
      } catch (err) {
        alert("Gagal mengubah pajak aktif");
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
      alert("Gagal menyimpan data");
    }
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
              {listPajak.map((p) => (
                <tr key={p.id} style={{ background: p.aktif ? "#f0fdf4" : "transparent" }}>
                  <td><strong>{p.nama_pajak}</strong></td>
                  <td>{p.tarif}%</td>
                  <td>{new Date(p.berlaku_mulai).toLocaleDateString("id-ID")}</td>
                  <td>
                    {p.aktif ? 
                      <span className="badge-active">AKTIF</span> : 
                      <span className="badge-inactive">NON-AKTIF</span>
                    }
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {!p.aktif && (
                      <button className="btn-success" onClick={() => handleAktifkan(p.id)}>
                        Aktifkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
                    value={form.nama_pajak} 
                    onChange={(e) => setForm({...form, nama_pajak: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Persentase Tarif (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Contoh: 12"
                    value={form.tarif} 
                    onChange={(e) => setForm({...form, tarif: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai Berlaku</label>
                  <input 
                    type="date" 
                    value={form.berlaku_mulai} 
                    onChange={(e) => setForm({...form, berlaku_mulai: e.target.value})} 
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