import React, { useContext, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Calendar,
  Edit,
  Package,
  Plus,
  RefreshCcw,
  ShoppingCart,
  Trash2,
  Truck,
  User,
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
  PageHeader,
  SearchField,
  SectionCard,
  StatusBadge,
  WorkspacePage,
} from '../components/ui/ErpPrimitives.jsx'
import AppContext from '../context/app-context.js'
import { purchaseApi } from '../lib/purchaseApi.js'
import {
  DEFAULT_PHONE_PLACEHOLDER,
  PAYMENT_METHOD_LABELS,
  formatCurrencyNpr,
  formatDateNepal,
} from '../utils/nepal.js'

const paymentMethods = ['cash', 'card', 'bank_transfer', 'esewa', 'khalti', 'credit', 'cheque', 'other']
const paymentStatuses = [
  { value: 'pending', label: 'Unpaid', tone: 'amber' },
  { value: 'partial', label: 'Partial', tone: 'blue' },
  { value: 'paid', label: 'Paid', tone: 'emerald' },
]
const stockStatuses = [
  { value: 'pending', label: 'Not received', tone: 'slate' },
  { value: 'in_transit', label: 'On the way', tone: 'blue' },
  { value: 'delivered', label: 'Stock received', tone: 'emerald' },
  { value: 'returned', label: 'Returned', tone: 'rose' },
]
const dateFilters = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'this_month', label: 'This month' },
]

const createEmptyForm = () => ({
  supplierName: '',
  supplierContact: '',
  productName: '',
  quantity: '',
  unitPrice: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  paymentStatus: 'pending',
  paidAmount: '',
  paymentMethod: 'cash',
  deliveryStatus: 'pending',
  notes: '',
})

const getPurchaseNumber = (purchase) => {
  const tail = String(purchase?._id || '').slice(-6).toUpperCase()
  return tail ? `PUR-${tail}` : 'PUR-NEW'
}

const getCreatorName = (purchase) =>
  purchase?.userId && typeof purchase.userId === 'object' && purchase.userId.username
    ? purchase.userId.username
    : 'Workspace user'

const getPaymentMeta = (value) => paymentStatuses.find((item) => item.value === value) || paymentStatuses[0]
const getStockMeta = (value) => stockStatuses.find((item) => item.value === value) || stockStatuses[0]

const matchesDateFilter = (value, filter) => {
  if (filter === 'all') return true
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return false
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const current = new Date(target.getFullYear(), target.getMonth(), target.getDate())

  if (filter === 'today') return current.getTime() === today.getTime()
  if (filter === 'this_month') {
    return current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear()
  }
  if (filter === 'last_7_days') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return current >= start && current <= today
  }
  return true
}

const toFormState = (purchase) => ({
  supplierName: purchase.supplierName || '',
  supplierContact: purchase.supplierContact || '',
  productName: purchase.productName || '',
  quantity: purchase.quantity === undefined || purchase.quantity === null ? '' : String(purchase.quantity),
  unitPrice: purchase.unitPrice === undefined || purchase.unitPrice === null ? '' : String(purchase.unitPrice),
  purchaseDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  paymentStatus: purchase.paymentStatus || 'pending',
  paidAmount: purchase.paymentStatus === 'partial' ? String(purchase.paidAmount || '') : '',
  paymentMethod: purchase.paymentMethod || 'cash',
  deliveryStatus: purchase.deliveryStatus || 'pending',
  notes: purchase.notes || '',
})

