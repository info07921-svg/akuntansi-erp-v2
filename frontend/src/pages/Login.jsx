import { useState, useEffect } from "react";
import { loginUser } from "../services/api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const isSessionExpired =
    new URLSearchParams(location.search).get("session") === "expired";

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Kelola pembukuan bisnis Anda lebih praktis.",
      desc: "Sistem otomasi ERP terintegrasi untuk memantau penjualan, persediaan stok gudang, dan laporan akuntansi secara real-time.",
    },
    {
      title: "Pantau Stok & Gudang Multi-Cabang.",
      desc: "Lacak pergerakan aset dan inventaris produk Anda di mana saja secara akurat untuk menghindari kehilangan produk.",
    },
    {
      title: "Keamanan Data Standar Perbankan.",
      desc: "Seluruh sirkulasi data operasional finansial perusahaan dienkripsi penuh menggunakan sistem proteksi komputasi awan terbaik.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await loginUser(form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Kombinasi sandi atau nama pengguna salah."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="left-header-logo">
          <div className="erp-badge">
            <h1>ACCOUNTINGQ</h1>
          </div>
        </div>

        <div className="slider-container">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? "active" : ""}`}
            >
              <h2>{slide.title}</h2>
              <p>{slide.desc}</p>
            </div>
          ))}
        </div>

        <div className="slider-dots">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            ></div>
          ))}
        </div>

        <div className="left-footer">
          © 2026 AccountingQ Indonesia. All Rights Reserved. Securing Connection.
        </div>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Masuk ke Akun</h2>
          <p className="login-subtitle">Silakan masukkan kredensial terdaftar Anda.</p>

          {isSessionExpired && (
            <div className="auth-error">
              Sesi Anda telah berakhir demi keamanan. Silakan login kembali.
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Masukkan username Anda"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Masukkan sandi akses"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Memverifikasi Kredensial..." : "Masuk Aplikasi"}
          </button>

          <p className="auth-footer">
            Belum memiliki lisensi? <Link to="/register">Daftar Sekarang</Link>
          </p>
        </form>
      </div>
    </div>
  );
}