import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    logo: {
      type: String,
      default: "",
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    gstin: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "INR",
    },
    financialYearStart: {
      type: Number,
      default: 4, // April
    },
    invoicePrefix: {
      type: String,
      default: "INV",
    },
    settings: {
      enabledModules: {
        type: [String],
        default: [
          "notes",
          "todos",
          "accounting",
          "inventory",
          "customers",
          "invoices",
          "purchases",
          "reports",
          "crm",
        ],
      },
    },
  },
  { timestamps: true }
);

organizationSchema.index({ ownerId: 1 });

const OrganizationModel = mongoose.model("organization", organizationSchema);

export default OrganizationModel;
