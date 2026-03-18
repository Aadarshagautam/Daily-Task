import React, { useContext, useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Download,
  Package,
  Printer,
  Receipt,
  RefreshCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import StatePanel from '../components/StatePanel.jsx'
import {
  DataTableShell,
  EmptyCard,
  FieldLabel,
  KpiCard,
  ListRow,
  PageHeader,
  SearchField,
  SectionCard,
  StatusBadge,
  WorkspacePage,
} from '../components/ui/ErpPrimitives.jsx'
import AppContext from '../context/app-context.js'
import api from '../lib/api.js'
import {
  PAYMENT_METHOD_LABELS,
  formatCurrencyNpr,
  formatDateNepal,
  formatDateTimeNepal,
} from '../utils/nepal.js'

const REPORT_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'month', label: 'This month' },
]

const businessDescriptions = {
  shop: 'Track daily sales, purchase cost, stock pressure, and customer dues without accounting-heavy language.',
  restaurant:
    'See service sales, expenses, purchases, and stock pressure in one clean daily view for restaurant owners in Nepal.',
  cafe: 'Keep counter sales, daily expense, low stock, and customer dues easy to scan before the next rush.',
  general: 'Simple business reports for Nepal owners who want fast answers, not cluttered analytics.',
}

const emptySummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  salesSummary: {
    totalSales: 0,
    totalPaid: 0,
    totalDue: 0,
    totalRefunds: 0,
    count: 0,
  },
  purchaseSummary: {
    totalPurchases: 0,
    totalPaid: 0,
    totalDue: 0,
    totalCredit: 0,
    count: 0,
  },
  dueSummary: {
    receivable: 0,
    payable: 0,
  },
  cashSummary: {
    totalIn: 0,
    totalOut: 0,
    net: 0,
    byMethod: {},
  },
}

const emptyReportData = {
  summary: emptySummary,
  transactions: [],
  inventory: [],
  purchases: [],
  customers: [],
  invoices: [],
  posSales: [],
}

const asNumber = (value) => Number(value) || 0

const formatCount = (value) =>
  asNumber(value).toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const formatQuantity = (value) =>
  asNumber(value).toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const formatTitle = (value) =>
  String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const formatPaymentLabel = (method) => PAYMENT_METHOD_LABELS[method] || formatTitle(method || 'other')

const getPayload = (response, fallback) => {
  if (response?.data?.data !== undefined) return response.data.data
  if (response?.data !== undefined) return response.data
  return fallback
}

const normalizeSummary = (summary) => ({
  ...emptySummary,
  ...(summary || {}),
  salesSummary: {
    ...emptySummary.salesSummary,
    ...(summary?.salesSummary || {}),
  },
  purchaseSummary: {
    ...emptySummary.purchaseSummary,
    ...(summary?.purchaseSummary || {}),
  },
  dueSummary: {
    ...emptySummary.dueSummary,
    ...(summary?.dueSummary || {}),
  },
  cashSummary: {
    ...emptySummary.cashSummary,
    ...(summary?.cashSummary || {}),
    byMethod: summary?.cashSummary?.byMethod || {},
  },
})

const toInputDate = (value = new Date()) => {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

const buildRangeFromPreset = (presetKey) => {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  if (presetKey === 'today') {
    const value = toInputDate(today)
    return { startDate: value, endDate: value }
  }

  if (presetKey === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const value = toInputDate(yesterday)
    return { startDate: value, endDate: value }
  }

  if (presetKey === 'last7') {
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return {
      startDate: toInputDate(start),
      endDate: toInputDate(today),
    }
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    startDate: toInputDate(start),
    endDate: toInputDate(today),
  }
}

const isWithinDateRange = (value, startDate, endDate) => {
  if (!value) return false

  const current = new Date(value)
  if (Number.isNaN(current.getTime())) return false

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return current >= start && current <= end
}

const compareDatesDesc = (left, right) =>
  new Date(right || 0).getTime() - new Date(left || 0).getTime()

const getRangeLabel = (startDate, endDate) => {
  if (!startDate && !endDate) return 'No date selected'
  if (startDate === endDate) return formatDateNepal(startDate)
  return `${formatDateNepal(startDate)} to ${formatDateNepal(endDate)}`
}

const toCsvCell = (value) => {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

const downloadCsv = (filename, sections) => {
  const lines = []

  sections.forEach((section, index) => {
    if (index > 0) lines.push('')
    lines.push(toCsvCell(section.title))
    lines.push(section.columns.map(toCsvCell).join(','))
    section.rows.forEach((row) => {
      lines.push(row.map(toCsvCell).join(','))
    })
  })

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const getInventoryStatusMeta = (item) => {
  const quantity = asNumber(item.quantity)
  const reorderLevel = asNumber(item.lowStockAlert)

  if (quantity <= 0) {
    return {
      key: 'out',
      label: 'Out of stock',
      tone: 'rose',
      rowClass: 'bg-rose-50/70',
      helper:
        reorderLevel > 0
          ? `Reorder target: ${formatQuantity(reorderLevel)}`
          : 'Restock this item soon',
    }
  }

  if (reorderLevel > 0 && quantity <= reorderLevel) {
    const shortfall = Math.max(reorderLevel - quantity, 0)
    return {
      key: 'low',
      label: 'Low stock',
      tone: 'amber',
      rowClass: 'bg-amber-50/70',
      helper:
        shortfall > 0
          ? `${formatQuantity(shortfall)} below reorder level`
          : 'At reorder level',
    }
  }

  return {
    key: 'healthy',
    label: 'Healthy',
    tone: 'emerald',
    rowClass: '',
    helper: 'Stock level looks stable',
  }
}

const getTopCategory = (categoryMap) => {
  const entries = Object.entries(categoryMap || {})
  if (!entries.length) return 'General'
  entries.sort((left, right) => right[1] - left[1])
  return entries[0][0]
}

const sumItemQuantity = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (total, item) => total + asNumber(item?.qty ?? item?.quantity),
    0
  )

const buildDailySalesRows = (salesDocuments) => {
  const dailySalesMap = new Map()

  salesDocuments.forEach((sale) => {
    const dateKey = toInputDate(sale.date)
    const existing = dailySalesMap.get(dateKey) || {
      dateKey,
      salesCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      counterSales: 0,
      invoiceSales: 0,
    }

    existing.salesCount += 1
    existing.totalAmount += sale.totalAmount
    existing.paidAmount += sale.paidAmount
    existing.dueAmount += sale.dueAmount

    if (sale.source === 'Counter sale') existing.counterSales += 1
    if (sale.source === 'Invoice') existing.invoiceSales += 1

    dailySalesMap.set(dateKey, existing)
  })

  return Array.from(dailySalesMap.values()).sort((left, right) =>
    compareDatesDesc(left.dateKey, right.dateKey)
  )
}

const buildDailyExpenseRows = (expenseRows) => {
  const dailyExpenseMap = new Map()

  expenseRows.forEach((expense) => {
    const dateKey = toInputDate(expense.date)
    const existing = dailyExpenseMap.get(dateKey) || {
      dateKey,
      entryCount: 0,
      totalAmount: 0,
      categories: {},
    }

    existing.entryCount += 1
    existing.totalAmount += expense.amount
    existing.categories[expense.category] = (existing.categories[expense.category] || 0) + expense.amount

    dailyExpenseMap.set(dateKey, existing)
  })

  return Array.from(dailyExpenseMap.values())
    .map((row) => ({
      ...row,
      topCategory: getTopCategory(row.categories),
    }))
    .sort((left, right) => compareDatesDesc(left.dateKey, right.dateKey))
}

const fetchAllPosSales = async ({ startDate, endDate }) => {
  const records = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await api.get('/pos/sales', {
      params: {
        page,
        limit: 200,
        startDate,
        endDate,
      },
    })

    const payload = getPayload(response, {})
    const sales = Array.isArray(payload?.sales)
      ? payload.sales
      : Array.isArray(payload)
        ? payload
        : []

    records.push(...sales)

    totalPages = Math.max(asNumber(payload?.pagination?.pages), 1)
    if (!sales.length) break

    page += 1
  }

  return records
}

const FilterPresetButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      active
        ? 'rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800'
        : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900'
    }
  >
    {children}
  </button>
)

