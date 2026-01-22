import jwt from "jsonwebtoken";



 const userAuth=async (req,res,next)=>{
   try{

const token=req.cookies.token;
if(!token){

   return res.status(401).json({success:false,message:"Unauthorized, no token"});

}

  const tokenDecode= jwt.verify(token,process.env.JWT_SECRET);
  req.userId = tokenDecode.id;

   next();


}catch(error){
   console.log("Auth middleware error:", error.message);
   return res.status(401).json({success:false,message:"Unauthorized, no token"});
}

 };

    export default userAuth;