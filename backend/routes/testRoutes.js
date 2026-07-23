const express =
require("express");

const router =
express.Router();

const {
  verifyToken
} = require("../middleware/authMiddleware");

// TEST API
router.get(
  "/",
  verifyToken,
  (req, res) => {

    res.json({

      success: true,
      message: "Test route berhasil",
      user: req.user

    });

  }
);

module.exports =
router;