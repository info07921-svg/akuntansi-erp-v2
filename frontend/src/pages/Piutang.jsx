import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { FaMoneyBillWave, FaCoins, FaRegCalendarAlt, FaTimes, FaCheck } from "react-icons/fa";
import "../styles/erp.css";

export default function Piutang() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBayar, setShowBayar] = useState(false);
  const [selectedPiutang, setSelectedPiutang] = useState(null);

  const [formBayar, setFormBayar] = useState({
    jumlah_bayar: "",
    metode_pembayaran: "TRANSFER",
    catatan: ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/penjualan/piutang");
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data piutang");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bukaBayar = (row) => {
    setSelectedPiutang(row);
    setFormBayar({
      jumlah_bayar: row.sisa_piutang,
      metode_pembayaran: "TRANSFER",
      catatan: ""
    });
    setShowBayar(true);
  };

  const handleBayar = async (e) => {
    e.preventDefault();
    if (!formBayar.jumlah_bayar || Number(formBayar.jumlah_bayar) <= 0) {
      alert("Jumlah pembayaran harus lebih besar dari 0");
      return;
    }

    try {
      await api.post(`/penjualan/piutang/${selectedPiutang.id}/bayar`, formBayar);
      alert("Pembayaran piutang berhasil disimpan!");
      setShowBayar(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal memproses pembayaran piutang");
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID").format(angka || 0);
  };

  return (
    <div className="page-container">
      {/* HEADER MASTER PIUTANG GLASSMORPHISM */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kartu Piutang Penjualan (Customer)</h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "13px" }}>
            Pemantauan tagihan pelanggan, riwayat pelunasan, dan manajemen batas jatuh tempo kredit.
          </p>
        </div>
      </div>

      {/* TABEL DATA PIUTANG GLASS CONTAINER */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Nama Pelanggan</th>
              <th>Batas Jatuh Tempo</th>
              <th>Rincian Saldo Tagihan (Rp)</th>
              <th>Status</th>
              <th style={{ textAlign: "center", width: "150px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Menyinkronkan rekam kartu piutang...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row) => {
                const sudahDibayar = Number(row.total_piutang) - Number(row.sisa_piutang);
                const isLunas = row.status === "LUNAS";

                return (
                  <tr key={row.id}>
                    <td>
                      <span className="badge-code">{row.invoice || `TRX-#${row.penjualan_id}`}</span>
                      <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Buka: {row.created_at ? new Date(row.created_at).toLocaleDateString("id-ID") : "-"}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--text-main)" }}>
                      {row.nama_customer || "General Customer"}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                        <FaRegCalendarAlt style={{ color: "var(--text-muted)", fontSize: "12px" }} />
                        <span>{row.jatuh_tempo ? new Date(row.jatuh_tempo).toLocaleDateString("id-ID") : "-"}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                        <div style={{ color: "var(--text-main)" }}>
                          Total Piutang: <span style={{ fontWeight: "700" }}>Rp {formatRupiah(row.total_piutang)}</span>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                          Sudah Dibayar: <span style={{ color: "#16a34a", fontWeight: "600" }}>Rp {formatRupiah(sudahDibayar)}</span>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px", borderTop: "1px dashed #cbd5e1", paddingTop: "2px", marginTop: "2px" }}>
                          Sisa Tagihan: <span style={{ color: isLunas ? "#16a34a" : "#dc2626", fontWeight: "700" }}>Rp {formatRupiah(row.sisa_piutang)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={isLunas ? "badge-active" : "text-danger font-semibold"} style={{ fontSize: "12px" }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {!isLunas ? (
                        <button 
                          className="btn-primary" 
                          style={{ padding: "6px 12px", fontSize: "12px", margin: "0 auto" }}
                          onClick={() => bukaBayar(row)}
                        >
                          <FaMoneyBillWave /> Bayar
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>Selesai</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px", fontStyle: "italic" }}>
                  Tidak ada rekaman kartu piutang kredit yang terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DIALOG POP-UP PELUNASAN */}
      {showBayar && selectedPiutang && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "460px" }}>
            <form onSubmit={handleBayar}>
              <div className="modal-header">
                <h2><FaCoins style={{ color: "#0284c7", marginRight: "6px", verticalAlign: "middle" }} /> Form Pelunasan Piutang</h2>
                <button type="button" className="close-btn" onClick={() => setShowBayar(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", fontSize: "13px", color: "var(--text-main)", lineHeight: "1.7", border: "1px solid var(--glass-border)", marginBottom: "16px" }}>
                  <div>Pelanggan: <strong>{selectedPiutang.nama_customer || "General Customer"}</strong></div>
                  <div>No. Invoice: <strong>{selectedPiutang.invoice || `TRX-#${selectedPiutang.penjualan_id}`}</strong></div>
                  <div style={{ borderTop: "1px solid #cbd5e1", marginTop: "6px", paddingTop: "6px" }}>
                    Sisa Tagihan Aktif: <strong style={{ color: "#dc2626" }}>Rp {formatRupiah(selectedPiutang.sisa_piutang)}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Uang Pembayaran (Rp)</label>
                  <input
                    type="number"
                    max={selectedPiutang.sisa_piutang}
                    placeholder="Masukkan jumlah bayar"
                    value={formBayar.jumlah_bayar}
                    onChange={(e) => setFormBayar({ ...formBayar, jumlah_bayar: e.target.value })}
                    required
                  />
                  <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px", fontSize: "11px" }}>
                    Sistem otomatis melunasi dokumen jika diisi penuh sebesar sisa tagihan.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Metode Pembayaran</label>
                  <select
                    value={formBayar.metode_pembayaran}
                    onChange={(e) => setFormBayar({ ...formBayar, metode_pembayaran: e.target.value })}
                  >
                    <option value="TRANSFER">TRANSFER BANK</option>
                    <option value="TUNAI">KAS / TUNAI</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan / Keterangan</label>
                  <textarea
                    rows="3"
                    style={{ width: "100%", padding: "11px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "14px", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    placeholder="Contoh: Pembayaran cicilan ke-2"
                    value={formBayar.catatan}
                    onChange={(e) => setFormBayar({ ...formBayar, catatan: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBayar(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  <FaCheck /> Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}