const PurchaseModal = ({
  editingPurchase,
  form,
  suppliers,
  saving,
  onClose,
  onFieldChange,
  onSupplierChange,
  onSubmit,
}) => {
  const total = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0)
  const paid =
    form.paymentStatus === 'paid' ? total : form.paymentStatus === 'partial' ? Number(form.paidAmount) || 0 : 0
  const due = Math.max(total - paid, 0)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-4xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
          <div>
            <p className="section-kicker">{editingPurchase ? 'Edit purchase' : 'Add purchase'}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {editingPurchase ? 'Update supplier purchase' : 'Record supplier purchase'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep purchase entry practical: supplier, product, quantity, cost, payment, and stock-in.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[calc(90vh-5rem)] overflow-y-auto px-6 py-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Supplier</FieldLabel>
                <input
                  type="text"
                  list="purchase-suppliers"
                  value={form.supplierName}
                  onChange={(event) => onSupplierChange(event.target.value)}
                  className="input-primary"
                  placeholder="Supplier or wholesaler"
                  required
                />
                <datalist id="purchase-suppliers">
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <FieldLabel optional>Supplier phone</FieldLabel>
                <input
                  type="text"
                  value={form.supplierContact}
                  onChange={(event) => onFieldChange('supplierContact', event.target.value)}
                  className="input-primary"
                  placeholder={DEFAULT_PHONE_PLACEHOLDER}
                />
              </div>
              <div>
                <FieldLabel>Purchase date</FieldLabel>
                <input type="date" value={form.purchaseDate} onChange={(event) => onFieldChange('purchaseDate', event.target.value)} className="input-primary" required />
              </div>
              <div>
                <FieldLabel>Stock-in status</FieldLabel>
                <select value={form.deliveryStatus} onChange={(event) => onFieldChange('deliveryStatus', event.target.value)} className="input-primary">
                  {stockStatuses.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Product</FieldLabel>
                <input type="text" value={form.productName} onChange={(event) => onFieldChange('productName', event.target.value)} className="input-primary" placeholder="Rice 25kg, Coke 250ml, Chicken wings" required />
              </div>
              <div>
                <FieldLabel>Quantity</FieldLabel>
                <input type="number" min="1" step="0.001" value={form.quantity} onChange={(event) => onFieldChange('quantity', event.target.value)} className="input-primary" required />
              </div>
              <div>
                <FieldLabel>Unit cost</FieldLabel>
                <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => onFieldChange('unitPrice', event.target.value)} className="input-primary" required />
              </div>
              <div>
                <FieldLabel>Payment status</FieldLabel>
                <select value={form.paymentStatus} onChange={(event) => onFieldChange('paymentStatus', event.target.value)} className="input-primary">
                  {paymentStatuses.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              {form.paymentStatus !== 'pending' ? (
                <div>
                  <FieldLabel>Payment method</FieldLabel>
                  <select value={form.paymentMethod} onChange={(event) => onFieldChange('paymentMethod', event.target.value)} className="input-primary">
                    {paymentMethods.map((item) => (
                      <option key={item} value={item}>{PAYMENT_METHOD_LABELS[item] || item}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {form.paymentStatus === 'partial' ? (
                <div>
                  <FieldLabel>Amount paid</FieldLabel>
                  <input type="number" min="0" step="0.01" value={form.paidAmount} onChange={(event) => onFieldChange('paidAmount', event.target.value)} className="input-primary" required />
                </div>
              ) : null}
              <div className="md:col-span-2">
                <FieldLabel optional>Notes</FieldLabel>
                <textarea value={form.notes} onChange={(event) => onFieldChange('notes', event.target.value)} className="input-primary min-h-28 resize-y" placeholder="Invoice reference, stock note, or supplier reminder" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="section-kicker">Summary</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p><p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrencyNpr(total)}</p></div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paid</p><p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrencyNpr(paid)}</p></div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Due</p><p className="mt-2 text-xl font-semibold text-amber-800">{formatCurrencyNpr(due)}</p></div>
                </div>
              </div>
              <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
                Inventory only increases when the stock-in status is set to <strong>Stock received</strong>.
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingPurchase ? 'Update purchase' : 'Save purchase'}</button>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ReturnModal = ({ purchase, form, saving, onClose, onFieldChange, onSubmit }) => {
  const available = Math.max(0, Number(purchase?.quantity || 0) - Number(purchase?.returnedQty || 0))

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
          <div>
            <p className="section-kicker">Stock return</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Return {purchase?.productName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-6">
          <div className="erp-stack">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Return quantity</FieldLabel>
                <input type="number" min="0.001" max={available || undefined} step="0.001" value={form.quantity} onChange={(event) => onFieldChange('quantity', event.target.value)} className="input-primary" placeholder={`Available: ${available}`} required />
              </div>
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-950"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Available to return</p><p className="mt-2 text-lg font-semibold">{available}</p></div>
            </div>
            <div>
              <FieldLabel optional>Return note</FieldLabel>
              <input type="text" value={form.notes} onChange={(event) => onFieldChange('notes', event.target.value)} className="input-primary" placeholder="Damaged stock, expired item, wrong delivery" />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save return'}</button>
              <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchasePage() {
  const { hasPermission } = useContext(AppContext)
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [form, setForm] = useState(createEmptyForm())
  const [returnTarget, setReturnTarget] = useState(null)
  const [returnForm, setReturnForm] = useState({ quantity: '', notes: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const purchasesQuery = useQuery({ queryKey: ['purchases'], queryFn: () => purchaseApi.list() })
  const suppliersQuery = useQuery({ queryKey: ['purchase-suppliers'], queryFn: () => purchaseApi.suppliers() })

  const purchases = Array.isArray(purchasesQuery.data?.data) ? purchasesQuery.data.data : []
  const suppliers = Array.isArray(suppliersQuery.data?.data) ? suppliersQuery.data.data : []
  const canCreatePurchase = hasPermission('purchases.create')
  const canUpdatePurchase = hasPermission('purchases.update')
  const canReturnPurchase = hasPermission('purchases.return')
  const canDeletePurchase = hasPermission('purchases.delete')

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['purchases'] })
    qc.invalidateQueries({ queryKey: ['purchase-suppliers'] })
  }

  const savePurchaseMut = useMutation({
    mutationFn: (payload) => (editingPurchase ? purchaseApi.update(editingPurchase._id, payload) : purchaseApi.create(payload)),
    onSuccess: () => {
      toast.success(editingPurchase ? 'Purchase updated' : 'Purchase saved')
      invalidate()
      setShowForm(false)
      setEditingPurchase(null)
      setForm(createEmptyForm())
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to save purchase'),
  })

  const deletePurchaseMut = useMutation({
    mutationFn: (id) => purchaseApi.delete(id),
    onSuccess: () => {
      toast.success('Purchase deleted')
      invalidate()
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to delete purchase'),
  })

  const returnPurchaseMut = useMutation({
    mutationFn: ({ id, payload }) => purchaseApi.return(id, payload),
    onSuccess: () => {
      toast.success('Stock return saved')
      invalidate()
      setReturnTarget(null)
      setReturnForm({ quantity: '', notes: '' })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to save stock return'),
  })

  const handleFormFieldChange = (field, value) => {
    setForm((current) => {
      if (field === 'paymentStatus') {
        return {
          ...current,
          paymentStatus: value,
          paidAmount: value === 'partial' ? current.paidAmount : '',
        }
      }

      return { ...current, [field]: value }
    })
  }

  const handleSupplierChange = (supplierName) => {
    const supplier = suppliers.find((item) => item.name === supplierName)
    setForm((current) => ({
      ...current,
      supplierName,
      supplierContact: supplier?.contact || current.supplierContact,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const quantity = Number(form.quantity)
    const unitPrice = Number(form.unitPrice)
    const total = quantity * unitPrice
    const partialPaid = Number(form.paidAmount)

    if (!form.supplierName.trim() || !form.productName.trim() || quantity <= 0 || unitPrice < 0) {
      toast.error('Supplier, product, quantity, and unit cost are required')
      return
    }
    if (!form.purchaseDate) {
      toast.error('Purchase date is required')
      return
    }
    if (form.paymentStatus === 'partial' && (!form.paidAmount || partialPaid <= 0 || partialPaid >= total)) {
      toast.error('Partial purchases need a paid amount smaller than the total')
      return
    }

    savePurchaseMut.mutate({
      supplierName: form.supplierName.trim(),
      supplierContact: form.supplierContact.trim(),
      productName: form.productName.trim(),
      quantity,
      unitPrice,
      purchaseDate: form.purchaseDate,
      paymentStatus: form.paymentStatus,
      paidAmount: form.paymentStatus === 'paid' ? total : form.paymentStatus === 'partial' ? partialPaid : 0,
      paymentMethod: form.paymentMethod,
      deliveryStatus: form.deliveryStatus,
      notes: form.notes.trim(),
    })
  }

  const handleReturnSubmit = (event) => {
    event.preventDefault()
    if (!returnTarget) return
    if (!returnForm.quantity || Number(returnForm.quantity) <= 0) {
      toast.error('Enter a return quantity')
      return
    }

    returnPurchaseMut.mutate({
      id: returnTarget._id,
      payload: { quantity: Number(returnForm.quantity), notes: returnForm.notes.trim() },
    })
  }

  const now = new Date()
  const purchasesThisMonth = purchases.filter((purchase) => {
    const date = new Date(purchase.purchaseDate || purchase.createdAt)
    return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })
  const unpaidPurchases = purchases.filter((purchase) => ['pending', 'partial'].includes(purchase.paymentStatus))
  const outstandingTotal = unpaidPurchases.reduce((sum, purchase) => sum + (Number(purchase.outstandingAmount) || 0), 0)

  const searchValue = searchTerm.trim().toLowerCase()
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      !searchValue ||
      [purchase.supplierName, purchase.productName, purchase.notes, getPurchaseNumber(purchase)]
        .some((value) => String(value || '').toLowerCase().includes(searchValue))

    return (
      matchesSearch &&
      (paymentFilter === 'all' || purchase.paymentStatus === paymentFilter) &&
      matchesDateFilter(purchase.purchaseDate || purchase.createdAt, dateFilter)
    )
  })

  const hasFilters = searchTerm.trim() !== '' || dateFilter !== 'all' || paymentFilter !== 'all'
  const visibleOutstanding = filteredPurchases.reduce((sum, purchase) => sum + (Number(purchase.outstandingAmount) || 0), 0)
  const loading = purchasesQuery.isLoading || suppliersQuery.isLoading
  const loadError = purchasesQuery.error || suppliersQuery.error

  if (loading) {
    return (
      <WorkspacePage>
        <StatePanel
          icon={ShoppingCart}
          title="Loading purchases"
          message="Bringing supplier purchases, payment status, and stock-in records into one workspace."
          tone="teal"
        />
      </WorkspacePage>
    )
  }

  if (loadError) {
    return (
      <WorkspacePage>
        <StatePanel
          icon={AlertTriangle}
          title="Could not load purchases"
          message="We could not load purchase records right now. Please retry and check the connection."
          tone="rose"
          action={
            <button
              onClick={() => {
                purchasesQuery.refetch()
                suppliersQuery.refetch()
              }}
              className="btn-primary"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </button>
          }
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Purchases"
        title="Supplier buying should feel simple, practical, and trustworthy."
        description="Record supplier bills, understand unpaid purchases quickly, and keep stock-in status clear for owners and staff."
        badges={[`${purchases.length} purchases`, `${suppliers.length} suppliers`, 'Stock-in ready']}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShoppingCart} title="Total Purchases" value={purchases.length} detail={`${formatCurrencyNpr(purchases.reduce((sum, purchase) => sum + (Number(purchase.totalAmount) || 0), 0))} total recorded`} tone="blue" />
        <KpiCard icon={Calendar} title="Purchases This Month" value={purchasesThisMonth.length} detail={`${formatCurrencyNpr(purchasesThisMonth.reduce((sum, purchase) => sum + (Number(purchase.totalAmount) || 0), 0))} this month`} tone="teal" />
        <KpiCard icon={Wallet} title="Unpaid Purchases" value={unpaidPurchases.length} detail={`${formatCurrencyNpr(outstandingTotal)} outstanding`} tone="amber" />
        <KpiCard icon={Users} title="Suppliers Count" value={suppliers.length} detail="Suppliers linked to purchase records" tone="emerald" />
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_220px_220px]">
            <div className="md:col-span-2 xl:col-span-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</p>
              <SearchField value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by supplier, purchase no, or invoice note..." />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</p>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="input-primary">
                {dateFilters.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment status</p>
              <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="input-primary">
                <option value="all">All payment status</option>
                {paymentStatuses.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canCreatePurchase ? (
              <button onClick={() => { setEditingPurchase(null); setForm(createEmptyForm()); setShowForm(true) }} className="btn-primary">
                <Plus className="h-4 w-4" />
                Add purchase
              </button>
            ) : null}
            <button onClick={() => { purchasesQuery.refetch(); suppliersQuery.refetch() }} className="btn-secondary">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="erp-chip">{filteredPurchases.length} visible</span>
          <span className="erp-chip">{filteredPurchases.filter((purchase) => ['pending', 'partial'].includes(purchase.paymentStatus)).length} unpaid</span>
          <span className="erp-chip">{suppliers.length} suppliers</span>
          {hasFilters ? <button onClick={() => { setSearchTerm(''); setDateFilter('all'); setPaymentFilter('all') }} className="btn-secondary">Clear filters</button> : null}
        </div>
      </section>

      <SectionCard
        eyebrow="Purchase History"
        title="Purchase records"
        description="A cleaner ledger for supplier buying, payment follow-up, and stock-in tracking."
        action={<StatusBadge tone={visibleOutstanding > 0 ? 'amber' : 'emerald'}>{visibleOutstanding > 0 ? `${formatCurrencyNpr(visibleOutstanding)} unpaid in current view` : 'No unpaid purchases in current view'}</StatusBadge>}
      >
        {filteredPurchases.length === 0 ? (
          <EmptyCard
            icon={ShoppingCart}
            title={hasFilters ? 'No purchases match these filters' : 'No purchases added yet'}
            message={hasFilters ? 'Try another supplier search, date filter, or payment status filter.' : 'Add your first supplier purchase to start tracking stock-in and unpaid bills from one simple page.'}
            action={hasFilters ? <button onClick={() => { setSearchTerm(''); setDateFilter('all'); setPaymentFilter('all') }} className="btn-secondary">Clear filters</button> : canCreatePurchase ? <button onClick={() => { setEditingPurchase(null); setForm(createEmptyForm()); setShowForm(true) }} className="btn-primary">Add first purchase</button> : null}
          />
        ) : (
          <>
            <DataTableShell className="hidden md:block">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Purchase No</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Total Amount</th>
                    <th>Payment Status</th>
                    <th>Created By</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => {
                    const paymentMeta = getPaymentMeta(purchase.paymentStatus)
                    const stockMeta = getStockMeta(purchase.deliveryStatus)
                    const due = Number(purchase.outstandingAmount) || 0
                    const canReturnMore = purchase.deliveryStatus === 'delivered' && Number(purchase.quantity || 0) > Number(purchase.returnedQty || 0)

                    return (
                      <tr key={purchase._id} className={due > 0 ? 'bg-amber-50/55' : ''}>
                        <td><p className="font-semibold text-slate-900">{getPurchaseNumber(purchase)}</p><p className="mt-1 text-sm text-slate-500">{purchase.productName || 'Purchase item'}</p></td>
                        <td><p className="font-medium text-slate-900">{formatDateNepal(purchase.purchaseDate || purchase.createdAt)}</p><p className="mt-1 text-xs text-slate-500">Qty {purchase.quantity || 0}</p></td>
                        <td><p className="font-medium text-slate-900">{purchase.supplierName || 'Supplier'}</p><p className="mt-1 text-xs text-slate-500">{purchase.supplierContact || 'No supplier phone saved'}</p></td>
                        <td><p className="font-semibold text-slate-900">{formatCurrencyNpr(purchase.totalAmount)}</p><p className="mt-1 text-xs text-slate-500">Paid {formatCurrencyNpr(purchase.paidAmount || 0)}{due > 0 ? ` · Due ${formatCurrencyNpr(due)}` : ' · No due'}</p></td>
                        <td><div className="space-y-2"><StatusBadge tone={paymentMeta.tone}>{paymentMeta.label}</StatusBadge><div><StatusBadge tone={stockMeta.tone}>{stockMeta.label}</StatusBadge></div></div></td>
                        <td><p className="font-medium text-slate-900">{getCreatorName(purchase)}</p><p className="mt-1 text-xs text-slate-500">Recorded {formatDateNepal(purchase.createdAt || purchase.purchaseDate)}</p></td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {canUpdatePurchase ? <button onClick={() => { setEditingPurchase(purchase); setForm(toFormState(purchase)); setShowForm(true) }} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><span className="inline-flex items-center gap-2"><Edit className="h-4 w-4" />Edit</span></button> : null}
                            {canReturnPurchase && canReturnMore ? <button onClick={() => { setReturnTarget(purchase); setReturnForm({ quantity: '', notes: '' }) }} className="rounded-2xl border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"><span className="inline-flex items-center gap-2"><Truck className="h-4 w-4" />Return</span></button> : null}
                            {canDeletePurchase ? <button onClick={() => { if (window.confirm(`Delete purchase ${getPurchaseNumber(purchase)}?`)) deletePurchaseMut.mutate(purchase._id) }} className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"><span className="inline-flex items-center gap-2"><Trash2 className="h-4 w-4" />Delete</span></button> : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </DataTableShell>

            <div className="grid gap-4 md:hidden">
              {filteredPurchases.map((purchase) => {
                const paymentMeta = getPaymentMeta(purchase.paymentStatus)
                const stockMeta = getStockMeta(purchase.deliveryStatus)
                const due = Number(purchase.outstandingAmount) || 0
                const canReturnMore = purchase.deliveryStatus === 'delivered' && Number(purchase.quantity || 0) > Number(purchase.returnedQty || 0)

                return (
                  <div key={purchase._id} className={`card p-5 ${due > 0 ? 'border-amber-200 bg-amber-50/35' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-base font-semibold text-slate-900">{getPurchaseNumber(purchase)}</p><p className="mt-1 text-sm text-slate-500">{purchase.productName || 'Purchase item'}</p></div>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrencyNpr(purchase.totalAmount)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2"><StatusBadge tone={paymentMeta.tone}>{paymentMeta.label}</StatusBadge><StatusBadge tone={stockMeta.tone}>{stockMeta.label}</StatusBadge></div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /><span>{purchase.supplierName || 'Supplier'}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /><span>{formatDateNepal(purchase.purchaseDate || purchase.createdAt)}</span></div>
                      <div className="flex items-center gap-2"><Package className="h-4 w-4 text-slate-400" /><span>{purchase.quantity || 0} units</span></div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paid / due</p><p className="mt-2 text-sm font-medium text-slate-900">{formatCurrencyNpr(purchase.paidAmount || 0)} paid</p><p className="mt-1 text-sm text-slate-500">{formatCurrencyNpr(due)} due</p></div>
                      <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created by</p><p className="mt-2 text-sm font-medium text-slate-900">{getCreatorName(purchase)}</p><p className="mt-1 text-sm text-slate-500">{purchase.supplierContact || 'No supplier phone saved'}</p></div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {canUpdatePurchase ? <button onClick={() => { setEditingPurchase(purchase); setForm(toFormState(purchase)); setShowForm(true) }} className="btn-secondary flex-1 justify-center"><Edit className="h-4 w-4" />Edit</button> : null}
                      {canReturnPurchase && canReturnMore ? <button onClick={() => { setReturnTarget(purchase); setReturnForm({ quantity: '', notes: '' }) }} className="btn-secondary flex-1 justify-center text-amber-700"><Truck className="h-4 w-4" />Return</button> : null}
                      {canDeletePurchase ? <button onClick={() => { if (window.confirm(`Delete purchase ${getPurchaseNumber(purchase)}?`)) deletePurchaseMut.mutate(purchase._id) }} className="btn-danger flex-1 justify-center"><Trash2 className="h-4 w-4" />Delete</button> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </SectionCard>

      {showForm ? <PurchaseModal editingPurchase={editingPurchase} form={form} suppliers={suppliers} saving={savePurchaseMut.isPending} onClose={() => { setShowForm(false); setEditingPurchase(null); setForm(createEmptyForm()) }} onFieldChange={handleFormFieldChange} onSupplierChange={handleSupplierChange} onSubmit={handleSubmit} /> : null}
      {returnTarget ? <ReturnModal purchase={returnTarget} form={returnForm} saving={returnPurchaseMut.isPending} onClose={() => { setReturnTarget(null); setReturnForm({ quantity: '', notes: '' }) }} onFieldChange={(field, value) => setReturnForm((current) => ({ ...current, [field]: value }))} onSubmit={handleReturnSubmit} /> : null}
    </WorkspacePage>
  )
}
