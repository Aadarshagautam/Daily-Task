import mongoose from "mongoose";

const posCustomerSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

posCustomerSchema.index(
  { orgId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $ne: "" } } }
);
posCustomerSchema.index({ orgId: 1, name: "text" });

const PosCustomer = mongoose.model("pos_customer", posCustomerSchema);

export default PosCustomer;
