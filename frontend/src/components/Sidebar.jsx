import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaCoins,
  FaBox,
  FaUsers,
  FaTruck,
  FaShoppingCart,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaBook,
  FaChartBar,
  FaBalanceScale,
  FaPercentage,
  FaFileExcel,
  FaList,
  FaJournalWhills,
  FaCalendarCheck
} from "react-icons/fa";
import "../styles/sidebar.css";

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <aside className="sidebar">
      {/* BRANDING */}
      <div className="logo">
        ACCOUNTINGQ
      </div>

      {/* USER IDENTITAS */}
      <div className="user-box">
        <strong>{user?.nama || "Administrator"}</strong>
        <small>{user?.perusahaan || "Perusahaan ERP"}</small>
        <span className="badge-role">{user?.role || "Super Admin"}</span>
      </div>

      {/* WRAPPER NAVIGASI */}
      <div className="sidebar-nav-container">
        
        {/* CORE UTAMA */}
        <div className="menu-group" style={{ marginTop: 0 }}>
          <NavLink to="/" end>
            <FaHome />
            Dashboard
          </NavLink>
        </div>

        {/* MASTER DATA */}
        <div className="menu-group">
          <h4>Master Data</h4>
          <NavLink to="/kas-modal" className="menu-item">
            <FaCoins /> 
            Input Kas & Modal
          </NavLink>
          <NavLink to="/barang">
            <FaBox />
            Data Barang
          </NavLink>
          <NavLink to="/supplier">
            <FaTruck />
            Data Supplier
          </NavLink>
          <NavLink to="/customer">
            <FaUsers />
            Data Customer
          </NavLink>
          <NavLink to="/akun">
            <FaList />
            Daftar Akun
          </NavLink>
        </div>

        {/* TRANSAKSI BUKU */}
        <div className="menu-group">
          <h4>Transaksi Buku</h4>
          <NavLink to="/barang-masuk">
            <FaShoppingCart />
            Barang Masuk
          </NavLink>
          <NavLink to="/penjualan">
            <FaFileInvoiceDollar />
            Penjualan / Invoice
          </NavLink>
          <NavLink to="/penjualan-list">
            <FaFileInvoiceDollar />
            Daftar Penjualan
            </NavLink>
          <NavLink to="/piutang">
            <FaMoneyBillWave />
            Kartu Piutang
          </NavLink>
          <NavLink to="/hutang">
            <FaMoneyBillWave />
            Kartu Hutang
          </NavLink>
          <NavLink to="/jurnalmanual">
            <FaJournalWhills />
            Jurnal Manual
          </NavLink>
        </div>

        {/* LAPORAN KEUANGAN */}
        <div className="menu-group">
          <h4>Laporan Keuangan</h4>

          <NavLink to="/jurnal">
            <FaBook />
            Jurnal Umum
          </NavLink>
          <NavLink to="/bukubesar">
            <FaBook />
            Buku Besar
          </NavLink>
          <NavLink to="/neracasaldo">
            <FaChartBar />
            Neraca Saldo
          </NavLink>
          <NavLink to="/labarugi">
            <FaChartBar />
            Laba Rugi
          </NavLink>
          <NavLink to="/neraca">
            <FaBalanceScale />
            Neraca Lajur
          </NavLink>
        </div>

        {/* UTILITAS & CLOSING */}
        <div className="menu-group">
          <h4>Utilitas & Penutupan</h4>
          <NavLink to="/pajak">
            <FaPercentage />
            Pengaturan Pajak
          </NavLink>    
          <NavLink to="/export-excel">
            <FaFileExcel />
            Export Laporan Excel
          </NavLink>
          <NavLink to="/tutupbuku">
            <FaCalendarCheck />
            Tutup Buku Akhir Tahun
          </NavLink>
          <NavLink to="/tutupperiode">
            <FaCalendarCheck />
            Tutup Periode Bulanan
          </NavLink>
        </div>

      </div>
    </aside>
  );
}