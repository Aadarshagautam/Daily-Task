export const ROLE_MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Daily business overview and quick performance visibility.",
  },
  {
    key: "pos",
    label: "POS / Billing",
    description: "Counter billing, dine-in orders, and live sales work.",
  },
  {
    key: "products",
    label: "Products",
    description: "Product or menu setup, pricing, and item maintenance.",
  },
  {
    key: "customers",
    label: "Customers",
    description: "Customer search, due balances, and contact details.",
  },
  {
    key: "purchases",
    label: "Purchases",
    description: "Supplier purchases, stock-in, and unpaid purchase tracking.",
  },
  {
    key: "inventory",
    label: "Inventory",
    description: "Stock visibility, updates, and restock readiness.",
  },
  {
    key: "reports",
    label: "Reports",
    description: "Daily sales, expense, payment, and stock reporting.",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Business profile, VAT, receipt, and admin setup.",
  },
  {
    key: "restaurant",
    label: "Restaurant",
    description: "Tables, kitchen flow, and dine-in service tools.",
  },
  {
    key: "accounting",
    label: "Accounting",
    description: "Transactions, ledger work, and finance controls.",
  },
];

export const ACCESS_LEVEL_META = {
  none: {
    label: "No access",
    tone: "slate",
  },
  view: {
    label: "View only",
    tone: "slate",
  },
  work: {
    label: "Daily work",
    tone: "blue",
  },
  manage: {
    label: "Manage",
    tone: "teal",
  },
  full: {
    label: "Full access",
    tone: "amber",
  },
};

const createEmptyModuleAccess = () =>
  Object.fromEntries(ROLE_MODULES.map((module) => [module.key, "none"]));

