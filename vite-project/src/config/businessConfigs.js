import {
  ChefHat,
  Clock,
  DollarSign,
  FileText,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  Monitor,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Table2,
  TrendingUp,
  Users,
} from "lucide-react";

const overviewApp = {
  id: "overview",
  name: "Dashboard",
  icon: LayoutDashboard,
  accent: "amber",
  basePath: "/home",
  pathPrefixes: ["/home", "/dashboard", "/apps"],
  description: "Today's business view and quick navigation.",
  menu: [
    { label: "Business Home", path: "/home", icon: LayoutDashboard, exact: true },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "All tools", path: "/apps", icon: LayoutGrid, exact: true },
  ],
};

const settingsApp = {
  id: "settings",
  name: "Settings",
  icon: Settings,
  accent: "slate",
  basePath: "/settings",
  pathPrefixes: ["/settings"],
  description: "Business settings, branches, and staff access.",
  permission: "settings.read",
  menu: [
    { label: "Business Settings", path: "/settings", icon: Settings, permission: "settings.read" },
  ],
};

const stockApp = {
  id: "stock",
  name: "Inventory",
  icon: Package,
  accent: "orange",
  basePath: "/inventory",
  pathPrefixes: ["/inventory"],
  description: "Inventory counts, low-stock alerts, and restocking.",
  permission: "inventory.read",
  menu: [
    { label: "Inventory", path: "/inventory", icon: Package, permission: "inventory.read" },
  ],
};

const crmApp = {
  id: "crm",
  name: "CRM",
  icon: Kanban,
  accent: "rose",
  basePath: "/crm",
  pathPrefixes: ["/crm"],
  description: "Lead capture, pipeline, and conversion.",
  permission: "crm.read",
  menu: [
    { label: "Pipeline", path: "/crm", icon: Kanban, exact: true, permission: "crm.read" },
  ],
};

