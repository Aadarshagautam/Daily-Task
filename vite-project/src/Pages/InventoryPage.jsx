import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock3,
  DollarSign,
  Edit,
  History,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  TrendingDown,
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
import api from '../lib/api.js'
import { formatCurrencyNpr, formatDateTimeNepal } from '../utils/nepal.js'

const emptyItemForm = {
  productName: '',
  quantity: '',
  costPrice: '',
  sellingPrice: '',
  category: '',
  supplier: '',
  lowStockAlert: '10',
  vatRate: '0',
  sku: '',
  barcode: '',
}

const emptyAdjustmentForm = {
  quantityDelta: '',
  reason: 'Stock count correction',
  note: '',
}

const adjustmentReasons = [
  'Stock count correction',
  'Purchase received',
  'Wastage / spoilage',
  'Damaged item',
  'Returned to supplier',
]

const stockFilterLabels = {
  all: 'All items',
  low: 'Low stock',
  out: 'Out of stock',
  healthy: 'Healthy',
}

const businessDescriptions = {
  shop: 'See shelf stock, catch low items early, and update products without technical clutter.',
  restaurant: 'Keep ingredients, packaged items, and kitchen stock easy for owners and staff to follow.',
  cafe: 'Watch counter stock and ingredient levels before the rush creates shortages.',
  general: 'Simple stock control for Nepal retail, cafe, and restaurant teams.',
}

const formatQuantity = (value) =>
  (Number(value) || 0).toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })

const toItemForm = (item = {}) => ({
  productName: item.productName || '',
  quantity: item.quantity === undefined || item.quantity === null ? '' : String(item.quantity),
  costPrice: item.costPrice === undefined || item.costPrice === null ? '' : String(item.costPrice),
  sellingPrice: item.sellingPrice === undefined || item.sellingPrice === null ? '' : String(item.sellingPrice),
  category: item.category || '',
  supplier: item.supplier || '',
  lowStockAlert: item.lowStockAlert === undefined || item.lowStockAlert === null ? '10' : String(item.lowStockAlert),
  vatRate: item.vatRate === undefined || item.vatRate === null ? '0' : String(item.vatRate),
  sku: item.sku || '',
  barcode: item.barcode || '',
})

const toItemPayload = (form) => ({
  productName: form.productName.trim(),
  quantity: Number(form.quantity),
  costPrice: Number(form.costPrice),
  sellingPrice: Number(form.sellingPrice),
  category: form.category.trim(),
  supplier: form.supplier.trim(),
  lowStockAlert: Number(form.lowStockAlert) || 0,
  vatRate: Number(form.vatRate) || 0,
  sku: form.sku.trim(),
  barcode: form.barcode.trim(),
})

const getStockStatus = (item) => {
  const quantity = Number(item.quantity) || 0
  const reorderLevel = Number(item.lowStockAlert) || 0

  if (quantity <= 0) return 'out'
  if (reorderLevel > 0 && quantity <= reorderLevel) return 'low'
  return 'healthy'
}

const getStockStatusMeta = (item) => {
  const quantity = Number(item.quantity) || 0
  const reorderLevel = Number(item.lowStockAlert) || 0
  const shortfall = Math.max(reorderLevel - quantity, 0)

  if (quantity <= 0) {
    return {
      tone: 'rose',
      label: 'Out of stock',
      rowClass: 'bg-rose-50/65',
      stockClass: 'border-rose-200 bg-rose-50 text-rose-700',
      helperText:
        reorderLevel > 0
          ? `Need ${formatQuantity(reorderLevel)} to reach reorder level`
          : 'Restock this item soon',
    }
  }

  if (reorderLevel > 0 && quantity <= reorderLevel) {
    return {
      tone: 'amber',
      label: 'Low stock',
      rowClass: 'bg-amber-50/65',
      stockClass: 'border-amber-200 bg-amber-50 text-amber-800',
      helperText:
        shortfall > 0
          ? `Need ${formatQuantity(shortfall)} more to reach reorder level`
          : 'At the reorder level',
    }
  }

  return {
    tone: 'emerald',
    label: 'In stock',
    rowClass: '',
    stockClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    helperText: 'Stock level looks healthy',
  }
}

