import { useState, useEffect } from "react";
import { registerUser } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nama_perusahaan: "",
    nama_lengkap: "",
    username: "",
    password: "",
    konfirmasiPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Mulai digitalisasi finansial perusahaan Anda.",
      desc: "Bergabunglah dengan ribuan entitas bisnis yang mempercayakan efisiensi pencatatan jurnal operasional harian bersama kami.",
    },
    {
      title: "Otomasi Laporan Keuangan Instan.",
      desc: "Hasilkan Neraca, Laba Rugi, dan Arus Kas hanya dalam hitungan detik tanpa perlu kompilasi rumus manual.",
    },
    {
      title: "Skalabilitas Bisnis Tanpa Batas.",
      desc: "Sistem siap mendukung ekspansi UMKM hingga level korporasi dengan penyesuaian infrastruktur database multi-cabang.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.konfirmasiPassword) {
      setError("Konfirmasi password tidak cocok dengan password utama.");
      return;
    }

    try {
      setLoading(true);
      await registerUser(form);
      alert("Registrasi database perusahaan berhasil! Silakan masuk.");
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal melakukan registrasi, periksa kembali jaringan data Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* PANEL KIRI - SLIDER */}
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
          © 2026 AccountingQ Indonesia. All Rights Reserved. Secret & Secured Connection.
        </div>
      </div>

      {/* PANEL KANAN - FORM SCROLLABLE */}
      <div className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Registrasi Database</h2>
          <p className="login-subtitle">Lengkapi formulir identitas perusahaan berikut.</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Nama Perusahaan / Organisasi</label>
            <input
              type="text"
              name="nama_perusahaan"
              placeholder="PT / CV / Toko Utama"
              value={form.nama_perusahaan}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap Administrator</label>
            <input
              type="text"
              name="nama_lengkap"
              placeholder="Nama asli sesuai identitas"
              value={form.nama_lengkap}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username Akses</label>
            <input
              type="text"
              name="username"
              placeholder="Buat username unik"
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
              placeholder="Minimal 8 karakter kombinasi"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password</label>
            <input
              type="password"
              name="konfirmasiPassword"
              placeholder="Ketik ulang password"
              value={form.konfirmasiPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Memproses Data..." : "Buat Database Bisnis"}
          </button>

          {/* FITUR KEMBALI KE LOGIN YANG SEBELUMNYA HILANG/TERPOTONG */}
          <p className="auth-footer">
            Sudah memiliki database terdaftar? <Link to="/login">Masuk Aplikasi</Link>
          </p>
        </form>
      </div>
    </div>
  );
}