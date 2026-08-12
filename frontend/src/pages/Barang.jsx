import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPlus, FaBoxOpen, FaEdit, FaTrashAlt, FaExchangeAlt, FaTimes } from "react-icons/fa";
import "../styles/erp.css";

export default function Barang() {
  const [barang, setBarang] = useState([]);
  const [kategori, setKategori] = useState([]);
  
  // State Pengendali Jendela Pop-up Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCadangan, setShowCadangan] = useState(false);

  // State Form Lengkap: Sinkron dengan req.body di barangController.js
  const [form, setForm] = useState({
    kode_barang: "",
    nama_barang: "",
    kategori_id: "",
    harga_beli: "",
    harga_jual: "",
    stok: "",
    stok_cadangan: "",
    satuan: ""
  });

  const [editId, setEditId] = useState(null);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [jumlahCadangan, setJumlahCadangan] = useState(0);
  const [aksiCadangan, setAksiCadangan] = useState("ke_cadangan");

  // Memuat data barang dari getBarang controller (Otomatis terfilter per perusahaan yang login)
  const loadBarang = async () => {
    try {
      const res = await api.get("/barang");
      if (res.data.success) {
        setBarang(res.data.data);
      } else {
        setBarang(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) { 
      console.error("Gagal memuat barang:", err); 
    }
  };

  // Memuat data kategori untuk dropdown form
  const loadKategori = async () => {
    try {
      const res = await api.get("/kategori");
      if (res.data.success) {
        setKategori(res.data.data || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) { 
      console.error("Gagal memuat kategori:", err); 
    }
  };

  useEffect(() => {
    loadBarang();
    loadKategori();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Create atau Update Data Barang
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const res = await api.put(`/barang/${editId}`, form);
        if (res.data.success) {
          alert("Data barang berhasil diperbarui!");
          setShowFormModal(false);
          loadBarang();
        }
      } else {
        const res = await api.post("/barang", form);
        if (res.data.success) {
          alert("Barang baru berhasil ditambahkan!");
          setShowFormModal(false);
          loadBarang();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Terjadi kesalahan sistem saat menyimpan barang.");
    }
  };

  // Membuka modal form dalam mode edit dengan field komplit
  const handleEdit = (item) => {
    setEditId(item.id);
    setForm({
      kode_barang: item.kode_barang || "",
      nama_barang: item.nama_barang || "",
      kategori_id: item.kategori_id || "",
      harga_beli: item.harga_beli || "",
      harga_jual: item.harga_jual || "",
      stok: item.stok || 0,
      stok_cadangan: item.stok_cadangan || 0,
      satuan: item.satuan || "Pcs"
    });
    setShowFormModal(true);
  };

  // Menghapus data barang
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini secara permanen?")) {
      try {
        const res = await api.delete(`/barang/${id}`);
        if (res.data.success) {
          alert("Barang sukses dihapus.");
          loadBarang();
        }
      } catch (err) {
        alert(err.response?.data?.message || "Gagal menghapus produk.");
      }
    }
  };

  // Membuka modal pengelolaan stok cadangan
  const openModalCadangan = (item) => {
    setSelectedBarang(item);
    setJumlahCadangan(0);
    setAksiCadangan("ke_cadangan");
    setShowCadangan(true);
  };

  // Eksekusi Sinkronisasi Mutasi Cadangan
  const handleSubmitCadangan = async (e) => {
    e.preventDefault();
    if (Number(jumlahCadangan) <= 0) {
      alert("Jumlah mutasi harus lebih besar dari 0.");
      return;
    }

    try {
      const payloadAksi = aksiCadangan === "ke_cadangan" ? "MASUK_CADANGAN" : "KELUAR_CADANGAN";
      const res = await api.put(`/barang/${selectedBarang.id}/cadangan`, {
        aksi: payloadAksi,
        jumlah: Number(jumlahCadangan)
      });

      if (res.data.success) {
        alert("Mutasi stok cadangan berhasil dieksekusi!");
        setShowCadangan(false);
        loadBarang();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui mutasi gudang cadangan.");
    }
  };

  const bukaModalTambah = () => {
    setEditId(null);
    setForm({
      kode_barang: "",
      nama_barang: "",
      kategori_id: "",
      harga_beli: "",
      harga_jual: "",
      stok: "",
      stok_cadangan: "",
      satuan: "Pcs"
    });
    setShowFormModal(true);
  };

  return (
    <div className="page-container">
      {/* HEADER UTAMA: Mengikuti struktur standar .page-header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Inventaris Barang</h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Kelola katalog komoditas gudang, standarisasi harga, dan kontrol sirkulasi cadangan stok.
          </p>
        </div>
        <button className="btn-primary" onClick={bukaModalTambah}>
          <FaPlus /> Tambah Produk Baru
        </button>
      </div>

      {/* CARD TABEL: Mengikuti standar wrap .table-card & .erp-table */}
      <div className="table-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga Beli</th>
              <th>Harga Jual</th>
              <th style={{ textAlign: "center" }}>Stok Toko</th>
              <th style={{ textAlign: "center" }}>Stok Cadangan</th>
              <th style={{ textAlign: "center" }}>Aksi Operasional</th>
            </tr>
          </thead>
          <tbody>
            {barang.length > 0 ? (
              barang.map((item) => (
                <tr key={item.id}>
                  <td><span className="badge-code">{item.kode_barang}</span></td>
                  <td style={{ fontWeight: "500" }}>{item.nama_barang}</td>
                  <td>{item.nama_kategori || <span style={{ color: "#94a3b8", fontSize: "12px" }}>Tanpa Kategori</span>}</td>
                  <td>Rp {new Intl.NumberFormat("id-ID").format(item.harga_beli || 0)}</td>
                  <td style={{ fontWeight: "600" }}>Rp {new Intl.NumberFormat("id-ID").format(item.harga_jual || 0)}</td>
                  <td style={{ textAlign: "center", fontWeight: "600" }}>
                    {item.stok ?? 0} {item.satuan || "Pcs"}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "600", color: "#0284c7" }}>
                    {item.stok_cadangan || 0} {item.satuan || "Pcs"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-buttons">
                      <button className="btn-icon btn-view" title="Kelola Cadangan" onClick={() => openModalCadangan(item)}>
                        <FaExchangeAlt />
                      </button>
                      <button className="btn-icon btn-edit" title="Ubah Data" onClick={() => handleEdit(item)}>
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-delete" title="Hapus Produk" onClick={() => handleDelete(item.id)}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                  <FaBoxOpen style={{ fontSize: "32px", display: "block", margin: "0 auto 10px", color: "#cbd5e1" }} />
                  Belum ada data barang terdaftar untuk instansi ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM TAMBAH / EDIT BARANG */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "650px" }}>
            <div className="modal-header">
              <h2>{editId ? "✏️ Perbarui Data Barang" : "📦 Daftarkan Produk Baru"}</h2>
              <button className="close-btn" onClick={() => setShowFormModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="form-group">
                  <label className="form-label">Kode Barang (Unique)</label>
                  <input type="text" name="kode_barang" value={form.kode_barang} onChange={handleChange} placeholder="Contoh: BRG-001" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Barang</label>
                  <input type="text" name="nama_barang" value={form.nama_barang} onChange={handleChange} placeholder="Masukkan nama barang" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori Komoditas</label>
                  <select name="kategori_id" value={form.kategori_id} onChange={handleChange}>
                    <option value="">-- Pilih Kategori --</option>
                    {kategori.map((kat) => (
                      <option key={kat.id} value={kat.id}>{kat.nama_kategori}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Satuan Takaran</label>
                  <input type="text" name="satuan" value={form.satuan} onChange={handleChange} placeholder="Pcs, Pack, Kg, dll." />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Beli Standar (Rp)</label>
                  <input type="number" name="harga_beli" value={form.harga_beli} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Jual Toko (Rp)</label>
                  <input type="number" name="harga_jual" value={form.harga_jual} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kuantitas Stok Utama</label>
                  <input type="number" name="stok" value={form.stok} onChange={handleChange} disabled={!!editId} placeholder="Mulai dari 0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kuantitas Stok Cadangan</label>
                  <input type="number" name="stok_cadangan" value={form.stok_cadangan} onChange={handleChange} disabled={!!editId} placeholder="Mulai dari 0" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MUTASI GUDANG CADANGAN */}
      {showCadangan && selectedBarang && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h2>Mutasi Cadangan Stok</h2>
              <button className="close-btn" onClick={() => setShowCadangan(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmitCadangan}>
              <div className="modal-body">
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px", border: "1px solid #e2e8f0" }}>
                  <div>Nama Produk: <strong>{selectedBarang.nama_barang}</strong></div>
                  <div>Stok Toko Utama: <strong>{selectedBarang.stok ?? 0} Unit</strong></div>
                  <div>Stok Cadangan Saat Ini: <strong>{selectedBarang.stok_cadangan || 0} Unit</strong></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Aksi Pemindahan</label>
                  <select value={aksiCadangan} onChange={(e) => setAksiCadangan(e.target.value)}>
                    <option value="ke_cadangan">Pindahkan Stok Utama → Ke Cadangan</option>
                    <option value="ke_stok">Tarik Stok Cadangan → Ke Stok Utama</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Volume Jumlah Unit</label>
                  <input type="number" min="1" value={jumlahCadangan} onChange={(e) => setJumlahCadangan(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCadangan(false)}>Batal</button>
                <button type="submit" className="btn-primary">Eksekusi Mutasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}