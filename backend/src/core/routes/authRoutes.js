import express from "express";
import { 
     register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    sendVerificationOTP,
    isAuthenticated,
    sendRestopt, } from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";
import rateLimiter from "../middleware/rateLimiter.js";


const authRouter = express.Router();

authRouter.post("/register", rateLimiter, register);
authRouter.post("/login", rateLimiter, login);
authRouter.post("/logout", logout);
authRouter.post("/send-verify-opt", userAuth, sendVerificationOTP);
authRouter.post("/verify-account", userAuth, verifyEmail);
authRouter.get("/is-auth", userAuth, isAuthenticated);
authRouter.post("/send-reset-Otp", rateLimiter, sendRestopt);
authRouter.post("/forgot-password", rateLimiter, forgotPassword);
authRouter.post("/reset-password", rateLimiter, resetPassword);


export default authRouter;