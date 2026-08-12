import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  FaFileInvoiceDollar, 
  FaPlus, 
  FaSearch, 
  FaEye, 
  FaPrint, 
  FaTimesCircle, 
  FaCalendarAlt, 
  FaUser, 
  FaExclamationTriangle 
} from "react-icons/fa";
import "../styles/erp.css";

export default function PenjualanList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // State untuk Detail Modal View
  const [showDetail, setShowDetail] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [itemsDetail, setItemsDetail] = useState([]);
  const [pembayaranDetail, setPembayaranDetail] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/penjualan");
      const dataSistem = res.data?.data || res.data || [];
      setData(Array.isArray(dataSistem) ? dataSistem : []);
    } catch (err) {
      console.error("Gagal memuat data penjualan:", err);
      alert("Gagal mengambil daftar invoice penjualan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const lihatDetailInvoice = async (itemBarisTabel) => {
    if (!itemBarisTabel) return;
    try {
      const normalizedInvoice = {
        id: itemBarisTabel.id,
        invoice: itemBarisTabel.invoice || itemBarisTabel.no_invoice || `TRX-#${itemBarisTabel.id}`,
        nama_customer: itemBarisTabel.nama_customer || itemBarisTabel.customer_nama || "Customer Umum",
        tanggal: itemBarisTabel.tanggal || new Date().toISOString(),
        metode_pembayaran: itemBarisTabel.metode_pembayaran || "TUNAI",
        total: itemBarisTabel.total || 0,
        total_piutang: itemBarisTabel.total || 0,
        penjualan_id: itemBarisTabel.id
      };
      
      setSelectedInvoice(normalizedInvoice);

      const res = await api.get(`/penjualan/piutang/${itemBarisTabel.id}`); 
      
      if (res.data) {
        setItemsDetail(res.data.detail || res.data.items || []);
        setPembayaranDetail(res.data.pembayaran || []);
      } else {
        setItemsDetail([]);
        setPembayaranDetail([]);
      }
      
      setShowDetail(true);
    } catch (err) {
      console.error("Gagal memuat rincian tambahan invoice:", err);
      setItemsDetail([]);
      setPembayaranDetail([]);
      setShowDetail(true);
    }
  };

  const handleCetakInvoice = (id) => {
    if (!id) return;
    window.open(`${api.defaults.baseURL}/penjualan/invoice/${id}`, "_blank");
  };

  // === PERBAIKAN UTAMA: AMAN SAAT TRANSAKSI DIBATALKAN ===
  const handleCancel = async (id) => {
    if (!id) return;
    const konfirmasi = window.confirm("Apakah Anda yakin ingin membatalkan transaksi penjualan ini? Stok gudang akan otomatis dikembalikan.");
    if (!konfirmasi) return;

    try {
      const res = await api.put(`/penjualan/cancel/${id}`);
      if (res.data?.success) {
        alert("Penjualan berhasil dibatalkan!");
        
        // Proteksi Crash: Tutup modal & bersihkan state detail sebelum reload data tabel
        setShowDetail(false);
        setSelectedInvoice(null);
        setItemsDetail([]);
        setPembayaranDetail([]);

        // Refresh data tabel utama
        await loadData();
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Gagal membatalkan transaksi.");
    }
  };

  const formatRupiah = (num) => {
    return "Rp " + Number(num || 0).toLocaleString("id-ID");
  };

  const filteredData = data.filter(item => {
    if (!item) return false;
    const nomorInvoice = String(item.invoice || item.no_invoice || "").toLowerCase();
    const namaPelanggan = String(item.nama_customer || item.customer_nama || "customer umum").toLowerCase();
    const kataKunci = search.toLowerCase().trim();

    return nomorInvoice.includes(kataKunci) || namaPelanggan.includes(kataKunci);
  });

  return (
    <div className="page-container">
      {/* HEADER UTAMA GLASSMORPHISM */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <FaFileInvoiceDollar style={{ color: "#0284c7" }} /> Daftar Invoice Penjualan
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "13px" }}>
            Kelola faktur penjualan komersial, cetak invoice PDF pelanggan, dan pelacakan status piutang usaha.
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => navigate("/penjualan")}
        >
          <FaPlus /> Input Penjualan Baru
        </button>
      </div>

      {/* FILTER PENCARIAN GLASS BOX */}
      <div className="table-card" style={{ padding: "14px 20px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <FaSearch />
          </span>
          <input 
            type="text" 
            placeholder="Cari nomor invoice atau nama pelanggan..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px", margin: 0, width: "100%", height: "38px" }}
          />
        </div>
      </div>

      {/* TABEL DATA GLASS CONTAINER */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th style={{ textAlign: "right" }}>Total Nilai</th>
              <th>Metode</th>
              <th style={{ textAlign: "center" }}>Status Bayar</th>
              <th style={{ textAlign: "center" }}>Status Transaksi</th>
              <th style={{ width: "160px", textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Sedang memuat data transaksi penjualan...
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => {
                const isCancelled = item.status_transaksi === "DIBATALKAN";
                const namaTampil = item.nama_customer || item.customer_nama || "Pelanggan Umum";
                
                return (
                  <tr key={item.id} style={{ opacity: isCancelled ? 0.55 : 1 }}>
                    <td>
                      <span className="badge-code">{item.invoice || `TRX-#${item.id}`}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                        <FaCalendarAlt style={{ color: "var(--text-muted)", fontSize: "12px" }} />
                        {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "var(--text-main)" }}>
                        <FaUser style={{ color: "#0284c7", fontSize: "11px" }} />
                        {namaTampil}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "700", color: "var(--text-main)" }}>
                      {formatRupiah(item.total)}
                    </td>
                    <td>
                      <span style={{ background: "rgba(226, 232, 240, 0.6)", color: "var(--text-main)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                        {item.metode_pembayaran}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={item.status_pembayaran === "LUNAS" ? "badge-active" : "text-danger font-semibold"} style={{ fontSize: "12px" }}>
                        {item.status_pembayaran}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        background: isCancelled ? "rgba(239, 68, 68, 0.15)" : "rgba(2, 132, 199, 0.15)", 
                        color: isCancelled ? "#ef4444" : "#0284c7",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700"
                      }}>
                        {item.status_transaksi || "APPROVED"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn-icon btn-view"
                          title="Lihat Detail"
                          onClick={() => lihatDetailInvoice(item)}
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          className="btn-icon btn-edit"
                          title="Cetak PDF"
                          onClick={() => handleCetakInvoice(item.id)}
                        >
                          <FaPrint />
                        </button>

                        {!isCancelled && (
                          <button
                            type="button"
                            className="btn-icon btn-delete"
                            title="Batalkan Invoice"
                            onClick={() => handleCancel(item.id)}
                          >
                            <FaTimesCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Tidak ada invoice penjualan yang cocok atau ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SYSTEM POP-UP MODAL VIEW (DENGAN SECURITY NULL-CHECK YANG KETAT) */}
      {showDetail && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "680px" }}>
            
            <div className="modal-header">
              <h2>Rincian Dokumen Invoice {selectedInvoice?.invoice || ""}</h2>
              <button className="close-btn" onClick={() => { setShowDetail(false); setSelectedInvoice(null); }}>&times;</button>
            </div>

            <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Nama Pelanggan:</span>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", marginTop: "2px" }}>
                    {selectedInvoice?.nama_customer || "Customer Umum"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Tanggal Transaksi:</span>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", marginTop: "2px" }}>
                    {selectedInvoice?.tanggal ? new Date(selectedInvoice.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Metode Pembayaran:</span>
                  <div style={{ fontWeight: "700", color: "var(--text-main)", marginTop: "2px" }}>
                    {selectedInvoice?.metode_pembayaran || "TUNAI"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Total Nilai Faktur:</span>
                  <div style={{ fontWeight: "800", color: "#16a34a", marginTop: "2px", fontSize: "15px" }}>
                    {formatRupiah(selectedInvoice?.total_piutang || selectedInvoice?.total)}
                  </div>
                </div>
              </div>

              <h4 style={{ margin: "16px 0 8px 0", fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Daftar Produk Yang Keluar:</h4>
              {itemsDetail.length > 0 ? (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                  <table className="erp-table" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: "10px 14px" }}>Nama Barang</th>
                        <th style={{ width: "80px", textAlign: "center", padding: "10px 14px" }}>Qty</th>
                        <th style={{ width: "130px", textAlign: "right", padding: "10px 14px" }}>Harga Satuan</th>
                        <th style={{ width: "140px", textAlign: "right", padding: "10px 14px" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsDetail.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: "600", color: "var(--text-main)", padding: "10px 14px" }}>{item?.nama_barang || "Produk"}</td>
                          <td style={{ textAlign: "center", padding: "10px 14px" }}>{item?.qty || 0} Unit</td>
                          <td style={{ textAlign: "right", padding: "10px 14px" }}>{formatRupiah(item?.harga_satuan || item?.harga_jual)}</td>
                          <td style={{ textAlign: "right", fontWeight: "700", color: "var(--text-main)", padding: "10px 14px" }}>{formatRupiah(item?.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "16px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  <FaExclamationTriangle style={{ color: "#eab308", marginRight: "6px" }} />
                  Rincian barang tersemat penuh pada lembar cetak dokumen (Klik Tombol PDF).
                </div>
              )}

              {pembayaranDetail.length > 0 && (
                <>
                  <h4 style={{ margin: "20px 0 8px 0", fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Histori Mutasi Angsuran Pelunasan:</h4>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <table className="erp-table" style={{ fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "10px 14px" }}>Tanggal Bayar</th>
                          <th style={{ padding: "10px 14px" }}>Metode</th>
                          <th style={{ padding: "10px 14px" }}>Catatan Memo</th>
                          <th style={{ width: "140px", textAlign: "right", padding: "10px 14px" }}>Jumlah Bayar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pembayaranDetail.map((pay, pIdx) => (
                          <tr key={pIdx}>
                            <td style={{ padding: "10px 14px" }}>{pay?.created_at ? new Date(pay.created_at).toLocaleDateString("id-ID") : "-"}</td>
                            <td style={{ padding: "10px 14px" }}><span className="badge-code" style={{ fontSize: "11px" }}>{pay?.metode_pembayaran || ""}</span></td>
                            <td style={{ fontStyle: "italic", color: "var(--text-muted)", padding: "10px 14px" }}>{pay?.catatan || "-"}</td>
                            <td style={{ textAlign: "right", fontWeight: "700", color: "#16a34a", padding: "10px 14px" }}>{formatRupiah(pay?.jumlah_bayar)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ background: "var(--success-gradient)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)" }}
                onClick={() => {
                  handleCetakInvoice(selectedInvoice?.id);
                  setShowDetail(false);
                  setSelectedInvoice(null);
                }}
              >
                <FaPrint /> Cetak PDF Invoice
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setShowDetail(false); setSelectedInvoice(null); }}>
                Tutup Window
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}