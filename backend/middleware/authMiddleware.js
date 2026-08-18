const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY_ERP";
const verifyToken = (req, res, next) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan"
      });

    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {

      return res.status(401).json({
        success: false,
        message: "Token tidak valid"
      });

    }

   const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "SECRET_KEY_ERP"
    );

    // Normalisasi req.user agar id dan perusahaan_id selalu berupa integer
    const userData = decoded.user || decoded;

    const rawId = userData.id ?? userData.user_id ?? userData.id_user;
    const rawPerusahaanId = userData.perusahaan_id;

    // PERBAIKAN BUG KEAMANAN SERIUS: sebelumnya jika token tidak membawa id/perusahaan_id
    // (misalnya token rusak/format lama), kode ini diam-diam menganggap user adalah
    // id=1 & perusahaan_id=1. Ini membuka celah kebocoran data lintas-tenant: siapa pun
    // dengan token valid tapi payload tidak lengkap akan otomatis "menjadi" perusahaan #1.
    // Sekarang token yang tidak membawa data wajib tersebut akan ditolak.
    if (rawId === undefined || rawId === null || rawPerusahaanId === undefined || rawPerusahaanId === null) {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid: informasi user/perusahaan tidak lengkap"
      });
    }

    req.user = {
      ...decoded,
      id: parseInt(rawId, 10),
      perusahaan_id: parseInt(rawPerusahaanId, 10)
    };

    next();

  }

  catch (error) {

    console.log(error);

    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });

  }

};

module.exports = {
  verifyToken
};