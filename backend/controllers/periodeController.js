exports.tutupPeriode = async (req,res)=>{
 try{

   const { periode } = req.body;

   await db.query(`
      UPDATE periode_akuntansi
      SET status='CLOSED',
      closed_at=NOW()
      WHERE periode=?
   `,[periode]);

   res.json({
      success:true,
      message:"Periode ditutup"
   });

 }catch(err){
   res.status(500).json({
      success:false,
      error:err.message
   });
 }
};