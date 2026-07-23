import { useEffect, useState } from "react";
import api from "../services/api";
import { FaScaleBalanced, FaFileExcel } from "react-icons/fa6";
import "../styles/erp.css";

export default function NeracaSaldo() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const res = await api.get("/akuntansi/neraca-saldo");
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalDebit = data.reduce((total, item) => total + Number(item.total_debit || 0), 0);
  const totalKredit = data.reduce((total, item) => total + Number(item.total_kredit || 0), 0);
  const token = localStorage.getItem("token");

  const exportExcel = async () => {
    try {
      const response = await api.get("/akuntansi/neraca-saldo/export", {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Neraca_Saldo_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.log(err);
      alert("Gagal export Excel");
    }
  };

  const rupiah = (angka) => {
    return new Intl.NumberFormat("id-ID").format(angka);
  };

  return (
    <div className="page-container">
      {/* HEADER HALAMAN */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <FaScaleBalanced style={{ color: "#0284c7" }} /> Laporan Neraca Saldo
        </h1>
        <button className="btn-primary" onClick={exportExcel} style={{ background: "#16a34a" }}>
          <FaFileExcel style={{ marginRight: "6px" }} /> Export Excel
        </button>
      </div>

      {/* CARD TABEL DATA */}
      <div className="page-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Kode Akun</th>
                <th>Nama Akun / Perkiraan</th>
                <th style={{ width: "180px" }}>Tipe Akun</th>
                <th style={{ textAlign: "right", width: "16px" }}>Debit (Rp)</th>
                <th style={{ textAlign: "right", width: "160px" }}>Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.kode_akun}</code></td>
                    <td style={{ fontWeight: "600", color: "#0f172a" }}>{item.nama_akun}</td>
                    <td>
                      <span className="badge-role" style={{ background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "6px", fontSize: "11px" }}>
                        {item.tipe}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "500" }}>{rupiah(item.total_debit)}</td>
                    <td style={{ textAlign: "right", fontWeight: "500" }}>{rupiah(item.total_kredit)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                    Tidak ada rekaman data neraca saldo saat ini.
                  </td>
                </tr>
              )}
              {/* BARIS TOTAL / SUMMARY STATEMENT */}
              <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                <td colSpan="3" style={{ textAlign: "right", color: "#0f172a", fontSize: "14px" }}>TOTAL AKUMULASI:</td>
                <td style={{ textAlign: "right", color: "#0284c7", fontSize: "14px" }}>Rp {rupiah(totalDebit)}</td>
                <td style={{ textAlign: "right", color: "#0284c7", fontSize: "14px" }}>Rp {rupiah(totalKredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}