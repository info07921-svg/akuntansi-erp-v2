import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./styles/layout.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import KasModalForm from "./pages/KasModalForm";
import Barang from "./pages/Barang";
import Supplier from "./pages/Supplier";
import BarangMasuk from "./pages/BarangMasuk";
import Hutang from "./pages/Hutang";
import Customer from "./pages/Customer";
import Penjualan from "./pages/Penjualan";
import PenjualanList from "./pages/PenjualanList";
import Piutang from "./pages/Piutang";
import Pembelian from "./pages/Pembelian";
import Jurnal from "./pages/Jurnal";
import BukuBesar from "./pages/BukuBesar";
import NeracaSaldo from "./pages/NeracaSaldo";
import LabaRugi from "./pages/LabaRugi";
import Neraca from "./pages/Neraca";
import TutupBuku from "./pages/TutupBuku";
import JurnalManual from "./pages/JurnalManual";
import TutupPeriode from "./pages/TutupPeriode";
import ExportExcel from "./pages/ExportExcel";

import Akun from "./pages/Akun";

// 1. Pemetaan Judul Halaman berdasarkan Path URL
const pageTitles = {
  "/": "Dashboard",
  "/login": "Login",
  "/register": "Register",
  "/kas-modal": "Kas & Modal",
  "/barang": "Master Data Barang",
  "/akun": "Daftar Akun / COA",
  "/supplier": "Data Supplier",
  "/barang-masuk": "Barang Masuk Logistik",
  "/hutang": "Kartu Hutang Dagang",
  "/customer": "Data Customer",
  "/penjualan": "Input Penjualan / Invoice",
  "/penjualan-list": "Daftar Penjualan",
  "/piutang": "Kartu Piutang Usaha",
  "/pembelian": "Data Pembelian",
  "/jurnal": "Jurnal Umum",
  "/jurnalmanual": "Jurnal Manual",
  "/bukubesar": "Buku Besar",
  "/neracasaldo": "Neraca Saldo",
  "/labarugi": "Laporan Laba Rugi",
  "/neraca": "Neraca Keuangan",
  "/tutupbuku": "Tutup Buku Akhir Tahun",
  "/tutupperiode": "Tutup Periode Bulanan",
  "/export-excel": "Pusat Ekspor Excel",
 
};

// 2. Komponen Otomatis Pengubah Judul Tab Browser
function DynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    const title = pageTitles[location.pathname] || "ERP System";
    document.title = `${title} | accountingQ`;
  }, [location]);

  return null;
}

function Layout({ children }) {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-content">

        <Header />

        <div className="page-content">
          {children}
        </div>

      </div>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* Pengubah Judul dipasang di sini */}
      <DynamicTitle />

      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* DASHBOARD */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* KAS */}
        <Route
          path="/kas-modal"
          element={
            <ProtectedRoute>
              <Layout>
                <KasModalForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* BARANG */}
        <Route
          path="/barang"
          element={
            <ProtectedRoute>
              <Layout>
                <Barang />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* COA / AKUN */}
        <Route
          path="/akun"
          element={
            <ProtectedRoute>
              <Layout>
                <Akun />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* SUPPLIER */}
        <Route
          path="/supplier"
          element={
            <ProtectedRoute>
              <Layout>  
                <Supplier />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* BARANG MASUK */}
        <Route
          path="/barang-masuk"
          element={
            <ProtectedRoute>
              <Layout>
                <BarangMasuk />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* HUTANG */}
        <Route
          path="/hutang"
          element={
            <ProtectedRoute>
              <Layout>
                <Hutang />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* CUSTOMER */}  
        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <Layout>
                <Customer />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* PENJUALAN */}
        <Route
          path="/penjualan"
          element={
            <ProtectedRoute>
              <Layout>
                <Penjualan />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* PENJUALAN LIST */}
        <Route
          path="/penjualan-list"
          element={
            <ProtectedRoute>
              <Layout>
                <PenjualanList />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* PIUTANG */}
        <Route
          path="/piutang"
          element={
            <ProtectedRoute>
              <Layout>
                <Piutang />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* PEMBELIAN */}
        <Route
          path="/pembelian"
          element={
            <ProtectedRoute>
              <Layout>
                <Pembelian />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* JURNAL */}
        <Route
          path="/jurnal"
          element={
            <ProtectedRoute>
              <Layout>
                <Jurnal />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* JURNAL MANUAL */}
        <Route
          path="/jurnalmanual"
          element={
            <ProtectedRoute>
              <Layout>
                <JurnalManual />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* BUKU BESAR */}
        <Route
          path="/bukubesar"
          element={
            <ProtectedRoute>
              <Layout>
                <BukuBesar />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* NERACA SALDO */}
        <Route
          path="/neracasaldo"
          element={
            <ProtectedRoute>
              <Layout>
                <NeracaSaldo />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* LABA RUGI */}
        <Route
          path="/labarugi"
          element={
            <ProtectedRoute>
              <Layout>
                <LabaRugi />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* NERACA */}
        <Route
          path="/neraca"
          element={
            <ProtectedRoute>
              <Layout>
                <Neraca />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* TUTUP BUKU */}
        <Route
          path="/tutupbuku"
          element={
            <ProtectedRoute>
              <Layout>
                <TutupBuku />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* TUTUP PERIODE */}
        <Route
          path="/tutupperiode"
          element={
            <ProtectedRoute>
              <Layout>
                <TutupPeriode />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* EXPORT EXCEL */}
        <Route
          path="/export-excel"
          element={
            <ProtectedRoute>
              <Layout>
                <ExportExcel />
              </Layout>
            </ProtectedRoute>
          }
        />


        <Route
          path="*"
          element={<h2>404 - Halaman Tidak Ditemukan</h2>}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;