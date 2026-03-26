import React, { useState, useEffect, useCallback, useContext } from 'react'
import { 
  Plus, 
  DollarSign, 
  Calendar,
  X,
  Save,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Layers,
  BookOpen,
  ShieldCheck,
  BarChart3,
  FileText,
  Receipt
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'
import { getBusinessAccountingMeta } from '../config/businessConfigs.js'
import AppContext from '../context/app-context.js'
import {
  DataTableShell,
  EmptyCard,
  FieldLabel,
  KpiCard,
  PageHeader,
  SectionCard,
  WorkspacePage,
} from '../components/ui/ErpPrimitives.jsx'
import { formatDateNepal, PAYMENT_METHOD_LABELS } from '../utils/nepal.js'

const formatMoney = (value) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatSignedMoney = (value, type = 'income') =>
  `${type === 'income' ? '+' : '-'} ${formatMoney(value)}`

const toLocalDateInputValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const formatPaymentMethod = (value) => {
  const key = String(value || 'cash')
  return PAYMENT_METHOD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const formatLedgerDate = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-NP', {
    month: 'short',
    day: '2-digit',
  })
}

const MANUAL_PAYMENT_METHOD_OPTIONS = [
  { key: 'cash', hint: 'Cash counter' },
  { key: 'esewa', hint: 'eSewa wallet' },
  { key: 'khalti', hint: 'Khalti wallet' },
  { key: 'bank_transfer', hint: 'Bank deposit' },
  { key: 'card', hint: 'Card machine' },
  { key: 'cheque', hint: 'Cheque' },
  { key: 'other', hint: 'Manual note' },
]

const RECONCILE_METHOD_KEYS = new Set(['card', 'bank_transfer', 'esewa', 'khalti', 'cheque'])

const TAB_OPTIONS = [
  { key: 'overview', label: 'Overview', icon: Layers },
  { key: 'journals', label: 'Entry Lanes', icon: BookOpen },
  { key: 'reconcile', label: 'Wallet Check', icon: ShieldCheck },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
]

const ENTRY_FILTER_OPTIONS = [
  { key: 'all', label: 'All entries' },
  { key: 'income', label: 'Money in' },
  { key: 'expense', label: 'Money out' },
]

