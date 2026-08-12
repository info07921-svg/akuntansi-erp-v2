const express =
  require("express");

const cors =
  require("cors");

require("dotenv").config();

const app =
  express();

app.use(cors());

app.use(express.json());


// ======================
// ROUTES
// ======================

const perusahaanRoutes =
require("./routes/perusahaanRoutes");
const authRoutes =
require("./routes/authRoutes");
const registerRoutes = 
require("./routes/registerRoutes");


const testRoutes =
require("./routes/testRoutes");
const barangRoutes =
require("./routes/barangRoutes");
const kategoriRoutes =
require("./routes/kategoriRoutes");
const supplierRoutes =
require("./routes/supplierRoutes");
const customerRoutes =
require("./routes/customerRoutes");
const penjualanRoutes =
require("./routes/penjualanRoutes");
const barangMasukRoutes =
require("./routes/barangMasukRoutes");
const akuntansiRoutes =
require("./routes/akuntansiRoutes");
const hutangRoutes =
require("./routes/hutangRoutes");
const laporanRoutes =
require("./routes/laporanRoutes");
const akunRoutes = 
require("./routes/akunRoutes");
const jurnalRoutes =
require("./routes/jurnalRoutes");
const dashboardRoutes =
require("./routes/dashboardRoutes");
const exportRoutes =
require("./routes/exportRoutes");
const pajakRoutes =
require("./routes/pajakRoutes");
const kasModalRoutes =
require("./routes/kasModalRoutes");



app.use(
  "/api/perusahaan",
  require("./routes/perusahaanRoutes")
);
app.use("/api/auth", authRoutes);
app.use("/api/auth", registerRoutes);
app.use(
  "/api/test",
  testRoutes
);
app.use(
  "/api/barang",
  barangRoutes
);
app.use(
  "/api/kategori",
  kategoriRoutes
);
app.use(
  "/api/supplier",
  supplierRoutes
);
app.use(
  "/api/customer",
  customerRoutes
);
app.use(
  "/api/penjualan",
  penjualanRoutes
);
app.use(
  "/api/barang-masuk",
  barangMasukRoutes
);
app.use(
  "/api/akuntansi",
  akuntansiRoutes
);
app.use(
  "/api/hutang",
  hutangRoutes
);
app.use(
  "/api/laporan",
  laporanRoutes
);

app.use("/api/akun", akunRoutes);
app.use(
  "/api/jurnal",
  jurnalRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);
app.use(
  "/api/export",
  exportRoutes
);

app.use(
 "/api/pajak",
 pajakRoutes
);

app.use(
 "/api/kas-modal",
 kasModalRoutes
);

// ======================
// TEST API
// ======================

app.get("/",(req,res)=>{

  res.send(
    "ERP API RUNNING"
  );

});


// ======================
// PORT
// ======================

const PORT =
  process.env.PORT || 3000;

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});

app.listen(PORT,()=>{

  console.log(
    `Server running on port ${PORT}`
  );

});