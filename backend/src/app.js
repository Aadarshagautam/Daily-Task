import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./core/routes/authRoutes.js";
import userRouter from "./core/routes/userRoutes.js";
import auditRouter from "./core/routes/auditRoutes.js";
import orgRouter from "./core/routes/orgRoutes.js";
import opsRouter from "./core/routes/opsRoutes.js";
import transactionRouter from "./modules/accounting/routes.js";
import inventoryRouter from "./modules/inventory/routes.js";
import customerRouter from "./modules/customers/routes.js";
import invoiceRouter from "./modules/invoices/routes.js";
import posRouter from "./modules/pos/routes.js";
import purchasesRouter from "./modules/purchases/routes.js";
import { securityMiddleware } from "./core/config/security.js";
import {
  attachRequestContext,
  logRequestLifecycle,
  logUnhandledError,
} from "./core/middleware/observability.js";
import { getHealth, getReadiness } from "./core/controllers/opsController.js";

dotenv.config();

const app = express();
const normalizeEnvValue = (value = "") =>
  String(value)
    .trim()
    .replace(/^['"]|['"]$/g, "");

const nodeEnv = normalizeEnvValue(process.env.NODE_ENV || "development");
const isDevelopment = nodeEnv !== "production";
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => normalizeEnvValue(origin))
  .filter(Boolean);
const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (configuredOrigins.includes("*")) {
      return callback(null, true);
    }

    if (isDevelopment && localhostOriginPattern.test(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error("The CORS policy for this site does not allow access from the specified Origin."),
      false
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Request-Id",
    "X-Client-Session-Id",
  ],
  exposedHeaders: ["Set-Cookie", "X-Request-Id"],
};

app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.options("/*", cors(corsOptions));

app.use(attachRequestContext);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(logRequestLifecycle);

securityMiddleware(app);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/audit", auditRouter);
app.use("/api/org", orgRouter);
app.use("/api/ops", opsRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/customers", customerRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/pos", posRouter);
app.use("/api/purchases", purchasesRouter);

app.get("/health", getHealth);
app.get("/ready", getReadiness);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, _next) => {
  logUnhandledError(err, req, res);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(err.status || 500).json({ success: false, message });
});

export default app;
