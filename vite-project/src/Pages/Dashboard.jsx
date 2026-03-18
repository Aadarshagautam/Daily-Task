import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  FileText,
  Kanban,
  Monitor,
  Package,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { posCustomerApi, posKdsApi, posSaleApi, posTableApi } from '../api/posApi'
import StatePanel from '../components/StatePanel.jsx'
import { getBusinessMeta } from '../config/businessConfigs.js'
import AppContext from '../context/app-context.js'
import { purchaseApi } from '../lib/purchaseApi.js'
import api from '../lib/api.js'

const formatCurrency = value =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const getSettledData = (result, fallback) => {
  if (!result || result.status !== 'fulfilled') return fallback
  const value = result.value

  if (value?.data?.data !== undefined) return value.data.data
  if (value?.data !== undefined) return value.data

  return fallback
}

const isSameDay = (value) => {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

const getDueAmount = (customer) =>
  Math.max(
    0,
    Number(
      customer?.creditBalance ??
        customer?.balanceDue ??
        customer?.totalDue ??
        customer?.dueAmount ??
        0
    ) || 0
  )

const getPurchaseDate = (purchase) => purchase?.purchaseDate || purchase?.createdAt

const getTableServiceState = (table) => {
  if (table?.status === 'available') return 'free'
  if (table?.status === 'reserved') return 'reserved'
  if (table?.status === 'cleaning') return 'cleaning'
  if (table?.status === 'occupied' && table?.currentOrderId?.orderStatus === 'served') return 'billing'
  if (table?.status === 'occupied') return 'occupied'
  return 'free'
}

const ownerCardToneMap = {
  emerald: {
    border: 'border-emerald-200 hover:border-emerald-300',
    icon: 'bg-emerald-50 text-emerald-700',
  },
  rose: {
    border: 'border-rose-200 hover:border-rose-300',
    icon: 'bg-rose-50 text-rose-700',
  },
  amber: {
    border: 'border-amber-200 hover:border-amber-300',
    icon: 'bg-amber-50 text-amber-700',
  },
  blue: {
    border: 'border-sky-200 hover:border-sky-300',
    icon: 'bg-sky-50 text-sky-700',
  },
  slate: {
    border: 'border-slate-200 hover:border-slate-300',
    icon: 'bg-slate-100 text-slate-700',
  },
  teal: {
    border: 'border-teal-200 hover:border-teal-300',
    icon: 'bg-teal-50 text-teal-700',
  },
}

const insightToneMap = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  rose: 'border-rose-200 bg-rose-50 text-rose-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  blue: 'border-sky-200 bg-sky-50 text-sky-900',
  slate: 'border-slate-200 bg-slate-50 text-slate-900',
  teal: 'border-teal-200 bg-teal-50 text-teal-900',
}

const businessModes = [
  { name: 'Restaurant', summary: 'Tables, kitchen, billing, stock, and shift close in one Nepal-ready package.', path: '/settings' },
  { name: 'Cafe', summary: 'Counter billing, regulars, stock, and day close without restaurant clutter.', path: '/settings' },
  { name: 'Shop', summary: 'Billing, products, stock, invoices, and due follow-up for retail counters.', path: '/settings' },
]

