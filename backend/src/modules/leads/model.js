import mongoose from "mongoose";

const noteSubSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["website", "referral", "social", "email", "cold_call", "advertisement", "other"],
      default: "other",
    },
    stage: {
      type: String,
      enum: ["new", "qualified", "proposal", "won", "lost"],
      default: "new",
    },
    expectedRevenue: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    notes: [noteSubSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      index: true,
      default: null,
    },
  },
  { timestamps: true }
);

leadSchema.index({ orgId: 1, stage: 1 });
leadSchema.index({ userId: 1 });

const CrmLeadModel = mongoose.model("CrmLead", leadSchema);

export default CrmLeadModel;
