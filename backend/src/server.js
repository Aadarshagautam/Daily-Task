import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import notesRoutes from "./routes/notes_routes.js";
import authRoutes from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

import { ConnectDB } from "./config/db.js";
import raterLimiter from "./config/upstash.js";



const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = ['http://localhost:5173'];

ConnectDB(); // connecting to database


app.use( cors({ origin: allowedOrigins,credentials: true,})); // enabling CORS for all origins

// middleware
app.use(express.json()); // this will help to parse json data
app.use(cookieParser());// to parse cookies from request headers
app.use(raterLimiter); // applying rate limit middleware


// routes
app.use("/api/notes", notesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// mongodb+srv://aadarshgautam23_db_user:PIZQfcZcVNCSrSnO@cluster0.kc9whs9.mongodb.net/?appName=Cluster0
