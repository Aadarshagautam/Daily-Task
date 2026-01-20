import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import transporter from "../config/nodemailer.js";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplate.js";


// Register Controller
export const register = async (req, res) => {
    const { username, email, password} = req.body;

    if (!username || !email || !password) {
        return res.json({ success: false, message: "Missing Details" });

    }

    try {
        const exists = await UserModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = new UserModel({username, email, password: hashedPassword,isAccountVerified: false, });
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
        });
        
        //Send welcome email
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Our App!",
            text: `Welcome to Our App, ${username}! We're glad to have you on board. Your account has been successfully created with email: ${email}.`,

        }
        await transporter.sendMail(mailOption);
        return res.json({ success: true });


    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
// Login Controller
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.json({ success: false, message: " email and password are required" });

    }
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
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
        return res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });
        return res.json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        res.json({ success: false, message: error.message });

    };
}

//sendVerificationOTP Controller
export const sendVerificationOTP = async (req, res) => {
    try {
        const { userID } = req.body;
        const user = await UserModel.findOne({ userID });
        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" });
        }
        const opt = String(Math.floor(100000 + Math.random() * 1000000));
        user.veriftyOpt = otp;
        user.verifyOptExpireAt = Date.now() + 24 * 60 * 60 * 1000; //24 hours
        await user.save();
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            // text: `Your account verification OTP is ${otp}. It is valid for 24 hours.`, 
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)

        }
        await transporter.sendMail(mailOption);
        return res.json({ success: true, message: "Verification OTP sent to your email" });

    } catch (error) {
        res.json({ success: false, message: error.message });

    }
};

// Verify Email Controller
export const verifyEmail = async (req, res) => {
    const { userID, opt } = req.body;
    if (!userID || !opt) {
        return res.json({ success: false, message: "Missing Details" });

    }
    try {
        const user = await UserModel.findOne({ userID });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        if (user.veriftyOpt === '' || user.veriftyOpt !== opt) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if (user.verifyOptExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" });
        }

        user.isAccountVerified = true;
        user.veriftyOpt = '';
        user.verifyOptExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Email verified successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }



}

// Is Authenticated Controller
export const isAuthenticated = async(req, res)=>{
try {
    return res.json({success:true} );
    
} catch (error) {
    res.json({ success: false, message: error.message });
}
}

// send password reset OPT controller
export const sendRestopt= async(req,res)=>{
    const{email}= req.body;
    if(!email){
        return res.json({success:false, message:"Email is required"});
    }
    try {

        const user =await UserModel.findOne({email});
        if(!user){
            return res.json({success:false, message:"User not found"});
        }
        const opt = String(Math.floor(100000 + Math.random() * 1000000));
        user. resetOpt = otp;
        user.resetOptExpireAt = Date.now() + 15 * 60 * 1000; //15 minutes
        await user.save();
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            // text: `Your account verification OTP is ${otp}. It is valid for 24 hours.`,
            html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)

        }
        await transporter.sendMail(mailOption);
        return res.json({ success: true, message: "Verification OTP sent to your email" });

        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// reset password controller
export const resetPassword=async(req, res)=>{
    const{email,opt,newPassword}=req.body;
    if(!email || !opt || !newPassword){
        return res.json({success:false, message:"Email, OTP, and new password are requied"});
    }

    try {
        const user = await UserModel.findOne({email});
        if(!user){
            return res.json({success:false, message:"User not found"});

        }
        if(user.resetOpt===""|| user.resetOpt !==opt){
            return res.json({success:false, message:"Invalid OTP"});
        }
        if(user.resetOptExpireAt< Date.now()){
            return res.json({success:false, message:"OTP Expired"});
        }
        const hashedPassword= bcrypt.hashSync(newPassword,10);
        user.password= hashedPassword;
        user.resetOpt= '';
        user.resetOptExpireAt=0;
        await user.save();
        return res.json({success:true, message:"Password reset successfully"});
    } catch (error) {
        res.json({ success: false, message: error.message });
        
    }
}

// forgot Password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "User not found" });
  
      const resetToken = crypto.randomBytes(32).toString("hex");
  
      user.resetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
  
      user.resetTokenExpire = Date.now() + 10 * 60 * 1000;
  
      await user.save();
  
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
      await sendEmail(
        user.email,
        "Reset your password",
        `Click here to reset password: ${resetUrl}`
      );
  
      res.json({ message: "Reset email sent" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  