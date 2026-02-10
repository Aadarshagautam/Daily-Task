import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos_product",
      required: true,
    },
    nameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const posSaleSchema = new mongoose.Schema(
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
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Sale must have at least one item",
      },
    },
    subTotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "credit", "mixed"],
      default: "cash",
    },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos_customer",
      default: null,
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "partial", "due", "refund"],
      default: "paid",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

posSaleSchema.index({ orgId: 1, createdAt: -1 });
posSaleSchema.index({ orgId: 1, status: 1 });
posSaleSchema.index({ orgId: 1, customerId: 1 });
posSaleSchema.index({ invoiceNo: 1 });

const PosSale = mongoose.model("pos_sale", posSaleSchema);

export default PosSale;
