import dotenv from "dotenv";
dotenv.config();

import express from "express";
import notesRoutes from "./routes/notes_routes.js";
import { ConnectDB } from "./config/db.js";
import raterLimiter from "./config/upstash.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;
ConnectDB();
app.use(
  cors({
    origin: "http://localhost:5173",
  })
); // enabling CORS for all origins

// middleware
app.use(express.json()); // this will help to parse json data
app.use(raterLimiter); // applying rate limit middleware
app.use(cookieParser);
app.use(cors({credentials:true,origin:"http://localhost:5173"}));

// routes
app.use("/api/notes", notesRoutes);
app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// mongodb+srv://aadarshgautam23_db_user:PIZQfcZcVNCSrSnO@cluster0.kc9whs9.mongodb.net/?appName=Cluster0
