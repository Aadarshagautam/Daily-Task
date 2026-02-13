import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

// Models
import UserModel from "../core/models/User.js";
import OrganizationModel from "../core/models/Organization.js";
import OrgMemberModel from "../core/models/OrgMember.js";
import NoteModel from "../modules/notes/model.js";
import TodoModel from "../modules/todos/model.js";
import CustomerModel from "../modules/customers/model.js";
import InventoryModel from "../modules/inventory/model.js";
import TransactionModel from "../modules/accounting/model.js";
import LeadModel from "../modules/crm/model.js";
import InvoiceModel from "../modules/invoices/model.js";

const DEMO_EMAIL = "demo@thinkboard.app";
const DEMO_PASSWORD = "Demo@1234";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: process.env.DB_NAME || "thinkboard" });
  console.log("Connected to MongoDB");

  // 1. Demo user
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await UserModel.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      username: "Demo User",
      email: DEMO_EMAIL,
      password: hashedPassword,
      isAccountVerified: true,
    },
    { upsert: true, new: true }
  );
  console.log("Demo user ready:", user.email);

  // 2. Organization
  const org = await OrganizationModel.findOneAndUpdate(
    { ownerId: user._id },
    {
      name: "ThinkBoard Demo",
      slug: "thinkboard-demo",
      ownerId: user._id,
      email: DEMO_EMAIL,
      phone: "+91 98765 43210",
      address: {
        street: "123 MG Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        country: "India",
      },
      currency: "INR",
      invoicePrefix: "TB",
    },
    { upsert: true, new: true }
  );

  // Link user to org
  await UserModel.findByIdAndUpdate(user._id, { currentOrgId: org._id });

  // 3. OrgMember
  await OrgMemberModel.findOneAndUpdate(
    { orgId: org._id, userId: user._id },
    { role: "owner", permissions: ["*"], isActive: true },
    { upsert: true }
  );
  console.log("Organization ready:", org.name);

  const uid = user._id;
  const oid = org._id;

  // 4. Notes
  const notes = [
    { title: "Q1 Roadmap", content: "Focus areas:\n- Launch POS module\n- Improve CRM pipeline\n- Add reporting dashboard\n- Mobile responsive design" },
    { title: "Team Meeting Notes", content: "Discussed sprint priorities. Backend team to focus on invoice PDF generation. Frontend to polish Kanban board interactions." },
    { title: "Client Feedback Summary", content: "Clients love the inventory tracking. Request: bulk import via CSV. Low-stock alerts working well." },
    { title: "Marketing Campaign Ideas", content: "1. LinkedIn content series on business tools\n2. Product demo videos\n3. Partner with accounting firms\n4. Free trial campaign" },
    { title: "API Documentation Draft", content: "REST API endpoints:\n- /api/auth/* - Authentication\n- /api/inventory - CRUD for products\n- /api/invoices - Invoice management\n- /api/crm - Lead pipeline" },
  ];
  await NoteModel.deleteMany({ userId: uid, orgId: oid });
  await NoteModel.insertMany(notes.map((n) => ({ ...n, userId: uid, orgId: oid })));
  console.log("Notes seeded:", notes.length);

  // 5. Todos
  const todos = [
    { title: "Review invoice template design", priority: "high", completed: true, category: "Design" },
    { title: "Set up CI/CD pipeline", priority: "high", completed: false, category: "DevOps" },
    { title: "Write unit tests for auth module", priority: "medium", completed: true, category: "Testing" },
    { title: "Update customer import feature", priority: "medium", completed: false, category: "Development" },
    { title: "Prepare demo data for stakeholders", priority: "high", completed: true, category: "Business" },
    { title: "Optimize database queries", priority: "low", completed: false, category: "Performance" },
    { title: "Design mobile navigation", priority: "medium", completed: false, category: "Design" },
    { title: "Add export to CSV for reports", priority: "low", completed: false, category: "Feature" },
  ];
  await TodoModel.deleteMany({ userId: uid, orgId: oid });
  await TodoModel.insertMany(todos.map((t) => ({ ...t, userId: uid, orgId: oid })));
  console.log("Todos seeded:", todos.length);

  // 6. Customers
  const customers = [
    { name: "Priya Electronics", email: "priya@electronics.in", phone: "+91 98765 00001", company: "Priya Electronics Pvt Ltd", address: "45 SP Road, Bangalore" },
    { name: "Sharma Textiles", email: "info@sharmatextiles.com", phone: "+91 98765 00002", company: "Sharma Textiles", address: "12 Gandhi Nagar, Delhi" },
    { name: "Green Valley Farms", email: "contact@greenvalley.in", phone: "+91 98765 00003", company: "Green Valley Organics", address: "78 Farm Road, Pune" },
    { name: "TechFlow Solutions", email: "hello@techflow.io", phone: "+91 98765 00004", company: "TechFlow Solutions", address: "Tower B, Cyber City, Gurugram" },
    { name: "Coastal Traders", email: "sales@coastaltraders.com", phone: "+91 98765 00005", company: "Coastal Traders", address: "Marina Beach Road, Chennai" },
    { name: "Mountain Brew Coffee", email: "orders@mountainbrew.in", phone: "+91 98765 00006", company: "Mountain Brew", address: "15 Mall Road, Shimla" },
  ];
  await CustomerModel.deleteMany({ userId: uid, orgId: oid });
  const insertedCustomers = await CustomerModel.insertMany(customers.map((c) => ({ ...c, userId: uid, orgId: oid })));
  console.log("Customers seeded:", insertedCustomers.length);

  // 7. Inventory
  const products = [
    { productName: "Wireless Mouse", quantity: 45, costPrice: 350, sellingPrice: 599, category: "Electronics", supplier: "TechHub Wholesale", lowStockAlert: 10, vatRate: 18, sku: "EL-001" },
    { productName: "USB-C Cable (1m)", quantity: 120, costPrice: 80, sellingPrice: 149, category: "Accessories", supplier: "TechHub Wholesale", lowStockAlert: 20, vatRate: 18, sku: "AC-001" },
    { productName: "Notebook A5", quantity: 200, costPrice: 25, sellingPrice: 45, category: "Stationery", supplier: "Paper World", lowStockAlert: 50, vatRate: 12, sku: "ST-001" },
    { productName: "Desk Lamp LED", quantity: 8, costPrice: 450, sellingPrice: 899, category: "Electronics", supplier: "LightMart", lowStockAlert: 10, vatRate: 18, sku: "EL-002" },
    { productName: "Office Chair", quantity: 12, costPrice: 3500, sellingPrice: 5999, category: "Furniture", supplier: "FurnishPro", lowStockAlert: 5, vatRate: 18, sku: "FN-001" },
    { productName: "Printer Paper A4 (500)", quantity: 80, costPrice: 180, sellingPrice: 280, category: "Stationery", supplier: "Paper World", lowStockAlert: 15, vatRate: 5, sku: "ST-002" },
    { productName: "Bluetooth Speaker", quantity: 3, costPrice: 800, sellingPrice: 1499, category: "Electronics", supplier: "TechHub Wholesale", lowStockAlert: 5, vatRate: 18, sku: "EL-003" },
    { productName: "Whiteboard Marker Set", quantity: 60, costPrice: 40, sellingPrice: 75, category: "Stationery", supplier: "Paper World", lowStockAlert: 15, vatRate: 12, sku: "ST-003" },
    { productName: "Standing Desk Mat", quantity: 15, costPrice: 600, sellingPrice: 999, category: "Furniture", supplier: "FurnishPro", lowStockAlert: 5, vatRate: 18, sku: "FN-002" },
    { productName: "Webcam HD 1080p", quantity: 22, costPrice: 1200, sellingPrice: 2199, category: "Electronics", supplier: "TechHub Wholesale", lowStockAlert: 5, vatRate: 18, sku: "EL-004" },
  ];
  await InventoryModel.deleteMany({ userId: uid, orgId: oid });
  const insertedProducts = await InventoryModel.insertMany(products.map((p) => ({ ...p, userId: uid, orgId: oid })));
  console.log("Inventory seeded:", insertedProducts.length);

  // 8. Transactions (spread across 30 days)
  const now = new Date();
  const transactions = [
    { type: "income", category: "Sales", amount: 15000, description: "Bulk order - Priya Electronics", paymentMethod: "bank_transfer", date: daysAgo(now, 2) },
    { type: "income", category: "Sales", amount: 8500, description: "Office supplies order", paymentMethod: "card", date: daysAgo(now, 5) },
    { type: "expense", category: "Rent", amount: 25000, description: "Office rent - January", paymentMethod: "bank_transfer", date: daysAgo(now, 1) },
    { type: "income", category: "Services", amount: 12000, description: "Consulting fee - TechFlow", paymentMethod: "bank_transfer", date: daysAgo(now, 7) },
    { type: "expense", category: "Salary", amount: 45000, description: "Staff salary - January", paymentMethod: "bank_transfer", date: daysAgo(now, 3) },
    { type: "expense", category: "Utilities", amount: 3200, description: "Electricity bill", paymentMethod: "card", date: daysAgo(now, 8) },
    { type: "income", category: "Sales", amount: 22000, description: "Furniture order - Green Valley", paymentMethod: "cash", date: daysAgo(now, 10) },
    { type: "expense", category: "Marketing", amount: 5000, description: "Google Ads campaign", paymentMethod: "card", date: daysAgo(now, 12) },
    { type: "income", category: "Sales", amount: 6800, description: "Walk-in customer purchase", paymentMethod: "cash", date: daysAgo(now, 14) },
    { type: "expense", category: "Supplies", amount: 2800, description: "Packaging materials", paymentMethod: "cash", date: daysAgo(now, 15) },
    { type: "income", category: "Other Income", amount: 1500, description: "Interest received", paymentMethod: "bank_transfer", date: daysAgo(now, 18) },
    { type: "expense", category: "Transport", amount: 1200, description: "Delivery charges", paymentMethod: "cash", date: daysAgo(now, 20) },
    { type: "income", category: "Sales", amount: 18500, description: "Monthly subscription - Sharma Textiles", paymentMethod: "bank_transfer", date: daysAgo(now, 22) },
    { type: "expense", category: "Food", amount: 800, description: "Team lunch", paymentMethod: "card", date: daysAgo(now, 25) },
    { type: "income", category: "Sales", amount: 9200, description: "Electronics accessories order", paymentMethod: "card", date: daysAgo(now, 28) },
  ];
  await TransactionModel.deleteMany({ userId: uid, orgId: oid });
  await TransactionModel.insertMany(transactions.map((t) => ({ ...t, userId: uid, orgId: oid })));
  console.log("Transactions seeded:", transactions.length);

  // 9. CRM Leads
  const leads = [
    { name: "Arjun Mehta", email: "arjun@startupx.in", phone: "+91 99887 11001", company: "StartupX", stage: "new", expectedRevenue: 50000, probability: 20, source: "website", priority: "medium" },
    { name: "Neha Gupta", email: "neha@retailhub.com", phone: "+91 99887 11002", company: "RetailHub", stage: "contacted", expectedRevenue: 120000, probability: 40, source: "referral", priority: "high" },
    { name: "Vikram Singh", email: "vikram@cloudops.io", phone: "+91 99887 11003", company: "CloudOps", stage: "qualified", expectedRevenue: 200000, probability: 60, source: "social", priority: "high" },
    { name: "Anita Desai", email: "anita@fashionco.in", phone: "+91 99887 11004", company: "FashionCo", stage: "proposal", expectedRevenue: 80000, probability: 70, source: "email", priority: "medium" },
    { name: "Rajesh Kumar", email: "rajesh@buildmart.com", phone: "+91 99887 11005", company: "BuildMart", stage: "negotiation", expectedRevenue: 350000, probability: 80, source: "cold_call", priority: "urgent" },
    { name: "Sunita Patel", email: "sunita@greentech.in", phone: "+91 99887 11006", company: "GreenTech", stage: "won", expectedRevenue: 150000, probability: 100, source: "referral", priority: "high" },
    { name: "Deepak Joshi", email: "deepak@mediplus.in", phone: "+91 99887 11007", company: "MediPlus", stage: "lost", expectedRevenue: 45000, probability: 0, source: "advertisement", priority: "low" },
    { name: "Kavitha Rao", email: "kavitha@edulearn.com", phone: "+91 99887 11008", company: "EduLearn", stage: "new", expectedRevenue: 75000, probability: 15, source: "website", priority: "medium" },
  ];
  await LeadModel.deleteMany({ userId: uid, orgId: oid });
  await LeadModel.insertMany(leads.map((l) => ({ ...l, userId: uid, orgId: oid })));
  console.log("CRM Leads seeded:", leads.length);

  // 10. Invoices
  const c = insertedCustomers;
  const p = insertedProducts;
  const invoices = [
    {
      invoiceNumber: "INV-0001",
      customerId: c[0]._id, customerName: c[0].name, customerEmail: c[0].email, customerPhone: c[0].phone,
      items: [
        { productId: p[0]._id, productName: p[0].productName, sku: p[0].sku, quantity: 10, unitPrice: 599, vatRate: 18, vatAmount: 1078.2, discountType: "flat", discountValue: 0, discountAmount: 0, lineTotal: 7068.2 },
        { productId: p[1]._id, productName: p[1].productName, sku: p[1].sku, quantity: 20, unitPrice: 149, vatRate: 18, vatAmount: 536.4, discountType: "flat", discountValue: 0, discountAmount: 0, lineTotal: 3516.4 },
      ],
      subtotal: 8970, totalVat: 1614.6, totalItemDiscount: 0, overallDiscountType: "none", overallDiscountValue: 0, overallDiscountAmount: 0, grandTotal: 10584.6,
      status: "paid", issueDate: daysAgo(now, 20), dueDate: daysAgo(now, 5), paidDate: daysAgo(now, 12), paymentMethod: "bank_transfer",
    },
    {
      invoiceNumber: "INV-0002",
      customerId: c[3]._id, customerName: c[3].name, customerEmail: c[3].email, customerPhone: c[3].phone,
      items: [
        { productId: p[9]._id, productName: p[9].productName, sku: p[9].sku, quantity: 5, unitPrice: 2199, vatRate: 18, vatAmount: 1979.1, discountType: "percentage", discountValue: 5, discountAmount: 549.75, discountAmount: 549.75, lineTotal: 12424.35 },
      ],
      subtotal: 10995, totalVat: 1979.1, totalItemDiscount: 549.75, overallDiscountType: "none", overallDiscountValue: 0, overallDiscountAmount: 0, grandTotal: 12424.35,
      status: "sent", issueDate: daysAgo(now, 5), dueDate: daysAgo(now, -10), paymentMethod: "card",
    },
    {
      invoiceNumber: "INV-0003",
      customerId: c[2]._id, customerName: c[2].name, customerEmail: c[2].email, customerPhone: c[2].phone,
      items: [
        { productId: p[4]._id, productName: p[4].productName, sku: p[4].sku, quantity: 2, unitPrice: 5999, vatRate: 18, vatAmount: 2159.64, discountType: "flat", discountValue: 0, discountAmount: 0, lineTotal: 14157.64 },
        { productId: p[8]._id, productName: p[8].productName, sku: p[8].sku, quantity: 2, unitPrice: 999, vatRate: 18, vatAmount: 359.64, discountType: "flat", discountValue: 0, discountAmount: 0, lineTotal: 2357.64 },
      ],
      subtotal: 13996, totalVat: 2519.28, totalItemDiscount: 0, overallDiscountType: "flat", overallDiscountValue: 500, overallDiscountAmount: 500, grandTotal: 16015.28,
      status: "overdue", issueDate: daysAgo(now, 35), dueDate: daysAgo(now, 5), paymentMethod: "bank_transfer",
    },
    {
      invoiceNumber: "INV-0004",
      customerId: c[5]._id, customerName: c[5].name, customerEmail: c[5].email, customerPhone: c[5].phone,
      items: [
        { productId: p[2]._id, productName: p[2].productName, sku: p[2].sku, quantity: 50, unitPrice: 45, vatRate: 12, vatAmount: 270, discountType: "flat", discountValue: 0, discountAmount: 0, lineTotal: 2520 },
        { productId: p[7]._id, productName: p[7].productName, sku: p[7].sku, quantity: 10, unitPrice: 75, vatRate: 12, vatAmount: 90, discountType: "flat", discountValue: 0, discountAmount: 0, lineTotal: 840 },
      ],
      subtotal: 3000, totalVat: 360, totalItemDiscount: 0, overallDiscountType: "none", overallDiscountValue: 0, overallDiscountAmount: 0, grandTotal: 3360,
      status: "draft", issueDate: daysAgo(now, 1), dueDate: daysAgo(now, -14), paymentMethod: "cash",
    },
  ];
  await InvoiceModel.deleteMany({ userId: uid, orgId: oid });
  await InvoiceModel.insertMany(invoices.map((inv) => ({ ...inv, userId: uid, orgId: oid })));
  console.log("Invoices seeded:", invoices.length);

  console.log("\nSeed completed successfully!");
  console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
}

function daysAgo(now, days) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
