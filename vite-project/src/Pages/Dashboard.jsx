import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  FileText,
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
import { getBusinessMeta, getCustomerPathForBusiness } from '../config/businessConfigs.js'
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
    border: 'border-[#dbe5f4] hover:border-[#7dd3fc]',
    line: 'from-emerald-500 via-cyan-400 to-transparent',
    icon: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-400',
  },
  rose: {
    border: 'border-[#dbe5f4] hover:border-[#fda4af]',
    line: 'from-rose-500 via-cyan-400 to-transparent',
    icon: 'border-rose-200 bg-rose-50 text-rose-700',
    badge: 'bg-rose-50 text-rose-700',
    dot: 'bg-rose-400',
  },
  amber: {
    border: 'border-[#dbe5f4] hover:border-[#fcd34d]',
    line: 'from-amber-500 via-cyan-400 to-transparent',
    icon: 'border-amber-200 bg-amber-50 text-amber-700',
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-400',
  },
  blue: {
    border: 'border-[#dbe5f4] hover:border-[#93c5fd]',
    line: 'from-blue-500 via-cyan-400 to-transparent',
    icon: 'border-blue-200 bg-blue-50 text-blue-700',
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-400',
  },
  slate: {
    border: 'border-[#dbe5f4] hover:border-[#cbd5e1]',
    line: 'from-slate-500 via-cyan-400 to-transparent',
    icon: 'border-slate-200 bg-slate-100 text-slate-700',
    badge: 'bg-slate-100 text-slate-700',
    dot: 'bg-slate-400',
  },
  teal: {
    border: 'border-[#dbe5f4] hover:border-[#67e8f9]',
    line: 'from-cyan-500 via-blue-400 to-transparent',
    icon: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    badge: 'bg-cyan-50 text-cyan-700',
    dot: 'bg-cyan-400',
  },
}

const insightToneMap = {
  emerald: { border: 'border-[#1b334e]', dot: 'bg-emerald-400' },
  rose: { border: 'border-[#3c2743]', dot: 'bg-rose-400' },
  amber: { border: 'border-[#3f3a2d]', dot: 'bg-amber-400' },
  blue: { border: 'border-[#1e3a5f]', dot: 'bg-blue-400' },
  slate: { border: 'border-[#334155]', dot: 'bg-slate-300' },
  teal: { border: 'border-[#153f51]', dot: 'bg-cyan-400' },
}

const moduleToneMap = {
  emerald: {
    rail: 'from-emerald-500 to-cyan-400',
    icon: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-800',
  },
  rose: {
    rail: 'from-rose-500 to-cyan-400',
    icon: 'border-rose-200 bg-rose-50 text-rose-700',
    badge: 'bg-rose-50 text-rose-800',
  },
  amber: {
    rail: 'from-amber-500 to-cyan-400',
    icon: 'border-amber-200 bg-amber-50 text-amber-700',
    badge: 'bg-amber-50 text-amber-800',
  },
  blue: {
    rail: 'from-blue-500 to-cyan-400',
    icon: 'border-blue-200 bg-blue-50 text-blue-700',
    badge: 'bg-blue-50 text-blue-800',
  },
  teal: {
    rail: 'from-cyan-500 to-blue-400',
    icon: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    badge: 'bg-cyan-50 text-cyan-800',
  },
  slate: {
    rail: 'from-slate-500 to-cyan-400',
    icon: 'border-slate-200 bg-slate-100 text-slate-700',
    badge: 'bg-slate-100 text-slate-800',
  },
}

const heroStatusToneMap = {
  emerald: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-50',
  rose: 'border-rose-400/25 bg-rose-400/10 text-rose-50',
  amber: 'border-amber-300/25 bg-amber-300/10 text-amber-50',
}

