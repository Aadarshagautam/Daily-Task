import { z } from "zod";

// ─── Product Schemas ───
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  sku: z.string().trim().optional().default(""),
  barcode: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default("General"),
  costPrice: z.number().min(0, "Cost price must be >= 0"),
  sellingPrice: z.number().min(0, "Selling price must be >= 0"),
  stockQty: z.number().int().optional().default(0),
  unit: z.string().trim().optional().default("pcs"),
  taxRate: z.number().min(0).max(100).optional().default(13),
  lowStockAlert: z.number().int().min(0).optional().default(10),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).trim().optional(),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  category: z.string().trim().optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  stockQty: z.number().int().optional(),
  unit: z.string().trim().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── Customer Schemas ───
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").trim(),
  phone: z.string().trim().optional().default(""),
  email: z.string().email().or(z.literal("")).optional().default(""),
  address: z.string().trim().optional().default(""),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().trim().optional(),
  creditBalance: z.number().optional(),
});

// ─── Sale Schemas ───
const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0).optional(), // if omitted, use product's sellingPrice
  discount: z.number().min(0).optional().default(0),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(["cash", "card", "upi", "credit", "mixed"]).optional().default("cash"),
  paidAmount: z.number().min(0).optional(),
  customerId: z.string().optional().nullable().default(null),
  overallDiscount: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(""),
});

// ─── Zod validation helper ───
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message: errors });
    }
    req.validated = result.data;
    next();
  };
}
