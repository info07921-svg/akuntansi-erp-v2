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

    // ✅ Normalisasi req.user agar id dan perusahaan_id selalu berupa integer
    const userData = decoded.user || decoded;

    req.user = {
      ...decoded,
      id: parseInt(userData.id || userData.user_id || userData.id_user || 1, 10),
      perusahaan_id: parseInt(userData.perusahaan_id || 1, 10)
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