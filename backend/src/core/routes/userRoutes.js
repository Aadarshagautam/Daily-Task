import express from "express";
import userAuth from "../middleware/userAuth.js";
import { getUserData } from "../controllers/userController.js";
import { sendVerificationOTP, verifyEmail } from "../controllers/authController.js";

const userRouter = express.Router();

userRouter.get("/data",userAuth,getUserData);
userRouter.post("/send-verify-opt", userAuth, sendVerificationOTP);
userRouter.post("/verify-account", userAuth, verifyEmail);

export default userRouter;
