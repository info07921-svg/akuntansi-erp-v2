import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { 
  FaPlus, 
  FaTrash, 
  FaCalendarAlt, 
  FaFileInvoiceDollar, 
  FaUser, 
  FaBox, 
  FaShoppingCart, 
  FaReceipt,
  FaPrint
} from "react-icons/fa";
import "../styles/erp.css";
import "../styles/penjualan.css";

export default function Penjualan() {
  const [customer, setCustomer] = useState([]);
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const [form, setForm] = useState({
    customer_id: "",
    metode_pembayaran: "TUNAI",
    status_pembayaran: "LUNAS",
    jatuh_tempo: ""
  });

  const [detail, setDetail] = useState([]);
  const [item, setItem] = useState({ barang_id: "", qty: 1 });
  const [tarifPPN] = useState(11);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCustomer, resBarang] = await Promise.all([
        api.get("/customer"),
        api.get("/barang")
      ]);
      
      if (resCustomer.data?.success) setCustomer(resCustomer.data.data);
      if (resBarang.data?.success) setBarang(resBarang.data.data);
    } catch (err) {
      console.error("Gagal memuat master data kasir:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleAddItem = () => {
    const kuantitas = parseInt(item.qty, 10);
    if (!item.barang_id || isNaN(kuantitas) || kuantitas <= 0) return;

    const target = barang.find((b) => b.id === parseInt(item.barang_id, 10));
    if (!target) return;

    const existingIndex = detail.findIndex((d) => d.barang_id === target.id);
    
    if (existingIndex !== -1) {
      const updatedDetail = [...detail];
      const newQty = updatedDetail[existingIndex].qty + kuantitas;

      if (newQty > target.stok) {
        alert(`Stok tidak mencukupi. Sisa stok tersedia: ${target.stok} unit`);
        return;
      }
      updatedDetail[existingIndex].qty = newQty;
      setDetail(updatedDetail);
    } else {
      if (kuantitas > target.stok) {
        alert(`Stok tidak mencukupi. Sisa stok tersedia: ${target.stok} unit`);
        return;
      }
      setDetail([
        ...detail,
        {
          barang_id: target.id,
          nama_barang: target.nama_barang,
          kode_barang: target.kode_barang,
          harga_jual: target.harga_jual,
          qty: kuantitas
        }
      ]);
    }
    
    setItem({ barang_id: "", qty: 1 });
  };

  const handleRemoveItem = (index) => {
    setDetail(prev => prev.filter((_, i) => i !== index));
  };

  const hitungSubtotal = () => detail.reduce((acc, curr) => acc + (curr.harga_jual * curr.qty), 0);
  const hitungPPN = () => (hitungSubtotal() * tarifPPN) / 100;
  const hitungTotalAkhir = () => hitungSubtotal() + hitungPPN();

  const formatRupiah = (num) => Number(num || 0).toLocaleString("id-ID");

  const handleSubmitTransaksi = async (e) => {
    if (e) e.preventDefault();
    if (detail.length === 0) return;

    try {
      const payload = {
        ...form,
        items: detail
      };
      
      // Mengirim data ke endpoint createPenjualan di backend
      const res = await api.post("/penjualan", payload);
      
      if (res.data?.success) {
        // Cari nama customer berdasarkan customer_id yang dipilih untuk tampilan modal
        const pelangganTerpilih = customer.find(c => c.id === parseInt(form.customer_id, 10));
        const namaCustomerDisplay = pelangganTerpilih 
          ? `${pelangganTerpilih.nama_customer} ${pelangganTerpilih.perusahaan_mitra ? `(${pelangganTerpielen.perusahaan_mitra})` : ""}`
          : "Pelanggan Umum (Cash/Tunai)";

        // SINKRONISASI TOTAL: Memetakan struktur data dummy yang presisi sesuai variabel penampung modal
        const dataInvoiceFinal = {
          penjualan: {
            id: res.data.penjualan_id, // Mengambil id dari response backend (res.data.penjualan_id)
            invoice: res.data.invoice, // Mengambil nomor invoice unik dari backend (res.data.invoice)
            nama_customer: namaCustomerDisplay,
            tanggal: new Date().toISOString(),
            status_pembayaran: form.metode_pembayaran === "KREDIT" ? "KREDIT" : "LUNAS",
            status_transaksi: "APPROVED",
            jatuh_tempo: form.jatuh_tempo || null,
            subtotal: hitungSubtotal(),
            pajak: hitungPPN(),
            total: hitungTotalAkhir()
          },
          detail: detail.map((d, idx) => ({
            id: idx,
            kode_barang: d.kode_barang,
            nama_barang: d.nama_barang,
            qty: d.qty,
            harga_jual: d.harga_jual,
            subtotal: d.harga_jual * d.qty
          }))
        };

        // Simpan data terstruktur ke state selected untuk dibaca modal
        setSelected(dataInvoiceFinal); 
        setShowDetail(true);

        // Reset Formulir POS Kasir ke kondisi awal
        setDetail([]);
        setForm({
          customer_id: "",
          metode_pembayaran: "TUNAI",
          status_pembayaran: "LUNAS",
          jatuh_tempo: ""
        });
        
        // Perbarui sisa kuantitas stok barang riil dari server
        const resBarang = await api.get("/barang");
        if (resBarang.data?.success) setBarang(resBarang.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Terjadi kesalahan sistem saat memproses invoice");
    }
  };

  const handlePrintInvoice = (id) => {
    if (!id) return;
    window.open(`${api.defaults.baseURL}/penjualan/invoice/${id}`, "_blank");
  };

  if (loading) {
    return (
      <div className="penjualan-loading-state">
        <div className="spinner"></div>
        <p>Sinkronisasi Database Kasir...</p>
      </div>
    );
  }

  // Pengambilan data yang terjamin aman untuk render DOM komponen modal
  const invoiceInfo = selected?.penjualan;
  const itemDetailList = selected?.detail || [];

  return (
    <div className="penjualan-compact-container">
      {/* HEADER UTAMA */}
      <div className="compact-page-header">
        <h1 className="compact-page-title">
          <FaFileInvoiceDollar className="compact-header-icon" />
          Faktur Penjualan Komersial
        </h1>
      </div>

      {/* DASHBOARD KASIR ZERO-SCROLL LAYOUT */}
      <div className="penjualan-compact-layout">
        
        {/* PANEL SEBELAH KIRI: KASIR & TABEL ITEMS */}
        <div className="compact-left-panel">
          <div className="page-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="card-header-title">
              <h3><FaShoppingCart /> Entri Transaksi Kasir</h3>
            </div>
            
            <div className="compact-card-body">
              {/* FORM DATA PELANGGAN & ATRIBUT PEMBAYARAN */}
              <div className="compact-form-row-3col">
                <div className="form-group">
                  <label><FaUser /> Pelanggan / Customer</label>
                  <select 
                    value={form.customer_id} 
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  >
                    <option value="">-- Pelanggan Umum (Cash/Tunai) --</option>
                    {customer.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama_customer} {c.perusahaan_mitra ? `(${c.perusahaan_mitra})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Metode Pembayaran</label>
                  <select 
                    value={form.metode_pembayaran} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ 
                        ...form, 
                        metode_pembayaran: val,
                        status_pembayaran: val === "KREDIT" ? "KREDIT" : "LUNAS" 
                      });
                    }}
                  >
                    <option value="TUNAI">CASH / TUNAI</option>
                    <option value="TRANSFER">TRANSFER BANK</option>
                    <option value="KREDIT">KREDIT / TEMPO</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status Pembayaran</label>
                  <select 
                    value={form.status_pembayaran} 
                    onChange={(e) => setForm({ ...form, status_pembayaran: e.target.value })}
                    disabled={form.metode_pembayaran === "KREDIT"}
                  >
                    <option value="LUNAS">LUNAS (CASH)</option>
                    <option value="KREDIT">KREDIT (PIUTANG DAGANG)</option>
                  </select>
                </div>
              </div>

              {/* JATUH TEMPO (TAMPIL HANYA JIKA KREDIT) */}
              {form.status_pembayaran === "KREDIT" && (
                <div className="form-group compact-conditional-date">
                  <label><FaCalendarAlt /> Tanggal Jatuh Tempo</label>
                  <input 
                    type="date" 
                    value={form.jatuh_tempo} 
                    onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })} 
                    required
                  />
                </div>
              )}

              {/* BARIS SELEKSI KOMODITAS BARANG */}
              <div className="compact-product-divider">
                <div className="form-row-inline">
                  <div className="form-group flex-main">
                    <label><FaBox /> Pilih Komoditas Barang</label>
                    <select 
                      value={item.barang_id} 
                      onChange={(e) => setItem({ ...item, barang_id: e.target.value })}
                    >
                      <option value="">-- Pilih Produk Barang --</option>
                      {barang.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.stok <= 0}>
                          {b.nama_barang} ({b.kode_barang}) — Stok: {b.stok} unit [@ Rp {formatRupiah(b.harga_jual)}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group flex-sub">
                    <label>Qty</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.qty} 
                      onChange={(e) => setItem({ ...item, qty: Math.max(1, parseInt(e.target.value, 10) || 1) })} 
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ height: "34px", padding: "0 14px" }}
                    onClick={handleAddItem}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* AREA TABEL DENGAN SCROLLBAR INTERNAL */}
              <div className="compact-table-wrapper">
                <table className="table-cart">
                  <thead>
                    <tr>
                      <th>Nama Barang</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Harga Satuan</th>
                      <th style={{ textAlign: "right" }}>Total Harga</th>
                      <th style={{ textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="compact-table-empty">
                          Keranjang belanja masih kosong.
                        </td>
                      </tr>
                    ) : (
                      detail.map((d, index) => (
                        <tr key={index}>
                          <td>
                            <div className="compact-cart-info">
                              <span className="compact-item-name">{d.nama_barang}</span>
                              <span className="compact-item-code">{d.kode_barang}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }} className="font-medium">{d.qty} unit</td>
                          <td style={{ textAlign: "right" }}>Rp {formatRupiah(d.harga_jual)}</td>
                          <td style={{ textAlign: "right" }} className="font-semibold">Rp {formatRupiah(d.harga_jual * d.qty)}</td>
                          <td style={{ textAlign: "center" }}>
                            <button 
                              type="button" 
                              className="btn-icon btn-delete" 
                              style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer" }} 
                              onClick={() => handleRemoveItem(index)}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>

        {/* PANEL SEBELAH KANAN: TOTAL BELANJA & TOMBOL SUBMIT */}
        <div className="compact-right-panel">
          <div className="page-card" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="card-header-title">
              <h3>🧾 Ikhtisar Tagihan</h3>
            </div>
            
            <div className="compact-card-body" style={{ justifyContent: "space-between", height: "100%" }}>
              <div className="summary-invoice-box" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span>Subtotal Item:</span>
                  <span className="font-medium">Rp {formatRupiah(hitungSubtotal())}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#dc2626", marginBottom: "8px" }}>
                  <span>PPN Terutang ({tarifPPN}%):</span>
                  <span className="font-medium">Rp {formatRupiah(hitungPPN())}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px dashed #cbd5e1", paddingTop: "12px", fontSize: "16px", fontWeight: "800" }}>
                  <span>Total Faktur Akhir:</span>
                  <span className="text-success">Rp {formatRupiah(hitungTotalAkhir())}</span>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmitTransaksi}
                  disabled={detail.length === 0}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: detail.length === 0 ? "not-allowed" : "pointer",
                    opacity: detail.length === 0 ? 0.6 : 1
                  }}
                >
                  <FaReceipt /> Simpan & Posting Jurnal
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* POP-UP MODAL FIX: STRUK DETAIL & CETAK INVOICE */}
      {showDetail && invoiceInfo && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header-success">
              <h2>🎉 Transaksi Berhasil Disimpan!</h2>
              <button className="close-x-btn" onClick={() => setShowDetail(false)}>×</button>
            </div>
            
            <div className="modal-body-scroll">
              <div className="invoice-meta-badge-grid">
                <div>No. Invoice: <strong style={{ color: "#1e293b" }}>{invoiceInfo.invoice}</strong></div>
                <div>Nama Pembeli: <strong>{invoiceInfo.nama_customer}</strong></div>
                <div>Waktu Input: <strong>{invoiceInfo.tanggal ? new Date(invoiceInfo.tanggal).toLocaleString("id-ID") : "-"}</strong></div>
                <div>Metode Bayar: <span className="badge-payment-type">{invoiceInfo.status_pembayaran}</span></div>
                <div>Status Jurnal: <strong className="text-success">{invoiceInfo.status_transaksi}</strong></div>
                <div>Jatuh Tempo: <strong>{invoiceInfo.jatuh_tempo ? new Date(invoiceInfo.jatuh_tempo).toLocaleDateString("id-ID") : "-"}</strong></div>
              </div>

              <h3 className="section-modal-title">Rincian Komoditas Terjual:</h3>
              <table className="modal-data-table">
                <thead>
                  <tr>
                    <th>Nama Barang</th>
                    <th style={{ textAlign: "center" }}>Kuantitas</th>
                    <th style={{ textAlign: "right" }}>Harga Satuan</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {itemDetailList.map((det) => (
                    <tr key={det.id}>
                      <td className="font-medium">
                        {det.nama_barang} <br/>
                        <span className="badge-code-table">{det.kode_barang || "PROD"}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>{det.qty} Unit</td>
                      <td style={{ textAlign: "right" }}>Rp {formatRupiah(det.harga_jual)}</td>
                      <td style={{ textAlign: "right" }} className="font-medium">Rp {formatRupiah(det.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="modal-financial-summary">
                <div>Nilai Bruto: <span>Rp {formatRupiah(invoiceInfo.subtotal)}</span></div>
                <div className="text-danger">Pajak PPN ({tarifPPN}%): <span>Rp {formatRupiah(invoiceInfo.pajak)}</span></div>
                <div className="total-highlight">Total Faktur Akhir: <span className="text-success">Rp {formatRupiah(invoiceInfo.total)}</span></div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button type="button" className="btn-modal-dismiss" onClick={() => setShowDetail(false)}>
                Tutup & Kasir Baru
              </button>
              <button 
                type="button" 
                className="btn-modal-print" 
                onClick={() => handlePrintInvoice(invoiceInfo.id)}
              >
                <FaPrint /> Cetak PDF Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}