const FilterSelect = ({ label, value, onChange, children }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <select value={value} onChange={onChange} className="input-primary">
      {children}
    </select>
  </div>
)

const ActionButton = ({
  variant = 'secondary',
  icon: Icon,
  children,
  className = '',
  ...props
}) => (
  <button
    type="button"
    className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${className}`}
    {...props}
  >
    {Icon ? <Icon className="h-4 w-4" /> : null}
    {children}
  </button>
)

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="panel h-40 animate-pulse rounded-3xl bg-slate-100" />
      ))}
    </div>
  </div>
)

export default function ReportsPage() {
  const { hasPermission, orgBusinessType } = useContext(AppContext)
  const businessType = orgBusinessType || 'general'
  const [activePreset, setActivePreset] = useState('month')
  const [dateRange, setDateRange] = useState(() => buildRangeFromPreset('month'))
  const [reportType, setReportType] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [reportData, setReportData] = useState(emptyReportData)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [warnings, setWarnings] = useState([])
  const [reloadToken, setReloadToken] = useState(0)

  const canReadAccounting = hasPermission('accounting.read')
  const canReadInventory = hasPermission('inventory.read')
  const canReadPurchases = hasPermission('purchases.read')
  const canReadCustomers = hasPermission('customers.read')
  const canReadInvoices = hasPermission('invoices.read')
  const canReadPosSales = hasPermission('pos.sales.read')

  const canViewSales = canReadInvoices || canReadPosSales
  const canViewPayments = canReadAccounting || canReadInvoices || canReadPosSales || canReadPurchases
  const canViewExpenses = canReadAccounting
  const canViewPurchases = canReadPurchases
  const canViewInventory = canReadInventory
  const canViewCustomerDue = canReadInvoices || canReadCustomers
  const canViewTopSelling = canReadInvoices || canReadPosSales
  const hasAnyReportAccess =
    canViewSales ||
    canViewPayments ||
    canViewExpenses ||
    canViewPurchases ||
    canViewInventory ||
    canViewCustomerDue ||
    canViewTopSelling

  useEffect(() => {
    let active = true

    const loadReports = async () => {
      if (!hasAnyReportAccess) {
        setReportData(emptyReportData)
        setWarnings([])
        setLoadError('')
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadError('')

      const requests = [
        canReadAccounting
          ? {
              key: 'summary',
              label: 'sales and cash summary',
              run: () =>
                api.get('/transactions/summary', {
                  params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                  },
                }),
            }
          : null,
        canReadAccounting
          ? {
              key: 'transactions',
              label: 'expense entries',
              run: () =>
                api.get('/transactions', {
                  params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                  },
                }),
            }
          : null,
        canReadInventory
          ? {
              key: 'inventory',
              label: 'inventory stock',
              run: () => api.get('/inventory'),
            }
          : null,
        canReadPurchases
          ? {
              key: 'purchases',
              label: 'purchase records',
              run: () => api.get('/purchases'),
            }
          : null,
        canReadCustomers
          ? {
              key: 'customers',
              label: 'customer balances',
              run: () => api.get('/customers'),
            }
          : null,
        canReadInvoices
          ? {
              key: 'invoices',
              label: 'invoice records',
              run: () => api.get('/invoices'),
            }
          : null,
        canReadPosSales
          ? {
              key: 'posSales',
              label: 'counter sales',
              run: () =>
                fetchAllPosSales({
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                }),
            }
          : null,
      ].filter(Boolean)

      try {
        const results = await Promise.allSettled(requests.map((request) => request.run()))
        if (!active) return

        const nextWarnings = []
        const nextData = {
          summary: emptySummary,
          transactions: [],
          inventory: [],
          purchases: [],
          customers: [],
          invoices: [],
          posSales: [],
        }

        let rejectedCount = 0

        results.forEach((result, index) => {
          const request = requests[index]

          if (result.status === 'rejected') {
            rejectedCount += 1
            nextWarnings.push(request.label)
            return
          }

          if (request.key === 'summary') {
            nextData.summary = normalizeSummary(getPayload(result.value, emptySummary))
            return
          }

          const payload = getPayload(result.value, [])

          if (request.key === 'posSales') {
            nextData.posSales = Array.isArray(payload) ? payload : []
            return
          }

          nextData[request.key] = Array.isArray(payload) ? payload : []
        })

        setReportData(nextData)
        setWarnings(nextWarnings)

        if (rejectedCount === requests.length) {
          setLoadError('Unable to load reports right now. Please try again.')
          toast.error('Unable to load reports right now')
        }
      } catch (error) {
        if (!active) return
        setLoadError('Unable to load reports right now. Please try again.')
        toast.error(error.response?.data?.message || 'Unable to load reports')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadReports()

    return () => {
      active = false
    }
  }, [
    canReadAccounting,
    canReadCustomers,
    canReadInventory,
    canReadInvoices,
    canReadPosSales,
    canReadPurchases,
    dateRange.endDate,
    dateRange.startDate,
    hasAnyReportAccess,
    reloadToken,
  ])

  const summary = normalizeSummary(reportData.summary)
  const inventoryItems = Array.isArray(reportData.inventory) ? reportData.inventory : []
  const purchases = Array.isArray(reportData.purchases) ? reportData.purchases : []
  const transactions = Array.isArray(reportData.transactions) ? reportData.transactions : []
  const customers = Array.isArray(reportData.customers) ? reportData.customers : []
  const invoices = Array.isArray(reportData.invoices) ? reportData.invoices : []
  const posSales = Array.isArray(reportData.posSales) ? reportData.posSales : []

  const filteredPurchases = purchases
    .filter((purchase) =>
      isWithinDateRange(purchase.purchaseDate || purchase.createdAt, dateRange.startDate, dateRange.endDate)
    )
    .map((purchase) => {
      const totalAmount = Math.max(
        asNumber(purchase.totalAmount) - asNumber(purchase.returnedAmount),
        0
      )
      const paidAmount = asNumber(purchase.paidAmount)
      const outstandingAmount =
        asNumber(purchase.outstandingAmount) || Math.max(totalAmount - paidAmount, 0)

      return {
        id: purchase._id || purchase.id || `${purchase.supplierName}-${purchase.purchaseDate}`,
        supplierName: purchase.supplierName || 'Supplier',
        productName: purchase.productName || 'Purchase item',
        quantity: asNumber(purchase.quantity),
        totalAmount,
        paidAmount,
        outstandingAmount,
        paymentMethod: purchase.paymentMethod || 'cash',
        purchaseDate: purchase.purchaseDate || purchase.createdAt,
      }
    })
    .sort((left, right) => compareDatesDesc(left.purchaseDate, right.purchaseDate))

  const filteredInvoices = invoices.filter((invoice) =>
    isWithinDateRange(invoice.issueDate || invoice.createdAt, dateRange.startDate, dateRange.endDate)
  )

  const filteredPosSales = posSales
    .filter((sale) =>
      isWithinDateRange(sale.createdAt || sale.updatedAt, dateRange.startDate, dateRange.endDate)
    )
    .sort((left, right) => compareDatesDesc(left.createdAt, right.createdAt))

  const salesDocuments = [
    ...filteredInvoices
      .filter((invoice) => !['draft', 'cancelled'].includes(String(invoice.status || '').toLowerCase()))
      .map((invoice) => {
        const totalAmount = asNumber(invoice.grandTotal)
        const paidAmount =
          invoice.paidAmount !== undefined
            ? asNumber(invoice.paidAmount)
            : String(invoice.status || '').toLowerCase() === 'paid'
              ? totalAmount
              : 0
        const dueAmount =
          invoice.dueAmount !== undefined
            ? asNumber(invoice.dueAmount)
            : invoice.balanceDue !== undefined
              ? asNumber(invoice.balanceDue)
              : Math.max(totalAmount - paidAmount, 0)

        return {
          id: invoice._id || invoice.id || invoice.invoiceNumber,
          source: 'Invoice',
          date: invoice.issueDate || invoice.createdAt,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentMethod: invoice.paymentMethod || 'other',
          payments: [],
          items: Array.isArray(invoice.items) ? invoice.items : [],
        }
      }),
    ...filteredPosSales
      .filter((sale) => String(sale.status || '').toLowerCase() !== 'refund')
      .map((sale) => ({
        id: sale._id || sale.id || sale.invoiceNo,
        source: 'Counter sale',
        date: sale.createdAt,
        totalAmount: asNumber(sale.grandTotal),
        paidAmount:
          sale.paidAmount !== undefined ? asNumber(sale.paidAmount) : asNumber(sale.grandTotal),
        dueAmount: asNumber(sale.dueAmount),
        paymentMethod:
          sale.paymentMethod ||
          sale.paymentMode ||
          sale.payments?.[0]?.method ||
          'cash',
        payments: Array.isArray(sale.payments) ? sale.payments : [],
        items: Array.isArray(sale.items) ? sale.items : [],
      })),
  ].sort((left, right) => compareDatesDesc(left.date, right.date))

  const expenseRows = transactions
    .filter((entry) => {
      const type = String(entry.type || '').toLowerCase()
      const sourceType = String(entry.sourceType || '').toLowerCase()
      const entryKind = String(entry.entryKind || '').toLowerCase()
      const entryState = String(entry.entryState || entry.status || '').toLowerCase()

      return (
        type === 'expense' &&
        sourceType !== 'purchase' &&
        entryKind !== 'pos_sale_refund' &&
        entryState !== 'cancelled' &&
        isWithinDateRange(entry.date || entry.createdAt, dateRange.startDate, dateRange.endDate)
      )
    })
    .map((entry) => ({
      id: entry._id || entry.id || `${entry.category}-${entry.date}`,
      date: entry.date || entry.createdAt,
      category: entry.category || 'Expense',
      amount: asNumber(entry.amount),
      paymentMethod: entry.paymentMethod || 'cash',
    }))
    .sort((left, right) => compareDatesDesc(left.date, right.date))

  const dailySalesRows = buildDailySalesRows(salesDocuments)
  const dailyExpenseRows = buildDailyExpenseRows(expenseRows)

  const inventoryRows = inventoryItems
    .map((item) => {
      const status = getInventoryStatusMeta(item)
      return {
        id: item._id || item.id || item.sku || item.productName,
        productName: item.productName || 'Inventory item',
        sku: item.sku || item.barcode || '-',
        category: item.category || 'Uncategorized',
        quantity: asNumber(item.quantity),
        reorderLevel: asNumber(item.lowStockAlert),
        status,
        stockValue: asNumber(item.quantity) * asNumber(item.costPrice),
        updatedAt: item.updatedAt || item.createdAt,
      }
    })
    .sort((left, right) => {
      const priority = { out: 0, low: 1, healthy: 2 }
      const leftPriority = priority[left.status.key] ?? 3
      const rightPriority = priority[right.status.key] ?? 3

      if (leftPriority !== rightPriority) return leftPriority - rightPriority
      return compareDatesDesc(left.updatedAt, right.updatedAt)
    })

  const lowStockRows = inventoryRows.filter(
    (row) => row.status.key === 'out' || row.status.key === 'low'
  )

  const inventorySnapshotRows = inventoryRows.slice(0, 10)

  const dueMap = new Map()

  filteredInvoices
    .filter((invoice) => ['sent', 'overdue'].includes(String(invoice.status || '').toLowerCase()))
    .forEach((invoice) => {
      const totalAmount = asNumber(invoice.grandTotal)
      const paidAmount = asNumber(invoice.paidAmount)
      const dueAmount =
        invoice.dueAmount !== undefined
          ? asNumber(invoice.dueAmount)
          : invoice.balanceDue !== undefined
            ? asNumber(invoice.balanceDue)
            : Math.max(totalAmount - paidAmount, 0)

      if (dueAmount <= 0) return

      const key =
        invoice.customerId ||
        invoice.customerName ||
        invoice.customerPhone ||
        invoice.invoiceNumber ||
        invoice._id

      const existing = dueMap.get(key) || {
        key,
        name: invoice.customerName || 'Customer',
        phone: invoice.customerPhone || '',
        invoiceCount: 0,
        invoiceDue: 0,
        ledgerDue: 0,
        lastFollowUpDate: invoice.dueDate || invoice.issueDate || invoice.createdAt,
      }

      existing.name = invoice.customerName || existing.name
      existing.phone = invoice.customerPhone || existing.phone
      existing.invoiceCount += 1
      existing.invoiceDue += dueAmount
      existing.lastFollowUpDate = invoice.dueDate || invoice.issueDate || existing.lastFollowUpDate

      dueMap.set(key, existing)
    })

  customers.forEach((customer) => {
    const ledgerDue = asNumber(customer.creditBalance)
    if (ledgerDue <= 0) return

    const key =
      customer._id ||
      customer.id ||
      customer.name ||
      customer.phone ||
      customer.company

    const existing = dueMap.get(key) || {
      key,
      name: customer.name || customer.company || 'Customer',
      phone: customer.phone || '',
      invoiceCount: 0,
      invoiceDue: 0,
      ledgerDue: 0,
      lastFollowUpDate: customer.lastSaleAt || customer.updatedAt || customer.createdAt,
    }

    existing.name = customer.name || customer.company || existing.name
    existing.phone = customer.phone || existing.phone
    existing.ledgerDue = Math.max(existing.ledgerDue, ledgerDue)
    existing.lastFollowUpDate =
      customer.lastSaleAt ||
      customer.updatedAt ||
      customer.createdAt ||
      existing.lastFollowUpDate

    dueMap.set(key, existing)
  })

  const customerDueRows = Array.from(dueMap.values())
    .map((row) => ({
      ...row,
      totalDue: row.invoiceDue > 0 ? Math.max(row.invoiceDue, row.ledgerDue) : row.ledgerDue,
    }))
    .filter((row) => row.totalDue > 0)
    .sort((left, right) => right.totalDue - left.totalDue)

  const topSellingMap = new Map()

  salesDocuments.forEach((sale) => {
    const items = Array.isArray(sale.items) ? sale.items : []

    items.forEach((item) => {
      const quantity = asNumber(item.qty ?? item.quantity)
      if (quantity <= 0) return

      const amount =
        item.lineTotal ??
        item.total ??
        item.amount ??
        quantity * asNumber(item.price ?? item.unitPrice)

      const key =
        item.productId ||
        item.nameSnapshot ||
        item.productName ||
        item.skuSnapshot ||
        item.sku

      const existing = topSellingMap.get(key) || {
        key,
        name:
          item.nameSnapshot ||
          item.productName ||
          item.title ||
          'Product',
        sku: item.skuSnapshot || item.sku || '-',
        quantity: 0,
        amount: 0,
      }

      existing.quantity += quantity
      existing.amount += asNumber(amount)

      topSellingMap.set(key, existing)
    })
  })

  const topSellingRows = Array.from(topSellingMap.values())
    .sort((left, right) => {
      if (right.quantity !== left.quantity) return right.quantity - left.quantity
      return right.amount - left.amount
    })
    .slice(0, 10)

  const paymentRowsFromSummary = Object.entries(summary.cashSummary.byMethod || {})
    .map(([method, totals]) => ({
      key: method,
      label: formatPaymentLabel(method),
      in: asNumber(totals?.in),
      out: asNumber(totals?.out),
      net: asNumber(totals?.net),
    }))
    .filter((row) => row.in > 0 || row.out > 0 || row.net !== 0)
    .sort((left, right) => right.in - left.in)

  const fallbackPaymentMap = new Map()

  const addPayment = (method, amount, direction = 'in') => {
    const normalizedMethod = String(method || 'other').toLowerCase()
    const numericAmount = asNumber(amount)
    if (numericAmount <= 0) return

    const existing = fallbackPaymentMap.get(normalizedMethod) || {
      key: normalizedMethod,
      label: formatPaymentLabel(normalizedMethod),
      in: 0,
      out: 0,
      net: 0,
    }

    existing[direction] += numericAmount
    existing.net = existing.in - existing.out

    fallbackPaymentMap.set(normalizedMethod, existing)
  }

  salesDocuments.forEach((sale) => {
    if (Array.isArray(sale.payments) && sale.payments.length > 0) {
      sale.payments.forEach((payment) => {
        addPayment(payment.method, payment.amount, 'in')
      })
      return
    }

    addPayment(sale.paymentMethod, sale.paidAmount, 'in')
  })

  filteredPurchases.forEach((purchase) =>
    addPayment(purchase.paymentMethod, purchase.paidAmount, 'out')
  )
  expenseRows.forEach((expense) => addPayment(expense.paymentMethod, expense.amount, 'out'))

  const paymentRows =
    paymentRowsFromSummary.length > 0
      ? paymentRowsFromSummary
      : Array.from(fallbackPaymentMap.values()).sort((left, right) => right.in - left.in)

  const reportTypeOptions = [
    { value: 'all', label: 'All reports' },
    canViewSales ? { value: 'sales', label: 'Daily sales' } : null,
    canViewPayments ? { value: 'payments', label: 'Payment summary' } : null,
    canViewExpenses ? { value: 'expenses', label: 'Daily expenses' } : null,
    canViewPurchases ? { value: 'purchases', label: 'Purchases' } : null,
    canViewInventory ? { value: 'inventory', label: 'Inventory' } : null,
    canViewInventory ? { value: 'low_stock', label: 'Low stock' } : null,
    canViewCustomerDue ? { value: 'customer_due', label: 'Customer due' } : null,
    canViewTopSelling ? { value: 'top_selling', label: 'Top selling' } : null,
  ].filter(Boolean)

  const paymentMethodOptions = Array.from(
    new Map(
      [
        ...paymentRows.map((row) => [row.key, row.label]),
        ...salesDocuments.map((sale) => [String(sale.paymentMethod || 'other').toLowerCase(), formatPaymentLabel(sale.paymentMethod)]),
        ...filteredPurchases.map((purchase) => [String(purchase.paymentMethod || 'other').toLowerCase(), formatPaymentLabel(purchase.paymentMethod)]),
        ...expenseRows.map((expense) => [String(expense.paymentMethod || 'other').toLowerCase(), formatPaymentLabel(expense.paymentMethod)]),
      ].filter(([key]) => Boolean(key))
    ).entries()
  )
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label))

  const categoryOptions = Array.from(
    new Set(
      inventoryRows
        .map((row) => row.category)
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const matchesSearch = (...values) =>
    normalizedSearch === '' ||
    values.some((value) => String(value || '').toLowerCase().includes(normalizedSearch))

  const matchesPaymentFilter = (method, payments = []) => {
    if (paymentFilter === 'all') return true

    if (Array.isArray(payments) && payments.length > 0) {
      return payments.some(
        (payment) => String(payment?.method || '').toLowerCase() === paymentFilter
      )
    }

    return String(method || 'other').toLowerCase() === paymentFilter
  }

  const filteredSalesDocumentsByPayment = salesDocuments.filter((sale) =>
    matchesPaymentFilter(sale.paymentMethod, sale.payments)
  )
  const filteredExpenseRowsByPayment = expenseRows.filter((expense) =>
    matchesPaymentFilter(expense.paymentMethod)
  )
  const filteredPurchasesByControl = filteredPurchases.filter((purchase) =>
    matchesPaymentFilter(purchase.paymentMethod) &&
    matchesSearch(purchase.supplierName, purchase.productName)
  )
  const filteredInventoryByControl = inventoryRows.filter((row) => {
    const matchesCategory = categoryFilter === 'all' || row.category === categoryFilter
    return matchesCategory && matchesSearch(row.productName, row.sku, row.category)
  })
  const filteredLowStockByControl = filteredInventoryByControl.filter(
    (row) => row.status.key === 'out' || row.status.key === 'low'
  )
  const filteredCustomerDueByControl = customerDueRows.filter((row) =>
    matchesSearch(row.name, row.phone)
  )
  const filteredTopSellingByControl = topSellingRows.filter((row) =>
    matchesSearch(row.name, row.sku)
  )
  const filteredPaymentRowsByControl =
    paymentFilter === 'all'
      ? paymentRows
      : paymentRows.filter((row) => String(row.key || '').toLowerCase() === paymentFilter)

  const visibleDailySalesRows = buildDailySalesRows(filteredSalesDocumentsByPayment)
  const visibleDailyExpenseRows = buildDailyExpenseRows(filteredExpenseRowsByPayment)
  const visibleInventorySnapshotRows = filteredInventoryByControl.slice(0, 10)

  const sectionVisibility = {
    sales: reportType === 'all' || reportType === 'sales',
    payments: reportType === 'all' || reportType === 'payments',
    expenses: reportType === 'all' || reportType === 'expenses',
    purchases: reportType === 'all' || reportType === 'purchases',
    inventory: reportType === 'all' || reportType === 'inventory',
    lowStock: reportType === 'all' || reportType === 'low_stock',
    customerDue: reportType === 'all' || reportType === 'customer_due',
    topSelling: reportType === 'all' || reportType === 'top_selling',
  }

  const salesTotal =
    filteredSalesDocumentsByPayment.length > 0
      ? filteredSalesDocumentsByPayment.reduce((total, sale) => total + sale.totalAmount, 0)
      : paymentFilter === 'all'
        ? summary.salesSummary.totalSales
        : 0

  const expenseTotal =
    filteredExpenseRowsByPayment.length > 0
      ? filteredExpenseRowsByPayment.reduce((total, expense) => total + expense.amount, 0)
      : paymentFilter === 'all'
        ? summary.totalExpense
        : 0

  const purchaseTotal =
    filteredPurchasesByControl.length > 0
      ? filteredPurchasesByControl.reduce((total, purchase) => total + purchase.totalAmount, 0)
      : paymentFilter === 'all' && normalizedSearch === ''
        ? summary.purchaseSummary.totalPurchases
        : 0

  const customerDueTotal =
    filteredCustomerDueByControl.length > 0
      ? filteredCustomerDueByControl.reduce((total, customer) => total + customer.totalDue, 0)
      : normalizedSearch === ''
        ? summary.dueSummary.receivable
        : 0

  const totalCollections =
    filteredPaymentRowsByControl.length > 0
      ? filteredPaymentRowsByControl.reduce((total, payment) => total + payment.in, 0)
      : paymentFilter === 'all'
        ? summary.cashSummary.totalIn
        : 0

  const outOfStockCount = filteredLowStockByControl.filter((row) => row.status.key === 'out').length
  const stockValue = filteredInventoryByControl.reduce((total, row) => total + row.stockValue, 0)
  const inventoryUnits = filteredInventoryByControl.reduce((total, row) => total + row.quantity, 0)
  const paymentInTotal = Math.max(
    filteredPaymentRowsByControl.reduce((total, payment) => total + payment.in, 0),
    0
  )

  const activeFilterCount = [
    activePreset !== 'month',
    reportType !== 'all',
    paymentFilter !== 'all',
    categoryFilter !== 'all',
    normalizedSearch !== '',
  ].filter(Boolean).length

  const summaryCards = [
    canViewSales && sectionVisibility.sales
      ? {
          title: 'Sales in period',
          value: formatCurrencyNpr(salesTotal),
          detail: `${formatCount(filteredSalesDocumentsByPayment.length || (paymentFilter === 'all' ? summary.salesSummary.count : 0))} bills and sales entries`,
          icon: TrendingUp,
          tone: 'emerald',
        }
      : null,
    canViewExpenses && sectionVisibility.expenses
      ? {
          title: 'Expense in period',
          value: formatCurrencyNpr(expenseTotal),
          detail: `${formatCount(filteredExpenseRowsByPayment.length)} expense entries recorded`,
          icon: TrendingDown,
          tone: 'rose',
        }
      : null,
    canViewPurchases && sectionVisibility.purchases
      ? {
          title: 'Purchases in period',
          value: formatCurrencyNpr(purchaseTotal),
          detail: `${formatCount(filteredPurchasesByControl.length || (paymentFilter === 'all' && normalizedSearch === '' ? summary.purchaseSummary.count : 0))} supplier purchase records`,
          icon: ShoppingCart,
          tone: 'blue',
        }
      : null,
    canViewCustomerDue && sectionVisibility.customerDue
      ? {
          title: 'Customer due',
          value: formatCurrencyNpr(customerDueTotal),
          detail: `${formatCount(filteredCustomerDueByControl.length)} customers need follow-up`,
          icon: Users,
          tone: 'amber',
        }
      : null,
    canViewInventory && (sectionVisibility.inventory || sectionVisibility.lowStock)
      ? {
          title: 'Low stock items',
          value: formatCount(filteredLowStockByControl.length),
          detail:
            outOfStockCount > 0
              ? `${formatCount(outOfStockCount)} already out of stock`
              : filteredLowStockByControl.length > 0
                ? 'Reorder these items soon'
                : 'No items are fully out of stock',
          icon: Package,
          tone: filteredLowStockByControl.length > 0 ? 'orange' : 'emerald',
        }
      : null,
    canViewPayments && sectionVisibility.payments
      ? {
          title: 'Collected by payment methods',
          value: formatCurrencyNpr(totalCollections),
          detail:
            filteredPaymentRowsByControl.length > 0
              ? `${formatCount(filteredPaymentRowsByControl.length)} payment channels seen in this period`
              : 'Payment breakdown will appear once sales are recorded',
          icon: Wallet,
          tone: 'teal',
        }
      : null,
  ].filter(Boolean)

  const handlePresetChange = (presetKey) => {
    setActivePreset(presetKey)
    setDateRange(buildRangeFromPreset(presetKey))
  }

  const handleDateChange = (field, value) => {
    setActivePreset('custom')
    setDateRange((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const clearFilters = () => {
    setActivePreset('month')
    setDateRange(buildRangeFromPreset('month'))
    setReportType('all')
    setPaymentFilter('all')
    setCategoryFilter('all')
    setSearchTerm('')
  }

  const retryLoad = () => {
    setReloadToken((current) => current + 1)
  }

  const printReports = () => {
    if (loading) return
    window.print()
  }

  const exportReports = () => {
    if (loading) return

    const sections = []

    if (summaryCards.length > 0) {
      sections.push({
        title: 'Summary cards',
        columns: ['Metric', 'Value', 'Note'],
        rows: summaryCards.map((card) => [card.title, card.value, card.detail]),
      })
    }

    if (sectionVisibility.sales && visibleDailySalesRows.length > 0) {
      sections.push({
        title: 'Daily Sales Report',
        columns: ['Date', 'Bills', 'Sales', 'Collected', 'Due', 'Source mix'],
        rows: visibleDailySalesRows.map((row) => [
          formatDateNepal(row.dateKey),
          formatCount(row.salesCount),
          formatCurrencyNpr(row.totalAmount),
          formatCurrencyNpr(row.paidAmount),
          formatCurrencyNpr(row.dueAmount),
          `Counter ${formatCount(row.counterSales)} / Invoice ${formatCount(row.invoiceSales)}`,
        ]),
      })
    }

    if (sectionVisibility.payments && filteredPaymentRowsByControl.length > 0) {
      sections.push({
        title: 'Payment Method Summary',
        columns: ['Method', 'Collected', 'Paid out', 'Net'],
        rows: filteredPaymentRowsByControl.map((row) => [
          row.label,
          formatCurrencyNpr(row.in),
          formatCurrencyNpr(row.out),
          formatCurrencyNpr(row.net),
        ]),
      })
    }

    if (sectionVisibility.expenses && visibleDailyExpenseRows.length > 0) {
      sections.push({
        title: 'Daily Expense Report',
        columns: ['Date', 'Entries', 'Expense', 'Top spending area'],
        rows: visibleDailyExpenseRows.map((row) => [
          formatDateNepal(row.dateKey),
          formatCount(row.entryCount),
          formatCurrencyNpr(row.totalAmount),
          row.topCategory,
        ]),
      })
    }

    if (sectionVisibility.purchases && filteredPurchasesByControl.length > 0) {
      sections.push({
        title: 'Purchase Report',
        columns: ['Date', 'Supplier', 'Product', 'Qty', 'Purchase total', 'Unpaid'],
        rows: filteredPurchasesByControl.map((row) => [
          formatDateNepal(row.purchaseDate),
          row.supplierName,
          row.productName,
          formatQuantity(row.quantity),
          formatCurrencyNpr(row.totalAmount),
          formatCurrencyNpr(row.outstandingAmount),
        ]),
      })
    }

    if (sectionVisibility.inventory && filteredInventoryByControl.length > 0) {
      sections.push({
        title: 'Inventory Report',
        columns: ['Product', 'SKU / Barcode', 'Category', 'Current stock', 'Reorder level', 'Status'],
        rows: filteredInventoryByControl.map((row) => [
          row.productName,
          row.sku,
          row.category,
          formatQuantity(row.quantity),
          formatQuantity(row.reorderLevel),
          row.status.label,
        ]),
      })
    }

    if (sectionVisibility.lowStock && filteredLowStockByControl.length > 0) {
      sections.push({
        title: 'Low Stock Report',
        columns: ['Product', 'Current stock', 'Reorder level', 'Status', 'Restock note'],
        rows: filteredLowStockByControl.map((row) => [
          row.productName,
          formatQuantity(row.quantity),
          formatQuantity(row.reorderLevel),
          row.status.label,
          row.status.helper,
        ]),
      })
    }

    if (sectionVisibility.customerDue && filteredCustomerDueByControl.length > 0) {
      sections.push({
        title: 'Customer Due Report',
        columns: ['Customer', 'Phone', 'Due amount', 'Open bills', 'Last activity'],
        rows: filteredCustomerDueByControl.map((row) => [
          row.name,
          row.phone || '-',
          formatCurrencyNpr(row.totalDue),
          formatCount(row.invoiceCount),
          formatDateNepal(row.lastFollowUpDate),
        ]),
      })
    }

    if (sectionVisibility.topSelling && filteredTopSellingByControl.length > 0) {
      sections.push({
        title: 'Top Selling Products',
        columns: ['Product', 'SKU', 'Quantity sold', 'Sales amount'],
        rows: filteredTopSellingByControl.map((row) => [
          row.name,
          row.sku,
          formatQuantity(row.quantity),
          formatCurrencyNpr(row.amount),
        ]),
      })
    }

    if (!sections.length) {
      toast.error('No report data is ready to export yet')
      return
    }

    downloadCsv(
      `reports-${reportType}-${dateRange.startDate || 'start'}-to-${dateRange.endDate || 'end'}.csv`,
      sections
    )
    toast.success('Reports exported')
  }

  const rangeLabel = getRangeLabel(dateRange.startDate, dateRange.endDate)
  const headerDescription =
    businessDescriptions[businessType] || businessDescriptions.general
  const selectedReportLabel =
    reportTypeOptions.find((option) => option.value === reportType)?.label || 'All reports'
  const businessTypeLabel = formatTitle(businessType === 'general' ? 'general business' : businessType)

  if (!hasAnyReportAccess) {
    return (
      <WorkspacePage className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Reports"
          title="Simple reports for owners"
          description={headerDescription}
          badges={['Nepal-friendly wording', 'Owner-focused layout']}
        />

        <SectionCard>
          <EmptyCard
            icon={BarChart3}
            title="No report sections are available for this role"
            message="This reports page is ready, but your current role does not include sales, accounting, inventory, purchase, or customer report access."
          />
        </SectionCard>
      </WorkspacePage>
    )
  }

  if (loadError && !loading) {
    return (
      <WorkspacePage className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Reports"
          title="Reports owners can act on quickly"
          description={headerDescription}
          badges={[rangeLabel, 'Nepal-friendly wording', 'Practical business view']}
          actions={
            <button type="button" onClick={retryLoad} className="btn-primary">
              <RefreshCcw className="h-4 w-4" />
              Retry
            </button>
          }
        />

        <StatePanel
          tone="rose"
          icon={AlertTriangle}
          title="Reports could not be loaded"
          message={loadError}
          action={
            <button type="button" onClick={retryLoad} className="btn-primary">
              Reload reports
            </button>
          }
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Reports"
        title="Reports owners can act on quickly"
        description={headerDescription}
        badges={[
          businessTypeLabel,
          rangeLabel,
          activeFilterCount > 0 ? `${activeFilterCount} filters active` : 'Simple owner workflow',
        ]}
        actions={
          <ActionButton icon={RefreshCcw} onClick={retryLoad} disabled={loading} className="print:hidden">
            Refresh data
          </ActionButton>
        }
      />

      <SectionCard
        className="print:hidden"
        eyebrow="Filter & Export"
        title="Keep filtering simple and exports easy to trust"
        description="Start with a short date range, focus on one report only when needed, and export exactly what is visible on the page."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {REPORT_PRESETS.map((preset) => (
                <FilterPresetButton
                  key={preset.key}
                  active={activePreset === preset.key}
                  onClick={() => handlePresetChange(preset.key)}
                >
                  {preset.label}
                </FilterPresetButton>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <FieldLabel>Start date</FieldLabel>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(event) => handleDateChange('startDate', event.target.value)}
                    className="input-primary pl-10"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>End date</FieldLabel>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(event) => handleDateChange('endDate', event.target.value)}
                    className="input-primary pl-10"
                  />
                </div>
              </div>

              <FilterSelect
                label="Report type"
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                {reportTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                label="Payment method"
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
              >
                <option value="all">All payment methods</option>
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FilterSelect>

              {canViewInventory ? (
                <FilterSelect
                  label="Product category"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FilterSelect>
              ) : null}

              <div className={canViewInventory ? '' : 'md:col-span-2 xl:col-span-2'}>
                <FieldLabel>Customer / product</FieldLabel>
                <SearchField
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search customer, product, SKU, or supplier..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="slate">Business: {businessTypeLabel}</StatusBadge>
              <StatusBadge tone="teal">{selectedReportLabel}</StatusBadge>
              <StatusBadge tone="amber">{rangeLabel}</StatusBadge>
              {activeFilterCount > 0 ? (
                <StatusBadge tone="blue">{activeFilterCount} extra filters active</StatusBadge>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Export and print</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These actions use the current date range and the filters above, so owners export only the report view they are looking at now.
            </p>

            <div className="mt-5 grid gap-3">
              <ActionButton variant="primary" icon={Download} onClick={exportReports} disabled={loading}>
                Export CSV
              </ActionButton>
              <ActionButton icon={Printer} onClick={printReports} disabled={loading}>
                Print report
              </ActionButton>
              <ActionButton icon={X} onClick={clearFilters} disabled={loading || activeFilterCount === 0}>
                Clear filters
              </ActionButton>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Current export view
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{selectedReportLabel}</p>
              <p className="mt-1 text-sm text-slate-600">{rangeLabel}</p>
              <p className="mt-3 text-sm text-slate-600">
                {summaryCards.length} summary card{summaryCards.length === 1 ? '' : 's'} visible
                {reportType === 'all' ? ' across all owner reports.' : ' in this focused report view.'}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                PDF export can be added later once a dedicated printable report layout is finalized.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {warnings.length > 0 ? (
            <StatePanel
              tone="amber"
              icon={AlertTriangle}
              title="Some report sections are incomplete"
              message={`The page is still usable, but these data sources could not be loaded: ${warnings.join(', ')}.`}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => (
              <KpiCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                value={card.value}
                detail={card.detail}
                tone={card.tone}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {canViewSales && sectionVisibility.sales ? (
              <SectionCard
                eyebrow="Daily Sales Report"
                title="Sales by day"
                description="A clean daily sales readout so owners can compare the day quickly without opening every invoice."
              >
                {visibleDailySalesRows.length === 0 ? (
                  <EmptyCard
                    icon={TrendingUp}
                    title="No sales found for this period"
                    message="Try a wider date range or clear the payment filter to see invoice and counter sale activity."
                  />
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {visibleDailySalesRows.map((row) => (
                        <div key={row.dateKey} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {formatDateNepal(row.dateKey)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatCount(row.salesCount)} bills
                              </p>
                            </div>
                            <StatusBadge tone="teal">
                              {formatCurrencyNpr(row.totalAmount)}
                            </StatusBadge>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Collected
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatCurrencyNpr(row.paidAmount)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Due
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatCurrencyNpr(row.dueAmount)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-sm text-slate-500">
                            Counter {formatCount(row.counterSales)} and invoice {formatCount(row.invoiceSales)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <DataTableShell className="hidden md:block">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Bills</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Sales</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Collected</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Due</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Source mix</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {visibleDailySalesRows.map((row) => (
                            <tr key={row.dateKey}>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {formatDateNepal(row.dateKey)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">{formatCount(row.salesCount)}</td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {formatCurrencyNpr(row.totalAmount)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatCurrencyNpr(row.paidAmount)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatCurrencyNpr(row.dueAmount)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                Counter {formatCount(row.counterSales)}
                                <span className="mx-2 text-slate-300">/</span>
                                Invoice {formatCount(row.invoiceSales)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DataTableShell>
                  </>
                )}
              </SectionCard>
            ) : null}

            {canViewPayments && sectionVisibility.payments ? (
              <SectionCard
                eyebrow="Payment Method Summary"
                title="How customers paid"
                description="Keep payment channels readable so owners can understand cash, card, bank, and wallet movement quickly."
              >
                {filteredPaymentRowsByControl.length === 0 ? (
                  <EmptyCard
                    icon={Wallet}
                    title="No payment summary yet"
                    message="Once sales, purchases, or accounting entries match the current filters, payment method totals will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredPaymentRowsByControl.map((row) => {
                      const share = paymentInTotal > 0 ? Math.round((row.in / paymentInTotal) * 100) : 0

                      return (
                        <ListRow key={row.key} className="items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                              <StatusBadge tone={row.in >= row.out ? 'emerald' : 'amber'}>
                                {share}% of collections
                              </StatusBadge>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                              Collected {formatCurrencyNpr(row.in)}
                              {row.out > 0 ? `, paid out ${formatCurrencyNpr(row.out)}` : ''}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-base font-semibold text-slate-900">
                              {formatCurrencyNpr(row.net)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">Net movement</p>
                          </div>
                        </ListRow>
                      )
                    })}
                  </div>
                )}
              </SectionCard>
            ) : null}

            {canViewExpenses && sectionVisibility.expenses ? (
              <SectionCard
                eyebrow="Daily Expense Report"
                title="Expense by day"
                description="Everyday business spending should stay clear, not hidden inside technical accounting language."
              >
                {visibleDailyExpenseRows.length === 0 ? (
                  <EmptyCard
                    icon={Receipt}
                    title="No expenses found for this period"
                    message="Choose a wider date range or clear the payment filter to review daily operating expenses."
                  />
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {visibleDailyExpenseRows.map((row) => (
                        <div key={row.dateKey} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {formatDateNepal(row.dateKey)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatCount(row.entryCount)} expense entries
                              </p>
                            </div>
                            <StatusBadge tone="rose">
                              {formatCurrencyNpr(row.totalAmount)}
                            </StatusBadge>
                          </div>
                          <p className="mt-4 text-sm text-slate-500">
                            Main spending: {row.topCategory}
                          </p>
                        </div>
                      ))}
                    </div>

                    <DataTableShell className="hidden md:block">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Entries</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Expense</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Top spending area</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {visibleDailyExpenseRows.map((row) => (
                            <tr key={row.dateKey}>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {formatDateNepal(row.dateKey)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatCount(row.entryCount)}
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {formatCurrencyNpr(row.totalAmount)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">{row.topCategory}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DataTableShell>
                  </>
                )}
              </SectionCard>
            ) : null}

            {canViewPurchases && sectionVisibility.purchases ? (
              <SectionCard
                eyebrow="Purchase Report"
                title="Supplier purchases"
                description="See recent purchase cost, supplier dues, and the items that are driving stock replenishment."
              >
                {filteredPurchasesByControl.length === 0 ? (
                  <EmptyCard
                    icon={ShoppingCart}
                    title="No purchases found for this period"
                    message="Widen the date range or clear payment and search filters to review supplier purchases and unpaid balances."
                  />
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {filteredPurchasesByControl.slice(0, 10).map((purchase) => (
                        <div key={purchase.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {purchase.productName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {purchase.supplierName}
                              </p>
                            </div>
                            <StatusBadge tone={purchase.outstandingAmount > 0 ? 'amber' : 'emerald'}>
                              {purchase.outstandingAmount > 0 ? 'Balance pending' : 'Paid'}
                            </StatusBadge>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Purchase total
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatCurrencyNpr(purchase.totalAmount)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Unpaid
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatCurrencyNpr(purchase.outstandingAmount)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-sm text-slate-500">
                            {formatDateNepal(purchase.purchaseDate)} and quantity {formatQuantity(purchase.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <DataTableShell className="hidden md:block">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Supplier</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Qty</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Purchase total</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Unpaid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {filteredPurchasesByControl.slice(0, 10).map((purchase) => (
                            <tr key={purchase.id}>
                              <td className="px-4 py-4 text-slate-600">
                                {formatDateNepal(purchase.purchaseDate)}
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {purchase.supplierName}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {purchase.productName}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatQuantity(purchase.quantity)}
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {formatCurrencyNpr(purchase.totalAmount)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatCurrencyNpr(purchase.outstandingAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DataTableShell>
                  </>
                )}
              </SectionCard>
            ) : null}

            {canViewInventory && sectionVisibility.inventory ? (
              <SectionCard
                eyebrow="Inventory Report"
                title="Current stock snapshot"
                description="A simple current-stock view with reorder levels and status, starting with the items that need attention first."
              >
                {filteredInventoryByControl.length === 0 ? (
                  <EmptyCard
                    icon={Package}
                    title="No inventory matches these filters"
                    message="Try a different category or clear the product search to see current stock again."
                  />
                ) : (
                  <>
                    <div className="mb-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Inventory items
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                          {formatCount(filteredInventoryByControl.length)}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Units on hand
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                          {formatQuantity(inventoryUnits)}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Stock value estimate
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                          {formatCurrencyNpr(stockValue)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 md:hidden">
                      {visibleInventorySnapshotRows.map((row) => (
                        <div
                          key={row.id}
                          className={`rounded-3xl border border-slate-200 bg-white p-4 ${row.status.rowClass}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {row.productName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {row.sku} and {row.category}
                              </p>
                            </div>
                            <StatusBadge tone={row.status.tone}>{row.status.label}</StatusBadge>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-white/80 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Current stock
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatQuantity(row.quantity)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/80 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Reorder level
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatQuantity(row.reorderLevel)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-sm text-slate-500">{row.status.helper}</p>
                        </div>
                      ))}
                    </div>

                    <DataTableShell className="hidden md:block">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">SKU / Barcode</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Current stock</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Reorder level</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Last updated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {visibleInventorySnapshotRows.map((row) => (
                            <tr key={row.id} className={row.status.rowClass}>
                              <td className="px-4 py-4">
                                <p className="font-semibold text-slate-900">{row.productName}</p>
                              </td>
                              <td className="px-4 py-4 text-slate-600">{row.sku}</td>
                              <td className="px-4 py-4 text-slate-600">{row.category}</td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {formatQuantity(row.quantity)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatQuantity(row.reorderLevel)}
                              </td>
                              <td className="px-4 py-4">
                                <StatusBadge tone={row.status.tone}>{row.status.label}</StatusBadge>
                                <p className="mt-2 text-xs text-slate-500">{row.status.helper}</p>
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatDateTimeNepal(row.updatedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DataTableShell>
                  </>
                )}
              </SectionCard>
            ) : null}

            {canViewInventory && sectionVisibility.lowStock ? (
              <SectionCard
                eyebrow="Low Stock Report"
                title="Restock these items first"
                description="Low stock should stand out immediately for owners and staff, especially in busy shops, cafes, and restaurants."
              >
                {filteredLowStockByControl.length === 0 ? (
                  <EmptyCard
                    icon={Package}
                    title="No low stock items"
                    message="Your current inventory looks healthy for the active category and search filters."
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredLowStockByControl.slice(0, 12).map((row) => (
                      <ListRow
                        key={row.id}
                        className={`items-start justify-between gap-4 rounded-3xl border ${row.status.key === 'out' ? 'border-rose-200 bg-rose-50/80' : 'border-amber-200 bg-amber-50/80'}`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{row.productName}</p>
                            <StatusBadge tone={row.status.tone}>{row.status.label}</StatusBadge>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {row.category} and {row.sku}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">{row.status.helper}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatQuantity(row.quantity)} in stock
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Reorder at {formatQuantity(row.reorderLevel)}
                          </p>
                        </div>
                      </ListRow>
                    ))}
                  </div>
                )}
              </SectionCard>
            ) : null}

            {canViewCustomerDue && sectionVisibility.customerDue ? (
              <SectionCard
                eyebrow="Customer Due Report"
                title="Customers to follow up"
                description="Owners should be able to see due amounts quickly and understand who needs a reminder."
              >
                {filteredCustomerDueByControl.length === 0 ? (
                  <EmptyCard
                    icon={Users}
                    title="No customer dues found"
                    message="Customer due balances will appear here when invoices or customer ledger balances match the current search."
                  />
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {filteredCustomerDueByControl.slice(0, 10).map((row) => (
                        <div key={row.key} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{row.phone || 'No phone saved'}</p>
                            </div>
                            <StatusBadge tone="amber">{formatCurrencyNpr(row.totalDue)}</StatusBadge>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Open bills
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatCount(row.invoiceCount)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Last activity
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {formatDateNepal(row.lastFollowUpDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <DataTableShell className="hidden md:block">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Phone</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Due amount</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Open bills</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Last activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {filteredCustomerDueByControl.slice(0, 10).map((row) => (
                            <tr key={row.key}>
                              <td className="px-4 py-4 font-semibold text-slate-900">{row.name}</td>
                              <td className="px-4 py-4 text-slate-600">{row.phone || '-'}</td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {formatCurrencyNpr(row.totalDue)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatCount(row.invoiceCount)}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {formatDateNepal(row.lastFollowUpDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DataTableShell>
                  </>
                )}
              </SectionCard>
            ) : null}

            {canViewTopSelling && sectionVisibility.topSelling ? (
              <SectionCard
                eyebrow="Top Selling Products"
                title="Fast-moving products"
                description="A small, practical seller ranking helps owners spot what is moving and what needs restocking or repeat buying."
              >
                {filteredTopSellingByControl.length === 0 ? (
                  <EmptyCard
                    icon={BarChart3}
                    title="No top-selling products yet"
                    message="Once sales are recorded in invoices or POS, the fastest-moving products matching the current filters will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredTopSellingByControl.map((row, index) => (
                      <ListRow key={row.key} className="items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={index < 3 ? 'emerald' : 'slate'}>
                              #{index + 1}
                            </StatusBadge>
                            <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{row.sku}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatQuantity(row.quantity)} sold
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatCurrencyNpr(row.amount)}
                          </p>
                        </div>
                      </ListRow>
                    ))}
                  </div>
                )}
              </SectionCard>
            ) : null}
          </div>
        </div>
      )}
    </WorkspacePage>
  )
}
