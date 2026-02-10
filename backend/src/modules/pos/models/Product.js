import mongoose from "mongoose";

const posProductSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      index: true,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    barcode: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQty: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 13, // Nepal VAT 13%
      min: 0,
      max: 100,
    },
    lowStockAlert: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for unique SKU per org
posProductSchema.index(
  { orgId: 1, sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $ne: "" } } }
);
posProductSchema.index(
  { orgId: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $ne: "" } } }
);
posProductSchema.index({ orgId: 1, name: "text" });
posProductSchema.index({ orgId: 1, category: 1 });

const PosProduct = mongoose.model("pos_product", posProductSchema);

export default PosProduct;