const getRoleExperience = (role, businessType, businessMeta) => {
  const isLegacyWorkspace = businessType === 'general'
  const isShop = businessType === 'shop'
  const isFoodService = businessType === 'restaurant' || businessType === 'cafe'
  const focusedPrimary =
    isLegacyWorkspace
      ? { label: 'Review finance', path: '/accounting' }
      : isShop
        ? { label: 'Review invoices', path: '/invoices' }
        : { label: 'Review shift close', path: '/pos/shifts' }

  const byRole = {
    owner: {
      kicker: 'Owner View',
      summary: businessMeta.commandCenterSummary,
      primaryAction: focusedPrimary,
      secondaryAction: { label: 'Check settings', path: '/settings' },
    },
    admin: {
      kicker: 'Admin View',
      summary: 'Keep work areas, staff access, and payment flow aligned across the workspace.',
      primaryAction: { label: 'Open settings', path: '/settings' },
      secondaryAction: { label: 'Review work areas', path: '/apps' },
    },
    manager: {
      kicker: 'Manager View',
      summary:
        businessType === 'restaurant'
          ? 'Stay on top of tables, kitchen flow, and stock risk while service is active.'
          : businessType === 'cafe'
            ? 'Keep counter speed, regulars, and stock risk visible during rush hours.'
            : businessType === 'shop'
              ? 'Keep checkout speed, stock risk, and due follow-up visible through the day.'
              : 'Watch revenue, branch health, and the next bottlenecks before they slow the workspace.',
      primaryAction: { label: 'Open POS', path: '/pos/billing' },
      secondaryAction: { label: 'Check stock', path: '/inventory' },
    },
    accountant: {
      kicker: 'Accountant View',
      summary:
        isLegacyWorkspace
          ? 'Keep revenue, receivables, purchases, and cash movement reconciled for Nepal VAT reporting.'
          : isShop
            ? 'Keep invoices, collections, and buying records ready for daily reconciliation.'
            : 'Keep stock buying, wallet totals, and shift close consistent for daily reconciliation.',
      primaryAction: focusedPrimary,
      secondaryAction: isFoodService ? { label: 'Check stock', path: '/inventory' } : { label: 'Review invoices', path: '/invoices' },
    },
    cashier: {
      kicker: 'Cashier View',
      summary: 'Open the shift, bill cleanly, and keep cash and digital wallet totals accurate throughout the day.',
      primaryAction: { label: 'Start billing', path: '/pos/billing' },
      secondaryAction: { label: 'Manage shift', path: '/pos/shifts' },
    },
  }

  return (
    byRole[role] || {
      kicker: 'Command Center',
      summary: businessMeta.commandCenterSummary,
      primaryAction: { label: 'Open billing', path: '/pos/billing' },
      secondaryAction: { label: 'Open work areas', path: '/apps' },
    }
  )
}

