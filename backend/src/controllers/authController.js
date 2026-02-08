import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import transporter from "../config/nodemailer.js";
import crypto from "crypto";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE,WELCOME_EMAIL_TEMPLATE } from "../config/emailTemplate.js";



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
            secure: false, 
            sameSite: "lax", 
          //  secure: process.env.NODE_ENV === "production", //for https production
          //  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", //for https production
            maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
        });
        
        //Send welcome email
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Our App!",
            // text: `Welcome to Our App, ${username}! We're glad to have you on board. Your account has been successfully created with email: ${email}.`,
            html:WELCOME_EMAIL_TEMPLATE.replace("{{username}}",username).replace("{{email}}",email)

        }
        await transporter.sendMail(mailOption);
        return res.json({ success: true });


    } catch (error) {
        console.error("Register error:", error); // ✅ Added console.error for debugging
        res.json({ success: false, message: error.message });
    }
}
// Login Controller
export const login = async (req, res) => {
    const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  try {
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    console.log('Login successful for:', email);

    return res.json({ 
      success: true,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Login error:", error);
    res.json({ success: false, message: "Server error" });
  }
};
// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: false, 
            sameSite: "lax", 
          //  secure: process.env.NODE_ENV === "production", //for https production
          //  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", //for https production
        });
        return res.json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        res.json({ success: false, message: error.message });

    };
}

//sendVerificationOTP Controller
export const sendVerificationOTP = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await UserModel.findById(userId);
  
      if (!user) {
        return res.json({ success: false, message: "User not found" });
      }
  
      if (user.isAccountVerified) {
        return res.json({ success: false, message: "Account already verified" });
      }
  
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.verifyOtp = otp;
      user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

  
      // TODO: Send email with OTP
await transporter.sendMail({
  from: process.env.EMAIL,
  to: user.email,
  subject: "Verify Your Email",
  html: EMAIL_VERIFY_TEMPLATE(otp),
});

return res.json({ 
  success: true, 
  message: "Verification OTP sent to email"
});      
      
    } catch (error) {
      console.error("Send verification OTP error:", error);
      return res.json({ success: false, message: "Failed to send OTP" });
    }
  };

// Verify Email Controller
export const verifyEmail = async (req, res) => {
    const { otp } = req.body;
    const userID = req.user; // ✅ Get from req.user, not req.body
    
    if (!userID || !otp) {
        return res.json({ success: false, message: "Missing Details" });
    }
    
    try {
        const user = await UserModel.findById(userID); // ✅ Changed from findById({userID})
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        
        if (user.verifyOtp === '' || user.verifyOtp !== otp) { // ✅ Fixed typo: opt to otp
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Email verified successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}
// Is Authenticated Controller
export const isAuthenticated = async(req, res)=>{
    try {
        const { token } = req.cookies;
    
        if (!token) {
          return res.json({ success: false, message: "Not authenticated" });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
        if (!decoded || !decoded.id) {
          return res.json({ success: false, message: "Invalid token" });
        }
    
        // Get user data
        const user = await UserModel.findById(decoded.id).select('-password');
    
        if (!user) {
          return res.json({ success: false, message: "User not found" });
        }
    
        return res.json({ 
          success: true, 
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isAccountVerified: user.isAccountVerified
          }
        });
      } catch (error) {
        console.error("Auth check error:", error);
        return res.json({ success: false, message: "Authentication failed" });
      }
    };

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
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; //15 minutes
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
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({
            success: false,
            message: "Email, OTP, and new password are required",
        });
    }

    try {
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // ✅ Check OTP correctly
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        // ✅ Check expiry
        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" });
        }

        // ✅ Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // ✅ Clear OTP after use
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


// forgot Password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await UserModel.findOne({ email });
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
  