const getMovementMeta = (movement) => {
  if (movement.type === 'OUT') {
    return {
      icon: ArrowDown,
      iconClass: 'bg-rose-100 text-rose-700',
      amountClass: 'text-rose-700',
      label: 'Stock reduced',
      sign: '-',
    }
  }

  if (movement.type === 'IN') {
    return {
      icon: ArrowUp,
      iconClass: 'bg-emerald-100 text-emerald-700',
      amountClass: 'text-emerald-700',
      label: 'Stock added',
      sign: '+',
    }
  }

  return {
    icon: RefreshCcw,
    iconClass: 'bg-amber-100 text-amber-700',
    amountClass: 'text-amber-700',
    label: 'Stock adjusted',
    sign: '+',
  }
}

const InventoryItemModal = ({
  editingItem,
  form,
  onClose,
  onFieldChange,
  onSubmit,
  saving,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
    <div className="panel w-full max-w-3xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
        <div>
          <p className="section-kicker">{editingItem ? 'Edit item' : 'Add product'}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {editingItem ? 'Update inventory details' : 'Add a new inventory item'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Keep names simple so owners and staff can find stock fast at the counter, shelf, or kitchen.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="max-h-[calc(90vh-5rem)] overflow-y-auto px-6 py-6">
        <div className="erp-stack">
          <div>
            <p className="section-kicker">Basic details</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>Product name</FieldLabel>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(event) => onFieldChange('productName', event.target.value)}
                  className="input-primary"
                  placeholder="Rice 25kg bag, Coke 250ml, Chicken momo filling"
                  required
                />
              </div>

              <div>
                <FieldLabel optional>Category</FieldLabel>
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) => onFieldChange('category', event.target.value)}
                  className="input-primary"
                  placeholder="Groceries, Beverages, Kitchen, Bakery"
                />
              </div>

              <div>
                <FieldLabel optional>Supplier</FieldLabel>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(event) => onFieldChange('supplier', event.target.value)}
                  className="input-primary"
                  placeholder="Supplier or wholesaler name"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="section-kicker">Codes</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel optional>SKU</FieldLabel>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(event) => onFieldChange('sku', event.target.value)}
                  className="input-primary"
                  placeholder="SKU-001"
                />
              </div>

              <div>
                <FieldLabel optional>Barcode</FieldLabel>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(event) => onFieldChange('barcode', event.target.value)}
                  className="input-primary"
                  placeholder="Scan or type barcode"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="section-kicker">Stock and pricing</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Current stock</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.quantity}
                  onChange={(event) => onFieldChange('quantity', event.target.value)}
                  className="input-primary"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <FieldLabel optional>Reorder level</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.lowStockAlert}
                  onChange={(event) => onFieldChange('lowStockAlert', event.target.value)}
                  className="input-primary"
                  placeholder="10"
                />
              </div>

              <div>
                <FieldLabel>Cost price (NPR)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) => onFieldChange('costPrice', event.target.value)}
                  className="input-primary"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <FieldLabel>Selling price (NPR)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(event) => onFieldChange('sellingPrice', event.target.value)}
                  className="input-primary"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <FieldLabel optional>VAT rate (%)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.vatRate}
                  onChange={(event) => onFieldChange('vatRate', event.target.value)}
                  className="input-primary"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-70">
              <Plus className="h-4 w-4" />
              {saving ? 'Saving...' : editingItem ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
)

