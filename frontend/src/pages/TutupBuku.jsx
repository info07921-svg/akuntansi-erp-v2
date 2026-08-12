import { useEffect, useState } from "react";
import api from "../services/api";

export default function TutupBuku() {

  const [tanggal, setTanggal] =
    useState("");

  const [data, setData] =
    useState([]);

  const fetchData = async () => {

    try {

      const res =
        await api.get(
          "/akuntansi/tutup-buku"
        );

      setData(
        res.data.data || []
      );

    } catch (err) {

      console.error(err);

    }

  };

  const handleSubmit =
    async () => {

      try {

        await api.post(
          "/akuntansi/tutup-buku",
          { tanggal }
        );

        alert(
          "Tutup Buku berhasil"
        );

        fetchData();

      } catch (err) {

  const msg =
    err.response?.data?.message;

  if (
    msg ===
    "Periode sudah ditutup"
  ) {

    alert(
      "Periode ini sudah pernah ditutup."
    );

    return;
  }

  alert(msg);

}

    };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container">

      <h2>Tutup Buku</h2>

      <input
        type="date"
        value={tanggal}
        onChange={(e) =>
          setTanggal(
            e.target.value
          )
        }
      />

      <button
        onClick={handleSubmit}
      >
        Proses Tutup Buku
      </button>

      <table
        border="1"
        cellPadding="8"
        width="100%"
      >

        <thead>

          <tr>
            <th>Tanggal</th>
            <th>Laba Bersih</th>
          </tr>

        </thead>

        <tbody>

          {data.map((item) => (

            <tr key={item.id}>

              <td>
                {new Date(
                  item.tanggal
                ).toLocaleDateString(
                  "id-ID"
                )}
              </td>

              <td align="right">
                {Number(
                  item.laba_bersih
                ).toLocaleString(
                  "id-ID"
                )}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}