/**
 * POS Demo Product Seeder
 *
 * Usage: node src/modules/pos/seed.js
 *
 * Set these env vars (or it uses defaults):
 *   MONGODB_URI   – your mongo connection string
 *   SEED_USER_ID  – the userId who owns the products
 *   SEED_ORG_ID   – (optional) orgId for multi-tenant
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import PosProduct from "./models/Product.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/thinkboard";
const SEED_USER_ID = process.env.SEED_USER_ID;
const SEED_ORG_ID = process.env.SEED_ORG_ID || null;

const demoProducts = [
  { name: "Wai Wai Noodles", sku: "WAI-001", barcode: "8901234567890", category: "Food", costPrice: 18, sellingPrice: 25, stockQty: 200, unit: "pcs", taxRate: 13 },
  { name: "Coca Cola 500ml", sku: "COK-001", barcode: "8901234567891", category: "Beverages", costPrice: 35, sellingPrice: 50, stockQty: 150, unit: "pcs", taxRate: 13 },
  { name: "Basmati Rice 5kg", sku: "RIC-001", barcode: "8901234567892", category: "Grains", costPrice: 450, sellingPrice: 550, stockQty: 80, unit: "pcs", taxRate: 0 },
  { name: "Amul Butter 500g", sku: "BUT-001", barcode: "8901234567893", category: "Dairy", costPrice: 220, sellingPrice: 280, stockQty: 40, unit: "pcs", taxRate: 13 },
  { name: "Dabur Honey 500g", sku: "HON-001", barcode: "8901234567894", category: "Food", costPrice: 280, sellingPrice: 350, stockQty: 30, unit: "pcs", taxRate: 13 },
  { name: "Surf Excel 1kg", sku: "SUR-001", barcode: "8901234567895", category: "Household", costPrice: 150, sellingPrice: 200, stockQty: 60, unit: "pcs", taxRate: 13 },
  { name: "Dettol Soap", sku: "DET-001", barcode: "8901234567896", category: "Personal Care", costPrice: 40, sellingPrice: 55, stockQty: 100, unit: "pcs", taxRate: 13 },
  { name: "Maggi Seasoning", sku: "MAG-001", barcode: "8901234567897", category: "Food", costPrice: 55, sellingPrice: 75, stockQty: 90, unit: "pcs", taxRate: 13 },
  { name: "Pen Pilot V5", sku: "PEN-001", barcode: "8901234567898", category: "Stationery", costPrice: 30, sellingPrice: 45, stockQty: 200, unit: "pcs", taxRate: 13 },
  { name: "A4 Paper Ream", sku: "PAP-001", barcode: "8901234567899", category: "Stationery", costPrice: 380, sellingPrice: 450, stockQty: 25, unit: "pcs", taxRate: 13 },
  { name: "Notebook 200pg", sku: "NTB-001", barcode: "8901234567900", category: "Stationery", costPrice: 80, sellingPrice: 120, stockQty: 60, unit: "pcs", taxRate: 13 },
  { name: "Goldstar Shoes", sku: "GSH-001", barcode: "8901234567901", category: "Footwear", costPrice: 800, sellingPrice: 1200, stockQty: 15, unit: "pair", taxRate: 13 },
  { name: "Tokla Tea 500g", sku: "TEA-001", barcode: "8901234567902", category: "Beverages", costPrice: 180, sellingPrice: 230, stockQty: 50, unit: "pcs", taxRate: 0 },
  { name: "Real Juice 1L", sku: "JUI-001", barcode: "8901234567903", category: "Beverages", costPrice: 90, sellingPrice: 130, stockQty: 70, unit: "pcs", taxRate: 13 },
  { name: "Colgate 200g", sku: "COL-001", barcode: "8901234567904", category: "Personal Care", costPrice: 85, sellingPrice: 110, stockQty: 80, unit: "pcs", taxRate: 13 },
];

async function seed() {
  if (!SEED_USER_ID) {
    console.error("Error: Set SEED_USER_ID env var (MongoDB ObjectId of a user)");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Only add products that don't already exist (by SKU)
  let added = 0;
  for (const p of demoProducts) {
    const exists = await PosProduct.findOne({
      sku: p.sku,
      userId: SEED_USER_ID,
      ...(SEED_ORG_ID ? { orgId: SEED_ORG_ID } : {}),
    });
    if (!exists) {
      await PosProduct.create({
        ...p,
        userId: SEED_USER_ID,
        orgId: SEED_ORG_ID,
      });
      added++;
    }
  }

  console.log(`Seeded ${added} demo products (${demoProducts.length - added} already existed)`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
