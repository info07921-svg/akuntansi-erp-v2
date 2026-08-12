import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPlus, FaTruck, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaTrashAlt, FaTimes } from "react-icons/fa";
import "../styles/erp.css";

export default function Supplier() {
  const [supplier, setSupplier] = useState([]);
  
  // State Pengendali Jendela Pop-up Modal
  const [showFormModal, setShowFormModal] = useState(false);

  const [form, setForm] = useState({
    nama_supplier: "",
    telepon: "",
    alamat: "",
    email: "",
    status: "AKTIF"
  });

  const [editId, setEditId] = useState(null);

  const loadSupplier = async () => {
    try {
      const res = await api.get("/supplier");
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData)) {
        setSupplier(rawData);
      } else {
        setSupplier([]);
      }
    } catch (err) {
      console.error("Gagal memuat data supplier:", err);
    }
  };

  useEffect(() => {
    loadSupplier();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      nama_supplier: "",
      telepon: "",
      alamat: "",
      email: "",
      status: "AKTIF"
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setForm({
      nama_supplier: item.nama_supplier || "",
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
        const res = await api.put(`/supplier/${editId}`, form);
        if (res.data.success) {
          alert("Data supplier berhasil diperbarui!");
          setShowFormModal(false);
          loadSupplier();
        }
      } else {
        const res = await api.post("/supplier", form);
        if (res.data.success) {
          alert("Supplier baru berhasil didaftarkan!");
          setShowFormModal(false);
          loadSupplier();
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan data supplier:", err);
      alert(err.response?.data?.message || "Terjadi kesalahan sistem saat menyimpan supplier.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus supplier ini secara permanen?")) {
      try {
        const res = await api.delete(`/supplier/${id}`);
        if (res.data.success) {
          alert("Supplier sukses dihapus.");
          loadSupplier();
        }
      } catch (err) {
        console.error("Gagal menghapus supplier:", err);
        alert(err.response?.data?.message || "Gagal menghapus supplier.");
      }
    }
  };

  return (
    <div className="page-container">
      {/* HEADER UTAMA: Patuh terhadap standardisasi .page-header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Mitra Supplier</h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Kelola daftar vendor pengadaan logistik barang yang terhubung langsung dengan entitas instansi Anda.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <FaPlus /> Registrasi Supplier Baru
        </button>
      </div>

      {/* CARD TABEL: Patuh terhadap wrap .table-card & .erp-table */}
      <div className="table-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Nama Vendor</th>
              <th>Kontak Telepon</th>
              <th>Email Korespondensi</th>
              <th>Alamat Kantor / Pabrik</th>
              <th style={{ textAlign: "center" }}>Status Logistik</th>
              <th style={{ textAlign: "center" }}>Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody>
            {supplier.length > 0 ? (
              supplier.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "500", color: "#0f172a" }}>{item.nama_supplier}</td>
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
                      <button className="btn-icon btn-edit" title="Ubah Data" onClick={() => handleOpenEdit(item)}>
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-delete" title="Hapus Vendor" onClick={() => handleDelete(item.id)}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                  <FaTruck style={{ fontSize: "32px", display: "block", margin: "0 auto 10px", color: "#cbd5e1" }} />
                  Belum ada mitra supplier terdaftar untuk instansi ini.
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
              <h2>{editId ? "✏️ Perbarui Informasi Supplier" : "🚚 Registrasi Supplier Baru"}</h2>
              <button className="close-btn" onClick={() => setShowFormModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Vendor / Badan Usaha</label>
                  <input type="text" name="nama_supplier" placeholder="Contoh: PT. Logistik Nusantara" value={form.nama_supplier} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Telepon Interkom / Sales</label>
                  <input type="text" name="telepon" placeholder="Contoh: 021-xxxxxx atau 08xxx" value={form.telepon} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Korespondensi E-mail</label>
                  <input type="email" name="email" placeholder="vendor@emailperusahaan.com" value={form.email} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Kantor Utama / Pabrik</label>
                  <input type="text" name="alamat" placeholder="Nama jalan, nomor gedung, kota operasional" value={form.alamat} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Logistik Vendor</label>
                  <select name="status" value={form.status} onChange={handleChange} required>
                    <option value="AKTIF">AKTIF (Dapat Melakukan Pembelian)</option>
                    <option value="NONAKTIF">NON-AKTIF (Kunci Transaksi Pembelian)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan ke Sistem</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}