import express from "express";
import userAuth from "../middleware/userAuth.js";
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
} from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/", userAuth, getInvoices);
router.get("/stats", userAuth, getInvoiceStats);
router.get("/next-number", userAuth, getNextInvoiceNumber);
router.get("/:id", userAuth, getInvoice);
router.post("/", userAuth, createInvoice);
router.put("/:id", userAuth, updateInvoice);
router.patch("/:id/status", userAuth, updateInvoiceStatus);
router.delete("/:id", userAuth, deleteInvoice);
router.get("/:id/pdf", userAuth, generateInvoicePDF);

export default router;
