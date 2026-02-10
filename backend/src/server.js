import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Core routes
import authRouter from "./core/routes/authRoutes.js";
import userRouter from "./core/routes/userRoutes.js";
import auditRouter from "./core/routes/auditRoutes.js";
import orgRouter from "./core/routes/orgRoutes.js";

// Module routes
import notesRouter from "./modules/notes/routes.js";
import todoRouter from "./modules/todos/routes.js";
import transactionRouter from "./modules/accounting/routes.js";
import inventoryRouter from "./modules/inventory/routes.js";
import customerRouter from "./modules/customers/routes.js";
import invoiceRouter from "./modules/invoices/routes.js";
import crmRouter from "./modules/crm/routes.js";
import leadsRouter from "./modules/leads/routes.js";

import { ConnectDB } from "./core/config/db.js";
import { securityMiddleware } from "./core/config/security.js";

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
// Core
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/audit", auditRouter);
app.use("/api/org", orgRouter);

// Modules
app.use("/api/notes", notesRouter);
app.use("/api/todos", todoRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/customers", customerRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/crm", crmRouter);
app.use("/api/leads", leadsRouter);

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
