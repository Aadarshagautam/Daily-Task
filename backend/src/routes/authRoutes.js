import express from "express";
import {  register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    sendVerificationOTP,
    isAuthenticated,
    sendRestopt, } from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";

const authRouter = express.Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/send-verify-opt",userAuth,sendVerificationOTP);
authRouter.post("/verify-account",userAuth,verifyEmail);
authRouter.get("/is-auth",userAuth,isAuthenticated); // to check if user is authenticated
authRouter.post("/send-reset-Otp",sendRestopt);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);


export default authRouter;