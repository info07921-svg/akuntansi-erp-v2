import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPlus, FaSearch, FaEdit, FaTrashAlt, FaTimes, FaBookOpen } from "react-icons/fa";
import "../styles/erp.css";

const TIPE_OPTIONS = [
  "KAS",
  "ASET",
  "KEWAJIBAN",
  "MODAL",
  "PENDAPATAN",
  "BEBAN",
];

const emptyForm = {
  kode_akun: "",
  nama_akun: "",
  tipe: "",
};

export default function Akun() {
  const [akun, setAkun] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // State Pengendali Jendela Pop-up Modal Form
  const [showModal, setShowModal] = useState(false);

  const loadAkun = async () => {
    try {
      const res = await api.get("/akun");
      setAkun(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat data akun:", err);
    }
  };

  useEffect(() => {
    loadAkun();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setForm({
      kode_akun: item.kode_akun || "",
      nama_akun: item.nama_akun || "",
      tipe: item.tipe || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        const res = await api.put(`/akun/${editId}`, form);
        if (res.data.success || res.status === 200) {
          alert("Data akun berhasil diperbarui!");
          setShowModal(false);
          loadAkun();
        }
      } else {
        const res = await api.post("/akun", form);
        if (res.status === 201 || res.data.success) {
          alert("Akun baru berhasil ditambahkan!");
          setShowModal(false);
          loadAkun();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Terjadi kendala saat memproses akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus akun ini dari Chart of Accounts (CoA)?")) {
      try {
        const res = await api.delete(`/akun/${id}`);
        if (res.data.success || res.status === 200) {
          alert("Akun sukses dihapus.");
          loadAkun();
        }
      } catch (err) {
        alert(err.response?.data?.message || "Gagal menghapus data akun.");
      }
    }
  };

  // Filter pencarian berdasarkan kode atau nama akun
  const filtered = akun.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.kode_akun?.toLowerCase().includes(s) ||
      item.nama_akun?.toLowerCase().includes(s) ||
      item.tipe?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="page-container">
      {/* HEADER UTAMA: Struktur patuh erp.css */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Chart of Accounts (Daftar Akun)</h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Kelola kode perkiraan akuntansi, penamaan ledger, dan klasifikasi neraca/laba rugi instansi Anda.
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FaPlus /> Tambah Akun Baru
        </button>
      </div>

      {/* FILTER & PENCARIAN UTENSIL */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "#fff", padding: "14px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Cari akun berdasarkan kode, nama, atau tipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px"
            }}
          />
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          Menampilkan <strong>{filtered.length}</strong> akun keuangan
        </div>
      </div>

      {/* CARD TABEL UTAMA */}
      <div className="table-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Kode Akun</th>
              <th style={{ width: "40%" }}>Nama Akun Keuangan</th>
              <th style={{ width: "25%" }}>Klasifikasi / Tipe</th>
              <th style={{ width: "15%", textAlign: "center" }}>Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                  <FaBookOpen style={{ fontSize: "32px", display: "block", margin: "0 auto 10px", color: "#cbd5e1" }} />
                  {search ? "Hasil pencarian akun tidak ditemukan." : "Belum ada master akun terdaftar untuk instansi ini."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <code style={{ background: "#f1f5f9", padding: "3px 6px", borderRadius: "4px", color: "#0f172a", fontWeight: "600", fontFamily: "monospace" }}>
                      {item.kode_akun}
                    </code>
                  </td>
                  <td style={{ fontWeight: "500", color: "#334155" }}>{item.nama_akun}</td>
                  <td>
                    {/* Menggunakan badge dinamis yang terdaftar atau di-handle via tipe text styling */}
                    <span className={`badge-active`} style={{ 
                      fontSize: "11px", 
                      fontWeight: "700",
                      background: item.tipe?.toUpperCase() === "ASET" ? "#eff6ff" : 
                                  item.tipe?.toUpperCase() === "KEWAJIBAN" ? "#fef2f2" : 
                                  item.tipe?.toUpperCase() === "MODAL" ? "#fdf4ff" :
                                  item.tipe?.toUpperCase() === "KAS" ? "#fdf4ff" :
                                  item.tipe?.toUpperCase() === "PENDAPATAN" ? "#f0fdf4" : "#fff7ed",
                      color: item.tipe?.toUpperCase() === "ASET" ? "#1d4ed8" : 
                             item.tipe?.toUpperCase() === "KEWAJIBAN" ? "#b91c1c" : 
                             item.tipe?.toUpperCase() === "MODAL" ? "#a21caf" :
                             item.tipe?.toUpperCase() === "KAS" ? "#a21caf" : 
                             item.tipe?.toUpperCase() === "PENDAPATAN" ? "#15803d" : "#c2410c",
                      padding: "4px 10px",
                      borderRadius: "6px"
                    }}>
                      {item.tipe?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-buttons" style={{ justifyContent: "center" }}>
                      <button className="btn-icon btn-edit" title="Ubah Akun" onClick={() => handleEdit(item)}>
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-delete" title="Hapus Akun" onClick={() => handleDelete(item.id)}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* JENDELA POP-UP MODAL: Sinkron dengan standardisasi struktur form modal erp.css */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h2>{editId ? "✏️ Perbarui Parameter Akun" : "📂 Daftarkan Akun Perkiraan Baru"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Kode Identifikasi Akun (Account Code)</label>
                  <input
                    type="text"
                    name="kode_akun"
                    placeholder="Contoh: 1101, 4101, atau 5102"
                    value={form.kode_akun}
                    onChange={handleChange}
                    required
                    disabled={editId !== null} // Mengunci kode akun saat edit demi integritas data laporan keuangan
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Akun (Account Name)</label>
                  <input
                    type="text"
                    name="nama_akun"
                    placeholder="Contoh: Kas Utama, Pendapatan Penjualan, Beban Gaji"
                    value={form.nama_akun}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Klasifikasi Tipe Akun Keuangan</label>
                  <select
                    name="tipe"
                    value={form.tipe}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Pilih Tipe Kelompok Akun --</option>
                    {TIPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Master Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}