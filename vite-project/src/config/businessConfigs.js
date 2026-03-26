import {
  ChefHat,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
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
  basePath: "/dashboard",
  pathPrefixes: ["/dashboard"],
  description: "Today's business view and quick navigation.",
  menu: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
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
  name: "Stock",
  icon: Package,
  accent: "orange",
  basePath: "/inventory",
  pathPrefixes: ["/inventory"],
  description: "Stock counts, low-stock alerts, and restocking.",
  permission: "inventory.read",
  menu: [
    { label: "Stock", path: "/inventory", icon: Package, permission: "inventory.read" },
  ],
};

const financeApp = {
  id: "finance",
  name: "Accounting",
  icon: DollarSign,
  accent: "emerald",
  basePath: "/invoices",
  pathPrefixes: ["/invoices", "/accounting", "/reports", "/purchases"],
  description: "Accounting, invoices, purchases, and collections.",
  permission: "invoices.read",
  menu: [
    { label: "Accounting", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
    { label: "Invoices", path: "/invoices", icon: FileText, permission: "invoices.read" },
    { label: "New Invoice", path: "/invoices/new", icon: Receipt, permission: "invoices.create" },
    { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
  ],
};

const generalFinanceApp = {
  id: "accounting",
  name: "Accounting",
  icon: DollarSign,
  accent: "emerald",
  basePath: "/accounting",
  pathPrefixes: ["/accounting", "/reports", "/purchases"],
  description: "Accounting, purchases, cash flow, and daily review.",
  permission: "accounting.read",
  menu: [
    { label: "Accounting", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
    { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
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
    name: "Stock",
    icon: Package,
    accent: "emerald",
    basePath: "/inventory",
    pathPrefixes: ["/inventory", "/reports", "/purchases"],
    description: "Kitchen stock and supplier buying without extra office clutter.",
    permission: "inventory.read",
    menu: [
      { label: "Stock", path: "/inventory", icon: Package, permission: "inventory.read" },
      { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
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
    name: "Stock",
    icon: Package,
    accent: "emerald",
    basePath: "/inventory",
    pathPrefixes: ["/inventory", "/reports", "/purchases"],
    description: "Ingredients, restocking, and daily stock control.",
    permission: "inventory.read",
    menu: [
      { label: "Stock", path: "/inventory", icon: Package, permission: "inventory.read" },
      { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
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
    description: "Retail checkout, receipts, and sales history.",
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
    description: "Retail catalog, prices, and barcode-ready items.",
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
    description: "Customer dues, history, and repeat-sale follow-up.",
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
  stockApp,
  generalFinanceApp,
  settingsApp,
];

const SUPPORTED_BUSINESS_TYPES = ["restaurant", "cafe", "shop"];

export function normalizeBusinessType(value) {
  return SUPPORTED_BUSINESS_TYPES.includes(value) ? value : "shop";
}

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
  activePrefixes: ["/dashboard"],
};

const posDashboardSidebarItem = {
  label: "POS Dashboard",
  path: "/pos",
  icon: Monitor,
  exact: true,
  permission: "pos.read",
};

const BUSINESS_SIDEBAR_SECTIONS = {
  shop: [
    {
      title: "Core",
      items: [
        dashboardSidebarItem,
        posDashboardSidebarItem,
        { label: "New Sale", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
        { label: "Stock", path: "/inventory", icon: Package, permission: "inventory.read" },
        { label: "Accounting", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
        { label: "Day Close", path: "/pos/shifts", icon: Receipt, permission: "pos.shifts.read" },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Products", path: "/pos/products", icon: Package, permission: "pos.products.read" },
        { label: "Customer Due", path: "/customers", icon: Users, permission: "customers.read" },
        { label: "Supplier Buying", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
      ],
    },
  ],
  cafe: [
    {
      title: "Core",
      items: [
        dashboardSidebarItem,
        posDashboardSidebarItem,
        { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
        { label: "Stock", path: "/inventory", icon: Package, permission: "inventory.read" },
        { label: "Accounting", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
        { label: "Day Close", path: "/pos/shifts", icon: Receipt, permission: "pos.shifts.read" },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Menu", path: "/pos/products", icon: Package, permission: "pos.products.read" },
        { label: "Regulars", path: "/pos/customers", icon: Users, permission: "pos.customers.read" },
      ],
    },
  ],
  restaurant: [
    {
      title: "Core",
      items: [
        dashboardSidebarItem,
        posDashboardSidebarItem,
        { label: "Tables", path: "/pos/tables", icon: Table2, permission: "pos.tables.read" },
        { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
        { label: "Stock", path: "/inventory", icon: Package, permission: "inventory.read" },
        { label: "Accounting", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
        { label: "Day Close", path: "/pos/shifts", icon: Receipt, permission: "pos.shifts.read" },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Kitchen / KOT", path: "/pos/kds", icon: ChefHat, permission: "pos.kitchen.read" },
        { label: "Bills", path: "/pos/sales", icon: Receipt, permission: "pos.sales.read" },
        { label: "Guests", path: "/pos/customers", icon: Users, permission: "pos.customers.read" },
      ],
    },
  ],
  general: [
    {
      title: "Core",
      items: [
        dashboardSidebarItem,
        posDashboardSidebarItem,
        { label: "New Order", path: "/pos/billing", icon: ShoppingCart, permission: "pos.sales.create" },
        { label: "Stock", path: "/inventory", icon: Package, permission: "inventory.read" },
        { label: "Accounting", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
        { label: "Day Close", path: "/pos/shifts", icon: Receipt, permission: "pos.shifts.read" },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Customer Due", path: "/customers", icon: Users, permission: "customers.read" },
        { label: "Invoices", path: "/invoices", icon: FileText, permission: "invoices.read" },
        { label: "Supplier Buying", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
      ],
    },
  ],
};

export const BUSINESS_META = {
  restaurant: {
    label: "Restaurant",
    shortLabel: "Restaurant",
    productName: "Restaurant Software",
    workspaceSummary: "Billing, tables, KOT, stock, accounting, and day close for Nepali restaurants.",
    settingsDescription: "Restaurant setup for tables, kitchen flow, billing, stock, day close, and staff access.",
    launcherDescription: "Open restaurant billing, kitchen, stock, accounting, and day close from one simple menu.",
    commandCenterSummary: "Service, kitchen flow, stock, cash, and day close stay easy to follow.",
    statusPill: "Restaurant software",
    spotlightTitle: "Focused for restaurant service",
    spotlightSummary: "Tables, kitchen tickets, guest history, stock, and shift close stay in one package.",
  },
  cafe: {
    label: "Cafe",
    shortLabel: "Cafe",
    productName: "Cafe Software",
    workspaceSummary: "Orders, menu, stock, accounting, and day close for Nepali cafes.",
    settingsDescription: "Cafe setup for quick orders, regular customers, payments, day close, and staff access.",
    launcherDescription: "Open cafe orders, regulars, stock, accounting, and day close from one simple menu.",
    commandCenterSummary: "Counter speed, regular customers, stock, and day close stay easy to scan.",
    statusPill: "Cafe software",
    spotlightTitle: "Focused for cafe counters",
    spotlightSummary: "Menu, regulars, stock, and daily close stay close to the till.",
  },
  shop: {
    label: "Retail Shop",
    shortLabel: "Retail",
    productName: "Retail Shop Software",
    workspaceSummary: "Dashboard, POS, stock, customer due, accounting, and day close for retail shops.",
    settingsDescription: "Retail shop setup for checkout, barcode-ready catalog, stock, accounting, day close, and staff access.",
    launcherDescription: "Open the retail dashboard, POS, stock, customer due, accounting, and day close from one simple menu.",
    commandCenterSummary: "Checkout, stock, buying, dues, cash, and day close stay in one retail control center.",
    statusPill: "Retail shop software",
    spotlightTitle: "Focused for retail operations",
    spotlightSummary: "Dashboard, retail POS, inventory, accounting, invoices, and customer balances stay in one package.",
  },
  general: {
    label: "General Business",
    shortLabel: "General",
    productName: "General Business Software",
    workspaceSummary: "General billing, stock, accounting, and day close for older accounts.",
    settingsDescription: "General package with broader access. Retail Shop, Cafe, or Restaurant gives a cleaner Nepal-first menu.",
    launcherDescription: "Open billing, stock, accounting, and day close from one general business menu.",
    commandCenterSummary: "This package still spans more areas than the focused Nepal business setups.",
    statusPill: "General software",
    spotlightTitle: "Move this business to a focused setup",
    spotlightSummary: "Restaurant, Cafe, and Retail Shop trim daily work down to the flows teams actually use.",
  },
};

export const BUSINESS_POS_META = {
  restaurant: {
    dashboardTitle: "Service Dashboard",
    dashboardSummary: "Tables, kitchen flow, sales, and stock stay visible during service.",
    controlLabel: "Restaurant POS",
    customerTitle: "Guests",
    customerSummary: "Guest history, loyalty, and service notes stay close to the floor.",
    allowTables: true,
    allowKitchen: true,
    orderTypes: ["dine-in", "takeaway", "delivery"],
    quickSaleLabel: "New Order",
    trendTitle: "Watch covers, bills, and rush patterns together.",
    trendDescription: "This board helps owners and floor managers spot service load, sales pace, and rush bottlenecks quickly.",
    secondaryPanelTitle: "Floor status",
    secondaryPanelDescription: "Keep open tables, reserved covers, and seat availability visible to the front desk.",
    secondaryPanelActionLabel: "Floor plan",
    secondaryPanelEmptyTitle: "No tables configured",
    secondaryPanelEmptyMessage: "Set up the floor plan first so dine-in service stays clear for hosts and cashiers.",
    secondaryPanelEmptyActionLabel: "Set up tables",
    secondaryPanelFocusLabel: "Today's service focus",
    stockTitle: "Kitchen stock to buy",
    stockDescription: "Low items should stay visible before the next service or supplier call.",
    quickActionTitle: "Keep the next table, kitchen, and cashier actions one tap away.",
    quickActionDescription: "Jump into service, kitchen, or shift control from one operator board.",
  },
  cafe: {
    dashboardTitle: "Counter Dashboard",
    dashboardSummary: "Fast checkout, regulars, stock, and shift status stay within one counter view.",
    controlLabel: "Cafe POS",
    customerTitle: "Regulars",
    customerSummary: "Repeat guests, loyalty, and quick lookup stay close to the till.",
    allowTables: false,
    allowKitchen: false,
    orderTypes: ["takeaway", "delivery"],
    quickSaleLabel: "Open Counter Sale",
    trendTitle: "Watch counter revenue, orders, and rush patterns together.",
    trendDescription: "This board helps owners or supervisors see counter pace, top demand, and shift readiness quickly.",
    secondaryPanelTitle: "Selling modes",
    secondaryPanelDescription: "Keep the main order paths obvious so new cashiers can work with less training.",
    secondaryPanelActionLabel: "Start billing",
    secondaryPanelFocusLabel: "Today's counter focus",
    stockTitle: "Counter stock to buy",
    stockDescription: "Low items should stay visible before the next rush or supplier call.",
    quickActionTitle: "Keep the next cashier actions one tap away.",
    quickActionDescription: "Start a sale, manage the shift, and jump to menu maintenance without extra navigation.",
  },
  shop: {
    dashboardTitle: "Retail POS Dashboard",
    dashboardSummary: "Checkout speed, products, stock, and customer balances stay within one retail flow.",
    controlLabel: "Retail POS",
    customerTitle: "Customers",
    customerSummary: "Customer balances, loyalty, and repeat sales stay easy to manage.",
    allowTables: false,
    allowKitchen: false,
    orderTypes: ["takeaway", "delivery"],
    quickSaleLabel: "New Checkout",
    trendTitle: "Watch checkout revenue, orders, and peak hours together.",
    trendDescription: "This board helps store owners or supervisors spot sales pace, stock risk, and counter readiness quickly.",
    secondaryPanelTitle: "Checkout modes",
    secondaryPanelDescription: "Keep counter sale, pickup, and delivery paths obvious so retail staff need less training.",
    secondaryPanelActionLabel: "Start checkout",
    secondaryPanelFocusLabel: "Today's checkout focus",
    stockTitle: "Stock to buy soon",
    stockDescription: "Low items should stay visible before they delay checkout or the next buying round.",
    quickActionTitle: "Keep the next cashier and stock actions one tap away.",
    quickActionDescription: "Jump into checkout, catalog maintenance, and shift control from one retail board.",
  },
  general: {
    dashboardTitle: "Legacy POS Dashboard",
    dashboardSummary: "Billing, reservations, tables, kitchen flow, stock, and shifts still run here until this business is moved to a focused package.",
    controlLabel: "POS Control",
    customerTitle: "Customers",
    customerSummary: "Customer management, loyalty, and repeat billing stay connected to POS.",
    allowTables: true,
    allowKitchen: true,
    orderTypes: ["dine-in", "takeaway", "delivery"],
    quickSaleLabel: "New Sale",
    trendTitle: "Watch revenue, orders, and rush patterns together.",
    trendDescription: "This view should help the owner or floor manager decide what needs attention in seconds.",
    secondaryPanelTitle: "Selling modes",
    secondaryPanelDescription: "Keep the main order paths obvious so new cashiers can work with less training.",
    secondaryPanelActionLabel: "Start billing",
    secondaryPanelFocusLabel: "Today's billing focus",
    stockTitle: "Low stock to buy",
    stockDescription: "Low items should stay visible before they slow down the next shift or buying round.",
    quickActionTitle: "Keep the next cashier and floor actions one tap away.",
    quickActionDescription: "Jump into billing, tables, kitchen, or shift control from one board.",
  },
};

export const BUSINESS_ACCOUNTING_META = {
  restaurant: {
    eyebrow: "Restaurant Accounting",
    title: "Restaurant ledger and day-close control",
    description: "Track service sales, supplier bills, kitchen expenses, wallet collections, and owner cash movement in one practical ledger.",
    badges: ["Day close", "Supplier buying", "Cash and wallets"],
    focusTitle: "Keep service, stock buying, and cash-up aligned.",
    focusSummary: "This screen is built for restaurant owners and accountants who need the day-close story in one place before the next service.",
    sidebarSummary: "Filter the ledger by period, journal type, and service day.",
    entryLabel: "Add manual entry",
    emptyTitle: "No restaurant finance records for this period",
  },
  cafe: {
    eyebrow: "Cafe Accounting",
    title: "Cafe sales, expenses, and counter-close control",
    description: "Track counter sales, supplier buying, expenses, digital wallet collections, and owner cash movement in one practical cafe ledger.",
    badges: ["Counter close", "eSewa and Khalti", "Cash and buying"],
    focusTitle: "Keep the counter, buying, and cash-up aligned.",
    focusSummary: "This screen is built for cafe owners and accountants who need a quick view of sales, expenses, and closing totals.",
    sidebarSummary: "Filter the ledger by period, journal type, and business day.",
    entryLabel: "Add manual entry",
    emptyTitle: "No cafe finance records for this period",
  },
  shop: {
    eyebrow: "Retail Accounting",
    title: "Retail sales, purchases, and collection control",
    description: "Track checkout sales, supplier buying, expenses, invoice collections, and owner cash movement in one retail ledger.",
    badges: ["Customer due", "Supplier buying", "Cash and wallets"],
    focusTitle: "Keep checkout, buying, and collections aligned.",
    focusSummary: "This screen is built for retail owners and accountants who need cash, dues, purchases, and expenses in one place.",
    sidebarSummary: "Filter the ledger by period, journal type, and store day.",
    entryLabel: "Add manual entry",
    emptyTitle: "No retail finance records for this period",
  },
  general: {
    eyebrow: "Business Accounting",
    title: "Business ledger and cash movement",
    description: "Track sales, purchases, expenses, dues, and owner cash movement in one practical ledger.",
    badges: ["Cash and due", "Purchases", "Day review"],
    focusTitle: "Keep revenue, buying, and cash movement aligned.",
    focusSummary: "This screen keeps the broad ledger visible until the workspace is moved into a focused business package.",
    sidebarSummary: "Filter the ledger by period and journal type.",
    entryLabel: "Add manual entry",
    emptyTitle: "No finance records for this period",
  },
};

const PATH_REDIRECT_RULES = {
  restaurant: [
    { prefixes: ['/customers'], redirectTo: '/pos/customers' },
    { prefixes: ['/accounting', '/invoices'], redirectTo: '/pos/shifts' },
  ],
  cafe: [
    { prefixes: ['/pos/tables', '/pos/kds'], redirectTo: '/pos' },
    { prefixes: ['/customers'], redirectTo: '/pos/customers' },
    { prefixes: ['/accounting', '/invoices'], redirectTo: '/pos/shifts' },
  ],
  shop: [
    { prefixes: ['/pos/tables', '/pos/kds'], redirectTo: '/pos' },
    { prefixes: ['/pos/customers'], redirectTo: '/customers' },
  ],
};

function findRedirectRule(pathname, businessType) {
  const type = normalizeBusinessType(businessType);
  const redirectRules = PATH_REDIRECT_RULES[type] || [];

  return redirectRules.find((rule) =>
    rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
  );
}

export function getAppsForBusiness(businessType) {
  return BUSINESS_CONFIGS[normalizeBusinessType(businessType)] || shopConfig;
}

export function getBusinessMeta(businessType) {
  return BUSINESS_META[normalizeBusinessType(businessType)] || BUSINESS_META.shop;
}

export function getSidebarSectionsForBusiness(businessType) {
  return BUSINESS_SIDEBAR_SECTIONS[normalizeBusinessType(businessType)] || BUSINESS_SIDEBAR_SECTIONS.shop;
}

export function getBusinessPosMeta(businessType) {
  return BUSINESS_POS_META[normalizeBusinessType(businessType)] || BUSINESS_POS_META.shop;
}

export function getBusinessAccountingMeta(businessType) {
  return BUSINESS_ACCOUNTING_META[normalizeBusinessType(businessType)] || BUSINESS_ACCOUNTING_META.shop;
}

export function getCustomerPathForBusiness(businessType) {
  return normalizeBusinessType(businessType) === "shop" ? "/customers" : "/pos/customers";
}

export function getActiveAppForBusiness(pathname, businessType) {
  const apps = getAppsForBusiness(normalizeBusinessType(businessType));
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
