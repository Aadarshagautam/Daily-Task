import jwt from "jsonwebtoken";

 const userAuth = async (req, res, next)=>{
console.log("userAuth middleware called");
const token = req.cookies?.token; //optional chaining to avoid error if cookies is undefined
if(!token){
   return res.status(401).json({success:false,message:"Unauthorized, no token"});
}
try{
  const decoded= jwt.verify(token, process.env.JWT_SECRET); 
   req.user = decoded.id; // attach full user object
   next();
}catch(error){
   return res.status(401).json({success:false,message:"Unauthorized, no token"});
}
 };
  export default userAuth;