const StockAdjustmentModal = ({
  item,
  form,
  onClose,
  onFieldChange,
  onSubmit,
  saving,
}) => {
  const statusMeta = getStockStatusMeta(item)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
          <div>
            <p className="section-kicker">Update stock</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {item.productName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use a positive number to add stock and a negative number to reduce it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-6">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="erp-subtle">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current stock</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatQuantity(item.quantity)}</p>
              </div>
              <div className="erp-subtle">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reorder level</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {Number(item.lowStockAlert) > 0 ? formatQuantity(item.lowStockAlert) : 'Not set'}
                </p>
              </div>
              <div className="erp-subtle">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                <div className="mt-3">
                  <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <FieldLabel>Stock change</FieldLabel>
                <input
                  type="number"
                  step="0.001"
                  value={form.quantityDelta}
                  onChange={(event) => onFieldChange('quantityDelta', event.target.value)}
                  className="input-primary"
                  placeholder="Example: 5 for new stock or -2 for wastage"
                  required
                />
              </div>

              <div>
                <FieldLabel>Reason</FieldLabel>
                <select
                  value={form.reason}
                  onChange={(event) => onFieldChange('reason', event.target.value)}
                  className="input-primary"
                >
                  {adjustmentReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel optional>Note</FieldLabel>
                <textarea
                  value={form.note}
                  onChange={(event) => onFieldChange('note', event.target.value)}
                  className="input-primary min-h-[120px] resize-y"
                  placeholder="Add a short note for the team if needed"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-70">
                <RefreshCcw className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save stock update'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const InventoryPage = () => {
  const { hasPermission, orgBusinessType } = useContext(AppContext)
  const inventorySectionRef = useRef(null)
  const historySectionRef = useRef(null)

  const [inventory, setInventory] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [movementsError, setMovementsError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [savingItem, setSavingItem] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState(null)
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm)
  const [savingAdjustment, setSavingAdjustment] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null)

  const canCreateInventory = hasPermission('inventory.create')
  const canUpdateInventory = hasPermission('inventory.update')
  const canDeleteInventory = hasPermission('inventory.delete')
  const canAdjustInventory = hasPermission('inventory.adjust')

  const pageDescription =
    businessDescriptions[orgBusinessType] || businessDescriptions.general

  const safeInventory = Array.isArray(inventory) ? inventory : []
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const categories = [...new Set(safeInventory.map((item) => item.category).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))

  const stats = {
    totalProducts: safeInventory.length,
    lowStock: safeInventory.filter((item) => getStockStatus(item) === 'low').length,
    outOfStock: safeInventory.filter((item) => getStockStatus(item) === 'out').length,
    stockValueEstimate: safeInventory.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPrice) || 0),
      0
    ),
  }

  const filteredInventory = safeInventory
    .filter((item) => {
      const matchesSearch =
        !normalizedSearchTerm ||
        [
          item.productName,
          item.sku,
          item.barcode,
          item.category,
          item.supplier,
        ].some((value) => String(value || '').toLowerCase().includes(normalizedSearchTerm))

      const matchesCategory =
        categoryFilter === 'all' || (item.category || '').toLowerCase() === categoryFilter.toLowerCase()

      const matchesStock =
        stockFilter === 'all' || getStockStatus(item) === stockFilter

      return matchesSearch && matchesCategory && matchesStock
    })
    .sort((left, right) => {
      const statusOrder = { out: 0, low: 1, healthy: 2 }
      const statusDifference =
        statusOrder[getStockStatus(left)] - statusOrder[getStockStatus(right)]

      if (statusDifference !== 0) return statusDifference

      return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0)
    })

  const hasActiveFilters =
    Boolean(normalizedSearchTerm) || categoryFilter !== 'all' || stockFilter !== 'all'

  const syncSelectedHistoryItem = (nextInventory) => {
    setSelectedHistoryItem((current) => {
      if (!current) return null
      return nextInventory.find((item) => item._id === current._id) || null
    })
  }

  const loadPage = async () => {
    setLoading(true)
    setLoadError('')
    setMovementsLoading(true)
    setMovementsError('')

    try {
      const [inventoryResult, movementsResult] = await Promise.allSettled([
        api.get('/inventory'),
        api.get('/inventory/movements'),
      ])

      if (inventoryResult.status !== 'fulfilled') {
        throw inventoryResult.reason
      }

      const inventoryPayload = inventoryResult.value.data?.data
      const nextInventory = Array.isArray(inventoryPayload) ? inventoryPayload : []
      setInventory(nextInventory)
      syncSelectedHistoryItem(nextInventory)

      if (movementsResult.status === 'fulfilled') {
        const movementsPayload = movementsResult.value.data?.data
        setMovements(Array.isArray(movementsPayload) ? movementsPayload : [])
      } else {
        console.error('Error fetching inventory movements:', movementsResult.reason)
        setMovements([])
        setMovementsError('Recent stock changes are unavailable right now.')
      }
    } catch (error) {
      console.error('Error loading inventory page:', error)
      setLoadError('Inventory could not be loaded right now.')
      setInventory([])
      setMovements([])
    } finally {
      setLoading(false)
      setMovementsLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [])

  const fetchMovements = async (inventoryItemId = null) => {
    setMovementsLoading(true)
    setMovementsError('')

    try {
      const response = await api.get('/inventory/movements', {
        params: inventoryItemId ? { inventoryItemId } : undefined,
      })
      const payload = response.data?.data
      setMovements(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error('Error fetching inventory movements:', error)
      setMovements([])
      setMovementsError(
        inventoryItemId
          ? 'This product history could not be loaded right now.'
          : 'Recent stock changes are unavailable right now.'
      )
    } finally {
      setMovementsLoading(false)
    }
  }

  const openCreateForm = () => {
    setEditingItem(null)
    setItemForm(emptyItemForm)
    setItemFormOpen(true)
  }

  const openEditForm = (item) => {
    setEditingItem(item)
    setItemForm(toItemForm(item))
    setItemFormOpen(true)
  }

  const closeItemForm = () => {
    setItemFormOpen(false)
    setEditingItem(null)
    setItemForm(emptyItemForm)
  }

  const openAdjustmentForm = (item) => {
    setAdjustingItem(item)
    setAdjustmentForm(emptyAdjustmentForm)
  }

  const closeAdjustmentForm = () => {
    setAdjustingItem(null)
    setAdjustmentForm(emptyAdjustmentForm)
  }

  const scrollToInventory = () => {
    requestAnimationFrame(() => {
      inventorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const scrollToHistory = () => {
    requestAnimationFrame(() => {
      historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleViewHistory = async (item) => {
    setSelectedHistoryItem(item)
    scrollToHistory()
    await fetchMovements(item._id)
  }

  const clearHistoryFilter = async () => {
    setSelectedHistoryItem(null)
    await fetchMovements()
  }

  const updateItemFormField = (field, value) => {
    setItemForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateAdjustmentField = (field, value) => {
    setAdjustmentForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const upsertInventoryItem = (updatedItem) => {
    setInventory((current) => {
      const safeCurrent = Array.isArray(current) ? current : []
      const exists = safeCurrent.some((item) => item._id === updatedItem._id)

      if (!exists) {
        return [updatedItem, ...safeCurrent]
      }

      return safeCurrent.map((item) => (
        item._id === updatedItem._id ? updatedItem : item
      ))
    })

    setSelectedHistoryItem((current) => (
      current && current._id === updatedItem._id ? updatedItem : current
    ))
  }

  const validateItemForm = () => {
    if (
      !itemForm.productName.trim() ||
      itemForm.quantity === '' ||
      itemForm.costPrice === '' ||
      itemForm.sellingPrice === ''
    ) {
      toast.error('Product name, stock, cost price, and selling price are required.')
      return false
    }

    const quantity = Number(itemForm.quantity)
    const costPrice = Number(itemForm.costPrice)
    const sellingPrice = Number(itemForm.sellingPrice)
    const reorderLevel = itemForm.lowStockAlert === '' ? 0 : Number(itemForm.lowStockAlert)

    if (
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isFinite(costPrice) ||
      costPrice < 0 ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0 ||
      !Number.isFinite(reorderLevel) ||
      reorderLevel < 0
    ) {
      toast.error('Please enter valid non-negative numbers for stock and pricing.')
      return false
    }

    return true
  }

  const handleCreateItem = async (event) => {
    event.preventDefault()

    if (!validateItemForm()) return

    try {
      setSavingItem(true)
      const response = await api.post('/inventory', toItemPayload(itemForm))
      const created = response.data?.data

      if (response.data?.success && created) {
        upsertInventoryItem(created)
        closeItemForm()
        toast.success('Product added to inventory.')
      }
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error(error.response?.data?.message || 'Failed to add product.')
    } finally {
      setSavingItem(false)
    }
  }

  const handleUpdateItem = async (event) => {
    event.preventDefault()

    if (!editingItem || !validateItemForm()) return

    try {
      setSavingItem(true)
      const response = await api.put(`/inventory/${editingItem._id}`, toItemPayload(itemForm))
      const updated = response.data?.data

      if (response.data?.success && updated) {
        upsertInventoryItem(updated)
        closeItemForm()
        toast.success('Product details updated.')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error(error.response?.data?.message || 'Failed to update product.')
    } finally {
      setSavingItem(false)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this product from inventory?')) return

    try {
      const response = await api.delete(`/inventory/${id}`)

      if (response.data?.success) {
        setInventory((current) => (
          Array.isArray(current) ? current.filter((item) => item._id !== id) : []
        ))

        if (selectedHistoryItem?._id === id) {
          setSelectedHistoryItem(null)
          fetchMovements()
        }

        toast.success('Product deleted.')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error(error.response?.data?.message || 'Failed to delete product.')
    }
  }

  const handleAdjustItem = async (event) => {
    event.preventDefault()

    if (!adjustingItem) return

    const quantityDelta = Number(adjustmentForm.quantityDelta)
    if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
      toast.error('Enter a stock change greater than zero.')
      return
    }

    if (!adjustmentForm.reason.trim()) {
      toast.error('Choose a reason for this stock update.')
      return
    }

    try {
      setSavingAdjustment(true)
      const response = await api.post(`/inventory/${adjustingItem._id}/adjustments`, {
        quantityDelta,
        reason: adjustmentForm.reason.trim(),
        note: adjustmentForm.note.trim(),
      })
      const updated = response.data?.data

      if (response.data?.success && updated) {
        upsertInventoryItem(updated)
        closeAdjustmentForm()
        await fetchMovements(selectedHistoryItem?._id || null)
        toast.success('Stock updated.')
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error)
      toast.error(error.response?.data?.message || 'Failed to update stock.')
    } finally {
      setSavingAdjustment(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStockFilter('all')
  }

  const focusLowStock = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStockFilter('low')
    scrollToInventory()
  }

  const displayedMovements = Array.isArray(movements) ? movements.slice(0, 10) : []

  if (loading) {
    return (
      <WorkspacePage className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Inventory workspace"
          title="Inventory"
          description={pageDescription}
        />
        <StatePanel
          title="Loading stock overview"
          message="Checking products, low-stock alerts, and recent stock changes."
          icon={Package}
        />
      </WorkspacePage>
    )
  }

  if (loadError) {
    return (
      <WorkspacePage className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Inventory workspace"
          title="Inventory"
          description={pageDescription}
        />
        <StatePanel
          title="Inventory is unavailable"
          message={loadError}
          icon={AlertTriangle}
          tone="amber"
          action={
            <button type="button" onClick={loadPage} className="btn-primary">
              Try again
            </button>
          }
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Inventory workspace"
        title="Simple stock control"
        description={pageDescription}
        badges={['Search by SKU or barcode', 'Low stock first', 'Recent stock history']}
        actions={(
          <>
            {stats.lowStock > 0 ? (
              <button type="button" onClick={focusLowStock} className="btn-secondary">
                <AlertTriangle className="h-4 w-4" />
                Review low stock
              </button>
            ) : null}
            {canCreateInventory ? (
              <button type="button" onClick={openCreateForm} className="btn-primary">
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            ) : null}
          </>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Package}
          title="Total Products"
          value={stats.totalProducts}
          detail={`${categories.length} categories currently tracked`}
          tone="blue"
        />
        <KpiCard
          icon={AlertTriangle}
          title="Low Stock Items"
          value={stats.lowStock}
          detail={stats.lowStock > 0 ? 'At or below the reorder level' : 'Nothing needs restock soon'}
          tone="amber"
        />
        <KpiCard
          icon={TrendingDown}
          title="Out of Stock Items"
          value={stats.outOfStock}
          detail={stats.outOfStock > 0 ? 'Refill before the next rush or sale' : 'No item is fully out'}
          tone="rose"
        />
        <KpiCard
          icon={DollarSign}
          title="Stock Value Estimate"
          value={formatCurrencyNpr(stats.stockValueEstimate)}
          detail="Based on current cost price"
          tone="teal"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.95fr)]">
        <div ref={inventorySectionRef}>
          <SectionCard
            title="Inventory list"
            description="Search by product, SKU, barcode, or supplier. Use the filters to focus on what needs attention now."
            action={hasActiveFilters ? (
              <button type="button" onClick={clearFilters} className="btn-secondary">
                <X className="h-4 w-4" />
                Clear filters
              </button>
            ) : null}
          >
            <div className="space-y-5">
              <div className="erp-toolbar">
                <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                  <SearchField
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by product, SKU, barcode, or supplier"
                    className="w-full md:max-w-xl"
                  />
                  <div className="w-full md:max-w-xs">
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                      className="input-primary"
                    >
                      <option value="all">All categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{filteredInventory.length}</span> of{' '}
                  <span className="font-semibold text-slate-900">{safeInventory.length}</span> items
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(stockFilterLabels).map(([value, label]) => {
                  const count =
                    value === 'all'
                      ? safeInventory.length
                      : safeInventory.filter((item) => getStockStatus(item) === value).length

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStockFilter(value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        stockFilter === value
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-500">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {safeInventory.length === 0 ? (
                <EmptyCard
                  title="No inventory items yet"
                  message="Start with the products your team checks every day. Once items are added, low stock and recent changes will show here."
                  icon={Package}
                  action={canCreateInventory ? (
                    <button type="button" onClick={openCreateForm} className="btn-primary">
                      <Plus className="h-4 w-4" />
                      Add first product
                    </button>
                  ) : null}
                />
              ) : filteredInventory.length === 0 ? (
                <EmptyCard
                  title="No items match these filters"
                  message="Try a different search, switch category, or clear the stock status filter."
                  icon={Search}
                  action={(
                    <button type="button" onClick={clearFilters} className="btn-secondary">
                      <X className="h-4 w-4" />
                      Reset filters
                    </button>
                  )}
                />
              ) : (
                <>
                  <div className="hidden lg:block">
                    <DataTableShell>
                      <div className="overflow-x-auto">
                        <table className="erp-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>SKU / Barcode</th>
                              <th>Category</th>
                              <th>Current Stock</th>
                              <th>Reorder Level</th>
                              <th>Status</th>
                              <th>Last Updated</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInventory.map((item) => {
                              const statusMeta = getStockStatusMeta(item)

                              return (
                                <tr key={item._id} className={`${statusMeta.rowClass} transition hover:bg-slate-50`}>
                                  <td>
                                    <div className="min-w-[16rem]">
                                      <p className="font-semibold text-slate-900">{item.productName}</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {item.supplier ? `Supplier: ${item.supplier}` : 'Supplier not added'}
                                      </p>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="space-y-1">
                                      <p className="font-medium text-slate-800">{item.sku || 'No SKU'}</p>
                                      <p className="text-xs text-slate-500">{item.barcode || 'No barcode'}</p>
                                    </div>
                                  </td>
                                  <td>{item.category || 'Uncategorized'}</td>
                                  <td>
                                    <div className={`inline-flex min-w-[8rem] items-center justify-center rounded-2xl border px-4 py-2 text-base font-semibold ${statusMeta.stockClass}`}>
                                      {formatQuantity(item.quantity)}
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-slate-500">{statusMeta.helperText}</p>
                                  </td>
                                  <td>
                                    {Number(item.lowStockAlert) > 0 ? formatQuantity(item.lowStockAlert) : 'Not set'}
                                  </td>
                                  <td>
                                    <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                                  </td>
                                  <td>{formatDateTimeNepal(item.updatedAt)}</td>
                                  <td>
                                    <div className="flex min-w-[14rem] flex-wrap gap-2">
                                      {canAdjustInventory ? (
                                        <button
                                          type="button"
                                          onClick={() => openAdjustmentForm(item)}
                                          className="btn-secondary px-3 py-2 text-xs"
                                        >
                                          <RefreshCcw className="h-4 w-4" />
                                          Update stock
                                        </button>
                                      ) : null}
                                      <button
                                        type="button"
                                        onClick={() => handleViewHistory(item)}
                                        className="btn-secondary px-3 py-2 text-xs"
                                      >
                                        <History className="h-4 w-4" />
                                        View history
                                      </button>
                                      {canUpdateInventory ? (
                                        <button
                                          type="button"
                                          onClick={() => openEditForm(item)}
                                          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700"
                                          title="Edit product"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                      ) : null}
                                      {canDeleteInventory ? (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteItem(item._id)}
                                          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                                          title="Delete product"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      ) : null}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </DataTableShell>
                  </div>

                  <div className="grid gap-4 lg:hidden">
                    {filteredInventory.map((item) => {
                      const statusMeta = getStockStatusMeta(item)

                      return (
                        <div
                          key={item._id}
                          className={`rounded-[26px] border bg-white p-5 shadow-sm ${statusMeta.rowClass ? 'border-transparent' : 'border-slate-200'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold tracking-tight text-slate-900">{item.productName}</p>
                              <p className="mt-1 text-sm text-slate-500">{item.category || 'Uncategorized'}</p>
                            </div>
                            <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current stock</p>
                              <p className="mt-2 text-xl font-semibold text-slate-900">{formatQuantity(item.quantity)}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reorder level</p>
                              <p className="mt-2 text-xl font-semibold text-slate-900">
                                {Number(item.lowStockAlert) > 0 ? formatQuantity(item.lowStockAlert) : 'Not set'}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-slate-500">{statusMeta.helperText}</p>

                          <div className="mt-4 space-y-2 text-sm text-slate-500">
                            <p>SKU: <span className="font-medium text-slate-700">{item.sku || 'No SKU'}</span></p>
                            <p>Barcode: <span className="font-medium text-slate-700">{item.barcode || 'No barcode'}</span></p>
                            <p>Last updated: <span className="font-medium text-slate-700">{formatDateTimeNepal(item.updatedAt)}</span></p>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {canAdjustInventory ? (
                              <button
                                type="button"
                                onClick={() => openAdjustmentForm(item)}
                                className="btn-secondary px-4 py-2 text-xs"
                              >
                                <RefreshCcw className="h-4 w-4" />
                                Update stock
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleViewHistory(item)}
                              className="btn-secondary px-4 py-2 text-xs"
                            >
                              <History className="h-4 w-4" />
                              View history
                            </button>
                            {canUpdateInventory ? (
                              <button
                                type="button"
                                onClick={() => openEditForm(item)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                            ) : null}
                            {canDeleteInventory ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item._id)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </div>

        <div ref={historySectionRef}>
          <SectionCard
            title={selectedHistoryItem ? 'Stock history' : 'Recent stock changes'}
            description={
              selectedHistoryItem
                ? `Showing recent stock updates for ${selectedHistoryItem.productName}.`
                : 'Latest stock additions, corrections, wastage, and other changes.'
            }
            action={selectedHistoryItem ? (
              <button type="button" onClick={clearHistoryFilter} className="btn-secondary">
                Show all activity
              </button>
            ) : null}
          >
            {movementsLoading ? (
              <div className="flex min-h-[12rem] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                  <p>Loading stock changes...</p>
                </div>
              </div>
            ) : movementsError ? (
              <StatePanel
                title="Stock history is unavailable"
                message={movementsError}
                icon={Clock3}
                tone="amber"
                className="p-6"
                action={
                  <button
                    type="button"
                    onClick={() => fetchMovements(selectedHistoryItem?._id || null)}
                    className="btn-primary"
                  >
                    Try again
                  </button>
                }
              />
            ) : displayedMovements.length === 0 ? (
              <EmptyCard
                title={selectedHistoryItem ? 'No stock history yet' : 'No stock changes yet'}
                message={
                  selectedHistoryItem
                    ? 'This item has no recent stock updates recorded yet.'
                    : 'Stock additions, corrections, and wastage updates will appear here.'
                }
                icon={History}
              />
            ) : (
              <div className="space-y-3">
                {displayedMovements.map((movement) => {
                  const movementMeta = getMovementMeta(movement)
                  const MovementIcon = movementMeta.icon

                  return (
                    <div
                      key={movement._id}
                      className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${movementMeta.iconClass}`}>
                            <MovementIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {movement.inventoryItemId?.productName || 'Inventory item'}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {movementMeta.label}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {movement.reason || 'Stock update'}
                              {movement.note ? ` - ${movement.note}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm font-semibold ${movementMeta.amountClass}`}>
                            {movementMeta.sign}
                            {formatQuantity(movement.qty)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTimeNepal(movement.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {itemFormOpen ? (
        <InventoryItemModal
          editingItem={editingItem}
          form={itemForm}
          onClose={closeItemForm}
          onFieldChange={updateItemFormField}
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          saving={savingItem}
        />
      ) : null}

      {adjustingItem ? (
        <StockAdjustmentModal
          item={adjustingItem}
          form={adjustmentForm}
          onClose={closeAdjustmentForm}
          onFieldChange={updateAdjustmentField}
          onSubmit={handleAdjustItem}
          saving={savingAdjustment}
        />
      ) : null}
    </WorkspacePage>
  )
}

export default InventoryPage
