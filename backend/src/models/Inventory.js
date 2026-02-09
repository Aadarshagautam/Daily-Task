import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "",
    },
    supplier: {
      type: String,
      default: "",
    },
    lowStockAlert: {
      type: Number,
      default: 10,
    },
    vatRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
inventorySchema.index({ userId: 1, createdAt: -1 });
inventorySchema.index({ userId: 1, quantity: 1 });

const InventoryModel = mongoose.model("inventory", inventorySchema);

export default InventoryModel;