import { useEffect, useState } from "react";
import api from "../services/api";
import { FaPlus, FaEye, FaTrash, FaFileInvoice, FaPrint, FaTimes, FaCalendarAlt } from "react-icons/fa";
import "../styles/erp.css";

export default function BarangMasuk() {
  const [data, setData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    supplier_id: "",
    status_pembayaran: "LUNAS",
    jatuh_tempo: "",
    items: []
  });

  const [currentItem, setCurrentItem] = useState({
    barang_id: "",
    qty: 1,
    harga_beli: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/barang-masuk");
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil daftar dokumen pembelian logistik.");
    } finally {
      setLoading(false);
    }
  };

  const loadHelpers = async () => {
    try {
      const resSup = await api.get("/supplier");
      setSuppliers(resSup.data?.data || resSup.data || []);
      const resBrg = await api.get("/barang");
      setBarang(resBrg.data?.data || resBrg.data || []);
    } catch (err) {
      console.error("Gagal memuat entitas relasi pembantu:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadHelpers();
  }, []);

  const handleAddItem = () => {
    if (!currentItem.barang_id || !currentItem.harga_beli) {
      alert("Pilih barang dan tentukan harga beli terlebih dahulu.");
      return;
    }

    const selectedProduct = barang.find(b => b.id == currentItem.barang_id);
    const hargaBeliMaster = Number(selectedProduct?.harga_beli || 0);
    const hargaBeliInput = Number(currentItem.harga_beli);

    if (hargaBeliInput > hargaBeliMaster) {
      alert(`⚠️ Peringatan: Harga beli melebihi ketentuan! Batas master untuk barang ini adalah Rp ${hargaBeliMaster.toLocaleString("id-ID")}`);
      return;
    }

    setForm({
      ...form,
      items: [...form.items, { ...currentItem }]
    });
    setCurrentItem({ barang_id: "", qty: 1, harga_beli: "" });
  };

  const handleRemoveItem = (index) => {
    const updated = [...form.items];
    updated.splice(index, 1);
    setForm({ ...form, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      alert("Wajib memasukkan minimal 1 jenis barang belanjaan.");
      return;
    }
    if (form.status_pembayaran === "KREDIT" && !form.jatuh_tempo) {
      alert("Untuk pembayaran KREDIT, tanggal jatuh tempo wajib ditentukan.");
      return;
    }
    try {
      // PERBAIKAN: Memastikan payload status_pembayaran terkirim huruf besar murni
      const payload = {
        ...form,
        status_pembayaran: form.status_pembayaran.toUpperCase()
      };
      const res = await api.post("/barang-masuk", payload);
      if (res.data.success) {
        alert("Faktur barang masuk berhasil disimpan.");
        setShowForm(false);
        setForm({ supplier_id: "", status_pembayaran: "LUNAS", jatuh_tempo: "", items: [] });
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memproses pendaftaran logistik.");
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await api.get(`/barang-masuk/${id}`);
      if (res.data && res.data.success) {
        setSelected(res.data);
        setShowDetail(true);
      } else {
        alert("Data detail tidak ditemukan dari server.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memuat rincian arsip data.");
    }
  };

  const handleCancelTransaksi = async (id) => {
    if (window.confirm("⚠️ PERINGATAN KONTROL STOK: Apakah Anda yakin ingin membatalkan transaksi ini? Stok barang di gudang akan ditarik kembali otomatis.")) {
      try {
        const res = await api.put(`/barang-masuk/${id}/cancel`);
        alert(res.data.message || "Transaksi berhasil dibatalkan.");
        setShowDetail(false);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || "Gagal memproses pembatalan.");
      }
    }
  };

  const handlePrintPDF = (id) => {
    window.open(`http://localhost:3000/api/barang-masuk/${id}/pdf`, "_blank");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Penerimaan & Barang Masuk</h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Dokumentasikan pengadaan aset logistik dengan perlindungan kontrol batas harga acuan master produk.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <FaPlus /> Catat Pembelian Baru
        </button>
      </div>

      <div className="table-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Nama Vendor / Supplier</th>
              <th>Tanggal Terima</th>
              <th>Total Biaya Belanja</th>
              <th style={{ textAlign: "center" }}>Status Transaksi</th>
              <th style={{ textAlign: "center" }}>Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody>
            {/* DI DALAM TR MAP UTAMA TABEL BARANGMASUK.JSX */}
{data.length > 0 ? (
  data.map((row) => {
    const currentStatus = (row.status_transaksi || "APPROVED").toUpperCase();
    const isActive = currentStatus === "SELESAI" || currentStatus === "APPROVED";
    
    // PERBAIKAN BACA TABEL UTAMA: Jika nilai database row.status_pembayaran adalah 0, artikan sebagai KREDIT
    const displayMetodeBayar = Number(row.status_pembayaran) === 0 ? "KREDIT" : "LUNAS";

    return (
      <tr key={row.id}>
        <td><span className="badge-code">{row.invoice}</span></td>
        <td style={{ fontWeight: "500" }}>{row.nama_supplier || "Supplier Umum"}</td>
        <td>{new Date(row.tanggal).toLocaleDateString("id-ID")}</td>
        
        {/* Mengganti row.status_pembayaran menjadi variabel displayMetodeBayar */}
        <td style={{ fontWeight: "500" }}>{displayMetodeBayar}</td> 
        
        <td style={{ fontWeight: "600" }}>Rp {Number(row.total).toLocaleString("id-ID")}</td>
        <td style={{ textAlign: "center" }}>
          <span className={isActive ? "badge-active" : "badge-inactive"}>
            {currentStatus}
          </span>
        </td>
        <td style={{ textAlign: "center" }}>
          <div className="action-buttons" style={{ justifyContent: "center" }}>
            <button className="btn-icon btn-view" title="Lihat Rincian Faktur" onClick={() => handleViewDetail(row.id)}>
              <FaEye />
            </button>
          </div>
        </td>
      </tr>
    );
  })
) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <FaFileInvoice style={{ fontSize: "32px", display: "block", margin: "0 auto 10px", color: "#cbd5e1" }} />
                  Belum ada rekaman invoice logistik terdaftar untuk instansi ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "750px" }}>
            <div className="modal-header">
              <h2>📥 Pembelian & Restock Aset Logistik</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="form-group">
                  <label className="form-label">Mitra Vendor/Supplier</label>
                  <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} required>
                    <option value="">-- Pilih Vendor --</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Termin / Metode Pembayaran</label>
                  <select 
                    value={form.status_pembayaran} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, status_pembayaran: val, jatuh_tempo: val === "LUNAS" ? "" : form.jatuh_tempo });
                    }}
                  >
                    <option value="LUNAS">💵 LUNAS (CASH)</option>
                    <option value="KREDIT">⏳ KREDIT (TEMPO / HUTANG)</option>
                  </select>
                </div>

                {form.status_pembayaran === "KREDIT" && (
                  <div className="form-group" style={{ gridColumn: "1 / -1", background: "#fff5f5", padding: "12px", borderRadius: "6px", border: "1px solid #fca5a5" }}>
                    <label className="form-label" style={{ color: "#b91c1c", fontWeight: "700" }}>
                      <FaCalendarAlt /> Batas Tanggal Jatuh Tempo *
                    </label>
                    <input 
                      type="date" 
                      value={form.jatuh_tempo} 
                      onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })} 
                      required
                      style={{ border: "1px solid #fca5a5" }}
                    />
                  </div>
                )}

                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "10px" }}>
                  <h4 style={{ marginBottom: "10px", color: "#334155" }}>Pilih Komoditas Item Logistik</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <select value={currentItem.barang_id} onChange={(e) => setCurrentItem({ ...currentItem, barang_id: e.target.value })}>
                        <option value="">-- Pilih Barang --</option>
                        {barang.map((b) => (
                          <option key={b.id} value={b.id}>
                            [{b.kode_barang}] - {b.nama_barang} (Acuan: Rp {Number(b.harga_beli || 0).toLocaleString("id-ID")})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input type="number" min="1" placeholder="Qty" value={currentItem.qty} onChange={(e) => setCurrentItem({ ...currentItem, qty: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input type="number" placeholder="Harga (Rp)" value={currentItem.harga_beli} onChange={(e) => setCurrentItem({ ...currentItem, harga_beli: e.target.value })} />
                    </div>
                    <button type="button" className="btn-primary" onClick={handleAddItem} style={{ height: "42px" }}>Sisipkan</button>
                  </div>

                  <table style={{ width: "100%", marginTop: "15px", fontSize: "13px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#cbd5e1", textAlign: "left" }}>
                        <th style={{ padding: "6px" }}>Nama Barang</th>
                        <th style={{ padding: "6px", textAlign: "center" }}>Volume Qty</th>
                        <th style={{ padding: "6px" }}>Harga Beli Input</th>
                        <th style={{ padding: "6px", textAlign: "center" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => {
                        const product = barang.find(b => b.id == it.barang_id);
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={{ padding: "6px" }}>{product?.nama_barang || "Barang Terhapus"}</td>
                            <td style={{ padding: "6px", textAlign: "center" }}>{it.qty} Pcs</td>
                            <td style={{ padding: "6px" }}>Rp {Number(it.harga_beli).toLocaleString("id-ID")}</td>
                            <td style={{ padding: "6px", textAlign: "center" }}>
                              <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><FaTrash /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn-primary">Bukukan Faktur Masuk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selected && selected.barang_masuk && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h2>Rincian Faktur Belanja {selected.barang_masuk.invoice}</h2>
              <button className="close-btn" onClick={() => setShowDetail(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px", fontSize: "13px", background: "#f8fafc", padding: "12px", borderRadius: "6px" }}>
                <div>Vendor: <strong>{selected.barang_masuk.nama_supplier || "Supplier Umum"}</strong></div>
                
                {/* AMAN: Memaksa render teks status_pembayaran dari data mentah backend */}
                <div>Metode Bayar: <strong style={{ color: String(selected.barang_masuk.status_pembayaran).toUpperCase() === "KREDIT" ? "#b91c1c" : "#1e3a8a" }}>{String(selected.barang_masuk.status_pembayaran).toUpperCase()}</strong></div>
                
                <div>Tanggal Masuk: <strong>{new Date(selected.barang_masuk.tanggal).toLocaleDateString("id-ID")}</strong></div>
                <div>Status Transaksi: <strong style={{ color: selected.barang_masuk.status_transaksi === "DIBATALKAN" ? "#ef4444" : "#16a34a" }}>{selected.barang_masuk.status_transaksi || "APPROVED"}</strong></div>
                
                {/* NOTE PERINGATAN STRUKTUR HUTANG */}
                {String(selected.barang_masuk.status_pembayaran).toUpperCase() === "KREDIT" && (
                  <div style={{ 
                    gridColumn: "1 / -1", 
                    background: "#fff5f5", 
                    padding: "10px", 
                    borderRadius: "6px", 
                    color: "#b91c1c", 
                    marginTop: "8px", 
                    fontWeight: "600",
                    border: "1px solid #fee2e2"
                  }}>
                    ⚠️ Status Keuangan: BELUM DIBAYAR (HUTANG USAHA)
                    {selected.barang_masuk.jatuh_tempo && (
                      <span style={{ marginLeft: "10px", color: "#7f1d1d" }}>
                        (Jatuh Tempo: {new Date(selected.barang_masuk.jatuh_tempo).toLocaleDateString("id-ID")})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Nama Barang</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Jumlah Unit</th>
                    <th style={{ padding: "8px" }}>Harga Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.detail || []).map((det, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px" }}>{det.nama_barang}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}>{det.qty} Unit</td>
                      <td style={{ padding: "8px" }}>Rp {Number(det.harga_beli).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: "right", marginTop: "15px", fontWeight: "700", fontSize: "16px" }}>
                Total Belanja: Rp {Number(selected.barang_masuk.total).toLocaleString("id-ID")}
              </div>
            </div>
            <div className="modal-footer" style={{ gap: "10px", justifyContent: "space-between" }}>
              <div>
                {selected.barang_masuk.status_transaksi !== "DIBATALKAN" && (
                  <button type="button" className="btn-secondary" style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }} onClick={() => handleCancelTransaksi(selected.barang_masuk.id)}>
                    ❌ Batalkan Transaksi
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowDetail(false)}>Tutup</button>
                <button type="button" className="btn-primary" onClick={() => handlePrintPDF(selected.barang_masuk.id)}>
                  <FaPrint /> Cetak PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}