import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  getInvoices,
  getInvoice,
  getInvoiceStats,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoicePDF,
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("invoices.read"), getInvoices);
router.get("/stats", userAuth, permissionMiddleware("invoices.read"), getInvoiceStats);
router.get("/next-number", userAuth, permissionMiddleware("invoices.read"), getNextInvoiceNumber);
router.get("/:id", userAuth, permissionMiddleware("invoices.read"), getInvoice);
router.post("/", userAuth, permissionMiddleware("invoices.create"), createInvoice);
router.put("/:id", userAuth, permissionMiddleware("invoices.update"), updateInvoice);
router.patch("/:id/status", userAuth, permissionMiddleware("invoices.update"), updateInvoiceStatus);
router.delete("/:id", userAuth, permissionMiddleware("invoices.delete"), deleteInvoice);
router.get("/:id/pdf", userAuth, permissionMiddleware("invoices.read"), generateInvoicePDF);

export default router;
