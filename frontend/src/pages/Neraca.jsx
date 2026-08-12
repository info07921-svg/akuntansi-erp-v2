import { useEffect, useState } from "react";
import api from "../services/api";
import { FaBuildingColumns } from "react-icons/fa6";
import "../styles/erp.css";

export default function Neraca() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get("/akuntansi/neraca");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) {
    return <div style={{ padding: "24px", color: "#64748b", fontSize: "14px" }}>Sinkronisasi laporan keuangan Neraca...</div>;
  }

  const rupiah = (angka) => {
    return new Intl.NumberFormat("id-ID").format(angka);
  };

  return (
    <div className="page-container">
      {/* HEADER HALAMAN */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <FaBuildingColumns style={{ color: "#0284c7" }} /> Laporan Posisi Keuangan (Neraca)
        </h1>
      </div>

      {/* CARD TABEL BALANCE SHEET */}
      <div className="page-card" style={{ padding: 0, overflow: "hidden", maxWidth: "600px" }}>
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Komponen Aktiva & Passiva</th>
                <th style={{ textAlign: "right", width: "200px" }}>Total Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: "600", paddingLeft: "20px" }}>TOTAL ASET (AKTIVA)</td>
                <td style={{ textAlign: "right", fontWeight: "700", color: "#0284c7" }}>Rp {rupiah(data.aset)}</td>
              </tr>
              <tr style={{ background: "#f8fafc" }}>
                <td style={{ paddingLeft: "20px" }}>Total Kewajiban / Liabilitas (Utang)</td>
                <td style={{ textAlign: "right", color: "#475569" }}>Rp {rupiah(data.kewajiban)}</td>
              </tr>
              <tr style={{ background: "#f8fafc" }}>
                <td style={{ paddingLeft: "20px" }}>Total Ekuitas (Modal Usaha)</td>
                <td style={{ textAlign: "right", color: "#475569" }}>Rp {rupiah(data.modal)}</td>
              </tr>
              {/* KELOMPOK PASSIVA */}
              <tr style={{ fontWeight: "700", borderTop: "2px solid #cbd5e1" }}>
                <td style={{ paddingLeft: "20px", color: "#0f172a" }}>TOTAL KEWAJIBAN & MODAL (PASSIVA)</td>
                <td style={{ textAlign: "right", color: "#0284c7" }}>
                  Rp {rupiah(Number(data.kewajiban) + Number(data.modal))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}