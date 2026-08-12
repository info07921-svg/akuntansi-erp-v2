import { useEffect, useState } from "react";
import api from "../services/api";
import { FaSave, FaUndo } from "react-icons/fa";
import "../styles/erp.css";

export default function KasModalForm() {
  const [akunList, setAkunList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    tipe: "KAS_MASUK",
    akun_kas_id: "",
    akun_tujuan_id: "",
    nominal: "",
    keterangan: "",
    tanggal: new Date().toISOString().split("T")[0]
  });

  // Memuat data Chart of Accounts (CoA) dari database sesuai perusahaan yang login
  const loadAkunData = async () => {
    try {
      const res = await api.get("/akun");
      setAkunList(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat COA:", err);
      setMsg({ type: "danger", text: "Sistem gagal memuat daftar nomor perkiraan akun." });
    }
  };

  useEffect(() => {
    loadAkunData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setForm({
      tipe: "KAS_MASUK",
      akun_kas_id: "",
      akun_tujuan_id: "",
      nominal: "",
      keterangan: "",
      tanggal: new Date().toISOString().split("T")[0]
    });
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(form.nominal) <= 0) {
      alert("Masukkan nilai nominal transaksi yang valid (Di atas Rp 0).");
      return;
    }

    if (form.akun_kas_id === form.akun_tujuan_id) {
      alert("Kesalahan Jurnal Ganda! Akun Utama (Kiri) dan Akun Lawan Kontra (Kanan) tidak boleh sama.");
      return;
    }

    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await api.post("/kas-modal", form);
      if (res.data.success) {
        setMsg({ type: "success", text: res.data.message });
        setForm({
          ...form,
          akun_kas_id: "",
          akun_tujuan_id: "",
          nominal: "",
          keterangan: ""
        });
      }
    } catch (err) {
      setMsg({ 
        type: "danger", 
        text: err.response?.data?.message || "Koneksi terputus, gagal memposting jurnal keuangan." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Label Dinamis Interaktif Pembimbing Input User (Anti-Terbalik)
  const getLabelAkunUtama = () => {
    if (form.tipe === "MODAL") return "Akun Pihak Pertama / Sumber Asal (Misal: Hutang Usaha / Kas / Bank)";
    if (form.tipe === "KAS_KELUAR") return "Akun Kas / Bank Utama (Sumber Uang Keluar)";
    return "Akun Kas / Bank Utama (Tempat Penampungan Uang Masuk)";
  };

  const getLabelAkunLawan = () => {
    if (form.tipe === "MODAL") return "Akun Pihak Kedua / Tujuan Ekuitas (Pilih Akun Ber-Tipe MODAL)";
    if (form.tipe === "KAS_KELUAR") return "Akun Alokasi Biaya / Pengeluaran (Tipe Beban / Aset)";
    return "Akun Lawan Kontra / Asal Sumber Dana (Kredit)";
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Entri Jurnal Buku Besar (Kas & Modal)</h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Pencatatan multi-transaksi otomatis terhubung langsung ke tabel riwayat detail jurnal akuntansi ERP berdasarkan Perusahaan yang login.
          </p>
        </div>
      </div>

      {/* NOTIFIKASI STATUS BANNER */}
      {msg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "500",
          background: msg.type === "success" ? "#dcfce7" : "#fee2e2",
          color: msg.type === "success" ? "#15803d" : "#b91c1c",
          border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fca5a5"}`
        }}>
          {msg.text}
        </div>
      )}

      {/* CARD BODI UTAMA FORM */}
      <div className="table-card" style={{ padding: "24px", background: "#ffffff" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="form-group">
              <label className="form-label">Klasifikasi Jenis Transaksi</label>
              <select name="tipe" value={form.tipe} onChange={handleChange} required>
                <option value="KAS_MASUK">📥 KAS MASUK (Penerimaan Operasional / Pendapatan / Piutang)</option>
                <option value="KAS_KELUAR">📤 KAS KELUAR (Pengeluaran Kasir / Alokasi Beban Usaha)</option>
                <option value="MODAL">💼 TRANSAKSI EKUITAS (Setoran Modal Baru / Penarikan Prive Pemilik)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Efektif Buku</label>
              <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* DROPDOWN KIRI */}
            <div className="form-group">
              <label className="form-label">{getLabelAkunUtama()} <span style={{ color: "#dc2626" }}>*</span></label>
              <select name="akun_kas_id" value={form.akun_kas_id} onChange={handleChange} required>
                <option value="">-- Pilih Nomor Akun Utama --</option>
                {akunList.map((a) => (
                  <option key={a.id} value={a.id}>[{a.kode_akun}] - {a.nama_akun} ({a.tipe})</option>
                ))}
              </select>
            </div>

            {/* DROPDOWN KANAN */}
            <div className="form-group">
              <label className="form-label">{getLabelAkunLawan()} <span style={{ color: "#dc2626" }}>*</span></label>
              <select name="akun_tujuan_id" value={form.akun_tujuan_id} onChange={handleChange} required>
                <option value="">-- Pilih Nomor Akun Lawan --</option>
                {akunList.map((a) => (
                  <option key={a.id} value={a.id}>[{a.kode_akun}] - {a.nama_akun} ({a.tipe})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Jumlah Nominal Transaksi (Rp) <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="number" name="nominal" placeholder="Contoh: 15000000" value={form.nominal} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Memo / Berita Acara Deskripsi</label>
            <textarea 
              name="keterangan" 
              placeholder="Berikan catatan tambahan mengenai tujuan dilakukannya transaksi ini..." 
              value={form.keterangan} 
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", minHeight: "75px", fontFamily: "inherit", fontSize: "13px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <button type="button" className="btn-secondary" onClick={handleReset} disabled={loading}>
              <FaUndo /> Reset Form
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <FaSave /> {loading ? "Memproses Jurnal..." : "Posting Transaksi"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}