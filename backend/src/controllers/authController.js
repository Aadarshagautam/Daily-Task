import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";



// Register Controller
export const register= async(req,res)=>{
    const{username, email,password}=req.body;

    if(!username || !email || !password){
        return res.json({success:false,message:"Missing Details"});

    }

    try{
        const existingUser=await UserModel.findOne({email})
        if(existingUser){
            return res.json({success:false,message:"User already exists"});
        }
        const hashedPassword= bcrypt.hashSync(password,10);
        const user=new UserModel({name,email,password:hashedPassword});
        await user.save();
        const token =jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:"7d"});
        res.cookie("token",token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:process.env.NODE_ENV==="production"?"none":"strict",
            maxAge:7*24*60*60*1000, //7 days
        });
      return res.json({success:true});


    }catch(error){
        res.json({success:false,message:error.message});
    }
}
// Login Controller
export const login= async(req,res)=>{
    const{email,password}=req.body;
    if(!email || !password){
        return res.json({success:false,message:" email and password are required"});

    }
    try{
        const user= await UserModel.findOne({email});
        if(!user){
            return res.json({success:false,message:"Invalid credentials"});
        } 
        const isMatch = bcrypt.compareSync(password,user.password);
    if(!isMatch){
        return res.json({success:false,message:"Invalid credentials"});
    }
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({success:true});
    }catch(error){
        res.json({success:false,message:error.message});
    }
};

// Logout Controller
export const logout= async(req,res)=>{
    try{
        res.clearCookie("token",{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:process.env.NODE_ENV==="production"?"none":"strict",
        });
        return res.json({success:true,message:"Logged out successfully"});

    }catch(error){
        res.json({success:false,message:error.message});
   
    };
}
    