const AccountingPage = () => {
  const { orgBusinessType } = useContext(AppContext)
  const accountingMeta = getBusinessAccountingMeta(orgBusinessType)
  const [monthlySummaries, setMonthlySummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [dayView, setDayView] = useState('all')
  
  // Date filtering
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [availableYears, setAvailableYears] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: toLocalDateInputValue(),
    paymentMethod: 'cash'
  })

  const months = [
    { value: 'all', label: 'All Year' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const transactionsRes = await api.get('/transactions')
      
      const allTransactions = Array.isArray(transactionsRes.data?.data)
        ? transactionsRes.data.data
        : []
      
      const years = [...new Set(allTransactions.map(t => new Date(t.date).getFullYear()).filter(Boolean))]
      const sortedYears = years.sort((a, b) => b - a)
      setAvailableYears(sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()])
      
      calculateMonthlySummaries(allTransactions)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const calculateMonthlySummaries = (allTransactions) => {
    const monthlyData = {}
    
    allTransactions.forEach(t => {
      const date = new Date(t.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          income: 0,
          expense: 0,
          transactions: []
        }
      }
      
      monthlyData[monthYear].transactions.push(t)
      
      if (t.type === 'income') {
        monthlyData[monthYear].income += t.amount
      } else {
        monthlyData[monthYear].expense += t.amount
      }
    })
    
    const summaries = Object.keys(monthlyData)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        monthYear: key,
        ...monthlyData[key],
        balance: monthlyData[key].income - monthlyData[key].expense
      }))
    
    setMonthlySummaries(summaries)
  }

  const getMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-NP', { month: 'long', year: 'numeric' })
  }

  const getFilteredSummaries = () => {
    let filtered = monthlySummaries

    if (selectedYear !== 'all') {
      filtered = filtered.filter(m => m.monthYear.startsWith(selectedYear.toString()))
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(m => m.monthYear.endsWith(`-${selectedMonth}`))
    }

    return filtered
  }

  const getFilteredSummary = () => {
    const filtered = getFilteredSummaries()
    const totals = {
      income: 0,
      expense: 0,
      balance: 0
    }

    filtered.forEach(m => {
      totals.income += m.income
      totals.expense += m.expense
    })

    totals.balance = totals.income - totals.expense
    return totals
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('Please fill all fields')
      return
    }

    try {
      if (editingId) {
        const res = await api.put(`/transactions/${editingId}`, {
          ...formData,
          amount: parseFloat(formData.amount)
        })

        if (res.data.success) {
          toast.success('Updated successfully')
        }
      } else {
        const res = await api.post('/transactions', {
          ...formData,
          amount: parseFloat(formData.amount)
        })

        if (res.data.success) {
          toast.success('Added successfully')
        }
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Failed to save')
    }
  }

  const startEdit = (transaction) => {
    if (transaction.isSystemGenerated) {
      toast.error('Auto-posted accounting entries are updated from sales, invoices, and purchases.')
      return
    }

    setEditingId(transaction._id)
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: toLocalDateInputValue(transaction.date),
      paymentMethod: transaction.paymentMethod
    })
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: toLocalDateInputValue(),
      paymentMethod: 'cash'
    })
  }

  const previousYear = () => {
    if (selectedYear > Math.min(...availableYears)) {
      setSelectedYear(selectedYear - 1)
      setSelectedMonth('all')
    }
  }

  const nextYear = () => {
    if (selectedYear < Math.max(...availableYears)) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth('all')
    }
  }

  const clearFilters = () => {
    setSelectedMonth('all')
    setSelectedYear(availableYears[0] || new Date().getFullYear())
    setFilter('all')
    setDayView('all')
    setShowDatePicker(false)
  }

  const toggleEntryForm = () => {
    setActiveTab('overview')
    if (editingId) {
      resetForm()
      return
    }

    setShowAddForm(previous => !previous)
  }

  const incomeCategories = ['Sales', 'Services', 'Investment', 'Other Income']
  const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Marketing', 'Transport', 'Food', 'Other']

  if (loading) {
    return (
      <WorkspacePage className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow={accountingMeta.eyebrow}
          title={accountingMeta.title}
          description={accountingMeta.description}
          badges={accountingMeta.badges}
        />
        <div className="panel p-10 text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-lg font-medium text-slate-700">Loading accounting workspace...</p>
          <p className="mt-2 text-sm text-slate-500">Preparing entries, payment channels, and day-close figures.</p>
        </div>
      </WorkspacePage>
    )
  }

  const filteredSummaries = getFilteredSummaries()
  const filteredTotals = getFilteredSummary()
  const allFilteredTransactions = filteredSummaries.flatMap(m => m.transactions)
  const journalTransactions = filter === 'all'
    ? allFilteredTransactions
    : allFilteredTransactions.filter(t => t.type === filter)

  const dailyTotals = journalTransactions.reduce((acc, t) => {
    const dayKey = toLocalDateInputValue(t.date)
    if (!acc[dayKey]) {
      acc[dayKey] = { income: 0, expense: 0, transactions: [] }
    }
    acc[dayKey].transactions.push(t)
    if (t.type === 'income') acc[dayKey].income += t.amount
    else acc[dayKey].expense += t.amount
    return acc
  }, {})

  const dailySummaries = Object.keys(dailyTotals)
    .sort((a, b) => b.localeCompare(a))
    .map(key => ({
      day: key,
      ...dailyTotals[key],
      balance: dailyTotals[key].income - dailyTotals[key].expense
    }))

  const activePeriodLabel =
    selectedMonth === 'all'
      ? `All of ${selectedYear}`
      : `${months.find(m => m.value === selectedMonth)?.label || 'Selected month'} ${selectedYear}`
  const activeViewLabel =
    dayView === 'all'
      ? activePeriodLabel
      : formatDateNepal(dayView, { day: '2-digit', month: 'short', year: 'numeric' })
  const periodTransactions = dayView === 'all' ? journalTransactions : dailyTotals[dayView]?.transactions || []
  const autoPostedCount = periodTransactions.filter(t => t.isSystemGenerated).length
  const manualEntryCount = periodTransactions.filter(t => !t.isSystemGenerated).length

  const dayOptions = [
    { value: 'all', label: 'All Days' },
    ...dailySummaries.map(d => ({
      value: d.day,
      label: formatDateNepal(d.day, { day: '2-digit', month: 'short', year: 'numeric' })
    }))
  ]

  const categoryTotals = journalTransactions.reduce((acc, t) => {
    const key = t.category || 'Uncategorized'
    acc[key] = (acc[key] || 0) + t.amount
    return acc
  }, {})

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const todayKey = toLocalDateInputValue()
  const todaySummary = dailyTotals[todayKey] || { income: 0, expense: 0, transactions: [] }
  const sortedPeriodTransactions = [...periodTransactions]
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
  const latestTransactions = sortedPeriodTransactions.slice(0, 6)
  const paymentMethodTotals = sortedPeriodTransactions.reduce((acc, transaction) => {
    const method = formatPaymentMethod(transaction.paymentMethod)
    const amount = Number(transaction.paidAmount) || Number(transaction.amount) || 0
    acc[method] = (acc[method] || 0) + amount
    return acc
  }, {})
  const topPaymentMethods = Object.entries(paymentMethodTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  const renderJournals = () => {
    const income = journalTransactions.filter(t => t.type === 'income')
    const expense = journalTransactions.filter(t => t.type === 'expense')

    return (
      <SectionCard
        eyebrow="Entry lanes"
        title="Keep money in and money out easy to scan."
        description="Review the latest income and expense lines in separate lanes so owners and accountants can spot issues faster."
        action={(
          <div className="flex flex-wrap gap-2">
            <span className="erp-chip border-emerald-200 bg-emerald-50 text-emerald-700">{income.length} money in</span>
            <span className="erp-chip border-rose-200 bg-rose-50 text-rose-700">{expense.length} money out</span>
          </div>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Money in', rows: income.slice(0, 5) },
            { title: 'Money out', rows: expense.slice(0, 5) },
          ].map((box) => (
            <div key={box.title} className="erp-subtle overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <p className="text-sm font-semibold text-slate-900">{box.title}</p>
              </div>
              <div className="space-y-3 p-4">
                {box.rows.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                    No entries yet
                  </div>
                ) : (
                  box.rows.map((t) => (
                    <div key={t._id} className="erp-list-row px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-500">
                          {t.category}
                          {t.sourceDocumentNo ? ` / ${t.sourceDocumentNo}` : ''}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatSignedMoney(t.amount, t.type)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    )
  }

  const renderReconcile = () => {
    const candidates = journalTransactions
      .filter(t => RECONCILE_METHOD_KEYS.has(t.paymentMethod))
      .slice(0, 8)

    return (
      <SectionCard
        eyebrow="Wallet and bank check"
        title="Match digital channels before day close."
        description="Review eSewa, Khalti, bank, card, and cheque lines together so mismatches are easy to catch."
      >
        {candidates.length === 0 ? (
          <EmptyCard
            icon={ShieldCheck}
            title="No digital items to reconcile"
            message="When wallet, bank, card, or cheque entries appear in this view, they will show here for checking."
          />
        ) : (
          <DataTableShell>
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((t) => (
                    <tr key={t._id}>
                      <td className="font-semibold text-slate-900">{t.description}</td>
                      <td>{t.category}</td>
                      <td>{formatPaymentMethod(t.paymentMethod)}</td>
                      <td>{formatLedgerDate(t.date)}</td>
                      <td className={`text-right font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatSignedMoney(t.amount, t.type)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataTableShell>
        )}
      </SectionCard>
    )
  }

  const renderReports = () => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            icon={Receipt}
            title="Working balance"
            value={formatMoney(filteredTotals.balance)}
            detail={`Current view: ${activeViewLabel}`}
            tone={filteredTotals.balance >= 0 ? 'emerald' : 'rose'}
          />
          <KpiCard
            icon={FileText}
            title="Money in"
            value={formatMoney(filteredTotals.income)}
            detail="Income lines in the selected view"
            tone="emerald"
          />
          <KpiCard
            icon={FileText}
            title="Money out"
            value={formatMoney(filteredTotals.expense)}
            detail="Expense lines in the selected view"
            tone="rose"
          />
        </div>

        <SectionCard
          eyebrow="Top categories"
          title="See where money is moving in the selected period."
          description="Use this report to spot the strongest income and expense categories before editing entries."
        >
          <div className="space-y-3">
            {sortedCategories.length === 0 ? (
              <EmptyCard
                icon={BarChart3}
                title="No category data yet"
                message="Once entries are available in the selected view, the biggest categories will appear here."
              />
            ) : (
              sortedCategories.map(([category, total]) => (
                <div key={category} className="erp-list-row px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{category}</p>
                  <p className="text-sm text-slate-700">{formatMoney(total)}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    )
  }

  const renderEntryForm = () => (
    <SectionCard
      eyebrow={editingId ? 'Edit manual entry' : 'Add manual entry'}
      title={editingId ? 'Update a manual accounting line.' : 'Add a clean manual accounting line.'}
      description="Use manual entries for owner cash, one-off expenses, or adjustments that do not come from sales, invoices, or purchases."
      action={(
        <button type="button" onClick={resetForm} className="btn-secondary">
          <X className="h-4 w-4" />
          Close form
        </button>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel>Type</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
              className={`rounded-[24px] border px-4 py-4 text-left text-sm font-semibold transition ${
                formData.type === 'income'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40'
              }`}
            >
              <ArrowDownCircle className={`mb-3 h-7 w-7 ${formData.type === 'income' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <p>Money In</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Sales, service income, or owner cash coming in.</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
              className={`rounded-[24px] border px-4 py-4 text-left text-sm font-semibold transition ${
                formData.type === 'expense'
                  ? 'border-rose-200 bg-rose-50 text-rose-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/40'
              }`}
            >
              <ArrowUpCircle className={`mb-3 h-7 w-7 ${formData.type === 'expense' ? 'text-rose-600' : 'text-slate-400'}`} />
              <p>Money Out</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Rent, salary, supplies, transport, or other expense.</p>
            </button>
          </div>
        </div>

        <div className="erp-form-grid">
          <div>
            <FieldLabel>Category</FieldLabel>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-primary"
              required
            >
              <option value="">Choose category</option>
              {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Amount (NPR)</FieldLabel>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-primary"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-primary"
              placeholder="What was it for?"
              required
            />
          </div>

          <div>
            <FieldLabel>Date</FieldLabel>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-primary"
              required
            />
          </div>
        </div>

        <div>
          <FieldLabel optional>Payment Channel</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {MANUAL_PAYMENT_METHOD_OPTIONS.map(method => (
              <button
                key={method.key}
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: method.key })}
                className={`rounded-[22px] border px-4 py-3 text-left text-sm font-semibold transition ${
                  formData.paymentMethod === method.key
                    ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <p>{formatPaymentMethod(method.key)}</p>
                <p className="mt-1 text-[11px] font-medium opacity-75">{method.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn-primary">
            <Save className="h-4 w-4" />
            {editingId ? 'Update entry' : 'Save entry'}
          </button>
          <button type="button" onClick={resetForm} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  )

  const renderOverview = () => {
    return (
      <>
        <SectionCard
          eyebrow="Daily workboard"
          title="Use one date when checking cash, wallets, edits, or day close."
          description={`Current view: ${activeViewLabel}`}
        >
          <div className="flex flex-wrap gap-2">
            {dayOptions.slice(0, 8).map(opt => (
              <button
                key={opt.value}
                onClick={() => setDayView(opt.value)}
                className={`erp-filter-chip text-xs ${dayView === opt.value ? 'erp-filter-chip-active' : ''}`}
              >
                {opt.value === 'all' ? 'All Days' : opt.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {(showAddForm || editingId) ? renderEntryForm() : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={ArrowDownCircle}
            title="Money In Today"
            value={formatMoney(todaySummary.income)}
            detail="Income posted on the current local day"
            tone="emerald"
          />
          <KpiCard
            icon={ArrowUpCircle}
            title="Money Out Today"
            value={formatMoney(todaySummary.expense)}
            detail="Expenses posted on the current local day"
            tone="rose"
          />
          <KpiCard
            icon={Receipt}
            title="Today Net"
            value={formatMoney(todaySummary.income - todaySummary.expense)}
            detail="Net movement for the current local day"
            tone={(todaySummary.income - todaySummary.expense) >= 0 ? 'blue' : 'rose'}
          />
          <KpiCard
            icon={DollarSign}
            title="Working Balance"
            value={formatMoney(filteredTotals.balance)}
            detail={`Across ${activeViewLabel}`}
            tone={filteredTotals.balance >= 0 ? 'teal' : 'rose'}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
          <SectionCard
            eyebrow="Current view summary"
            title="See cash, wallets, and system sync before making edits."
            description="The quick band below keeps auto-posted lines, manual changes, and payment mix visible."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="erp-subtle">
                <p className="text-xs text-slate-500">System sync lines</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{autoPostedCount}</p>
              </div>
              <div className="erp-subtle">
                <p className="text-xs text-slate-500">Manual lines</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{manualEntryCount}</p>
              </div>
            </div>

            <div className="erp-subtle mt-5">
              <p className="text-sm font-semibold text-slate-900">Payment mix in this view</p>
              <p className="mt-1 text-sm text-slate-500">Use this to check cash, eSewa, Khalti, bank, card, and cheque totals quickly.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {topPaymentMethods.length === 0 ? (
                  <span className="status-pill">No payment mix available yet</span>
                ) : (
                  topPaymentMethods.map(([method, total]) => (
                    <span key={method} className="status-pill">
                      {method}: {formatMoney(total)}
                    </span>
                  ))
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Recent entries"
            title="Review the latest postings before making adjustments."
            description="This list helps you catch the most recent changes without scanning the full ledger."
            action={<span className="status-pill">{latestTransactions.length} shown</span>}
          >
            {latestTransactions.length === 0 ? (
              <EmptyCard
                icon={BookOpen}
                title="No entries are visible"
                message="Try another period, switch back to all entries, or wait for the next accounting sync."
              />
            ) : (
              <div className="space-y-3">
                {latestTransactions.map((transaction) => (
                  <div key={transaction._id} className="erp-list-row px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {transaction.category}
                        {' / '}
                        {transaction.isSystemGenerated ? 'Auto-posted' : 'Manual'}
                        {transaction.sourceDocumentNo ? ` / ${transaction.sourceDocumentNo}` : ''}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatSignedMoney(transaction.amount, transaction.type)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Ledger"
          title="Ledger and day-close trail."
          description="Use this section for checking postings, edits, wallet totals, and month-end review."
          action={(
            <div className="flex flex-wrap gap-2">
              <span className="status-pill">
                {filter === 'all' ? 'All entries' : filter === 'income' ? 'Money in only' : 'Money out only'}
              </span>
              <span className="status-pill">{activeViewLabel}</span>
            </div>
          )}
        >
          {filteredSummaries.length === 0 ? (
            <EmptyCard
              icon={DollarSign}
              title={accountingMeta.emptyTitle}
              message="Try another period or switch back to all entries."
            />
          ) : (
            <div className="space-y-5">
              {dayView !== 'all' && (
                <div className="erp-subtle">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Selected day ledger</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateNepal(dayView)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Balance</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatMoney((dailyTotals[dayView]?.income || 0) - (dailyTotals[dayView]?.expense || 0))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(dailyTotals[dayView]?.transactions || []).map(t => (
                      <div key={t._id} className="erp-list-row px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t.description}</p>
                          <p className="text-xs text-slate-500">{t.category} / {formatPaymentMethod(t.paymentMethod)}</p>
                        </div>
                        <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatSignedMoney(t.amount, t.type)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredSummaries.map((monthly) => {
                const filteredTransactions = filter === 'all'
                  ? monthly.transactions
                  : monthly.transactions.filter(t => t.type === filter)

                if (filteredTransactions.length === 0) return null

                return (
                  <div key={monthly.monthYear} className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,246,254,0.92))] shadow-[0_24px_42px_-34px_rgba(15,23,42,0.16)]">
                    <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.96),rgba(241,246,254,0.84))] px-5 py-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="erp-icon-button h-10 w-10 p-0">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{getMonthName(monthly.monthYear)}</h3>
                            <p className="text-xs text-slate-500">{monthly.transactions.length} transactions</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-right">
                          <div>
                            <p className="text-xs text-slate-400">In</p>
                            <p className="text-lg font-semibold text-emerald-700">{formatMoney(monthly.income)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Out</p>
                            <p className="text-lg font-semibold text-rose-700">{formatMoney(monthly.expense)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Balance</p>
                            <p className={`text-lg font-semibold ${monthly.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                              {formatMoney(monthly.balance)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Method</th>
                            <th className="text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map((transaction) => (
                            <tr key={transaction._id} className={editingId === transaction._id ? 'bg-slate-50' : ''}>
                              <td>
                                <div className="min-w-[16rem]">
                                  <p className="font-semibold text-slate-900">{transaction.description}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {transaction.isSystemGenerated ? 'Auto-posted' : 'Manual'}
                                    {' / '}
                                    {transaction.type === 'income' ? 'Income' : 'Expense'}
                                    {transaction.sourceDocumentNo ? ` / ${transaction.sourceDocumentNo}` : ''}
                                  </p>
                                  {!transaction.isSystemGenerated ? (
                                    <button
                                      onClick={() => startEdit(transaction)}
                                      className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                                    >
                                      Edit
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                              <td>{transaction.category}</td>
                              <td>{formatLedgerDate(transaction.date)}</td>
                              <td>{formatPaymentMethod(transaction.paymentMethod)}</td>
                              <td className={`text-right font-semibold ${transaction.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatSignedMoney(transaction.amount, transaction.type)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </>
    )
  }

  const renderMainContent = () => {
    if (activeTab === 'journals') return renderJournals()
    if (activeTab === 'reconcile') return renderReconcile()
    if (activeTab === 'reports') return renderReports()

    return renderOverview()
  }

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={accountingMeta.eyebrow}
        title={accountingMeta.title}
        description={accountingMeta.description}
        badges={[...accountingMeta.badges, activeViewLabel]}
        actions={(
          <button onClick={toggleEntryForm} className="btn-primary">
            <Plus className="h-4 w-4" />
            {showAddForm || editingId ? 'Close entry form' : accountingMeta.entryLabel}
          </button>
        )}
      />

      <div className="erp-toolbar">
        <div className="max-w-3xl">
          <p className="section-kicker">Accounting and day close</p>
          <h2 className="section-heading mt-2">{accountingMeta.focusTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{accountingMeta.focusSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TAB_OPTIONS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`erp-filter-chip ${active ? 'erp-filter-chip-active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          title="Working balance"
          value={formatMoney(filteredTotals.balance)}
          detail={`Current view: ${activeViewLabel}`}
          tone={filteredTotals.balance >= 0 ? 'emerald' : 'rose'}
        />
        <KpiCard
          icon={Layers}
          title="Entries shown"
          value={periodTransactions.length}
          detail={`${filteredSummaries.length} monthly bucket${filteredSummaries.length === 1 ? '' : 's'} in this filter`}
          tone="blue"
        />
        <KpiCard
          icon={ShieldCheck}
          title="System sync"
          value={autoPostedCount}
          detail="Auto-posted lines from sales, invoices, and purchases"
          tone="amber"
        />
        <KpiCard
          icon={BookOpen}
          title="Manual lines"
          value={manualEntryCount}
          detail="Owner adjustments and manual expense entries in this view"
          tone="teal"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <SectionCard
          className="xl:sticky xl:top-24 self-start"
          eyebrow="Working filters"
          title="Keep one view active while you review cash, wallets, and day close."
          description={accountingMeta.sidebarSummary}
          action={(
            <button onClick={clearFilters} className="btn-secondary">
              Clear
            </button>
          )}
        >
          <div className="space-y-5">
            <div className="erp-subtle p-0">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="erp-icon-button h-10 w-10 p-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-500">Period</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedMonth === 'all'
                        ? `All of ${selectedYear}`
                        : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                    </p>
                  </div>
                </div>
                {showDatePicker ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {showDatePicker ? (
                <div className="border-t border-slate-200 px-4 pb-4 pt-3">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={previousYear}
                      disabled={selectedYear <= Math.min(...availableYears)}
                      className="erp-icon-button rounded-full disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <p className="text-sm font-semibold text-slate-900">{selectedYear}</p>
                    <button
                      onClick={nextYear}
                      disabled={selectedYear >= Math.max(...availableYears)}
                      className="erp-icon-button rounded-full disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {months.map(month => (
                      <button
                        key={month.value}
                        onClick={() => setSelectedMonth(month.value)}
                        className={`erp-filter-chip w-full justify-center rounded-[18px] px-3 py-2 text-xs ${selectedMonth === month.value ? 'erp-filter-chip-active' : ''}`}
                      >
                        {month.value === 'all' ? 'All' : month.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <FieldLabel optional>Day</FieldLabel>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={dayView === 'all' ? '' : dayView}
                        onChange={(e) => setDayView(e.target.value || 'all')}
                        className="input-primary"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {dayOptions.slice(0, 6).map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setDayView(opt.value)}
                            className={`erp-filter-chip w-full justify-center rounded-[18px] px-3 py-2 text-xs ${dayView === opt.value ? 'erp-filter-chip-active' : ''}`}
                          >
                            {opt.value === 'all' ? 'All Days' : opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <FieldLabel>Entry type</FieldLabel>
              <div className="grid gap-2">
                {ENTRY_FILTER_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={`w-full rounded-[20px] border px-3 py-2 text-left text-sm font-semibold transition ${
                      filter === option.key
                        ? 'border-transparent bg-[linear-gradient(135deg,#1d4ed8_0%,#06b6d4_100%)] text-white shadow-[0_18px_30px_-24px_rgba(37,99,235,0.42)]'
                        : 'border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,246,254,0.92))] text-slate-600 hover:border-blue-200 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="erp-subtle">
                <p className="text-xs text-emerald-600">Money In</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatMoney(filteredTotals.income)}</p>
              </div>
              <div className="erp-subtle">
                <p className="text-xs text-rose-600">Money Out</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatMoney(filteredTotals.expense)}</p>
              </div>
              <div className="erp-subtle">
                <p className="text-xs text-slate-500">Balance</p>
                <p className={`mt-2 text-lg font-semibold ${filteredTotals.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                  {formatMoney(filteredTotals.balance)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          {renderMainContent()}
        </div>
      </div>
    </WorkspacePage>
  )
}

export default AccountingPage
