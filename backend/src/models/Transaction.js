import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "other"],
      default: "cash",
    },
  },
  { timestamps: true }
);

// Indexes for better performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });

const TransactionModel = mongoose.model("transaction", transactionSchema);

export default TransactionModel;