import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";

import notesRouter from "./routes/notes_routes.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import todoRouter from "./routes/todoRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import inventoryRouter from "./routes/inventoryRoutes.js";

import { ConnectDB } from "./config/db.js";
import { securityMiddleware } from "./config/security.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Connect Database
ConnectDB();

// Security Middleware
securityMiddleware(app);

// Compression
app.use(compression());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting - Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});

// Routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/user", userRouter);
app.use("/api/todos", todoRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/inventory", inventoryRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({ 
      message: 'Something went wrong',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } else {
    res.status(err.status || 500).json({ 
      message: err.message,
      stack: err.stack
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});