const financeApp = {
  id: "finance",
  name: "Finance",
  icon: DollarSign,
  accent: "emerald",
  basePath: "/invoices",
  pathPrefixes: ["/invoices", "/accounting", "/reports", "/purchases"],
  description: "Invoices, purchases, and business reports.",
  permission: "invoices.read",
  menu: [
    { label: "Invoices", path: "/invoices", icon: FileText, permission: "invoices.read" },
    { label: "New Invoice", path: "/invoices/new", icon: Receipt, permission: "invoices.create" },
    { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
    { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
  ],
};

const generalFinanceApp = {
  id: "accounting",
  name: "Finance",
  icon: DollarSign,
  accent: "emerald",
  basePath: "/accounting",
  pathPrefixes: ["/accounting", "/reports", "/purchases"],
  description: "Expenses, purchases, cash flow, and reports.",
  permission: "accounting.read",
  menu: [
    { label: "Transactions", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
    { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
    { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
  ],
};

const restaurantConfig = [
  overviewApp,
  {
    id: "pos",
    name: "Service",
    icon: Monitor,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Tables, KOT, billing, guests, and shift close.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
      { label: "Tables", path: "/pos/tables", icon: Table2, permission: "pos.tables.read" },
      { label: "Kitchen / KOT", path: "/pos/kds", icon: ChefHat, permission: "pos.kitchen.read" },
      { label: "Menu Items", path: "/pos/products", icon: Package, permission: "pos.products.read" },
      { label: "Customers", path: "/pos/customers", icon: Users, permission: "pos.customers.read" },
      { label: "Shifts", path: "/pos/shifts", icon: Clock, permission: "pos.shifts.read" },
      { label: "Bills", path: "/pos/sales", icon: Receipt, permission: "pos.sales.read" },
    ],
  },
  {
    id: "stock",
    name: "Inventory",
    icon: Package,
    accent: "emerald",
    basePath: "/inventory",
    pathPrefixes: ["/inventory", "/reports", "/purchases"],
    description: "Kitchen stock, supplier buying, and daily reports.",
    permission: "inventory.read",
    menu: [
      { label: "Inventory", path: "/inventory", icon: Package, permission: "inventory.read" },
      { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
      { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
    ],
  },
  settingsApp,
];

const cafeConfig = [
  overviewApp,
  {
    id: "pos",
    name: "Counter",
    icon: Monitor,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Fast orders, menu, regular customers, and shift close.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
      { label: "Menu", path: "/pos/products", icon: Package, permission: "pos.products.read" },
      { label: "Customers", path: "/pos/customers", icon: Users, permission: "pos.customers.read" },
      { label: "Shifts", path: "/pos/shifts", icon: Clock, permission: "pos.shifts.read" },
      { label: "Bills", path: "/pos/sales", icon: Receipt, permission: "pos.sales.read" },
    ],
  },
  {
    id: "stock",
    name: "Inventory",
    icon: Package,
    accent: "emerald",
    basePath: "/inventory",
    pathPrefixes: ["/inventory", "/reports", "/purchases"],
    description: "Ingredients, restocking, and daily reports without office clutter.",
    permission: "inventory.read",
    menu: [
      { label: "Inventory", path: "/inventory", icon: Package, permission: "inventory.read" },
      { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
      { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
    ],
  },
  settingsApp,
];

const shopConfig = [
  overviewApp,
  {
    id: "sales",
    name: "Sales",
    icon: Store,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Checkout, receipts, and sales history.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "New Sale", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
      { label: "Sales History", path: "/pos/sales", icon: Receipt, permission: "pos.sales.read" },
    ],
  },
  {
    id: "products",
    name: "Products",
    icon: Package,
    accent: "orange",
    basePath: "/pos/products",
    pathPrefixes: ["/pos/products"],
    description: "Product catalog, prices, and barcode-ready items.",
    permission: "pos.read",
    menu: [
      { label: "Products", path: "/pos/products", icon: Package, permission: "pos.products.read" },
    ],
  },
  {
    id: "customers",
    name: "Customers",
    icon: Users,
    accent: "rose",
    basePath: "/customers",
    pathPrefixes: ["/customers", "/pos/customers"],
    description: "Customer dues, history, and repeat follow-up.",
    permission: "customers.read",
    menu: [
      { label: "Customer Accounts", path: "/customers", icon: Users, permission: "customers.read" },
    ],
  },
  stockApp,
  financeApp,
  settingsApp,
];

const generalConfig = [
  overviewApp,
  {
    id: "pos",
    name: "POS",
    icon: Monitor,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Billing, tables, kitchen, and shifts.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
      { label: "Tables", path: "/pos/tables", icon: Table2, permission: "pos.tables.read" },
      { label: "Kitchen / KOT", path: "/pos/kds", icon: ChefHat, permission: "pos.kitchen.read" },
      { label: "Products", path: "/pos/products", icon: Package, permission: "pos.products.read" },
      { label: "Customers", path: "/pos/customers", icon: Users, permission: "pos.customers.read" },
      { label: "Bills", path: "/pos/sales", icon: Receipt, permission: "pos.sales.read" },
      { label: "Shifts", path: "/pos/shifts", icon: Clock, permission: "pos.shifts.read" },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    icon: FileText,
    accent: "blue",
    basePath: "/invoices",
    pathPrefixes: ["/customers", "/invoices"],
    description: "Customers, invoices, and collections.",
    menu: [
      { label: "Customers", path: "/customers", icon: Users, permission: "customers.read" },
      { label: "Invoices", path: "/invoices", icon: FileText, permission: "invoices.read" },
      { label: "New Invoice", path: "/invoices/new", icon: Receipt, permission: "invoices.create" },
    ],
  },
  crmApp,
  stockApp,
  generalFinanceApp,
  settingsApp,
];

export const BUSINESS_CONFIGS = {
  restaurant: restaurantConfig,
  cafe: cafeConfig,
  shop: shopConfig,
  general: generalConfig,
};

const dashboardSidebarItem = {
  label: "Dashboard",
  path: "/dashboard",
  icon: LayoutDashboard,
  exact: true,
  activePrefixes: ["/dashboard", "/home"],
};

const BUSINESS_SIDEBAR_SECTIONS = {
  shop: [
    {
      title: "Today",
      items: [
        dashboardSidebarItem,
        { label: "New Sale", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
      ],
    },
    {
      title: "Business",
      items: [
        { label: "Products", path: "/pos/products", icon: Package, permission: "pos.products.read" },
        { label: "Customers", path: "/customers", icon: Users, permission: "customers.read" },
        { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
        { label: "Inventory", path: "/inventory", icon: Package, permission: "inventory.read" },
        { label: "Expenses", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
        { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
      ],
    },
  ],
  cafe: [
    {
      title: "Today",
      items: [
        dashboardSidebarItem,
        { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
      ],
    },
    {
      title: "Business",
      items: [
        { label: "Menu", path: "/pos/products", icon: Package, permission: "pos.products.read" },
        { label: "Customers", path: "/pos/customers", icon: Users, permission: "pos.customers.read" },
        { label: "Expenses", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
        { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
      ],
    },
  ],
  restaurant: [
    {
      title: "Today",
      items: [
        dashboardSidebarItem,
        { label: "Tables", path: "/pos/tables", icon: Table2, permission: "pos.tables.read" },
        { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
        { label: "Kitchen / KOT", path: "/pos/kds", icon: ChefHat, permission: "pos.kitchen.read" },
      ],
    },
    {
      title: "Business",
      items: [
        { label: "Bills", path: "/pos/sales", icon: Receipt, permission: "pos.sales.read" },
        { label: "Customers", path: "/pos/customers", icon: Users, permission: "pos.customers.read" },
        { label: "Inventory", path: "/inventory", icon: Package, permission: "inventory.read" },
        { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
      ],
    },
  ],
  general: [
    {
      title: "Today",
      items: [
        dashboardSidebarItem,
        { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
      ],
    },
    {
      title: "Business",
      items: [
        { label: "Customers", path: "/customers", icon: Users, permission: "customers.read" },
        { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
        { label: "Inventory", path: "/inventory", icon: Package, permission: "inventory.read" },
        { label: "Expenses", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
        { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
      ],
    },
  ],
};

export const BUSINESS_META = {
  restaurant: {
    label: "Restaurant",
    shortLabel: "Restaurant",
    productName: "Restaurant Software",
    workspaceSummary: "Billing, tables, KOT, stock, and daily reports for Nepali restaurants.",
    settingsDescription: "Restaurant setup for tables, kitchen flow, billing, stock, and staff access.",
    launcherDescription: "Open restaurant billing, kitchen, stock, and reports from one simple menu.",
    commandCenterSummary: "Service, kitchen flow, stock, and closing numbers stay easy to follow.",
    statusPill: "Restaurant software",
    spotlightTitle: "Focused for restaurant service",
    spotlightSummary: "Tables, kitchen tickets, guest history, stock, and shift close stay in one package.",
  },
  cafe: {
    label: "Cafe",
    shortLabel: "Cafe",
    productName: "Cafe Software",
    workspaceSummary: "Orders, menu, expenses, and daily reports for Nepali cafes.",
    settingsDescription: "Cafe setup for quick orders, regular customers, expenses, and staff access.",
    launcherDescription: "Open cafe orders, menu, expenses, and reports from one simple menu.",
    commandCenterSummary: "Counter speed, regular customers, expenses, and closing stay easy to scan.",
    statusPill: "Cafe software",
    spotlightTitle: "Focused for cafe counters",
    spotlightSummary: "Menu, regulars, stock, and daily close stay close to the till.",
  },
  shop: {
    label: "Shop",
    shortLabel: "Shop",
    productName: "Shop Software",
    workspaceSummary: "Billing, products, purchases, inventory, and due tracking for Nepali shops.",
    settingsDescription: "Shop setup for checkout, inventory, expenses, reports, and staff access.",
    launcherDescription: "Open shop billing, inventory, purchases, and reports from one simple menu.",
    commandCenterSummary: "Checkout, stock, expenses, and due follow-up stay in one retail flow.",
    statusPill: "Shop software",
    spotlightTitle: "Focused for shop operations",
    spotlightSummary: "Billing, products, invoices, and stock control stay in one package.",
  },
  general: {
    label: "General Business",
    shortLabel: "General",
    productName: "General Business Software",
    workspaceSummary: "General billing, inventory, expenses, and reports for older accounts.",
    settingsDescription: "General package with broader access. Shop, Cafe, or Restaurant gives a cleaner Nepal-first menu.",
    launcherDescription: "Open billing, inventory, expenses, and reports from one general business menu.",
    commandCenterSummary: "This package still spans more areas than the focused Nepal business setups.",
    statusPill: "General software",
    spotlightTitle: "Move this business to a focused setup",
    spotlightSummary: "Restaurant, Cafe, and Shop trim daily work down to the flows Nepali teams actually use.",
  },
};

export const BUSINESS_POS_META = {
  restaurant: {
    dashboardTitle: "Service Dashboard",
    dashboardSummary: "Tables, kitchen flow, sales, and stock stay visible during service.",
    customerTitle: "Guests",
    customerSummary: "Guest history, loyalty, and service notes stay close to the floor.",
    allowTables: true,
    allowKitchen: true,
    orderTypes: ["dine-in", "takeaway", "delivery"],
  },
  cafe: {
    dashboardTitle: "Counter Dashboard",
    dashboardSummary: "Fast checkout, regulars, stock, and shift status stay within one counter view.",
    customerTitle: "Regulars",
    customerSummary: "Repeat guests, loyalty, and quick lookup stay close to the till.",
    allowTables: false,
    allowKitchen: false,
    orderTypes: ["takeaway", "delivery"],
  },
  shop: {
    dashboardTitle: "Sales Dashboard",
    dashboardSummary: "Checkout, products, stock, and repeat customers stay within one retail flow.",
    customerTitle: "Customers",
    customerSummary: "Customer balances, loyalty, and repeat sales stay easy to manage.",
    allowTables: false,
    allowKitchen: false,
    orderTypes: ["takeaway", "delivery"],
  },
  general: {
    dashboardTitle: "Legacy POS Dashboard",
    dashboardSummary: "Billing, reservations, tables, kitchen flow, stock, and shifts still run here until this business is moved to a focused package.",
    customerTitle: "Customers",
    customerSummary: "Customer management, loyalty, and repeat billing stay connected to POS.",
    allowTables: true,
    allowKitchen: true,
    orderTypes: ["dine-in", "takeaway", "delivery"],
  },
};

const WORKSPACE_TOOL_PATHS = ['/notes', '/todos'];
const PATH_REDIRECT_RULES = {
  restaurant: [
    { prefixes: ['/customers'], redirectTo: '/pos/customers' },
    { prefixes: ['/accounting', '/invoices'], redirectTo: '/pos/shifts' },
    { prefixes: ['/crm'], redirectTo: '/dashboard' },
  ],
  cafe: [
    { prefixes: ['/pos/tables', '/pos/kds'], redirectTo: '/pos' },
    { prefixes: ['/customers'], redirectTo: '/pos/customers' },
    { prefixes: ['/accounting', '/invoices'], redirectTo: '/pos/shifts' },
    { prefixes: ['/crm'], redirectTo: '/dashboard' },
  ],
  shop: [
    { prefixes: ['/pos/tables', '/pos/kds'], redirectTo: '/pos' },
    { prefixes: ['/crm'], redirectTo: '/dashboard' },
  ],
};

function findRedirectRule(pathname, businessType) {
  const type = businessType || "general";
  const redirectRules = PATH_REDIRECT_RULES[type] || [];

  return redirectRules.find((rule) =>
    rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
  );
}

export function getAppsForBusiness(businessType) {
  return BUSINESS_CONFIGS[businessType] || generalConfig;
}

export function getBusinessMeta(businessType) {
  return BUSINESS_META[businessType] || BUSINESS_META.general;
}

export function getSidebarSectionsForBusiness(businessType) {
  return BUSINESS_SIDEBAR_SECTIONS[businessType] || BUSINESS_SIDEBAR_SECTIONS.general;
}

export function getBusinessPosMeta(businessType) {
  return BUSINESS_POS_META[businessType] || BUSINESS_POS_META.general;
}

export function getActiveAppForBusiness(pathname, businessType) {
  const apps = getAppsForBusiness(businessType);
  return (
    apps.find((app) =>
      (app.pathPrefixes || []).some((prefix) =>
        prefix === "/"
          ? pathname === "/"
          : pathname === prefix || pathname.startsWith(prefix + "/")
      )
    ) || null
  );
}

export function isPathSupportedForBusiness(pathname, businessType) {
  if (WORKSPACE_TOOL_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return true;
  }

  if (findRedirectRule(pathname, businessType)) {
    return false;
  }

  return getActiveAppForBusiness(pathname, businessType) !== null;
}

export function getRedirectPathForBusiness(pathname, businessType) {
  const redirectRule = findRedirectRule(pathname, businessType);

  if (redirectRule) {
    return redirectRule.redirectTo;
  }

  return "/dashboard";
}

export function isMenuItemActive(item, pathname) {
  if (item.activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return true;
  }
  if (item.exact) return pathname === item.path;
  if (item.path === "/") return pathname === "/";
  return pathname === item.path || pathname.startsWith(item.path + "/");
}