const getRoleExperience = (role, businessType, businessMeta) => {
  const isShop = businessType === 'shop'
  const isFoodService = businessType === 'restaurant' || businessType === 'cafe'
  const focusedPrimary =
    isShop
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
      secondaryAction: { label: 'Open dashboard', path: '/dashboard' },
    },
    manager: {
      kicker: 'Manager View',
      summary:
        businessType === 'restaurant'
          ? 'Stay on top of tables, kitchen flow, and stock risk while service is active.'
          : businessType === 'cafe'
            ? 'Keep counter speed, regulars, and stock risk visible during rush hours.'
            : businessType === 'shop'
              ? 'Keep checkout speed, stock risk, and due follow-up visible through the retail day.'
              : 'Watch revenue, branch health, and the next bottlenecks before they slow the workspace.',
      primaryAction: { label: 'Open POS', path: '/pos/billing' },
      secondaryAction: { label: 'Check stock', path: '/inventory' },
    },
    accountant: {
      kicker: 'Accountant View',
      summary:
        isShop
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
      secondaryAction: { label: 'Check stock', path: '/inventory' },
    }
  )
}

const OwnerMetricCard = ({ title, value, detail, icon: Icon, tone = 'slate', link, ctaLabel = 'Open details' }) => {
  const palette = ownerCardToneMap[tone] || ownerCardToneMap.slate
  const content = (
    <div className={`group relative overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,#ffffff_0%,#edf4ff_100%)] p-5 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:shadow-[0_34px_70px_-42px_rgba(37,99,235,0.18)] ${palette.border}`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${palette.line}`} />
      <div className="absolute -right-6 top-0 h-24 w-24 rounded-full bg-[#38bdf8]/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${palette.badge}`}>
            {title}
          </span>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-[#0f172a]">{value}</p>
          <p className="mt-3 text-sm leading-6 text-[#52627a]">{detail}</p>
        </div>
        {Icon ? (
          <div className={`rounded-[20px] border p-3 shadow-sm ${palette.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {link ? (
        <div className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
          {ctaLabel}
          <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      ) : null}
    </div>
  )

  return link ? <Link to={link}>{content}</Link> : content
}

const QuickInsightCard = ({ title, value, detail, tone = 'slate', path }) => {
  const palette = insightToneMap[tone] || insightToneMap.slate
  const content = (
    <div className={`group relative overflow-hidden rounded-[26px] border bg-[linear-gradient(180deg,rgba(10,18,34,0.96),rgba(16,29,53,0.98))] p-5 transition ${path ? 'hover:-translate-y-0.5 hover:shadow-[0_26px_56px_-38px_rgba(2,8,23,0.86)]' : ''} ${palette.border}`}>
      <div className="absolute -right-8 top-0 h-20 w-20 rounded-full bg-[#38bdf8]/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
            <p className="text-sm font-semibold text-white">{title}</p>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        {path ? <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#7dd3fc] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> : null}
      </div>
      <p className="relative mt-3 text-sm leading-6 text-[#bfd0e8]">{detail}</p>
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

  const businessType = orgBusinessType || 'shop'
  const isShop = businessType === 'shop'
  const isRestaurant = businessType === 'restaurant'
  const businessMeta = getBusinessMeta(businessType)
  const peoplePath = getCustomerPathForBusiness(businessType)
  const roleExperience = getRoleExperience(userRole, businessType, businessMeta)
  const showFinance = hasPermission('accounting.read')
  const showInvoices = isShop && hasPermission('invoices.read')
  const canReadCustomers = isShop ? hasPermission('customers.read') : hasPermission('pos.customers.read')
  const canReadInventory = hasPermission('inventory.read')
  const canReadPurchases = hasPermission('purchases.read')
  const canReadTables = isRestaurant && hasPermission('pos.tables.read')
  const canReadKitchen = isRestaurant && hasPermission('pos.kitchen.read')
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
          canReadCustomers ? (isShop ? api.get('/customers') : posCustomerApi.list()) : Promise.resolve({ data: { data: [] } }),
          showInvoices ? api.get('/invoices/stats') : Promise.resolve({ data: { data: {} } }),
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
        const finance = getSettledData(results[3], {})
        const transactions = getSettledData(results[4], [])
        const lowStock = getSettledData(results[5], [])
        const purchases = getSettledData(results[6], [])
        const tables = getSettledData(results[7], [])
        const kitchen = getSettledData(results[8], [])

        const failedIndexes = results
          .map((result, index) => (result.status === 'rejected' ? index : null))
          .filter((index) => index !== null)
        const criticalFailed = [0, 5, 6].every((index) => failedIndexes.includes(index))

        setLoadFailed(criticalFailed)
        setPartialLoad(!criticalFailed && failedIndexes.length > 0)

        setOverview({
          sales,
          people: Array.isArray(people) ? people : [],
          invoices,
          finance,
          lowStock: Array.isArray(lowStock) ? lowStock : [],
          purchases: Array.isArray(purchases) ? purchases : [],
          tables: Array.isArray(tables) ? tables : [],
          kitchen: Array.isArray(kitchen) ? kitchen : [],
          transactions: Array.isArray(transactions) ? transactions : [],
          availability: {
            sales: results[0]?.status === 'fulfilled',
            customers: canReadCustomers ? results[1]?.status === 'fulfilled' : false,
            finance: showFinance ? results[3]?.status === 'fulfilled' && results[4]?.status === 'fulfilled' : false,
            inventory: canReadInventory ? results[5]?.status === 'fulfilled' : false,
            purchases: canReadPurchases ? results[6]?.status === 'fulfilled' : false,
            tables: canReadTables ? results[7]?.status === 'fulfilled' : false,
            kitchen: canReadKitchen ? results[8]?.status === 'fulfilled' : false,
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
    isShop,
    reloadKey,
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
        ? `${overview.sales?.todaySales || 0} bills closed today${overview.sales?.todayAverageSale ? ` / Avg ${formatCurrency(overview.sales?.todayAverageSale)}` : ''}`
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
    isShop
      ? [
          { title: 'POS', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'teal', path: '/pos/billing' },
          { title: 'Customer due', metric: overview.availability.customers ? formatCurrency(dueCustomerTotal) : '--', summary: dueCustomers.length > 0 ? `${dueCustomers.length} account${dueCustomers.length === 1 ? '' : 's'} waiting collection` : 'No customer due is pending right now.', icon: Users, tone: 'blue', path: peoplePath },
          { title: 'Stock', metric: `${overview.lowStock.length} low stock`, summary: 'Replenish products before the shelf runs dry', icon: Package, tone: 'amber', path: '/inventory' },
          { title: 'Cash / due', metric: showFinance && overview.availability.finance ? formatCurrency(overview.finance?.balance) : '--', summary: showFinance && overview.availability.finance ? `${formatCurrency(overview.invoices?.unpaidAmount)} still waiting to collect` : 'Open accounting when finance access is available.', icon: FileText, tone: 'emerald', path: '/accounting' },
        ]
      : [
          { title: isRestaurant ? 'Service' : 'Counter', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'teal', path: '/pos/billing' },
          { title: isRestaurant ? 'Guests' : 'Regulars', metric: `${overview.people.length} profiles`, summary: 'Repeat visitors stay close to billing', icon: Users, tone: 'blue', path: peoplePath },
          { title: 'Stock', metric: `${overview.lowStock.length} low stock`, summary: 'Replenish before the next rush', icon: Package, tone: 'amber', path: '/inventory' },
          { title: 'Day close', metric: `${overview.sales?.todaySales || 0} sales`, summary: 'Shifts, wallet totals, and service summaries stay ready for sign-off.', icon: Receipt, tone: 'emerald', path: '/pos/shifts' },
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
      title: 'Customer due',
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
      title: 'Supplier due',
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
      title: 'Restock queue',
      value: overview.availability.inventory ? `${overview.lowStock.length} items` : '--',
      detail: overview.availability.inventory
        ? overview.lowStock.length > 0
          ? `${lowStockPreview || 'Critical items'} need attention soon`
          : 'No low-stock alert is active right now.'
        : 'Inventory alerts are not available in this view.',
      tone: overview.lowStock.length > 0 ? 'amber' : 'emerald',
      path: overview.availability.inventory ? '/inventory' : '',
    },
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
    isShop
      ? { label: 'Review collections', path: '/invoices', description: 'Follow overdue invoices and customer dues.' }
      : { label: 'Close the day', path: '/pos/shifts', description: 'Review shift totals, wallets, and handover before sign-off.' }

  const heroActions = [
    {
      ...roleExperience.primaryAction,
      description: 'Jump into the highest-priority workspace for your role.',
    },
    {
      ...roleExperience.secondaryAction,
      description: 'Keep the next operational decision obvious.',
    },
    supportAction,
  ].filter((action, index, items) => action?.path && items.findIndex(item => item.path === action.path) === index)

  const snapshotRows =
    isShop
      ? [
          { label: 'Sales closed today', value: overview.sales?.todaySales || 0, detail: 'Keep billing pace visible across the day.', path: '/pos/sales' },
          { label: 'Customer accounts', value: overview.people.length, detail: 'Follow dues and repeat sales without extra CRM flow.', path: peoplePath },
          { label: 'Outstanding invoices', value: formatCurrency(overview.invoices?.unpaidAmount), detail: 'Collections stay in focus for the next follow-up.', path: '/invoices' },
        ]
      : [
          { label: 'Sales closed today', value: overview.sales?.todaySales || 0, detail: 'Keep the counter and floor moving through one focused flow.', path: '/pos/sales' },
          { label: isRestaurant ? 'Guest profiles' : 'Regular profiles', value: overview.people.length, detail: 'Repeat guests and loyalty stay easy to reach.', path: peoplePath },
          { label: 'Low-stock alerts', value: overview.lowStock.length, detail: 'Replenishment stays visible before the next rush.', path: '/inventory' },
        ]

  const dashboardDateLabel = new Date().toLocaleDateString('en-NP', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const activitySignal =
    isRestaurant
      ? {
          label: 'Table watch',
          value: canReadTables && overview.availability.tables ? `${openTables.length}` : '--',
          detail:
            canReadTables && overview.availability.tables
              ? billingReadyTables.length > 0
                ? `${billingReadyTables.length} ready to bill`
                : `${reservedTables.length} reserved for service`
              : 'Table activity is not available right now.',
          tone: 'rose',
        }
      : isShop
        ? {
            label: 'Customer due',
            value: overview.availability.customers ? formatCurrency(dueCustomerTotal) : '--',
            detail:
              overview.availability.customers
                ? dueCustomers.length > 0
                  ? `${dueCustomers.length} due account${dueCustomers.length === 1 ? '' : 's'} still open`
                  : 'No customer due is waiting right now.'
                : 'Customer follow-up is not available right now.',
            tone: 'rose',
          }
        : canReadKitchen && overview.availability.kitchen
          ? {
              label: 'Kitchen watch',
              value: `${pendingKitchenOrders.length}`,
              detail:
                readyKitchenOrders.length > 0
                  ? `${readyKitchenOrders.length} ready to serve`
                  : 'Kitchen board is clear for now.',
              tone: 'rose',
            }
          : {
              label: 'Counter watch',
              value: overview.availability.sales ? `${overview.sales?.todaySales || 0}` : '--',
              detail:
                overview.availability.sales
                  ? overview.sales?.todayAverageSale
                    ? `Average bill ${formatCurrency(overview.sales?.todayAverageSale)}`
                    : 'Keep billing pace steady through the day.'
                  : 'Billing activity is not available right now.',
              tone: 'rose',
            }

  const topSignalCards = [
    {
      label: 'Today sales',
      value: overview.availability.sales ? formatCurrency(overview.sales?.todayRevenue) : '--',
      detail: overview.availability.sales ? `${overview.sales?.todaySales || 0} bills closed today` : 'Waiting for billing activity.',
      tone: 'emerald',
    },
    {
      label: showFinance ? 'Cash & due' : isShop ? 'Customer due' : 'Profiles',
      value:
        showFinance
          ? overview.availability.finance
            ? formatCurrency(overview.finance?.balance)
            : '--'
          : overview.availability.customers
            ? `${overview.people.length}`
            : '--',
      detail:
        showFinance
          ? overview.availability.finance
            ? `${formatCurrency(todayExpenseTotal)} expense recorded today`
            : 'Accounting visibility is not ready yet.'
          : overview.availability.customers
            ? `${dueCustomers.length} account${dueCustomers.length === 1 ? '' : 's'} with due`
            : 'Customer visibility is not ready yet.',
      tone: 'blue',
    },
    activitySignal,
    {
      label: 'Low stock',
      value: overview.availability.inventory ? `${overview.lowStock.length}` : '--',
      detail:
        overview.availability.inventory
          ? overview.lowStock.length > 0
            ? lowStockPreview || 'Critical items need refill'
            : 'No active stock alert right now.'
          : 'Inventory visibility is not available right now.',
      tone: 'amber',
    },
  ]

  const heroStatusTone =
    partialLoad
      ? 'amber'
      : overview.lowStock.length > 0 || dueCustomers.length > 0 || pendingKitchenOrders.length > 0
        ? 'rose'
        : 'emerald'

  const heroStatusTitle =
    partialLoad
      ? 'Some live counters are still syncing.'
      : heroStatusTone === 'rose'
        ? 'A few hotspots need owner attention.'
        : 'The counter looks balanced for the day.'

  const heroStatusDetail =
    partialLoad
      ? 'Sales, inventory, and finance are partly available. The visible cards below are still safe to use.'
      : overview.lowStock.length > 0
        ? `${overview.lowStock.length} stock alert${overview.lowStock.length === 1 ? '' : 's'} should be checked before the next rush.`
        : dueCustomers.length > 0
          ? `${dueCustomers.length} customer due${dueCustomers.length === 1 ? '' : 's'} are still open for follow-up.`
          : pendingKitchenOrders.length > 0
            ? `${pendingKitchenOrders.length} kitchen order${pendingKitchenOrders.length === 1 ? '' : 's'} are waiting on the board.`
            : 'Sales, cash, customers, and stock are all reading cleanly from one place.'

  const ownerRuleCopy =
    isRestaurant
      ? 'If tables, kitchen, cash, and stock are not obvious in one glance, the service floor will feel harder than it should.'
      : isShop
        ? 'If sales, collection, stock, and buying are not obvious in one glance, the counter team will end up searching instead of selling.'
        : 'If counter pace, regulars, cash, and stock are not obvious in one glance, the day close will get messy fast.'

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
      <section className="relative overflow-hidden rounded-[36px] border border-[#22385e] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.18),transparent_32%),linear-gradient(135deg,#09111f_0%,#0f1b31_45%,#152542_100%)] p-6 text-white shadow-[0_40px_100px_-58px_rgba(2,8,23,0.9)] sm:p-8">
        <div className="absolute inset-0 subtle-grid opacity-10 mix-blend-screen" />
        <div className="absolute -left-14 top-0 h-56 w-56 rounded-full bg-[#2563eb]/18 blur-3xl" />
        <div className="absolute right-0 top-8 h-64 w-64 rounded-full bg-[#06b6d4]/18 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.18fr,0.82fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#dbeafe]">
                {roleExperience.kicker}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-[#c9dbf5]">
                {dashboardDateLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-[#c9dbf5]">
                {userData?.username || 'Operator'}
              </span>
              <span className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-[#bff6ff]">
                {businessMeta.statusPill}
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                {currentOrgName || 'My Business'} {headline}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#bfd0e8] sm:text-base">{roleExperience.summary}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {heroActions.map(action => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="group rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{action.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[#bfd0e8]">{action.description}</p>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#7dd3fc] transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-[30px] border p-5 backdrop-blur ${heroStatusToneMap[heroStatusTone] || heroStatusToneMap.emerald}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#dbeafe]">Owner Status</p>
                  <h2 className="mt-3 text-xl font-semibold text-white">{heroStatusTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#cfe0f6]">{heroStatusDetail}</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dbeafe]">
                  Owner View
                </span>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Live Summary</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Quick scan for today&apos;s operations.</h2>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dbeafe]">
                  Live
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {topSignalCards.map(item => {
                  const palette = ownerCardToneMap[item.tone] || ownerCardToneMap.slate

                  return (
                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dbeafe]">{item.label}</p>
                      </div>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-[#bfd0e8]">{item.detail}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2563eb]">Business Snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-3xl">
              Keep the core numbers in one clear working band.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#51627d]">
              Sales, expenses, cash, dues, stock, and buying should stay visible in one clean business view.
            </p>
          </div>
          <div className={`rounded-[20px] border px-4 py-3 text-sm ${partialLoad ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-[#dbe5f4] bg-white/80 text-[#51627d]'}`}>
            {partialLoad
              ? 'Some live counters are still catching up. The visible cards below are safe to use.'
              : 'Updated from live billing, accounting, customer, inventory, purchase, and service activity.'}
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

      <section className="grid gap-6 xl:grid-cols-[1.22fr,0.78fr]">
        <div className="panel border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2563eb]">Main Areas</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a]">
                Keep the main work areas one click away.
              </h2>
            </div>
            <Link to="/settings" className="text-sm font-semibold text-[#0f172a]">
              Open settings
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {operationalCards.map(card => {
              const Icon = card.icon
              const palette = moduleToneMap[card.tone] || moduleToneMap.slate

              return (
                <Link
                  key={card.title}
                  to={card.path}
                  className="group relative overflow-hidden rounded-[28px] border border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] p-5 shadow-[0_24px_52px_-42px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-[0_30px_60px_-40px_rgba(37,99,235,0.16)]"
                >
                  <div className={`absolute inset-y-5 left-0 w-1 rounded-r-full bg-gradient-to-b ${palette.rail}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.badge}`}>
                        {card.title}
                      </span>
                      <p className="mt-4 text-2xl font-semibold tracking-tight text-[#0f172a]">{card.metric}</p>
                      <p className="mt-3 text-sm leading-6 text-[#51627d]">{card.summary}</p>
                    </div>
                    <div className={`rounded-[20px] border p-3 ${palette.icon}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                    Work here
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#22385e] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_36%),linear-gradient(180deg,#0a1222_0%,#12213b_100%)] p-6 shadow-[0_34px_80px_-52px_rgba(2,8,23,0.92)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">Priority Watchlist</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Keep the next work items obvious.</h2>
          <p className="mt-3 text-sm leading-6 text-[#bfd0e8]">
            Collections, stock, purchases, and service pressure should surface without hunting through menus.
          </p>

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

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-[#7dd3fc]" />
              <div>
                <p className="text-sm font-semibold text-white">Owner rule</p>
                <p className="mt-2 text-sm leading-6 text-[#bfd0e8]">{ownerRuleCopy}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        {showFinance ? (
          <div className="panel border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2563eb]">Daily Ledger</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a]">
                  Cash movement should read like a clean ledger.
                </h2>
              </div>
              <Link to="/accounting" className="text-sm font-semibold text-[#0f172a]">
                Open accounting
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {overview.transactions.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[#bfd7f8] bg-[#f5f9ff] p-8 text-center">
                  <p className="text-base font-semibold text-[#0f172a]">No accounting activity yet</p>
                  <p className="mt-2 text-sm leading-6 text-[#51627d]">
                    Start recording income and expenses so the dashboard can show live business health.
                  </p>
                  <Link to="/accounting" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                    Add transaction
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                overview.transactions.slice(0, 5).map(transaction => {
                  const isIncome = transaction.type === 'income'

                  return (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between gap-4 rounded-[26px] border border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-[18px] border p-3 ${isIncome ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                          {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0f172a]">{transaction.description}</p>
                          <p className="mt-1 text-sm text-[#51627d]">{transaction.category || 'Uncategorized'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-base font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </p>
                        <p className="mt-1 text-sm text-[#51627d]">
                          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="panel border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2563eb]">Daily Snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a]">
                  Keep the daily picture tight and easy to scan.
                </h2>
              </div>
              <Link to="/inventory" className="text-sm font-semibold text-[#0f172a]">
                Open inventory
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {snapshotRows.map(row => (
                <Link
                  key={row.label}
                  to={row.path}
                  className="block rounded-[26px] border border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] p-5 transition hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-[0_24px_48px_-36px_rgba(37,99,235,0.16)]"
                >
                  <p className="text-sm text-[#2563eb]">{row.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a]">{row.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#51627d]">{row.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="panel border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] p-6">
          <div className="grid gap-6 xl:grid-cols-[1.12fr,0.88fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2563eb]">Business Setup</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a]">{businessMeta.spotlightTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-[#51627d]">{businessMeta.spotlightSummary}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[#dbe5f4] bg-white/85 px-3 py-1 text-sm text-[#2563eb]">
                  {businessMeta.productName}
                </span>
                <span className="inline-flex items-center rounded-full border border-[#dbe5f4] bg-white/85 px-3 py-1 text-sm text-[#2563eb]">
                  {businessMeta.statusPill}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/pos"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111f38]"
                >
                  Open POS
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#dbe5f4] px-4 py-2.5 text-sm font-semibold text-[#51627d] transition hover:bg-white/80"
                >
                  Open settings
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {heroActions.slice(0, 2).map(action => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="group rounded-[28px] border border-[#dbe5f4] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] p-5 transition hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-[0_24px_48px_-36px_rgba(37,99,235,0.16)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-[#0f172a]">{action.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[#51627d]">{action.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#2563eb] transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
