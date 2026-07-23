import api from "../services/api";
import { 
  FaFileExcel, 
  FaScaleBalanced, 
  FaBookOpen, 
  FaChartLine, 
  FaBuildingColumns, 
  FaHandHoldingDollar, 
  FaMoneyCheckDollar 
} from "react-icons/fa6";
import "../styles/erp.css";

export default function ExportExcel() {
  const token = localStorage.getItem("token");

  const exportFile = async (endpoint, filename) => {
    try {
      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const blob = new Blob([response.data], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.log(err);
      alert("Gagal memproses ekspor file Excel. Silakan periksa koneksi server Anda.");
    }
  };

  const generateDownloadName = (baseName) => {
    const date = new Date().toISOString().slice(0, 10);
    return `${baseName}_${date}.xlsx`;
  };

  return (
    <div className="page-container">
      
      {/* HEADER UTAMA MODUL SYSTEM */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <FaFileExcel style={{ color: "#16a34a" }} /> Pusat Ekspor Laporan Excel
        </h1>
      </div>

      {/* DESKRIPSI SINGKAT */}
      <p style={{ color: "#64748b", fontSize: "14px", marginTop: "-10px", marginBottom: "24px" }}>
        Silakan pilih jenis data atau laporan keuangan di bawah ini untuk mengunduh dokumen spreadsheet format Microsoft Excel (`.xlsx`) secara *real-time*.
      </p>

      {/* GRID CONTAINER UNTUK KARTU EKSPOR */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        
        {/* CARD 1: NERACA SALDO */}
        <div className="page-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", margin: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(2, 132, 199, 0.1)", padding: "10px", borderRadius: "10px", display: "flex" }}>
                <FaScaleBalanced style={{ color: "#0284c7", fontSize: "20px" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Neraca Saldo</h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Unduh saldo penutupan dari semua akun buku besar untuk mengecek keseimbangan posisi debit dan kredit.
            </p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: "100%", background: "#16a34a", justifyContent: "center" }}
            onClick={() => exportFile("/akuntansi/neraca-saldo/export", generateDownloadName("Neraca_Saldo"))}
          >
            <FaFileExcel style={{ marginRight: "6px" }} /> Export Neraca Saldo
          </button>
        </div>

        {/* CARD 2: BUKU BESAR */}
        <div className="page-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", margin: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(2, 132, 199, 0.1)", padding: "10px", borderRadius: "10px", display: "flex" }}>
                <FaBookOpen style={{ color: "#0284c7", fontSize: "20px" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Buku Besar</h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Unduh rincian seluruh riwayat mutasi transaksi pasca-jurnal yang dikelompokkan per kode akun perkiraan.
            </p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: "100%", background: "#16a34a", justifyContent: "center" }}
            onClick={() => exportFile("/akuntansi/buku-besar/export", generateDownloadName("Buku_Besar"))}
          >
            <FaFileExcel style={{ marginRight: "6px" }} /> Export Buku Besar
          </button>
        </div>

        {/* CARD 3: LABA RUGI */}
        <div className="page-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", margin: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(2, 132, 199, 0.1)", padding: "10px", borderRadius: "10px", display: "flex" }}>
                <FaChartLine style={{ color: "#0284c7", fontSize: "20px" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Laba Rugi</h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Unduh ikhtisar pendapatan dan beban operasional perusahaan untuk meninjau estimasi profitabilitas bersih.
            </p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: "100%", background: "#16a34a", justifyContent: "center" }}
            onClick={() => exportFile("/akuntansi/laba-rugi/export", generateDownloadName("Laba_Rugi"))}
          >
            <FaFileExcel style={{ marginRight: "6px" }} /> Export Laba Rugi
          </button>
        </div>

        {/* CARD 4: NERACA LAJUR */}
        <div className="page-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", margin: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(2, 132, 199, 0.1)", padding: "10px", borderRadius: "10px", display: "flex" }}>
                <FaBuildingColumns style={{ color: "#0284c7", fontSize: "20px" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Neraca / Posisi Keuangan</h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Unduh laporan struktur aktiva dan passiva (Aset, Kewajiban, dan Modal) pada akhir periode berjalan.
            </p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: "100%", background: "#16a34a", justifyContent: "center" }}
            onClick={() => exportFile("/akuntansi/neraca/export", generateDownloadName("Neraca_Lajur"))}
          >
            <FaFileExcel style={{ marginRight: "6px" }} /> Export Neraca
          </button>
        </div>

        {/* CARD 5: REKAP PIUTANG */}
        <div className="page-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", margin: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "10px", display: "flex" }}>
                <FaHandHoldingDollar style={{ color: "#ef4444", fontSize: "20px" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Kartu Piutang Usaha</h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Unduh daftar rekaman tagihan piutang berjalan yang masih tertahan di sisi customer / pelanggan.
            </p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: "100%", background: "#16a34a", justifyContent: "center" }}
            onClick={() => exportFile("/piutang/export", generateDownloadName("Rekap_Piutang"))}
          >
            <FaFileExcel style={{ marginRight: "6px" }} /> Export Data Piutang
          </button>
        </div>

        {/* CARD 6: REKAP HUTANG */}
        <div className="page-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", margin: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "10px", display: "flex" }}>
                <FaMoneyCheckDollar style={{ color: "#ef4444", fontSize: "20px" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Kartu Hutang Dagang</h3>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Unduh daftar komitmen kewajiban hutang pembelanjaan material logistik kepada mitra supplier.
            </p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: "100%", background: "#16a34a", justifyContent: "center" }}
            onClick={() => exportFile("/hutang/export", generateDownloadName("Rekap_Hutang"))}
          >
            <FaFileExcel style={{ marginRight: "6px" }} /> Export Data Hutang
          </button>
        </div>

      </div>

    </div>
  );
}