const OwnerMetricCard = ({ title, value, detail, icon: Icon, tone = 'slate', link, ctaLabel = 'Open details' }) => {
  const palette = ownerCardToneMap[tone] || ownerCardToneMap.slate
  const content = (
    <div className={`group rounded-[28px] border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md ${palette.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        {Icon ? (
          <div className={`rounded-2xl p-3 ${palette.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {link ? (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          {ctaLabel}
          <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      ) : null}
    </div>
  )

  return link ? <Link to={link}>{content}</Link> : content
}

const QuickInsightCard = ({ title, value, detail, tone = 'slate', path }) => {
  const className = insightToneMap[tone] || insightToneMap.slate
  const content = (
    <div className={`rounded-3xl border p-5 transition ${path ? 'hover:-translate-y-0.5 hover:shadow-sm' : ''} ${className}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{detail}</p>
    </div>
  )

  return path ? <Link to={path}>{content}</Link> : content
}

const Dashboard = () => {
  const { currentOrgName, orgBusinessType, userData, userRole, hasPermission } = useContext(AppContext)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [partialLoad, setPartialLoad] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [overview, setOverview] = useState({
    sales: {},
    people: [],
    invoices: {},
    leads: {},
    finance: {},
    lowStock: [],
    purchases: [],
    tables: [],
    kitchen: [],
    transactions: [],
    availability: {
      sales: true,
      customers: true,
      finance: true,
      inventory: true,
      purchases: true,
      tables: true,
      kitchen: true,
    },
  })

  const businessType = orgBusinessType || 'general'
  const isLegacyWorkspace = businessType === 'general'
  const isShop = businessType === 'shop'
  const isRestaurant = businessType === 'restaurant'
  const businessMeta = getBusinessMeta(businessType)
  const peoplePath = isShop || isLegacyWorkspace ? '/customers' : '/pos/customers'
  const roleExperience = getRoleExperience(userRole, businessType, businessMeta)
  const showFinance = hasPermission('accounting.read')
  const showInvoices = (isLegacyWorkspace || isShop) && hasPermission('invoices.read')
  const showCrm = isLegacyWorkspace && hasPermission('crm.read')
  const canReadCustomers = (isLegacyWorkspace || isShop) ? hasPermission('customers.read') : hasPermission('pos.customers.read')
  const canReadInventory = hasPermission('inventory.read')
  const canReadPurchases = hasPermission('purchases.read')
  const canReadTables = (isRestaurant || isLegacyWorkspace) && hasPermission('pos.tables.read')
  const canReadKitchen = (isRestaurant || isLegacyWorkspace) && hasPermission('pos.kitchen.read')
  const todayFocusCount = (overview.leads?.byStage?.proposal?.count || 0) + (overview.leads?.byStage?.negotiation?.count || 0)
  const headline =
    businessType === 'restaurant'
      ? 'is ready for the next service cycle.'
      : businessType === 'cafe'
        ? 'is ready for the next rush.'
        : isShop
          ? 'is ready for today\'s sales.'
          : 'is ready for today\'s operations.'

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true)
        setLoadFailed(false)
        setPartialLoad(false)

        const results = await Promise.allSettled([
          posSaleApi.stats(),
          canReadCustomers ? (isLegacyWorkspace || isShop ? api.get('/customers') : posCustomerApi.list()) : Promise.resolve({ data: { data: [] } }),
          showInvoices ? api.get('/invoices/stats') : Promise.resolve({ data: { data: {} } }),
          showCrm ? api.get('/crm/stats') : Promise.resolve({ data: { data: {} } }),
          showFinance ? api.get('/transactions/summary') : Promise.resolve({ data: { data: {} } }),
          showFinance ? api.get('/transactions') : Promise.resolve({ data: { data: [] } }),
          canReadInventory ? api.get('/inventory/low-stock') : Promise.resolve({ data: { data: [] } }),
          canReadPurchases ? purchaseApi.list() : Promise.resolve({ data: { data: [] } }),
          canReadTables ? posTableApi.list() : Promise.resolve({ data: { data: [] } }),
          canReadKitchen ? posKdsApi.list() : Promise.resolve({ data: { data: [] } }),
        ])

        const sales = getSettledData(results[0], {})
        const people = getSettledData(results[1], [])
        const invoices = getSettledData(results[2], {})
        const leads = getSettledData(results[3], {})
        const finance = getSettledData(results[4], {})
        const transactions = getSettledData(results[5], [])
        const lowStock = getSettledData(results[6], [])
        const purchases = getSettledData(results[7], [])
        const tables = getSettledData(results[8], [])
        const kitchen = getSettledData(results[9], [])

        const failedIndexes = results
          .map((result, index) => (result.status === 'rejected' ? index : null))
          .filter((index) => index !== null)
        const criticalFailed = [0, 6, 7].every((index) => failedIndexes.includes(index))

        setLoadFailed(criticalFailed)
        setPartialLoad(!criticalFailed && failedIndexes.length > 0)

        setOverview({
          sales,
          people: Array.isArray(people) ? people : [],
          invoices,
          leads,
          finance,
          lowStock: Array.isArray(lowStock) ? lowStock : [],
          purchases: Array.isArray(purchases) ? purchases : [],
          tables: Array.isArray(tables) ? tables : [],
          kitchen: Array.isArray(kitchen) ? kitchen : [],
          transactions: Array.isArray(transactions) ? transactions : [],
          availability: {
            sales: results[0]?.status === 'fulfilled',
            customers: canReadCustomers ? results[1]?.status === 'fulfilled' : false,
            finance: showFinance ? results[4]?.status === 'fulfilled' && results[5]?.status === 'fulfilled' : false,
            inventory: canReadInventory ? results[6]?.status === 'fulfilled' : false,
            purchases: canReadPurchases ? results[7]?.status === 'fulfilled' : false,
            tables: canReadTables ? results[8]?.status === 'fulfilled' : false,
            kitchen: canReadKitchen ? results[9]?.status === 'fulfilled' : false,
          },
        })

        if (criticalFailed) toast.error('Unable to load owner dashboard data')
      } catch {
        setLoadFailed(true)
        toast.error('Unable to load owner dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [
    canReadCustomers,
    canReadInventory,
    canReadKitchen,
    canReadPurchases,
    canReadTables,
    isLegacyWorkspace,
    isShop,
    reloadKey,
    showCrm,
    showFinance,
    showInvoices,
  ])

  const todayExpenseEntries = overview.transactions.filter((transaction) => transaction?.type === 'expense' && isSameDay(transaction?.date || transaction?.createdAt))
  const todayExpenseTotal = todayExpenseEntries.reduce((sum, transaction) => sum + (Number(transaction?.amount) || 0), 0)
  const dueCustomers = overview.people.filter((customer) => getDueAmount(customer) > 0)
  const dueCustomerTotal = dueCustomers.reduce((sum, customer) => sum + getDueAmount(customer), 0)
  const todayPurchases = overview.purchases.filter((purchase) => isSameDay(getPurchaseDate(purchase)))
  const todayPurchaseTotal = todayPurchases.reduce((sum, purchase) => sum + (Number(purchase?.totalAmount) || 0), 0)
  const todayPurchaseSuppliers = new Set(todayPurchases.map((purchase) => purchase?.supplierName).filter(Boolean))
  const unpaidPurchases = overview.purchases.filter((purchase) => ['pending', 'partial'].includes(purchase?.paymentStatus))
  const unpaidPurchaseTotal = unpaidPurchases.reduce((sum, purchase) => sum + (Number(purchase?.outstandingAmount) || 0), 0)
  const lowStockPreview = overview.lowStock
    .slice(0, 2)
    .map((item) => item?.name || item?.productName || item?.product?.name || item?.sku)
    .filter(Boolean)
    .join(', ')
  const openTables = overview.tables.filter((table) => ['occupied', 'billing'].includes(getTableServiceState(table)))
  const billingReadyTables = overview.tables.filter((table) => getTableServiceState(table) === 'billing')
  const reservedTables = overview.tables.filter((table) => getTableServiceState(table) === 'reserved')
  const pendingKitchenOrders = overview.kitchen.filter((order) => ['pending', 'preparing'].includes(order?.orderStatus))
  const readyKitchenOrders = overview.kitchen.filter((order) => order?.orderStatus === 'ready')
  const ownerCards = [
    {
      title: 'Today Sales',
      value: overview.availability.sales ? formatCurrency(overview.sales?.todayRevenue) : '--',
      detail: overview.availability.sales
        ? `${overview.sales?.todaySales || 0} bills closed today${overview.sales?.todayAverageSale ? ` · Avg ${formatCurrency(overview.sales?.todayAverageSale)}` : ''}`
        : 'Live sales totals could not be loaded right now.',
      icon: DollarSign,
      tone: 'emerald',
      link: overview.availability.sales ? '/pos/sales' : '',
      ctaLabel: 'Open sales',
    },
    {
      title: 'Today Expenses',
      value: overview.availability.finance ? formatCurrency(todayExpenseTotal) : '--',
      detail: overview.availability.finance
        ? todayExpenseEntries.length > 0
          ? `${todayExpenseEntries.length} expense ${todayExpenseEntries.length === 1 ? 'entry' : 'entries'} recorded today`
          : 'No expense has been recorded today.'
        : 'Expense visibility is available in accounting-enabled access.',
      icon: TrendingDown,
      tone: 'rose',
      link: overview.availability.finance ? '/accounting' : '',
      ctaLabel: 'Open expenses',
    },
    {
      title: 'Cash in Hand',
      value: overview.availability.finance ? formatCurrency(overview.finance?.balance) : '--',
      detail: overview.availability.finance
        ? `${formatCurrency(overview.finance?.totalIncome)} in vs ${formatCurrency(overview.finance?.totalExpense)} out across recorded entries`
        : 'Recorded cash position will appear when accounting data is available.',
      icon: Wallet,
      tone: 'slate',
      link: overview.availability.finance ? '/accounting' : '',
      ctaLabel: 'Open accounting',
    },
    {
      title: 'Due Customers',
      value: overview.availability.customers ? dueCustomers.length : '--',
      detail: overview.availability.customers
        ? dueCustomers.length > 0
          ? `${formatCurrency(dueCustomerTotal)} waiting to collect`
          : 'No customer due is waiting right now.'
        : 'Customer due visibility is not available in this view.',
      icon: Users,
      tone: 'blue',
      link: overview.availability.customers ? peoplePath : '',
      ctaLabel: 'Open customers',
    },
    {
      title: 'Low Stock Items',
      value: overview.availability.inventory ? overview.lowStock.length : '--',
      detail: overview.availability.inventory
        ? overview.lowStock.length > 0
          ? `Restock ${lowStockPreview || 'critical items'} soon`
          : 'Stock levels look healthy for now.'
        : 'Stock alerts are not available in this view.',
      icon: Package,
      tone: 'amber',
      link: overview.availability.inventory ? '/inventory' : '',
      ctaLabel: 'Open inventory',
    },
    {
      title: 'Purchases Today',
      value: overview.availability.purchases ? formatCurrency(todayPurchaseTotal) : '--',
      detail: overview.availability.purchases
        ? todayPurchases.length > 0
          ? `${todayPurchases.length} purchase ${todayPurchases.length === 1 ? 'entry' : 'entries'} from ${todayPurchaseSuppliers.size || 1} supplier${todayPurchaseSuppliers.size === 1 ? '' : 's'}`
          : 'No stock-in purchase has been recorded today.'
        : 'Purchase visibility is not available in this view.',
      icon: ShoppingCart,
      tone: 'teal',
      link: overview.availability.purchases ? '/purchases' : '',
      ctaLabel: 'Open purchases',
    },
  ]

  const operationalCards =
    isLegacyWorkspace
      ? [
          { title: 'POS', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'bg-teal-50 text-teal-700 border-teal-200', path: '/pos/billing' },
          { title: 'Sales', metric: `${overview.invoices?.totalInvoices || 0} invoices`, summary: `${formatCurrency(overview.invoices?.unpaidAmount)} waiting to collect`, icon: FileText, tone: 'bg-blue-50 text-blue-700 border-blue-200', path: '/invoices' },
          { title: 'CRM', metric: `${overview.leads?.total || 0} leads`, summary: `${formatCurrency(overview.leads?.weightedRevenue)} weighted pipeline`, icon: Kanban, tone: 'bg-rose-50 text-rose-700 border-rose-200', path: '/crm' },
          { title: 'Inventory', metric: `${overview.lowStock.length} low stock`, summary: 'Watch critical products before service slows down', icon: Package, tone: 'bg-orange-50 text-orange-700 border-orange-200', path: '/inventory' },
        ]
      : isShop
        ? [
            { title: 'Sales', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'bg-teal-50 text-teal-700 border-teal-200', path: '/pos/billing' },
            { title: 'Customers', metric: `${overview.people.length} accounts`, summary: 'Balances and follow-up stay close to billing', icon: Users, tone: 'bg-blue-50 text-blue-700 border-blue-200', path: '/customers' },
            { title: 'Stock', metric: `${overview.lowStock.length} low stock`, summary: 'Replenish products before the shelf runs dry', icon: Package, tone: 'bg-orange-50 text-orange-700 border-orange-200', path: '/inventory' },
            { title: 'Finance', metric: `${overview.invoices?.overdueCount || 0} overdue`, summary: `${formatCurrency(overview.invoices?.unpaidAmount)} waiting to collect`, icon: FileText, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', path: '/invoices' },
          ]
        : [
            { title: isRestaurant ? 'Service' : 'Counter', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'bg-teal-50 text-teal-700 border-teal-200', path: '/pos/billing' },
            { title: isRestaurant ? 'Guests' : 'Regulars', metric: `${overview.people.length} profiles`, summary: 'Repeat visitors stay close to billing', icon: Users, tone: 'bg-blue-50 text-blue-700 border-blue-200', path: '/pos/customers' },
            { title: 'Stock', metric: `${overview.lowStock.length} low stock`, summary: 'Replenish before the next rush', icon: Package, tone: 'bg-orange-50 text-orange-700 border-orange-200', path: '/inventory' },
            { title: 'Day close', metric: `${overview.sales?.todaySales || 0} sales`, summary: 'Shifts, wallet totals, and service summaries stay ready for sign-off.', icon: Receipt, tone: 'bg-amber-50 text-amber-700 border-amber-200', path: '/pos/shifts' },
          ]

  const focusItems = [
    {
      title: 'Average bill today',
      value: overview.availability.sales ? formatCurrency(overview.sales?.todayAverageSale) : '--',
      detail: overview.availability.sales
        ? `${overview.sales?.todaySales || 0} completed bill${overview.sales?.todaySales === 1 ? '' : 's'} today`
        : 'Average sale will appear when billing data is available.',
      tone: 'emerald',
      path: overview.availability.sales ? '/pos/sales' : '',
    },
    {
      title: 'Collection watch',
      value: overview.availability.customers ? formatCurrency(dueCustomerTotal) : '--',
      detail: overview.availability.customers
        ? dueCustomers.length > 0
          ? `${dueCustomers.length} customer${dueCustomers.length === 1 ? '' : 's'} still have due balances`
          : 'No due follow-up is pending right now.'
        : 'Customer balance visibility is not available in this view.',
      tone: 'blue',
      path: overview.availability.customers ? peoplePath : '',
    },
    {
      title: 'Purchase follow-up',
      value: overview.availability.purchases ? formatCurrency(unpaidPurchaseTotal) : '--',
      detail: overview.availability.purchases
        ? unpaidPurchases.length > 0
          ? `${unpaidPurchases.length} supplier purchase${unpaidPurchases.length === 1 ? '' : 's'} still unpaid`
          : 'All recorded purchases are settled.'
        : 'Purchase follow-up will appear when purchase access is available.',
      tone: 'slate',
      path: overview.availability.purchases ? '/purchases' : '',
    },
    {
      title: 'Restock watch',
      value: overview.availability.inventory ? `${overview.lowStock.length} items` : '--',
      detail: overview.availability.inventory
        ? overview.lowStock.length > 0
          ? `${lowStockPreview || 'Critical items'} need attention soon`
          : 'No low-stock alert is active right now.'
        : 'Inventory alerts are not available in this view.',
      tone: overview.lowStock.length > 0 ? 'amber' : 'emerald',
      path: overview.availability.inventory ? '/inventory' : '',
    },
    ...(showCrm
      ? [{
          title: 'Pipeline focus',
          value: `${todayFocusCount}`,
          detail: todayFocusCount > 0 ? 'Deals are sitting in proposal or negotiation.' : 'No urgent proposal follow-up is pending.',
          tone: 'rose',
          path: '/crm',
        }]
      : []),
    ...(canReadTables && overview.availability.tables
      ? [{
          title: 'Open tables',
          value: `${openTables.length}`,
          detail: billingReadyTables.length > 0
            ? `${billingReadyTables.length} table${billingReadyTables.length === 1 ? '' : 's'} ready for bill close`
            : `${reservedTables.length} reserved for upcoming service`,
          tone: 'amber',
          path: '/pos/tables',
        }]
      : []),
    ...(canReadKitchen && overview.availability.kitchen
      ? [{
          title: 'Pending kitchen',
          value: `${pendingKitchenOrders.length}`,
          detail: readyKitchenOrders.length > 0
            ? `${readyKitchenOrders.length} order${readyKitchenOrders.length === 1 ? '' : 's'} ready to serve`
            : 'Kitchen board is clear for now.',
          tone: 'rose',
          path: '/pos/kds',
        }]
      : []),
  ].slice(0, canReadKitchen || canReadTables ? 6 : 5)

  const supportAction =
    isLegacyWorkspace
      ? { label: 'Close the books', path: '/accounting', description: 'Track cash, expenses, and reporting status.' }
      : isShop
        ? { label: 'Review collections', path: '/invoices', description: 'Follow overdue invoices and customer dues.' }
        : { label: 'Close the day', path: '/pos/shifts', description: 'Review shift totals, wallets, and handover before sign-off.' }

  const stockAction = {
    label: 'Check stock',
    path: '/inventory',
    description: 'Watch critical items before the next rush.',
  }

  const heroActions = [
    {
      ...roleExperience.primaryAction,
      description: 'Jump into the highest-priority workspace for your role.',
    },
    {
      ...roleExperience.secondaryAction,
      description: 'Keep the next operational decision obvious.',
    },
    ...(isLegacyWorkspace ? [stockAction] : []),
    supportAction,
  ].filter((action, index, items) => action?.path && items.findIndex(item => item.path === action.path) === index)

  const snapshotRows =
    isShop
      ? [
          { label: 'Sales closed today', value: overview.sales?.todaySales || 0, detail: 'Keep billing pace visible across the day.', path: '/pos/sales' },
          { label: 'Customer accounts', value: overview.people.length, detail: 'Follow dues and repeat sales without extra CRM flow.', path: '/customers' },
          { label: 'Outstanding invoices', value: formatCurrency(overview.invoices?.unpaidAmount), detail: 'Collections stay in focus for the next follow-up.', path: '/invoices' },
        ]
      : [
          { label: 'Sales closed today', value: overview.sales?.todaySales || 0, detail: 'Keep the counter and floor moving through one focused flow.', path: '/pos/sales' },
          { label: isRestaurant ? 'Guest profiles' : 'Regular profiles', value: overview.people.length, detail: 'Repeat guests and loyalty stay easy to reach.', path: '/pos/customers' },
          { label: 'Low-stock alerts', value: overview.lowStock.length, detail: 'Replenishment stays visible before the next rush.', path: '/inventory' },
        ]

  if (loading) {
    return (
      <div className="page-shell">
        <StatePanel tone="teal" title="Loading owner dashboard" message="Collecting sales, expenses, stock alerts, purchases, and customer due signals for the current workspace." />
      </div>
    )
  }

  if (loadFailed) {
    return (
      <div className="page-shell">
        <StatePanel
          tone="amber"
          icon={AlertTriangle}
          title="Owner dashboard is not ready yet"
          message="The main owner metrics could not be loaded right now. Try refreshing the dashboard in a moment."
          action={(
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="btn-secondary">
              Retry dashboard
            </button>
          )}
        />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <section className="panel subtle-grid relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-amber-50 to-transparent lg:block" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">{roleExperience.kicker}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {currentOrgName || 'My Business'} {headline}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{roleExperience.summary}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="status-pill">{new Date().toLocaleDateString('en-NP', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="status-pill">{userData?.username || 'Operator'}</span>
              <span className="status-pill">{businessMeta.statusPill}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
            {heroActions.map(action => (
              <Link key={action.path} to={action.path} className="action-tile">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Owner Snapshot</p>
            <h2 className="mt-2 section-heading">See today&apos;s business health in one quick scan.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep sales, expenses, cash, due follow-up, stock risk, and supplier buying visible before the day gets busy.
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${partialLoad ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            {partialLoad
              ? 'Some owner metrics are temporarily unavailable. The cards below show the data that is ready.'
              : 'Updated from live billing, accounting, customer, inventory, purchase, and restaurant activity.'}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ownerCards.map((card) => (
            <OwnerMetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              detail={card.detail}
              icon={card.icon}
              tone={card.tone}
              link={card.link}
              ctaLabel={card.ctaLabel}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="panel p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Main Areas</p>
              <h2 className="mt-2 section-heading">Keep the main work areas easy to reach.</h2>
            </div>
            <Link to="/apps" className="text-sm font-semibold text-slate-900">
              Open modules
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {operationalCards.map(card => {
              const Icon = card.icon

              return (
                <Link key={card.title} to={card.path} className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">{card.title}</p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{card.metric}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
                    </div>
                    <div className={`rounded-2xl border px-3 py-3 ${card.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Work here
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="panel p-6">
          <p className="section-kicker">Quick Insights</p>
          <h2 className="mt-2 section-heading">Keep the next owner decisions obvious.</h2>

          <div className="mt-6 grid gap-4">
            {focusItems.map((item) => (
              <QuickInsightCard
                key={item.title}
                title={item.title}
                value={item.value}
                detail={item.detail}
                tone={item.tone}
                path={item.path}
              />
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Owner rule</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If the day&apos;s sales, cash, dues, stock risk, and purchases are not obvious in one view, the dashboard is still too complicated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        {showFinance ? (
          <div className="panel p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Recent Finance</p>
                <h2 className="mt-2 section-heading">Cash movement should stay visible while you operate.</h2>
              </div>
              <Link to="/accounting" className="text-sm font-semibold text-slate-900">
                Open accounting
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {overview.transactions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-base font-semibold text-slate-900">No finance activity yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Start recording income and expenses so the command center can show live business health.</p>
                  <Link to="/accounting" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Add transaction
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                overview.transactions.slice(0, 5).map(transaction => {
                  const isIncome = transaction.type === 'income'

                  return (
                    <div key={transaction._id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-2xl p-3 ${isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                          <p className="mt-1 text-sm text-slate-500">{transaction.category || 'Uncategorized'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-base font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="panel p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Daily Snapshot</p>
                <h2 className="mt-2 section-heading">Keep the daily picture easy to scan.</h2>
              </div>
              <Link to="/apps" className="text-sm font-semibold text-slate-900">
                Open modules
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {snapshotRows.map(row => (
                <Link key={row.label} to={row.path} className="block rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                  <p className="text-sm text-slate-500">{row.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{row.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{row.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="panel p-6">
          {isLegacyWorkspace ? (
            <>
              <p className="section-kicker">Legacy Workspace</p>
              <h2 className="mt-2 section-heading">Choose the focused Nepal package that fits this business.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Restaurant, Cafe, and Shop keep daily work tighter than the legacy fallback workspace.
              </p>

              <div className="mt-6 space-y-4">
                {businessModes.map(mode => (
                  <Link key={mode.name} to={mode.path} className="group flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{mode.name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{mode.summary}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
              <Link to="/settings" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Choose package
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="section-kicker">Business Setup</p>
              <h2 className="mt-2 section-heading">{businessMeta.spotlightTitle}</h2>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm leading-6 text-slate-600">{businessMeta.spotlightSummary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="status-pill">{businessMeta.productName}</span>
                  <span className="status-pill">{businessMeta.statusPill}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/apps" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Open modules
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/settings" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Change package
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
