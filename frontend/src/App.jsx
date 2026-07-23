import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Pajak from "./pages/Pajak";
import Akun from "./pages/Akun";

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

        {/* kas */}
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

        {/* PENJUALAN List */}
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

        {/* PENJUALAN List */}
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

        {/* JURNAL manual */}
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

         {/* TUTUP PERIODE */}
        <Route
          path="/pajak"
          element={
            <ProtectedRoute>
              <Layout>
                <Pajak />
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