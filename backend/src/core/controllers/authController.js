import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import transporter from "../config/nodemailer.js";
import crypto from "crypto";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE,WELCOME_EMAIL_TEMPLATE } from "../config/emailTemplate.js";
import { sendCreated, sendError, sendSuccess } from "../utils/response.js";



// Register Controller
export const register = async (req, res) => {
    const { username, email, password} = req.body;

    if (!username || !email || !password) {
        return sendError(res, { status: 400, message: "Missing Details" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sendError(res, { status: 400, message: "Invalid email format" });
    }

    if (password.length < 8) {
        return sendError(res, { status: 400, message: "Password must be at least 8 characters" });
    }

    try {
        const exists = await UserModel.findOne({ email })
        if (exists) {
            return sendError(res, { status: 409, message: "User already exists" });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = new UserModel({username, email, password: hashedPassword,isAccountVerified: false, });
        await user.save();

        // Auto-create organization for new user
        const org = new OrganizationModel({
            name: `${username}'s Organization`,
            slug: `${username.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${user._id.toString().slice(-4)}`,
            ownerId: user._id,
            email: email,
        });
        await org.save();

        const member = new OrgMemberModel({
            orgId: org._id,
            userId: user._id,
            role: "owner",
            permissions: ["*"],
        });
        await member.save();

        user.currentOrgId = org._id;
        await user.save();

        const token = jwt.sign({ id: user._id, orgId: org._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
        return sendCreated(res, { orgId: org._id, orgName: org.name }, "Registration successful");


    } catch (error) {
        console.error("Register error:", error);
        return sendError(res, { status: 500, message: "Registration failed" });
    }
}
// Login Controller
export const login = async (req, res) => {
    const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, { status: 400, message: "All fields required" });
  }

  try {
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, { status: 401, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, { status: 401, message: "Invalid credentials" });
    }

    if (!user.currentOrgId) {
      const membership = await OrgMemberModel.findOne({
        userId: user._id,
        isActive: true,
      }).sort({ createdAt: 1 });

      if (membership) {
        user.currentOrgId = membership.orgId;
        await user.save();
      }
    }

    let orgName = null;
    if (user.currentOrgId) {
      const org = await OrganizationModel.findById(user.currentOrgId).select("name");
      orgName = org?.name || null;
    }

    // Generate token with orgId
    const token = jwt.sign(
      { id: user._id, orgId: user.currentOrgId || null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    console.log('Login successful for:', email);

    return sendSuccess(res, {
      message: "Login successful",
      data: { orgId: user.currentOrgId || null, orgName },
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};
// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        return sendSuccess(res, { message: "Logged out successfully" });

    } catch (error) {
        return sendError(res, { status: 500, message: error.message || "Logout failed" });

    };
}

//sendVerificationOTP Controller
export const sendVerificationOTP = async (req, res) => {
    try {
      const userId = req.userId;
      const user = await UserModel.findById(userId);
  
      if (!user) {
        return sendError(res, { status: 404, message: "User not found" });
      }
  
      if (user.isAccountVerified) {
        return sendError(res, { status: 400, message: "Account already verified" });
      }
  
      const otp = String(crypto.randomInt(100000, 999999));
      user.verifyOtp = otp;
      user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

  
      // TODO: Send email with OTP
await transporter.sendMail({
  from: process.env.SENDER_EMAIL,
  to: user.email,
  subject: "Verify Your Email",
  html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp),
});

return sendSuccess(res, { message: "Verification OTP sent to email" });      
      
    } catch (error) {
      console.error("Send verification OTP error:", error);
      return sendError(res, { status: 500, message: "Failed to send OTP" });
    }
  };

// Verify Email Controller
export const verifyEmail = async (req, res) => {
    const { otp } = req.body;
    const userID = req.userId;
    
    if (!userID || !otp) {
        return sendError(res, { status: 400, message: "Missing Details" });
    }
    
    try {
        const user = await UserModel.findById(userID); // ✅ Changed from findById({userID})
        
        if (!user) {
            return sendError(res, { status: 404, message: "User not found" });
        }
        
        if (user.verifyOtp === '' || user.verifyOtp !== otp) { // ✅ Fixed typo: opt to otp
            return sendError(res, { status: 400, message: "Invalid OTP" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return sendError(res, { status: 400, message: "OTP Expired" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return sendSuccess(res, { message: "Email verified successfully" });

    } catch (error) {
        console.error("Verify email error:", error);
        return sendError(res, { status: 500, message: "Verification failed" });
    }
}
// Is Authenticated Controller
export const isAuthenticated = async(req, res)=>{
    try {
        const { token } = req.cookies;
    
        if (!token) {
          return sendError(res, { status: 401, message: "Not authenticated" });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
        if (!decoded || !decoded.id) {
          return sendError(res, { status: 401, message: "Invalid token" });
        }
    
        // Get user data
        const user = await UserModel.findById(decoded.id).select('-password');
    
        if (!user) {
          return sendError(res, { status: 404, message: "User not found" });
        }

        if (!user.currentOrgId) {
          const membership = await OrgMemberModel.findOne({
            userId: user._id,
            isActive: true,
          }).sort({ createdAt: 1 });

          if (membership) {
            user.currentOrgId = membership.orgId;
            await user.save();
          }
        }

        const orgId = user.currentOrgId || null;
        let orgName = null;
        if (orgId) {
          const org = await OrganizationModel.findById(orgId).select("name");
          orgName = org?.name || null;
        }
        const decodedOrgId = decoded.orgId ? decoded.orgId.toString() : null;
        const currentOrgId = orgId ? orgId.toString() : null;

        if (decodedOrgId !== currentOrgId) {
          const refreshedToken = jwt.sign(
            { id: user._id, orgId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || "7d" }
          );

          res.cookie("token", refreshedToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/",
          });
        }
    
        return sendSuccess(res, { 
          data: {
            id: user._id,
            username: user.username,
            email: user.email,
            isAccountVerified: user.isAccountVerified,
            orgId,
            orgName
          }
        });
      } catch (error) {
        console.error("Auth check error:", error);
        return sendError(res, { status: 500, message: "Authentication failed" });
      }
    };

// send password reset OPT controller
export const sendRestopt= async(req,res)=>{
    const{email}= req.body;
    if(!email){
        return sendError(res, { status: 400, message: "Email is required" });
    }
    try {

        const user =await UserModel.findOne({email});
        if(!user){
            return sendError(res, { status: 404, message: "User not found" });
        }
        const otp = String(crypto.randomInt(100000, 999999));
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
        return sendSuccess(res, { message: "Verification OTP sent to your email" });

        
    } catch (error) {
        console.error("Send reset OTP error:", error);
        return sendError(res, { status: 500, message: "Failed to send reset OTP" });
    }
}

// reset password controller
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return sendError(res, { status: 400, message: "Email, OTP, and new password are required" });
    }

    try {
        const user = await UserModel.findOne({ email });

        if (!user) {
            return sendError(res, { status: 404, message: "User not found" });
        }

        // ✅ Check OTP correctly
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return sendError(res, { status: 400, message: "Invalid OTP" });
        }

        // ✅ Check expiry
        if (user.resetOtpExpireAt < Date.now()) {
            return sendError(res, { status: 400, message: "OTP Expired" });
        }

        // ✅ Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // ✅ Clear OTP after use
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save();

        return sendSuccess(res, { message: "Password reset successfully" });

    } catch (error) {
        console.error("Reset password error:", error);
        return sendError(res, { status: 500, message: "Password reset failed" });
    }
};


// forgot Password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return sendError(res, { status: 400, message: "Email is required" });
    }

    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return sendError(res, { status: 404, message: "User not found" });
      }

      const otp = String(crypto.randomInt(100000, 999999));
      user.resetOtp = otp;
      user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      await user.save();

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Reset your password",
        html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email),
      });

      return sendSuccess(res, { message: "Password reset OTP sent to your email" });
    } catch (error) {
      console.error("Forgot password error:", error);
      return sendError(res, { status: 500, message: "Failed to process request" });
    }
  };
  
