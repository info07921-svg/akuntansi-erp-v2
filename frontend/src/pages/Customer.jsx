import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPlus, FaUserPlus, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaTrashAlt, FaTimes, FaUsers } from "react-icons/fa";
import "../styles/erp.css";

export default function Customer() {
  const [customer, setCustomer] = useState([]);
  
  // State Pengendali Jendela Pop-up Modal
  const [showFormModal, setShowFormModal] = useState(false);

  const [form, setForm] = useState({
    nama_customer: "",
    jenis_customer: "UMUM",
    telepon: "",
    alamat: "",
    email: "",
    status: "AKTIF"
  });

  const [editId, setEditId] = useState(null);

  const loadCustomer = async () => {
    try {
      const res = await api.get("/customer");
      if (res.data) {
        setCustomer(res.data.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat data customer:", err);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const openAddModal = () => {
    setEditId(null);
    setForm({
      nama_customer: "",
      jenis_customer: "UMUM",
      telepon: "",
      alamat: "",
      email: "",
      status: "AKTIF"
    });
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditId(item.id);
    setForm({
      nama_customer: item.nama_customer || "",
      jenis_customer: item.jenis_customer || "UMUM",
      telepon: item.telepon || "",
      alamat: item.alamat || "",
      email: item.email || "",
      status: item.status || "AKTIF"
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await api.put(`/customer/${editId}`, form);
        if (res.data.success) {
          alert("Data pelanggan berhasil diperbarui!");
          setShowFormModal(false);
          loadCustomer();
        }
      } else {
        const res = await api.post("/customer", form);
        if (res.data.success) {
          alert("Pelanggan baru berhasil didaftarkan!");
          setShowFormModal(false);
          loadCustomer();
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan data customer:", err);
      alert(err.response?.data?.message || "Terjadi kesalahan sistem saat menyimpan customer.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data pelanggan ini secara permanen?")) {
      try {
        const res = await api.delete(`/customer/${id}`);
        if (res.data.success) {
          alert("Pelanggan sukses dihapus.");
          loadCustomer();
        }
      } catch (err) {
        console.error("Gagal menghapus customer:", err);
        alert(err.response?.data?.message || "Gagal menghapus customer.");
      }
    }
  };

  return (
    <div className="page-container">
      {/* HEADER UTAMA: Patuh terhadap standardisasi .page-header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Data Customer</h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Kelola segmentasi profil konsumen, badan niaga distribusi, dan riwayat kontak klien instansi Anda.
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FaPlus /> Registrasi Customer Baru
        </button>
      </div>

      {/* CARD TABEL: Patuh terhadap wrap .table-card & .erp-table */}
      <div className="table-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Nama Pelanggan</th>
              <th>Klasifikasi / Jenis</th>
              <th>Kontak Telepon</th>
              <th>Email</th>
              <th>Alamat Pengiriman</th>
              <th style={{ textAlign: "center" }}>Status Hubungan</th>
              <th style={{ textAlign: "center" }}>Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody>
            {customer.length > 0 ? (
              customer.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "500", color: "#0f172a" }}>{item.nama_customer}</td>
                  <td>
                    <span style={{ 
                      padding: "3px 8px", 
                      borderRadius: "4px", 
                      fontSize: "11px", 
                      fontWeight: "600",
                      background: item.jenis_customer === "GROSIR" ? "#eff6ff" : "#f1f5f9",
                      color: item.jenis_customer === "GROSIR" ? "#1d4ed8" : "#475569"
                    }}>
                      {item.jenis_customer}
                    </span>
                  </td>
                  <td>
                    {item.telepon ? (
                      <>
                        <FaPhone style={{ color: "#cbd5e1", marginRight: "6px", fontSize: "12px" }} />
                        {item.telepon}
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                  <td>
                    {item.email ? (
                      <>
                        <FaEnvelope style={{ color: "#cbd5e1", marginRight: "6px", fontSize: "12px" }} />
                        {item.email}
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                  <td>
                    {item.alamat ? (
                      <>
                        <FaMapMarkerAlt style={{ color: "#cbd5e1", marginRight: "6px", fontSize: "12px" }} />
                        {item.alamat}
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={item.status === "AKTIF" ? "badge-active" : "badge-inactive"}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" title="Ubah Data Profil" onClick={() => openEditModal(item)}>
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-delete" title="Hapus Pelanggan" onClick={() => handleDelete(item.id)}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                  <FaUsers style={{ fontSize: "32px", display: "block", margin: "0 auto 10px", color: "#cbd5e1" }} />
                  Belum ada data customer terdaftar untuk instansi ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM REGISTRASI / EDIT */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h2>{editId ? "✏️ Perbarui Profil Customer" : "👤 Registrasi Customer Baru"}</h2>
              <button className="close-btn" onClick={() => setShowFormModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Klien / Entitas Perusahaan</label>
                  <input type="text" name="nama_customer" placeholder="Contoh: Toko Berkah Mandiri / Bpk. Andi" value={form.nama_customer} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Klasifikasi Segmentasi Penjualan</label>
                  <select name="jenis_customer" value={form.jenis_customer} onChange={handleChange} required>
                    <option value="UMUM">UMUM / RETAIL (Harga Standar)</option>
                    <option value="GROSIR">GROSIR / DISTRIBUTOR (Harga Khusus)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Telepon Seluler / Kantor</label>
                  <input type="text" name="telepon" placeholder="Contoh: 0812345678x" value={form.telepon} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Surat Elektronik (Email)</label>
                  <input type="email" name="email" placeholder="contoh@perusahaan.com" value={form.email} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Domisili / Tujuan Pengiriman Logistik</label>
                  <input type="text" name="alamat" placeholder="Nama jalan, nomor gedung, kota, kode pos" value={form.alamat} onChange={handleChange} />
                </div>

                {editId && (
                  <div className="form-group">
                    <label className="form-label">Status Hubungan Dagang</label>
                    <select name="status" value={form.status} onChange={handleChange} required>
                      <option value="AKTIF">AKTIF (Dapat Bertransaksi)</option>
                      <option value="NONAKTIF">NON-AKTIF (Kunci Transaksi)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}