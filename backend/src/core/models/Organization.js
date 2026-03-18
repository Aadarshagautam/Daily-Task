import mongoose from "mongoose";
import { DEFAULT_COUNTRY, DEFAULT_CURRENCY } from "../utils/nepal.js";
import { PAYMENT_METHOD_VALUES } from "../../shared/payment-methods/constants.js";

const DEFAULT_ORG_PAYMENT_METHODS = Object.freeze([
  {
    key: "cash",
    name: "Cash",
    type: "cash",
    isActive: true,
    isDefault: true,
    description: "Default counter payment for daily billing.",
  },
  {
    key: "esewa",
    name: "eSewa",
    type: "digital",
    isActive: true,
    isDefault: false,
    description: "Popular QR and wallet payments in Nepal.",
  },
  {
    key: "khalti",
    name: "Khalti",
    type: "digital",
    isActive: true,
    isDefault: false,
    description: "Useful for cafes, restaurants, and local digital collections.",
  },
  {
    key: "bank_transfer",
    name: "Bank Transfer",
    type: "bank",
    isActive: true,
    isDefault: false,
    description: "Best for supplier settlements and larger customer bills.",
  },
  {
    key: "credit",
    name: "Due / Credit",
    type: "due",
    isActive: false,
    isDefault: false,
    description: "Enable this when you want to track trusted customers who pay later.",
  },
]);

export const createDefaultOrganizationPaymentMethods = () =>
  DEFAULT_ORG_PAYMENT_METHODS.map((method) => ({ ...method }));

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
      country: { type: String, default: DEFAULT_COUNTRY },
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
    businessType: {
      type: String,
      enum: ["restaurant", "cafe", "shop", "general"],
      default: "general",
    },
    softwarePlan: {
      type: String,
      enum: ["single-branch", "growth", "multi-branch"],
      default: "single-branch",
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
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
      paymentMethods: {
        type: [
          {
            _id: false,
            key: {
              type: String,
              enum: PAYMENT_METHOD_VALUES,
              required: true,
            },
            name: {
              type: String,
              required: true,
              trim: true,
            },
            type: {
              type: String,
              enum: ["cash", "digital", "bank", "due", "card", "other"],
              default: "other",
            },
            isActive: {
              type: Boolean,
              default: true,
            },
            isDefault: {
              type: Boolean,
              default: false,
            },
            description: {
              type: String,
              default: "",
            },
          },
        ],
        default: () => createDefaultOrganizationPaymentMethods(),
      },
    },
  },
  { timestamps: true }
);

organizationSchema.index({ ownerId: 1 });

const OrganizationModel = mongoose.model("organization", organizationSchema);

export default OrganizationModel;
