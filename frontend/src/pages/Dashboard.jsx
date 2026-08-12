import { useEffect, useState } from "react";
import api from "../services/api";
import { FaWallet, FaBriefcase, FaArrowUp, FaArrowDown, FaPercentage, FaBoxOpen, FaShoppingCart, FaUsers } from "react-icons/fa";
import "../styles/erp.css";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/dashboard/summary");
      if (res.data.success) {
        setSummary(res.data.data || res.data.summary || res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal terhubung ke server untuk memuat data ringkasan eksekutif.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#64748b", fontSize: "15px" }}>Menyelaraskan data pembukuan jurnal ERP...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ padding: "20px" }}>
        <div style={{ padding: "16px", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", border: "1px solid #fca5a5" }}>
          {error}
        </div>
      </div>
    );
  }

  // Fallback variabel dari berbagai kemungkinan properti backend
  const valKas = summary?.total_kas ?? summary?.kas ?? 0;
  const valModal = summary?.total_modal ?? summary?.modal ?? 0;
  const valPendapatan = summary?.total_pendapatan ?? summary?.pendapatan ?? 0;
  const valPengeluaran = summary?.total_pengeluaran ?? summary?.beban ?? 0;
  const valProfit = summary?.profit ?? summary?.laba_bersih ?? summary?.laba ?? 0;

  return (
    <div className="page-container">
      {/* HEADER UTAMA */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ringkasan Analisis Finansial</h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Pemantauan langsung posisi neraca kas, modal investasi, dan akumulasi laba-rugi operasional perusahaan.
          </p>
        </div>
      </div>

      {/* BARIS METRIK UTAMA (CARD) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        
        {/* CARD 1: TOTAL KAS & BANK */}
        <div className="table-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#e0f2fe", color: "#0369a1", padding: "14px", borderRadius: "10px", fontSize: "20px" }}>
            <FaWallet />
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Kas & Bank tunai/non</p>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{formatRupiah(valKas)}</h3>
          </div>
        </div>

        {/* CARD 2: TOTAL MODAL EKUITAS */}
        <div className="table-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#f3e8ff", color: "#6b21a8", padding: "14px", borderRadius: "10px", fontSize: "20px" }}>
            <FaBriefcase />
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Modal Disetor</p>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{formatRupiah(valModal)}</h3>
          </div>
        </div>

        {/* CARD 3: TOTAL PENDAPATAN */}
        <div className="table-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "14px", borderRadius: "10px", fontSize: "20px" }}>
            <FaArrowUp />
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Pendapatan</p>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>{formatRupiah(valPendapatan)}</h3>
          </div>
        </div>

        {/* CARD 4: TOTAL PENGELUARAN */}
        <div className="table-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "14px", borderRadius: "10px", fontSize: "20px" }}>
            <FaArrowDown />
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Beban Pengeluaran</p>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{formatRupiah(valPengeluaran)}</h3>
          </div>
        </div>

        {/* CARD 5: LABA BERSIH (PROFIT) */}
        <div className="table-card" style={{ 
          padding: "20px", display: "flex", alignItems: "center", gap: "16px",
          background: valProfit >= 0 ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${valProfit >= 0 ? "#bbf7d0" : "#fca5a5"}`
        }}>
          <div style={{ 
            background: valProfit >= 0 ? "#16a34a" : "#dc2626", 
            color: "#ffffff", padding: "14px", borderRadius: "10px", fontSize: "20px" 
          }}>
            <FaPercentage />
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Laba Bersih Usaha</p>
            <h3 style={{ fontSize: "20px", fontWeight: "900", color: valProfit >= 0 ? "#15803d" : "#b91c1c", marginTop: "4px" }}>
              {formatRupiah(valProfit)}
            </h3>
          </div>
        </div>

      </div>

      {/* PANEL BAWAH: DATA OPERASIONAL & PERINGATAN LOGISTIK */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" }}>
        
        {/* TABEL KONTROL STOK BARANG MENIPIS */}
        <div className="table-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBoxOpen style={{ color: "#eab308" }} /> Peringatan Inventaris (Stok Menipis)
          </h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Nama Produk Barang</th>
                <th style={{ textAlign: "center" }}>Sisa Stok Fisik</th>
                <th>Satuan</th>
              </tr>
            </thead>
            <tbody>
              {!summary?.stok_menipis || summary?.stok_menipis?.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8", padding: "15px" }}>
                    Aman! Seluruh stok barang berada di atas batas aman minimal.
                  </td>
                </tr>
              ) : (
                summary?.stok_menipis?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600", color: "#334155" }}>{item.nama_barang}</td>
                    <td style={{ textAlign: "center", color: "#dc2626", fontWeight: "700", background: "#fef2f2" }}>{item.stok}</td>
                    <td style={{ color: "#64748b" }}>{item.satuan || "unit"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RIWAYAT AKTIVITAS TRANSAKSI */}
        <div className="table-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>
            Volume Aktivitas Logistik
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#475569" }}>
                <FaShoppingCart style={{ color: "#0284c7" }} /> Faktur Penjualan
              </span>
              <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                {summary?.operasional?.jumlah_penjualan || summary?.total_transaksi || 0} Transaksi
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#475569" }}>
                <FaBoxOpen style={{ color: "#16a34a" }} /> Nota Barang Masuk
              </span>
              <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                {summary?.operasional?.jumlah_pembelian || 0} Transaksi
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "5px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#475569" }}>
                <FaUsers style={{ color: "#4f46e5" }} /> Pelanggan / Customer
              </span>
              <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                {summary?.operasional?.jumlah_customer || 0} Kontak
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}