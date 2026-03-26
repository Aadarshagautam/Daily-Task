import {
  BarChart2,
  Building2,
  ChefHat,
  Clock,
  Coffee,
  FileText,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  Table2,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export const staffRoles = [
  {
    key: "manager",
    name: "Manager",
    icon: Building2,
    summary: "Runs daily operations, pricing, team activity, and branch performance.",
  },
  {
    key: "accountant",
    name: "Accountant",
    icon: TrendingUp,
    summary: "Handles purchases, invoices, tax, reconciliations, and reporting.",
  },
  {
    key: "cashier",
    name: "Cashier",
    icon: ShoppingCart,
    summary: "Handles billing, payments, customer lookup, and shift closing.",
  },
];

export const softwareCatalog = [
  {
    slug: "restaurant",
    shortName: "Restaurant",
    title: "Restaurant Software",
    icon: UtensilsCrossed,
    audience: "For dine-in restaurants, food courts, and busy service floors",
    hero: "Focused restaurant dashboard, POS, stock, and accounting for reservations, tables, kitchen flow, billing, and shift close.",
    summary:
      "Run reservations, table service, kitchen tickets, fast billing, prep stock, and daily accounting without generic back-office clutter getting in the way.",
    badge: "Restaurant dashboard + POS",
    gradient: "from-orange-500 to-red-500",
    surface: "bg-orange-50",
    soft: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
    button: "bg-orange-500 hover:bg-orange-600",
    ring: "ring-orange-200",
    downloadFile: "/downloads/restaurant-software-guide.txt",
    launchPath: "/pos",
    advantages: [
      "Reservations, tables, kitchen display, billing, and owner dashboard stay in one operator workflow.",
      "Keeps stock, shift close, and daily accounting nearby without extra back-office noise.",
      "Ready for one branch or multiple branches with role-based access.",
    ],
    modules: [
      { icon: Table2, title: "Restaurant dashboard", description: "See service pace, tables, and key owner numbers in one place." },
      { icon: ChefHat, title: "Kitchen display", description: "Send live tickets to the kitchen and track progress." },
      { icon: ShoppingCart, title: "Fast billing", description: "Close dine-in, takeaway, and delivery orders quickly." },
      { icon: Package, title: "Prep stock", description: "Track ingredients, low stock, and buying needs." },
      { icon: Clock, title: "Accounting and day close", description: "Review cash, expenses, and closing totals before sign-off." },
    ],
    roleHighlights: {
      manager: [
        "Watch floor load and kitchen speed",
        "Approve discounts and review branch sales",
        "Track branch performance without extra apps",
      ],
      accountant: [
        "Review supplier bills and daily summaries",
        "Monitor food cost and branch reports",
        "Close the day without a heavy accounting screen",
      ],
      cashier: [
        "Open bills fast and collect payments",
        "Move between dine-in and takeaway smoothly",
        "Open and close shifts with cash count",
      ],
    },
    branchHighlights: [
      "Keep one focused restaurant workflow across branches.",
      "Assign branch managers, accountants, and cashiers with clean access rules.",
      "Compare daily sales, stock, and service performance by branch.",
    ],
    licenseOptions: [
      {
        planKey: "single-branch",
        name: "Starter Floor",
        note: "One restaurant location",
        points: ["Tables and billing", "Kitchen display", "Shift close"],
      },
      {
        planKey: "growth",
        name: "Service Control",
        note: "One branch with stock and reporting",
        points: ["Prep stock and purchases", "Reservations", "Daily reports"],
        recommended: true,
      },
      {
        planKey: "multi-branch",
        name: "Group Control",
        note: "For restaurant chains",
        points: ["Central branch view", "Role assignment by branch", "Cross-branch reporting"],
      },
    ],
  },
  {
    slug: "cafe",
    shortName: "Cafe",
    title: "Cafe Software",
    icon: Coffee,
    audience: "For cafes, bakeries, coffee bars, and quick counter service",
    hero: "Focused cafe dashboard, counter POS, stock, and accounting for quick checkout, regulars, and shift close.",
    summary:
      "Keep counter billing fast and simple. Show only the screens a cafe needs: dashboard, menu, regulars, stock, and daily accounting.",
    badge: "Cafe dashboard + POS",
    gradient: "from-teal-500 to-cyan-500",
    surface: "bg-teal-50",
    soft: "bg-teal-100 text-teal-700",
    border: "border-teal-200",
    button: "bg-teal-500 hover:bg-teal-600",
    ring: "ring-teal-200",
    downloadFile: "/downloads/cafe-software-guide.txt",
    launchPath: "/pos",
    advantages: [
      "Counter-first design keeps checkout quick during rush hours while the owner dashboard stays easy to read.",
      "Regular customer tracking stays simple instead of turning into a sales pipeline tool.",
      "Daily stock, supplier buying, and accounting stay nearby without restaurant-only screens.",
    ],
    modules: [
      { icon: ShoppingCart, title: "Counter dashboard", description: "See sales pace, rush periods, and owner totals in one place." },
      { icon: Users, title: "Regulars", description: "Track repeat guests and simple loyalty balances." },
      { icon: FileText, title: "Menu setup", description: "Manage drinks, snacks, combos, and prices." },
      { icon: Package, title: "Daily stock", description: "Watch ingredients and consumables with low-stock alerts." },
      { icon: Clock, title: "Accounting and shift close", description: "Handle cashier opening, closing, expenses, and handover." },
    ],
    roleHighlights: {
      manager: [
        "Track rush-hour speed and top sellers",
        "Adjust pricing and watch repeat guest activity",
        "Compare branch performance without extra clutter",
      ],
      accountant: [
        "Review daily totals and supplier buying",
        "Track tax summaries and purchase reports",
        "Reconcile closing totals branch by branch",
      ],
      cashier: [
        "Bill quickly and apply regular-customer rewards",
        "Find customer profiles without slowing the queue",
        "Handle shift open and close cleanly",
      ],
    },
    branchHighlights: [
      "Keep each branch on the same fast counter workflow.",
      "Assign separate cashiers, managers, and accountants by branch.",
      "Compare sales, top items, and repeat visits by branch.",
    ],
    licenseOptions: [
      {
        planKey: "single-branch",
        name: "Counter",
        note: "One cafe branch",
        points: ["Fast billing", "Regular customer profiles", "Shift close"],
      },
      {
        planKey: "growth",
        name: "Daily Control",
        note: "One branch with stock and reports",
        points: ["Daily stock", "Purchases", "Branch reports"],
        recommended: true,
      },
      {
        planKey: "multi-branch",
        name: "Cafe Chain",
        note: "Multiple cafe locations",
        points: ["Branch dashboard", "Shared standards", "Central reporting"],
      },
    ],
  },
  {
    slug: "shop",
    shortName: "Retail",
    title: "Retail Shop Software",
    icon: Store,
    audience: "For retail shops, mini marts, wholesalers, and general stores",
    hero: "Focused retail dashboard, POS, stock, invoices, and accounting for growing stores.",
    summary:
      "Handle barcode-ready checkout, stock, invoices, customer balances, and day-to-day accounting in one retail control center.",
    badge: "Retail dashboard + POS",
    gradient: "from-indigo-500 to-blue-500",
    surface: "bg-indigo-50",
    soft: "bg-indigo-100 text-indigo-700",
    border: "border-indigo-200",
    button: "bg-indigo-500 hover:bg-indigo-600",
    ring: "ring-indigo-200",
    downloadFile: "/downloads/shop-software-guide.txt",
    launchPath: "/pos",
    advantages: [
      "Built around products, stock, invoices, customer balances, and a clear owner dashboard.",
      "Keeps supplier buying, accounting, and stock in one flow built for retail teams.",
      "Supports branch stores with clean cashier, manager, and accountant access.",
    ],
    modules: [
      { icon: ShoppingCart, title: "Retail dashboard", description: "See sales pace, collections, and stock signals in one place." },
      { icon: Package, title: "Product catalog", description: "Manage items, prices, and barcode-ready products." },
      { icon: BarChart2, title: "Stock counts", description: "Track stock movement, low stock, and replenishment." },
      { icon: Receipt, title: "Invoices and dues", description: "Issue invoices and follow unpaid customer balances." },
      { icon: TrendingUp, title: "Accounting and day close", description: "Review purchases, cash flow, customer due, and daily totals." },
    ],
    roleHighlights: {
      manager: [
        "Watch sales and stock turnover",
        "Approve discounts and stock adjustments",
        "Track branch performance and customer dues",
      ],
      accountant: [
        "Handle invoices, supplier buying, and payment follow-up",
        "Track receivables, expenses, and tax summaries",
        "Review reports without extra CRM tools",
      ],
      cashier: [
        "Scan or select items for billing",
        "Handle receipts and customer payments",
        "Close the counter with daily totals",
      ],
    },
    branchHighlights: [
      "Run multiple shop branches under one account.",
      "Assign branch-level users for billing, finance, and stock control.",
      "View stock, invoices, and sales per branch or across the business.",
    ],
    licenseOptions: [
      {
        planKey: "single-branch",
        name: "Starter Store",
        note: "One branch retail shop",
        points: ["Retail checkout", "Products and stock", "Customer accounts"],
      },
      {
        planKey: "growth",
        name: "Store Control",
        note: "One branch with invoices and supplier buying",
        points: ["Invoices and dues", "Supplier buying", "Business reports"],
        recommended: true,
      },
      {
        planKey: "multi-branch",
        name: "Branch Network",
        note: "For multiple stores",
        points: ["Branch users", "Central stock view", "Group reporting"],
      },
    ],
  },
];

export const softwareBySlug = Object.fromEntries(
  softwareCatalog.map((product) => [product.slug, product])
);

export function getSoftwareSignupPath(slug, planKey = "growth") {
  const params = new URLSearchParams({
    mode: "signup",
    software: slug,
    plan: planKey,
  });

  return `/login?${params.toString()}`;
}
