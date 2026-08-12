import { useEffect, useState } from "react";
import api from "../services/api";
import { FaChartLine, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import "../styles/erp.css";

export default function LabaRugi() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get("/akuntansi/laba-rugi");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) {
    return <div style={{ padding: "24px", color: "#64748b", fontSize: "14px" }}>Sinkronisasi laporan keuangan Laba Rugi...</div>;
  }

  const rupiah = (angka) => {
    return new Intl.NumberFormat("id-ID").format(angka);
  };

  const isLaba = Number(data.laba_bersih) >= 0;

  return (
    <div className="page-container">
      {/* HEADER HALAMAN */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <FaChartLine style={{ color: "#0284c7" }} /> Laporan Laba Rugi
        </h1>
      </div>

      {/* CARD TABEL FINANCIAL STATEMENT */}
      <div className="page-card" style={{ padding: 0, overflow: "hidden", maxWidth: "600px" }}>
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Deskripsi Akun Keuangan</th>
                <th style={{ textAlign: "right", width: "200px" }}>Nilai Buku (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ paddingLeft: "20px" }}>Total Pendapatan / Penjualan Usaha</td>
                <td style={{ textAlign: "right", fontWeight: "600", color: "#16a34a" }}>Rp {rupiah(data.pendapatan)}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: "20px" }}>Total Beban Operasional & Pokok</td>
                <td style={{ textAlign: "right", fontWeight: "600", color: "#dc2626" }}>Rp {rupiah(data.beban)}</td>
              </tr>
              {/* BARIS KUNCI LABA BERSIH */}
              <tr style={{ background: isLaba ? "#f0f9ff" : "#fef2f2", fontWeight: "800", borderTop: "2px solid #cbd5e1" }}>
                <td style={{ fontSize: "14px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", border: "none" }}>
                  {isLaba ? <FaArrowTrendUp style={{ color: "#0284c7" }} /> : <FaArrowTrendDown style={{ color: "#dc2626" }} />}
                  ESTIMASI LABA / RUGI BERSIH :
                </td>
                <td style={{ textAlign: "right", fontSize: "16px", color: isLaba ? "#0284c7" : "#b91c1c", border: "none" }}>
                  Rp {rupiah(data.laba_bersih)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}