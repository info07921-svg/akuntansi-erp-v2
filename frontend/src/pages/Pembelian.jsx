import { Navigate } from "react-router-dom";

// Halaman pembelian dialihkan ke Barang Masuk
// karena modul pembelian dikelola di /barang-masuk
export default function Pembelian() {
  return <Navigate to="/barang-masuk" replace />;
}