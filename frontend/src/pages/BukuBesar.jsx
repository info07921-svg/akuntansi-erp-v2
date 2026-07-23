import { useEffect, useState } from "react";
import api from "../services/api";
import { FaBookOpen, FaFilter, FaSearch, FaRegCalendarAlt, FaInfoCircle } from "react-icons/fa";
import "../styles/erp.css";

export default function BukuBesar() {
  const [data, setData] = useState([]);
  const [akun, setAkun] = useState([]);

  const [filter, setFilter] = useState({
    akun_id: "",
    tanggal_awal: "",
    tanggal_akhir: ""
  });

  const fetchAkun = async () => {
    try {
      const res = await api.get("/akun");
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData)) {
        setAkun(rawData);
      }
    } catch (err) {
      console.error("Gagal memuat daftar akun:", err);
    }
  };

  const fetchData = async () => {
    try {
      const params = {};
      if (filter.akun_id) params.akun_id = filter.akun_id;
      if (filter.tanggal_awal) params.tanggal_awal = filter.tanggal_awal;
      if (filter.tanggal_akhir) params.tanggal_akhir = filter.tanggal_akhir;

      const res = await api.get("/akuntansi/buku-besar", { params });
      const dataJurnal = res.data?.data || res.data || [];
      
      if (Array.isArray(dataJurnal)) {
        let saldoBerjalan =
        Number(res.data.saldo_awal || 0);
        
        const dataDenganSaldo = dataJurnal.map((row) => {
          const debit = Number(row.debit) || 0;
          const kredit = Number(row.kredit) || 0;
          const tipeAkun = row.tipe ? row.tipe.toUpperCase() : "";

          // Perhitungan akumulasi saldo berjalan berdasarkan normal balance kelompok akun
          if (tipeAkun === "ASET" || tipeAkun === "BEBAN" || tipeAkun === "BIAYA") {
            saldoBerjalan += (debit - kredit);
          } else {
            saldoBerjalan += (kredit - debit);
          }

          return {
            ...row,
            saldo: saldoBerjalan
          };
        });

        setData(dataDenganSaldo);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Gagal memuat data buku besar:", err);
      setData([]);
    }
  };

  useEffect(() => {
    fetchAkun();
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const rupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number);
  };

  return (
    <div className="page-container">
      {/* Header Halaman */}
      <div className="page-header">
        <div className="page-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7", padding: "10px", borderRadius: "10px", display: "flex" }}>
            <FaBookOpen />
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Buku Besar (General Ledger)</h1>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0", fontWeight: "400" }}>
              Pemantauan histori mutasi debet kredit dan saldo berjalan per rekening akun terintegrasi.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar Panel */}
      <div className="page-card" style={{ padding: "16px" }}>
        <form onSubmit={handleSearch} className="form-row-inline">
          <div className="flex-main" style={{ flex: "1.8" }}>
            <label className="form-label" style={{ marginBottom: "6px", display: "block", fontWeight: "600", color: "#475569" }}>Rekening Akun Jurnal</label>
            <select name="akun_id" value={filter.akun_id} onChange={handleFilterChange}>
              <option value="">-- Tampilkan Semua Akun Buku Besar --</option>
              {akun.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.kode_akun}] — {a.nama_akun} ({a.tipe})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-sub">
            <label className="form-label" style={{ marginBottom: "6px", display: "block", fontWeight: "600", color: "#475569" }}>Dari Tanggal</label>
            <input type="date" name="tanggal_awal" value={filter.tanggal_awal} onChange={handleFilterChange} />
          </div>

          <div className="flex-sub">
            <label className="form-label" style={{ marginBottom: "6px", display: "block", fontWeight: "600", color: "#475569" }}>Sampai Tanggal</label>
            <input type="date" name="tanggal_akhir" value={filter.tanggal_akhir} onChange={handleFilterChange} />
          </div>

          <button type="submit" className="btn-action" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
            <FaSearch /> Cari Jurnal
          </button>
        </form>
      </div>

      {/* Hasil Data Mutasi Tabel */}
      <div className="page-card" style={{ padding: "0", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#334155", margin: 0, display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            <FaFilter style={{ color: "#94a3b8", fontSize: "11px" }} /> Rincian Transaksi Jurnal Posting
          </h3>
          {data.length > 0 && (
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
              Menampilkan <strong>{data.length}</strong> baris mutasi
            </span>
          )}
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table className="table-erp" style={{ margin: 0, border: "none", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#ffffff" }}>
                <th style={{ width: "130px", padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px" }}>Tanggal</th>
                <th style={{ width: "110px", padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px" }}>Kode Akun</th>
                <th style={{ width: "180px", padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px" }}>Nama Rekening</th>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px" }}>Keterangan Transaksi</th>
                <th style={{ textAlign: "right", width: "140px", padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px" }}>Debet</th>
                <th style={{ textAlign: "right", width: "140px", padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px" }}>Kredit</th>
                <th style={{ textAlign: "right", width: "160px", padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px" }}>Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "13px" }}>
                        <FaRegCalendarAlt style={{ fontSize: "12px", color: "#94a3b8" }} />
                        {new Date(row.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      <code style={{ background: "#f1f5f9", color: "#0f172a", padding: "3px 6px", borderRadius: "4px", fontWeight: "600", fontSize: "12px", border: "1px solid #e2e8f0" }}>
                        {row.kode_akun}
                      </code>
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle", fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>
                      {row.nama_akun}
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle", color: "#334155", fontSize: "13px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.keterangan}>
                      {row.keterangan}
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right", fontWeight: "600", fontSize: "13px", color: row.debit > 0 ? "#15803d" : "#94a3b8" }}>
                      {row.debit > 0 ? rupiah(row.debit) : "Rp 0"}
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right", fontWeight: "600", fontSize: "13px", color: row.kredit > 0 ? "#b91c1c" : "#94a3b8" }}>
                      {row.kredit > 0 ? rupiah(row.kredit) : "Rp 0"}
                    </td>
                    <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right", fontWeight: "700", fontSize: "13px", color: "#1e3a8a", background: index % 2 === 0 ? "#f0fdf4" : "#f0fdf4" }}>
                      {rupiah(row.saldo)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#64748b", padding: "50px 20px" }}>
                    <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "12px", borderRadius: "50%", color: "#94a3b8", marginBottom: "12px" }}>
                      <FaInfoCircle style={{ fontSize: "20px" }} />
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Tidak ada data mutasi jurnal ditemukan</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Silakan pilih jenis rekening akun keuangan yang berbeda atau ubah parameter rentang tanggal pencarian Anda.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}