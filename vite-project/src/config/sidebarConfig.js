import {
  LayoutDashboard,
  Kanban,
  List,
  Columns3,
  Package,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  StickyNote,
  CheckSquare,
  Settings,
  FolderKanban,
  Monitor,
  Receipt,
} from 'lucide-react'

/**
 * Each app mirrors an Odoo-style module.
 *   id          – unique key
 *   name        – display name in sidebar
 *   icon        – Lucide component
 *   accent      – tailwind color token (used for active states)
 *   basePath    – default route when the app icon is clicked
 *   pathPrefixes – URL prefixes that "belong" to this app
 *   menu        – submenu items shown when the app is active
 */
export const apps = [
  {
    id: 'crm',
    name: 'CRM',
    icon: Kanban,
    accent: 'violet',
    basePath: '/crm',
    pathPrefixes: ['/crm'],
    menu: [
      { label: 'Pipeline', path: '/crm', icon: Kanban, exact: true },
      { label: 'Leads', path: '/crm/leads', icon: List },
      { label: 'Pipeline Board', path: '/crm/pipeline', icon: Columns3 },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: FileText,
    accent: 'blue',
    basePath: '/customers',
    pathPrefixes: ['/customers', '/invoices'],
    menu: [
      { label: 'Customers', path: '/customers', icon: Users },
      { label: 'Invoices', path: '/invoices', icon: FileText },
    ],
  },
  {
    id: 'pos',
    name: 'POS',
    icon: Monitor,
    accent: 'teal',
    basePath: '/pos',
    pathPrefixes: ['/pos'],
    menu: [
      { label: 'Dashboard', path: '/pos', icon: Monitor, exact: true },
      { label: 'Billing', path: '/pos/billing', icon: ShoppingCart },
      { label: 'Products', path: '/pos/products', icon: Package },
      { label: 'Customers', path: '/pos/customers', icon: Users },
      { label: 'Sales', path: '/pos/sales', icon: Receipt },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: Package,
    accent: 'orange',
    basePath: '/inventory',
    pathPrefixes: ['/inventory'],
    menu: [
      { label: 'Products', path: '/inventory', icon: Package },
    ],
  },
  {
    id: 'accounting',
    name: 'Accounting',
    icon: DollarSign,
    accent: 'emerald',
    basePath: '/accounting',
    pathPrefixes: ['/accounting', '/reports', '/purchases'],
    menu: [
      { label: 'Transactions', path: '/accounting', icon: DollarSign },
      { label: 'Reports', path: '/reports', icon: TrendingUp },
      { label: 'Purchases', path: '/purchases', icon: ShoppingCart },
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: FolderKanban,
    accent: 'green',
    basePath: '/',
    pathPrefixes: ['/', '/todos'],
    menu: [
      { label: 'Notes', path: '/', icon: StickyNote, exact: true },
      { label: 'Tasks', path: '/todos', icon: CheckSquare },
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    accent: 'gray',
    basePath: '/settings',
    pathPrefixes: ['/settings'],
    menu: [
      { label: 'General', path: '/settings', icon: Settings },
    ],
  },
]

/** Given a pathname, return the active app object (or null). */
export function getActiveApp(pathname) {
  return apps.find(app =>
    app.pathPrefixes.some(prefix =>
      prefix === '/'
        ? pathname === '/'
        : pathname === prefix || pathname.startsWith(prefix + '/')
    )
  ) || null
}

/** Check if a single menu item is the current page. */
export function isMenuItemActive(item, pathname) {
  if (item.exact) return pathname === item.path
  if (item.path === '/') return pathname === '/'
  return pathname === item.path || pathname.startsWith(item.path + '/')
}
