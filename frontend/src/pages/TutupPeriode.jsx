import { useState } from "react";
import api from "../services/api";

export default function TutupPeriode() {

  const [tanggalTutup, setTanggalTutup] =
    useState("");

  const token =
    localStorage.getItem("token");

  const handleSubmit = async () => {

    try {

      if (!tanggalTutup) {

        alert("Pilih tanggal tutup");

        return;

      }

      await api.post(
        "/akuntansi/tutup-periode",
        {
          tanggal_tutup:
            tanggalTutup
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      alert(
        "Periode berhasil dikunci"
      );

      setTanggalTutup("");

    } catch (err) {

      console.log(err);

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal mengunci periode"
      );

    }

  };

  return (

    <div>

      <h2>
        Tutup Periode Akuntansi
      </h2>

      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center"
        }}
      >

        <input
          type="date"
          value={tanggalTutup}
          onChange={(e) =>
            setTanggalTutup(
              e.target.value
            )
          }
        />

        <button
          onClick={handleSubmit}
        >
          Kunci Periode
        </button>

      </div>

    </div>

  );

}