import jwt from "jsonwebtoken";

 const userAuth = async (req,res,next)=>{

const token = req.cookies?.token; //optional chaining to avoid error if cookies is undefined
if(!token){
   return res.status(401).json({success:false,message:"Unauthorized, no token"});
}
try{
  const tokenDecode= jwt.verify(token,process.env.JWT_SECRET); 
   req.user = tokenDecode.id; // attach full user object
   next();
}catch(error){
   console.log("Auth middleware error:", error.message);
   return res.status(401).json({success:false,message:"Unauthorized, no token"});
}
 };
  export default userAuth;