import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import notesRouter from "./routes/notes_routes.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import todoRouter from "./routes/todoRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import inventoryRouter from "./routes/inventoryRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";

import { ConnectDB } from "./config/db.js";
import { securityMiddleware } from "./config/security.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Connect Database
ConnectDB();

// ============================================
// CORS Configuration (IMPORTANT!)
// ============================================
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests
app.options('/*', cors());

// ============================================
// Middleware
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security middleware (Helmet, XSS, NoSQL injection, HPP)
securityMiddleware(app);

// ============================================
// Routes
// ============================================
app.use("/api/notes", notesRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/todos", todoRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/customers", customerRouter);
app.use("/api/invoices", invoiceRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
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
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';
  res.status(err.status || 500).json({ success: false, message });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});