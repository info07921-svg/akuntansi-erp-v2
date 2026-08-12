import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { 
  FaPlus, 
  FaTimes, 
  FaCheck, 
  FaExclamationTriangle, 
  FaMoneyBillWave, 
  FaCoins, 
  FaRegCalendarAlt, 
  FaFileInvoiceDollar 
} from "react-icons/fa";
import "../styles/erp.css";

export default function Hutang() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false); 
  
  const [showForm, setShowForm] = useState(false); 
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    id: "", 
    jumlah_bayar: "",
    metode_pembayaran: "KAS",
    catatan: ""
  });

  const [selectedHutang, setSelectedHutang] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/hutang");
      const dataSistem = Array.isArray(res.data) ? res.data : [];
      setData(dataSistem);
    } catch (err) {
      console.error(err);
      alert("Sistem gagal mengambil daftar master hutang dagang perusahaan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenForm = () => {
    setErrorMsg("");
    setSelectedHutang(null);
    setForm({
      id: "",
      jumlah_bayar: "",
      metode_pembayaran: "KAS",
      catatan: ""
    });
    setShowForm(true);
  };

  const handleInvoiceChange = (e) => {
    const targetId = e.target.value;
    const findHutang = data.find((item) => item.id === Number(targetId));
    
    if (findHutang) {
      setSelectedHutang(findHutang);
      setForm({
        ...form,
        id: targetId,
        jumlah_bayar: findHutang.sisa_hutang
      });
    } else {
      setSelectedHutang(null);
      setForm({ ...form, id: "", jumlah_bayar: "" });
    }
  };

  const handleSubmitTransaksi = async (e) => {
    e.preventDefault();
    if (!form.id) {
      setErrorMsg("Pilihlah salah satu dokumen invoice logistik terlebih dahulu.");
      return;
    }

    if (Number(form.jumlah_bayar) > Number(selectedHutang.sisa_hutang)) {
      setErrorMsg("Nominal pengeluaran dana angsuran melebihi sisa hutang nota.");
      return;
    }

    setSaveLoading(true);
    setErrorMsg("");

    try {
      // Pemformatan tanggal lokal komputer (WIB) murni berformat YYYY-MM-DD
      const targetDate = new Date();
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const day = String(targetDate.getDate()).padStart(2, "0");
      const tanggalLokalHariIni = `${year}-${month}-${day}`;

      const res = await api.post(`/hutang/${form.id}/bayar`, {
        jumlah_bayar: form.jumlah_bayar,
        metode_pembayaran: form.metode_pembayaran,
        catatan: form.catatan,
        tanggal: tanggalLokalHariIni // Dikirimkan agar lolos dari validasi checkPeriode
      });

      if (res.data?.success) {
        alert("Pencatatan angsuran pengeluaran hutang berhasil disimpan ke Buku Besar Jurnal!");
        setShowForm(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || "Gagal memproses data pembayaran hutang.");
    } finally {
      setSaveLoading(false);
    }
  };

  const invoiceAktifList = data.filter((item) => item.status !== "LUNAS");
  const totalSisaKewajiban = data.reduce((acc, curr) => acc + (curr.status !== "LUNAS" ? Number(curr.sisa_hutang) : 0), 0);

  return (
    <div className="page-container">
      {/* HEADER UTAMA HALAMAN */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kelola Hutang Dagang</h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "13px" }}>
            Pantau kewajiban finansial vendor logistik terikat otomatis double-entry jurnal
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={handleOpenForm}>
          <FaPlus /> Bayar Hutang Baru
        </button>
      </div>

      {/* SUMMARY STATS BOX */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "4px 0" }}>
        <div className="table-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ background: "rgba(2, 132, 199, 0.1)", color: "#0284c7", padding: "12px", borderRadius: "10px", display: "flex", alignItems: "center" }}><FaMoneyBillWave size={20} /></div>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Total Sisa Hutang Aktif</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)" }}>Rp {totalSisaKewajiban.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="table-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706", padding: "12px", borderRadius: "10px", display: "flex", alignItems: "center" }}><FaCoins size={20} /></div>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Faktur Belum Lunas</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)" }}>{invoiceAktifList.length} Invoice</span>
          </div>
        </div>
      </div>

      {/* TABEL DATA UTAMA */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden", marginTop: "4px" }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Nama Supplier / Vendor</th>
              <th>Total Hutang</th>
              <th>Sisa Hutang</th>
              <th>Jatuh Tempo</th>
              <th style={{ textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>Sinkronisasi berkas...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "34px", color: "var(--text-muted)", fontStyle: "italic" }}>Tidak ada rekam jejak transaksi kewajiban hutang.</td>
              </tr>
            ) : (
              data.map((row) => {
                const isLunas = row.status === "LUNAS";
                return (
                  <tr key={row.id}>
                    <td><span className="badge-code">{row.invoice || `BM-${row.barang_masuk_id}`}</span></td>
                    <td style={{ fontWeight: "600", color: "var(--text-main)" }}>{row.nama_supplier || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Umum / Cash</span>}</td>
                    <td>Rp {Number(row.total_hutang).toLocaleString("id-ID")}</td>
                    <td style={{ fontWeight: "700", color: isLunas ? "#16a34a" : "#b91c1c" }}>
                      Rp {Number(row.sisa_hutang).toLocaleString("id-ID")}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                        <FaRegCalendarAlt style={{ color: "var(--text-muted)", fontSize: "12px" }} />
                        <span>{row.jatuh_tempo ? new Date(row.jatuh_tempo).toLocaleDateString("id-ID") : "-"}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={isLunas ? "badge-active" : "text-danger font-semibold"} style={{ fontSize: "12px" }}>
                        {isLunas ? "Lunas" : "Belum Lunas"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DIALOG POP-UP PENGELUARAN HUTANG */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "550px" }}>
            
            <div className="modal-header">
              <h2><FaFileInvoiceDollar style={{ color: "#0284c7", marginRight: "4px", verticalAlign: "middle" }} /> Pembayaran Hutang Baru</h2>
              <button type="button" className="close-btn" onClick={() => setShowForm(false)} disabled={saveLoading}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaksi}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {errorMsg && (
                  <div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", padding: "12px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                    <FaExclamationTriangle /> {errorMsg}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Pilih Nota / Invoice Logistik Belum Lunas <span style={{ color: "#dc2626" }}>*</span></label>
                  <select value={form.id} onChange={handleInvoiceChange} required disabled={saveLoading}>
                    <option value="">-- Cari Nomor Dokumen Invoice Pembelian --</option>
                    {invoiceAktifList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.invoice} [{item.nama_supplier || "Vendor Cash"}] - Sisa: Rp {Number(item.sisa_hutang).toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedHutang && (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ background: "#f8fafc", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>
                      DETAIL TUNGGAKAN FAKTUR
                    </div>
                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)" }}>Total Tagihan Logistik Awal:</span>
                        <span style={{ fontWeight: "600", color: "var(--text-main)" }}>Rp {Number(selectedHutang.total_hutang).toLocaleString("id-ID")}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)" }}>Sisa Batas Maksimal Bayar:</span>
                        <span style={{ fontWeight: "700", color: "#b91c1c" }}>Rp {Number(selectedHutang.sisa_hutang).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Jumlah Nominal Pembayaran (Rp) <span style={{ color: "#dc2626" }}>*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Masukkan nilai nominal uang..."
                    value={form.jumlah_bayar}
                    onChange={(e) => setForm({ ...form, jumlah_bayar: e.target.value })}
                    disabled={!form.id || saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Metode Kas / Bank Pengurang Kontra <span style={{ color: "#dc2626" }}>*</span></label>
                  <select
                    value={form.metode_pembayaran}
                    onChange={(e) => setForm({ ...form, metode_pembayaran: e.target.value })}
                    disabled={saveLoading}
                  >
                    <option value="KAS">KAS UTAMA / TUNAI</option>
                    <option value="BANK">BANK UTAMA / TRANSFER INTERNET</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Memo Deskripsi Berita Acara Jurnal</label>
                  <textarea
                    rows="3"
                    style={{ 
                      width: "100%", padding: "11px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", 
                      fontSize: "14px", resize: "none", fontFamily: "inherit", boxSizing: "border-box" 
                    }}
                    placeholder="Contoh: Pelunasan sisa kekurangan dana pembelian nota material..."
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={saveLoading}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={saveLoading || !form.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <FaCheck /> {saveLoading ? "Menyimpan Jurnal..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}