export const ROLE_META = {
  owner: {
    label: "Owner",
    summary: "Full business access, team control, and audit visibility.",
    tone: "amber",
    audience: "Best for the business owner or one highly trusted admin.",
    caution:
      "Keep this role limited to people who can change pricing, tax, settings, and staff access.",
    includedActions: [
      "Can manage business setup, staff access, and branch changes.",
      "Can review sales, purchases, due customers, and stock in one place.",
      "Can approve sensitive updates such as billing, inventory, and reporting access.",
    ],
    moduleAccess: {
      dashboard: "full",
      pos: "full",
      products: "full",
      customers: "full",
      purchases: "full",
      inventory: "full",
      reports: "full",
      settings: "full",
      restaurant: "full",
      accounting: "full",
    },
  },
  manager: {
    label: "Manager",
    summary: "Daily operations, approvals, and branch oversight.",
    tone: "teal",
    audience: "Best for the person running daily shop, cafe, or restaurant operations.",
    caution:
      "Good for trusted floor or branch managers, but usually not for casual staff.",
    includedActions: [
      "Can manage daily billing, inventory, purchases, and customer work.",
      "Can review reports and operations without taking over owner-only setup.",
      "Can guide staff and branch work with broad day-to-day access.",
    ],
    moduleAccess: {
      dashboard: "manage",
      pos: "manage",
      products: "manage",
      customers: "manage",
      purchases: "manage",
      inventory: "manage",
      reports: "view",
      settings: "view",
      restaurant: "manage",
      accounting: "manage",
    },
  },
  accountant: {
    label: "Accountant",
    summary: "Invoices, purchases, reports, and accounting controls.",
    tone: "emerald",
    audience: "Best for finance staff handling bills, purchases, and reports.",
    caution:
      "Useful for finance work, but usually does not need POS or service-floor control.",
    includedActions: [
      "Can manage purchases, invoices, and accounting entries.",
      "Can review customer dues, reports, and stock visibility for finance checks.",
      "Stays away from service-floor tools like tables and kitchen flow.",
    ],
    moduleAccess: {
      dashboard: "view",
      pos: "none",
      products: "none",
      customers: "work",
      purchases: "manage",
      inventory: "view",
      reports: "view",
      settings: "none",
      restaurant: "none",
      accounting: "manage",
    },
  },
  cashier: {
    label: "Cashier",
    summary: "Billing, customers, and cashier shift close.",
    tone: "blue",
    audience: "Best for counter staff handling bills, walk-ins, and shift work.",
    caution:
      "Keep this role focused on daily billing instead of settings or finance setup.",
    includedActions: [
      "Can create sales, handle customer records, and close cashier shifts.",
      "Can view stock and reports needed for daily selling decisions.",
      "Can work in billing quickly without touching deeper admin settings.",
    ],
    moduleAccess: {
      dashboard: "view",
      pos: "work",
      products: "view",
      customers: "work",
      purchases: "none",
      inventory: "view",
      reports: "view",
      settings: "none",
      restaurant: "work",
      accounting: "none",
    },
  },
  waiter: {
    label: "Waiter",
    summary: "Table service, guest orders, and floor updates.",
    tone: "rose",
    audience: "Best for dine-in staff taking orders and handling guest tables.",
    caution:
      "This role should stay focused on floor service, not finance, setup, or stock control.",
    includedActions: [
      "Can open tables, take guest orders, and update live service flow.",
      "Can use customer lookup where needed for regular guests.",
      "Stays limited so restaurant staff do not accidentally access owner tools.",
    ],
    moduleAccess: {
      dashboard: "none",
      pos: "work",
      products: "none",
      customers: "work",
      purchases: "none",
      inventory: "none",
      reports: "none",
      settings: "none",
      restaurant: "work",
      accounting: "none",
    },
  },
  kitchen: {
    label: "Kitchen Staff",
    summary: "Kitchen tickets and order preparation flow.",
    tone: "orange",
    audience: "Best for kitchen teams focused on order preparation and KOT flow.",
    caution:
      "Keep this role narrow so kitchen users only see the tools needed to prepare orders.",
    includedActions: [
      "Can review incoming kitchen tickets and update preparation status.",
      "Can follow live order flow without accessing pricing or admin setup.",
      "Works well for fast kitchen operations with low training need.",
    ],
    moduleAccess: {
      dashboard: "none",
      pos: "view",
      products: "none",
      customers: "none",
      purchases: "none",
      inventory: "none",
      reports: "none",
      settings: "none",
      restaurant: "work",
      accounting: "none",
    },
  },
  admin: {
    label: "Admin (Legacy)",
    summary: "Older full-access role kept for legacy workspaces.",
    tone: "slate",
    audience: "Only for older workspaces that still use the earlier admin role.",
    caution:
      "This role has very broad access, so it should be reviewed carefully in legacy setups.",
    includedActions: [
      "Carries broad access similar to older owner-style workspaces.",
      "Can see and manage most modules in legacy organizations.",
      "Should be replaced with clearer modern roles where possible.",
    ],
    moduleAccess: {
      dashboard: "full",
      pos: "full",
      products: "full",
      customers: "full",
      purchases: "full",
      inventory: "full",
      reports: "full",
      settings: "full",
      restaurant: "full",
      accounting: "full",
    },
  },
  member: {
    label: "Member (Legacy)",
    summary: "Older mixed-access role kept for legacy workspaces.",
    tone: "slate",
    audience: "For older setups where one mixed role was shared across several tasks.",
    caution:
      "This role can feel unclear, so newer workspaces should prefer focused staff roles.",
    includedActions: [
      "Combines light sales, CRM, task, and reporting access.",
      "Useful for legacy users with mixed day-to-day responsibilities.",
      "Less clear than focused roles like cashier, waiter, or accountant.",
    ],
    moduleAccess: {
      dashboard: "view",
      pos: "work",
      products: "view",
      customers: "work",
      purchases: "view",
      inventory: "view",
      reports: "view",
      settings: "none",
      restaurant: "work",
      accounting: "view",
    },
  },
  viewer: {
    label: "Viewer (Legacy)",
    summary: "Older read-only role kept for legacy workspaces.",
    tone: "slate",
    audience: "For people who only need visibility and not daily operational changes.",
    caution:
      "Use this only when someone truly needs read-only visibility without editing rights.",
    includedActions: [
      "Can review business information without changing records.",
      "Useful for senior observers, auditors, or limited back-office visibility.",
      "Should not be used for staff who need to create or update transactions.",
    ],
    moduleAccess: {
      dashboard: "view",
      pos: "view",
      products: "view",
      customers: "view",
      purchases: "view",
      inventory: "view",
      reports: "view",
      settings: "none",
      restaurant: "view",
      accounting: "view",
    },
  },
};

export const ASSIGNABLE_ROLE_OPTIONS = [
  "manager",
  "accountant",
  "cashier",
  "waiter",
  "kitchen",
  "admin",
  "member",
  "viewer",
];

export const getRoleMeta = (role) =>
  ROLE_META[role] || {
    label: role ? String(role) : "No role",
    summary: "Role information is not available for this account.",
    tone: "slate",
    audience: "This role is not mapped to a clear access summary yet.",
    caution: "Review this role carefully before assigning it to staff.",
    includedActions: [],
    moduleAccess: createEmptyModuleAccess(),
  };

export const getAccessLevelMeta = (level) =>
  ACCESS_LEVEL_META[level] || ACCESS_LEVEL_META.none;

export const getRoleModuleAccess = (role) => {
  const roleMeta = getRoleMeta(role);

  return ROLE_MODULES.map((module) => {
    const accessLevel = roleMeta.moduleAccess?.[module.key] || "none";
    const accessMeta = getAccessLevelMeta(accessLevel);

    return {
      ...module,
      accessLevel,
      accessLabel: accessMeta.label,
      accessTone: accessMeta.tone,
    };
  });
};

export const getRoleHighlights = (role, limit = 3) =>
  getRoleModuleAccess(role)
    .filter((module) => ["full", "manage", "work"].includes(module.accessLevel))
    .slice(0, limit);
