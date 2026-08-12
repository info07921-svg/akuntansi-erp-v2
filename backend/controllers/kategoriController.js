const db =
require("../config/database");


// ======================
// GET ALL
// ======================

const getAllKategori =
async (req,res)=>{

  try{

    const [rows] =
    await db.query(

      `
      SELECT *

      FROM kategori_barang

      ORDER BY id DESC
      `

    );

    res.json({
  success: true,
  data: rows
});

  }

  catch(error){

    console.log(error);

    res.status(500)
    .json(error);

  }

};


// ======================
// CREATE
// ======================

const createKategori =
async (req,res)=>{

  try{

    const {

      nama_kategori

    } = req.body;

    await db.query(

      `
      INSERT INTO kategori_barang
      (
        nama_kategori,
        status
      )

      VALUES (?,?)
      `,

      [

        nama_kategori,
        "AKTIF"

      ]

    );

    res.json({

      message:
      "Kategori berhasil ditambahkan"

    });

  }

  catch(error){

    console.log(error);

    res.status(500)
    .json(error);

  }

};


// ======================
// UPDATE
// ======================

const updateKategori =
async (req,res)=>{

  try{

    const id =
    req.params.id;

    const {

      nama_kategori,
      status

    } = req.body;

    await db.query(

      `
      UPDATE kategori_barang

      SET

      nama_kategori = ?,
      status = ?

      WHERE id = ?
      `,

      [

        nama_kategori,
        status,
        id

      ]

    );

    res.json({

      message:
      "Kategori berhasil diupdate"

    });

  }

  catch(error){

    console.log(error);

    res.status(500)
    .json(error);

  }

};


// ======================
// NONAKTIF
// ======================

const deleteKategori =
async (req,res)=>{

  try{

    const id =
    req.params.id;

    await db.query(

      `
      UPDATE kategori_barang

      SET status =
      'NONAKTIF'

      WHERE id = ?
      `,

      [id]

    );

    res.json({

      message:
      "Kategori dinonaktifkan"

    });

  }

  catch(error){

    console.log(error);

    res.status(500)
    .json(error);

  }

};


module.exports = {

  getAllKategori,
  createKategori,
  updateKategori,
  deleteKategori

};