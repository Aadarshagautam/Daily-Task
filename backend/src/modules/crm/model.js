import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    stage: {
      type: String,
      enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
      default: "new",
    },
    stageOrder: {
      type: Number,
      default: 0,
    },
    expectedRevenue: {
      type: Number,
      default: 0,
    },
    probability: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      enum: ["website", "referral", "social", "email", "cold_call", "advertisement", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    nextFollowUp: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
      default: null,
    },
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

const LeadModel = mongoose.model("lead", leadSchema);

export default LeadModel;
