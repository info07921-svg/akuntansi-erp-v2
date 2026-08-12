const express =
require("express");

const router =
express.Router();

const {
  login
} = require(
  "../controllers/authController"
);

const {
  verifyToken
} = require("../middleware/authMiddleware");

// ======================
// LOGIN
// ======================

router.post(
  "/login",
  login
);

// ======================
// GET LOGIN USER
// ======================

router.get(

  "/me",

  verifyToken,

  async (req,res)=>{

    try{

      res.json({

        success:true,

        user:req.user

      });

    }catch(err){

      console.log(err);

      res.status(500)
      .json({

        success:false,

        error:
        "Server error"

      });

    }

  }

);

module.exports =
router;