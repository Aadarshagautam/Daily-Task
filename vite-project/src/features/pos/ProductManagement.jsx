import React, { useContext, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Edit3,
  Package,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { posProductApi } from '../../api/posApi'
import StatePanel from '../../components/StatePanel.jsx'
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
} from '../../components/ui/ErpPrimitives.jsx'
import AppContext from '../../context/app-context.js'
import api from '../../lib/api.js'
import { formatCurrencyNpr } from '../../utils/nepal.js'

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'plate', 'cup', 'bowl', 'serving', 'pair']
const MENU_CATEGORIES = ['Starters', 'Mains', 'Beverages', 'Desserts', 'Snacks', 'Specials']
const SUGGESTED_CATEGORIES = ['General', 'Groceries', 'Beverages', 'Bakery', 'Kitchen', 'Menu']
const STATUS_FILTERS = [
  { key: 'all', label: 'All items' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
]

const businessDescriptions = {
  shop: 'Set up barcode-ready retail products, prices, VAT, and stock levels without unnecessary product jargon.',
  restaurant:
    'Keep menu items and stock products practical for restaurant teams, while hiding advanced setup until it is actually needed.',
  cafe: 'Manage fast-moving cafe products and menu items with simple pricing, VAT, stock, and barcode support.',
  general: 'Simple product management for Nepal businesses that want low-training daily item setup.',
}

const emptyForm = {
  name: '',
  category: 'General',
  productType: 'stock',
  sellingPrice: '',
  costPrice: '',
  stockQty: '',
  lowStockAlert: '10',
  unit: 'pcs',
  barcode: '',
  sku: '',
  taxRate: '13',
  isAvailable: true,
  description: '',
  menuCategory: '',
  preparationTime: '0',
  recipe: [],
  modifiers: [],
}

const emptyModifierGroup = {
  name: '',
  required: false,
  multiSelect: false,
  options: [{ label: '', price: '0' }],
}

const emptyRecipeItem = {
  inventoryItemId: '',
  ingredientName: '',
  qty: '1',
  unit: '',
}

const asNumber = (value) => Number(value) || 0

const formatCount = (value) =>
  asNumber(value).toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const getProductType = (product = {}) =>
  product.productType || product.type || (product.trackStock === false ? 'service' : 'stock')

const getDisplayCategory = (product = {}) => product.menuCategory || product.category || 'General'

const matchesSearch = (product, rawSearch) => {
  const term = String(rawSearch || '').trim().toLowerCase()
  if (!term) return true

  return [product.name, product.sku, product.barcode, product.category, product.menuCategory]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term))
}

const getStockMeta = (product = {}) => {
  const productType = getProductType(product)
  const stockQty = asNumber(product.stockQty)
  const reorderLevel = asNumber(product.lowStockAlert)

  if (productType === 'service') {
    return {
      label: 'Service item',
      tone: 'blue',
      helper: 'No stock tracking',
    }
  }

  if (stockQty <= 0) {
    return {
      label: 'Out of stock',
      tone: 'rose',
      helper: reorderLevel > 0 ? `Reorder at ${formatCount(reorderLevel)}` : 'Restock soon',
    }
  }

  if (stockQty <= reorderLevel) {
    return {
      label: 'Low stock',
      tone: 'amber',
      helper: `Alert at ${formatCount(reorderLevel)}`,
    }
  }

  return {
    label: 'In stock',
    tone: 'emerald',
    helper: `${formatCount(stockQty)} ready`,
  }
}

const toForm = (product = {}) => ({
  name: product.name || '',
  category: product.category || 'General',
  productType: getProductType(product),
  sellingPrice:
    product.sellingPrice === undefined || product.sellingPrice === null
      ? ''
      : String(product.sellingPrice),
  costPrice:
    product.costPrice === undefined || product.costPrice === null
      ? ''
      : String(product.costPrice),
  stockQty:
    product.stockQty === undefined || product.stockQty === null
      ? ''
      : String(product.stockQty),
  lowStockAlert:
    product.lowStockAlert === undefined || product.lowStockAlert === null
      ? '10'
      : String(product.lowStockAlert),
  unit: product.unit || 'pcs',
  barcode: product.barcode || '',
  sku: product.sku || '',
  taxRate:
    product.taxRate === undefined || product.taxRate === null
      ? '13'
      : String(product.taxRate),
  isAvailable: product.isAvailable !== false,
  description: product.description || '',
  menuCategory: product.menuCategory || '',
  preparationTime:
    product.preparationTime === undefined || product.preparationTime === null
      ? '0'
      : String(product.preparationTime),
  recipe: Array.isArray(product.recipe)
    ? product.recipe.map((item) => ({
        inventoryItemId: item.inventoryItemId?._id || item.inventoryItemId || '',
        ingredientName: item.ingredientName || '',
        qty: item.qty === undefined || item.qty === null ? '1' : String(item.qty),
        unit: item.unit || '',
      }))
    : [],
  modifiers: Array.isArray(product.modifiers)
    ? product.modifiers.map((modifier) => ({
        name: modifier.name || '',
        required: Boolean(modifier.required),
        multiSelect: Boolean(modifier.multiSelect),
        options:
          Array.isArray(modifier.options) && modifier.options.length > 0
            ? modifier.options.map((option) => ({
                label: option.label || '',
                price:
                  option.price === undefined || option.price === null
                    ? '0'
                    : String(option.price),
              }))
            : [{ label: '', price: '0' }],
      }))
    : [],
})

const toPayload = (form) => {
  const isStockProduct = form.productType === 'stock'

  return {
    name: form.name.trim(),
    category: form.category.trim() || 'General',
    type: form.productType,
    sellingPrice: asNumber(form.sellingPrice),
    costPrice: asNumber(form.costPrice),
    stockQty: isStockProduct ? asNumber(form.stockQty) : 0,
    lowStockAlert: isStockProduct ? asNumber(form.lowStockAlert) : 0,
    unit: form.unit.trim() || 'pcs',
    barcode: form.barcode.trim(),
    sku: form.sku.trim(),
    taxRate: asNumber(form.taxRate),
    isAvailable: Boolean(form.isAvailable),
    description: form.description.trim(),
    menuCategory: form.menuCategory.trim(),
    preparationTime: asNumber(form.preparationTime),
    trackStock: isStockProduct,
    recipe: (Array.isArray(form.recipe) ? form.recipe : [])
      .filter((item) => item.inventoryItemId && asNumber(item.qty) > 0)
      .map((item) => ({
        inventoryItemId: item.inventoryItemId,
        ingredientName: item.ingredientName || '',
        qty: asNumber(item.qty),
        unit: item.unit || '',
      })),
    modifiers: (Array.isArray(form.modifiers) ? form.modifiers : [])
      .filter((modifier) => modifier.name.trim())
      .map((modifier) => ({
        name: modifier.name.trim(),
        required: Boolean(modifier.required),
        multiSelect: Boolean(modifier.multiSelect),
        options: (Array.isArray(modifier.options) ? modifier.options : [])
          .filter((option) => option.label.trim())
          .map((option) => ({
            label: option.label.trim(),
            price: asNumber(option.price),
          })),
      })),
  }
}

const QuickFilterChip = ({ active, children, onClick }) => (
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

const LoadingCards = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="panel h-36 animate-pulse rounded-3xl bg-slate-100" />
    ))}
  </div>
)

function ProductFormModal({
  businessType,
  categoryOptions,
  editingId,
  form,
  inventoryItems,
  inventoryLoading,
  onClose,
  onSubmit,
  saving,
  setForm,
  showAdvanced,
  setShowAdvanced,
}) {
  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const addRecipeItem = () => {
    setForm((current) => ({
      ...current,
      recipe: [...current.recipe, { ...emptyRecipeItem }],
    }))
  }

  const updateRecipeItem = (index, updates) => {
    setForm((current) => ({
      ...current,
      recipe: current.recipe.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      ),
    }))
  }

  const removeRecipeItem = (index) => {
    setForm((current) => ({
      ...current,
      recipe: current.recipe.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const addModifier = () => {
    setForm((current) => ({
      ...current,
      modifiers: [...current.modifiers, { ...emptyModifierGroup }],
    }))
  }

  const updateModifier = (index, updates) => {
    setForm((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier, modifierIndex) =>
        modifierIndex === index ? { ...modifier, ...updates } : modifier
      ),
    }))
  }

  const removeModifier = (index) => {
    setForm((current) => ({
      ...current,
      modifiers: current.modifiers.filter((_, modifierIndex) => modifierIndex !== index),
    }))
  }

  const addModifierOption = (modifierIndex) => {
    setForm((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier, index) =>
        index === modifierIndex
          ? {
              ...modifier,
              options: [...modifier.options, { label: '', price: '0' }],
            }
          : modifier
      ),
    }))
  }

  const updateModifierOption = (modifierIndex, optionIndex, updates) => {
    setForm((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier, index) =>
        index === modifierIndex
          ? {
              ...modifier,
              options: modifier.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? { ...option, ...updates } : option
              ),
            }
          : modifier
      ),
    }))
  }

  const removeModifierOption = (modifierIndex, optionIndex) => {
    setForm((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier, index) =>
        index === modifierIndex
          ? {
              ...modifier,
              options:
                modifier.options.length > 1
                  ? modifier.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex)
                  : modifier.options,
            }
          : modifier
      ),
    }))
  }

  const foodBusiness = businessType === 'restaurant' || businessType === 'cafe'
  const isStockProduct = form.productType === 'stock'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-4xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
          <div>
            <p className="section-kicker">{editingId ? 'Edit product' : 'Add product'}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {editingId ? 'Update product details' : 'Create a product quickly'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep the first setup simple: name, type, price, stock, VAT, SKU, and barcode. Advanced menu setup stays optional.
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

        <form onSubmit={onSubmit} className="max-h-[calc(92vh-5rem)] overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            <div>
              <p className="section-kicker">Basic details</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Product name</FieldLabel>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setField('name', event.target.value)}
                    className="input-primary"
                    placeholder="Milk tea, Coke 250ml, Rice 25kg bag, Chicken momo"
                    required
                  />
                </div>

                <div>
                  <FieldLabel>Category</FieldLabel>
                  <input
                    type="text"
                    list="product-category-options"
                    value={form.category}
                    onChange={(event) => setField('category', event.target.value)}
                    className="input-primary"
                    placeholder="Groceries, Beverages, Bakery, Kitchen"
                  />
                  <datalist id="product-category-options">
                    {categoryOptions.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <FieldLabel>Type</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setField('productType', 'stock')}
                      className={
                        form.productType === 'stock'
                          ? 'rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800'
                          : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:border-slate-300'
                      }
                    >
                      Stock product
                    </button>
                    <button
                      type="button"
                      onClick={() => setField('productType', 'service')}
                      className={
                        form.productType === 'service'
                          ? 'rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800'
                          : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:border-slate-300'
                      }
                    >
                      Service item
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="section-kicker">Pricing and codes</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <FieldLabel>Selling price</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(event) => setField('sellingPrice', event.target.value)}
                    className="input-primary"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <FieldLabel optional>Cost price</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(event) => setField('costPrice', event.target.value)}
                    className="input-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <FieldLabel>VAT / Tax %</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.taxRate}
                    onChange={(event) => setField('taxRate', event.target.value)}
                    className="input-primary"
                  />
                </div>

                <div>
                  <FieldLabel optional>SKU</FieldLabel>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(event) => setField('sku', event.target.value)}
                    className="input-primary"
                    placeholder="Internal stock code"
                  />
                </div>

                <div>
                  <FieldLabel optional>Barcode</FieldLabel>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(event) => setField('barcode', event.target.value)}
                    className="input-primary"
                    placeholder="Barcode or scan-ready code"
                  />
                </div>

                <div>
                  <FieldLabel>Status</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setField('isAvailable', true)}
                      className={
                        form.isAvailable
                          ? 'rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800'
                          : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:border-slate-300'
                      }
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setField('isAvailable', false)}
                      className={
                        !form.isAvailable
                          ? 'rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800'
                          : 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:border-slate-300'
                      }
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="section-kicker">Stock and unit</p>
              {isStockProduct ? (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <FieldLabel>Stock quantity</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      value={form.stockQty}
                      onChange={(event) => setField('stockQty', event.target.value)}
                      className="input-primary"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <FieldLabel>Reorder level</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      value={form.lowStockAlert}
                      onChange={(event) => setField('lowStockAlert', event.target.value)}
                      className="input-primary"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <FieldLabel>Unit</FieldLabel>
                    <select
                      value={form.unit}
                      onChange={(event) => setField('unit', event.target.value)}
                      className="input-primary"
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                  Service items stay simple. Stock quantity and reorder alerts are not required for this type.
                </div>
              )}
            </div>

            <div>
              <p className="section-kicker">Optional details</p>
              <div className="mt-4 grid gap-4">
                <div>
                  <FieldLabel optional>Description</FieldLabel>
                  <textarea
                    value={form.description}
                    onChange={(event) => setField('description', event.target.value)}
                    className="input-primary min-h-[96px] resize-y"
                    placeholder="Short note for staff or billing"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Advanced menu setup</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Optional. Useful for cafes and restaurants that need menu category, preparation time, recipe stock deduction, or modifiers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  className="btn-secondary"
                >
                  {showAdvanced ? 'Hide advanced fields' : foodBusiness ? 'Show menu options' : 'Show advanced fields'}
                </button>
              </div>

              {showAdvanced ? (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel optional>Menu category</FieldLabel>
                      <input
                        type="text"
                        list="menu-category-options"
                        value={form.menuCategory}
                        onChange={(event) => setField('menuCategory', event.target.value)}
                        className="input-primary"
                        placeholder="Starters, Mains, Beverages"
                      />
                      <datalist id="menu-category-options">
                        {MENU_CATEGORIES.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <FieldLabel optional>Preparation time (minutes)</FieldLabel>
                      <input
                        type="number"
                        min="0"
                        value={form.preparationTime}
                        onChange={(event) => setField('preparationTime', event.target.value)}
                        className="input-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Recipe stock deduction</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Link inventory items when selling this product should automatically reduce ingredients.
                        </p>
                      </div>
                      <button type="button" onClick={addRecipeItem} className="btn-secondary">
                        <Plus className="h-4 w-4" />
                        Add ingredient
                      </button>
                    </div>

                    {form.recipe.length === 0 ? (
                      <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                        No recipe items added yet.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {form.recipe.map((ingredient, index) => (
                          <div
                            key={`${ingredient.inventoryItemId || 'recipe'}-${index}`}
                            className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1.6fr)_120px_120px_auto]"
                          >
                            <select
                              value={ingredient.inventoryItemId}
                              onChange={(event) => {
                                const selected = inventoryItems.find((item) => item._id === event.target.value)
                                updateRecipeItem(index, {
                                  inventoryItemId: event.target.value,
                                  ingredientName: selected?.productName || '',
                                })
                              }}
                              className="input-primary"
                            >
                              <option value="">Select inventory item</option>
                              {inventoryItems.map((item) => (
                                <option key={item._id} value={item._id}>
                                  {item.productName}
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={ingredient.qty}
                              onChange={(event) => updateRecipeItem(index, { qty: event.target.value })}
                              className="input-primary"
                              placeholder="Qty"
                            />

                            <input
                              type="text"
                              value={ingredient.unit}
                              onChange={(event) => updateRecipeItem(index, { unit: event.target.value })}
                              className="input-primary"
                              placeholder="Unit"
                            />

                            <button
                              type="button"
                              onClick={() => removeRecipeItem(index)}
                              className="btn-secondary justify-center text-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {inventoryLoading ? (
                      <p className="mt-3 text-sm text-slate-500">Loading inventory items for recipe setup...</p>
                    ) : inventoryItems.length === 0 ? (
                      <p className="mt-3 text-sm text-amber-700">
                        Add inventory items first if you want automatic ingredient deduction.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Customizations / modifiers</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Optional choices like size, spice level, or add-ons for food and beverage businesses.
                        </p>
                      </div>
                      <button type="button" onClick={addModifier} className="btn-secondary">
                        <Plus className="h-4 w-4" />
                        Add group
                      </button>
                    </div>

                    {form.modifiers.length === 0 ? (
                      <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                        No modifier groups added yet.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {form.modifiers.map((modifier, modifierIndex) => (
                          <div key={modifierIndex} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="grid flex-1 gap-4 md:grid-cols-3">
                                <input
                                  type="text"
                                  value={modifier.name}
                                  onChange={(event) =>
                                    updateModifier(modifierIndex, { name: event.target.value })
                                  }
                                  className="input-primary md:col-span-2"
                                  placeholder="Group name: Size, Spice Level, Add-ons"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateModifier(modifierIndex, { required: !modifier.required })
                                    }
                                    className={
                                      modifier.required
                                        ? 'rounded-2xl border border-amber-300 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-800'
                                        : 'rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-600'
                                    }
                                  >
                                    Required
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateModifier(modifierIndex, { multiSelect: !modifier.multiSelect })
                                    }
                                    className={
                                      modifier.multiSelect
                                        ? 'rounded-2xl border border-sky-300 bg-sky-50 px-3 py-3 text-xs font-semibold text-sky-800'
                                        : 'rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-600'
                                    }
                                  >
                                    Multi
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeModifier(modifierIndex)}
                                className="btn-secondary text-rose-600"
                              >
                                Remove group
                              </button>
                            </div>

                            <div className="mt-4 space-y-3">
                              {modifier.options.map((option, optionIndex) => (
                                <div
                                  key={`${modifierIndex}-${optionIndex}`}
                                  className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]"
                                >
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(event) =>
                                      updateModifierOption(modifierIndex, optionIndex, {
                                        label: event.target.value,
                                      })
                                    }
                                    className="input-primary"
                                    placeholder="Option label"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={option.price}
                                    onChange={(event) =>
                                      updateModifierOption(modifierIndex, optionIndex, {
                                        price: event.target.value,
                                      })
                                    }
                                    className="input-primary"
                                    placeholder="Extra price"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeModifierOption(modifierIndex, optionIndex)}
                                    className="btn-secondary justify-center"
                                    disabled={modifier.options.length === 1}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => addModifierOption(modifierIndex)}
                                className="btn-secondary"
                              >
                                <Plus className="h-4 w-4" />
                                Add option
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductManagement() {
  const { hasPermission, orgBusinessType } = useContext(AppContext)
  const businessType = orgBusinessType || 'general'
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const canCreateProduct = hasPermission('pos.products.create')
  const canUpdateProduct = hasPermission('pos.products.update')
  const canDeleteProduct = hasPermission('pos.products.delete')

  const productsQuery = useQuery({
    queryKey: ['pos-products', search, categoryFilter, typeFilter, statusFilter, page],
    queryFn: () =>
      posProductApi.list({
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        type: typeFilter || undefined,
        isAvailable:
          statusFilter === 'active'
            ? true
            : statusFilter === 'inactive'
              ? false
              : undefined,
        page,
        limit: 20,
      }),
  })

  const categoriesQuery = useQuery({
    queryKey: ['pos-product-categories'],
    queryFn: () => posProductApi.categories(),
  })

  const lowStockQuery = useQuery({
    queryKey: ['pos-low-stock-products'],
    queryFn: () => posProductApi.lowStock(),
  })

  const totalProductsQuery = useQuery({
    queryKey: ['pos-products-total'],
    queryFn: () => posProductApi.list({ page: 1, limit: 1 }),
  })

  const activeProductsQuery = useQuery({
    queryKey: ['pos-products-active-total'],
    queryFn: () => posProductApi.list({ page: 1, limit: 1, isAvailable: true }),
  })

  const inventoryQuery = useQuery({
    queryKey: ['inventory-for-product-recipes'],
    queryFn: () => api.get('/inventory').then((response) => response.data),
    enabled: showModal && showAdvanced,
  })

  const products = productsQuery.data?.data?.products || []
  const pagination = productsQuery.data?.data?.pagination || {}
  const categories = Array.isArray(categoriesQuery.data?.data) ? categoriesQuery.data.data : []
  const lowStockProducts = Array.isArray(lowStockQuery.data?.data) ? lowStockQuery.data.data : []
  const inventoryItems = Array.isArray(inventoryQuery.data?.data) ? inventoryQuery.data.data : []

  const categoryOptions = [...new Set([...SUGGESTED_CATEGORIES, ...categories.filter(Boolean)])].sort((a, b) =>
    a.localeCompare(b)
  )

  const filteredLowStockProducts = lowStockProducts.filter((product) => {
    const productType = getProductType(product)
    const matchesCategory = !categoryFilter || getDisplayCategory(product) === categoryFilter || product.category === categoryFilter
    const matchesType = !typeFilter || productType === typeFilter
    const matchesStatus =
      statusFilter === 'out'
        ? asNumber(product.stockQty) <= 0
        : statusFilter === 'low'
          ? asNumber(product.stockQty) > 0 && asNumber(product.stockQty) <= asNumber(product.lowStockAlert)
          : true

    return matchesSearch(product, search) && matchesCategory && matchesType && matchesStatus
  })

  const usingClientLowStockFilter = statusFilter === 'low' || statusFilter === 'out'
  const displayProducts = usingClientLowStockFilter ? filteredLowStockProducts : products

  const totalProductsCount = totalProductsQuery.data?.data?.pagination?.total || 0
  const activeProductsCount = activeProductsQuery.data?.data?.pagination?.total || 0
  const lowStockCount = lowStockProducts.filter((product) => {
    const productType = getProductType(product)
    return productType === 'stock' && asNumber(product.stockQty) > 0
  }).length
  const outOfStockCount = lowStockProducts.filter((product) => asNumber(product.stockQty) <= 0).length

  const summaryCards = [
    {
      title: 'Total Products',
      value: formatCount(totalProductsCount),
      detail: 'Current active product records in your catalog',
      icon: Package,
      tone: 'blue',
    },
    {
      title: 'Active Products',
      value: formatCount(activeProductsCount),
      detail: 'Products currently active for billing',
      icon: Package,
      tone: 'emerald',
    },
    {
      title: 'Low Stock Products',
      value: formatCount(lowStockCount),
      detail: 'Stock items that need restock attention',
      icon: AlertTriangle,
      tone: lowStockCount > 0 ? 'amber' : 'emerald',
    },
    {
      title: 'Out of Stock Products',
      value: formatCount(outOfStockCount),
      detail: 'Items already unavailable because stock is zero',
      icon: AlertTriangle,
      tone: outOfStockCount > 0 ? 'rose' : 'emerald',
    },
  ]

  const invalidateProductQueries = () => {
    qc.invalidateQueries({ queryKey: ['pos-products'] })
    qc.invalidateQueries({ queryKey: ['pos-product-categories'] })
    qc.invalidateQueries({ queryKey: ['pos-low-stock-products'] })
    qc.invalidateQueries({ queryKey: ['pos-products-total'] })
    qc.invalidateQueries({ queryKey: ['pos-products-active-total'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload) => posProductApi.create(payload),
    onSuccess: () => {
      toast.success('Product created')
      invalidateProductQueries()
      closeModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to create product')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => posProductApi.update(id, payload),
    onSuccess: () => {
      toast.success('Product updated')
      invalidateProductQueries()
      closeModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to update product')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id) => posProductApi.delete(id),
    onSuccess: () => {
      toast.success('Product archived')
      invalidateProductQueries()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to archive product')
    },
  })

  const availabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }) => posProductApi.update(id, { isAvailable }),
    onSuccess: (_, variables) => {
      toast.success(variables.isAvailable ? 'Product marked active' : 'Product marked inactive')
      invalidateProductQueries()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to update product status')
    },
  })

  function openCreateForm() {
    if (!canCreateProduct) return

    setEditingId(null)
    setShowAdvanced(false)
    setForm({
      ...emptyForm,
      category: categoryFilter || 'General',
      productType: typeFilter || 'stock',
    })
    setShowModal(true)
  }

  function openEditForm(product) {
    if (!canUpdateProduct) return

    const nextForm = toForm(product)
    const hasAdvancedValues =
      nextForm.menuCategory ||
      asNumber(nextForm.preparationTime) > 0 ||
      nextForm.recipe.length > 0 ||
      nextForm.modifiers.length > 0

    setEditingId(product._id)
    setForm(nextForm)
    setShowAdvanced(hasAdvancedValues || businessType === 'restaurant' || businessType === 'cafe')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
    setShowAdvanced(false)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (editingId && !canUpdateProduct) {
      toast.error('Your role cannot update products.')
      return
    }

    if (!editingId && !canCreateProduct) {
      toast.error('Your role cannot create products.')
      return
    }

    const payload = toPayload(form)
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload })
      return
    }

    createMutation.mutate(payload)
  }

  function handleArchive(product) {
    if (!canDeleteProduct) return

    if (window.confirm(`Archive "${product.name}" from the active product list?`)) {
      archiveMutation.mutate(product._id)
    }
  }

  function handleAvailability(product) {
    if (!canUpdateProduct) return
    availabilityMutation.mutate({ id: product._id, isAvailable: !product.isAvailable })
  }

  function clearFilters() {
    setSearch('')
    setCategoryFilter('')
    setTypeFilter('')
    setStatusFilter('all')
    setPage(1)
  }

  function refreshPage() {
    productsQuery.refetch()
    categoriesQuery.refetch()
    lowStockQuery.refetch()
    totalProductsQuery.refetch()
    activeProductsQuery.refetch()
    if (showAdvanced) inventoryQuery.refetch()
  }

  const isSummaryLoading =
    totalProductsQuery.isLoading || activeProductsQuery.isLoading || lowStockQuery.isLoading
  const isTableLoading = usingClientLowStockFilter
    ? lowStockQuery.isLoading && !lowStockQuery.data
    : productsQuery.isLoading && !productsQuery.data
  const tableError = usingClientLowStockFilter ? lowStockQuery.error : productsQuery.error
  const activeFilterCount = [
    Boolean(search.trim()),
    Boolean(categoryFilter),
    Boolean(typeFilter),
    statusFilter !== 'all',
  ].filter(Boolean).length

  const headerDescription =
    businessDescriptions[businessType] || businessDescriptions.general
  const resultLabel = usingClientLowStockFilter
    ? `${formatCount(displayProducts.length)} matching products`
    : `${formatCount(pagination.total || 0)} matching products`

  if (tableError) {
    return (
      <WorkspacePage className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Products"
          title="Practical product setup for daily business"
          description={headerDescription}
          badges={['Barcode-ready', 'VAT-ready', 'Stock and service products']}
        />

        <StatePanel
          tone="rose"
          icon={AlertTriangle}
          title="Products could not be loaded"
          message="The product list is unavailable right now. Please try again."
          action={
            <button type="button" onClick={refreshPage} className="btn-primary">
              <RefreshCcw className="h-4 w-4" />
              Retry
            </button>
          }
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Products"
        title="Practical product setup for daily business"
        description={headerDescription}
        badges={['Barcode-ready', 'VAT-ready', 'Stock and service products']}
      />

      {isSummaryLoading ? (
        <LoadingCards />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      )}

      <SectionCard
        eyebrow="Action bar"
        title="Find or add products quickly"
        description="Search by name, SKU, or barcode. Filter by category and type. Keep advanced filtering out of the way."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" disabled title="Import can be added later">
              Import later
            </button>
            {canCreateProduct ? (
              <button type="button" onClick={openCreateForm} className="btn-primary">
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            ) : null}
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_220px_190px_auto]">
          <SearchField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by name, SKU, or barcode"
          />

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value)
              setPage(1)
            }}
            className="input-primary"
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value)
              setPage(1)
            }}
            className="input-primary"
          >
            <option value="">All types</option>
            <option value="stock">Stock products</option>
            <option value="service">Service items</option>
          </select>

          <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>{resultLabel}</span>
            {activeFilterCount > 0 ? (
              <button type="button" onClick={clearFilters} className="font-semibold text-slate-900">
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <QuickFilterChip
              key={filter.key}
              active={statusFilter === filter.key}
              onClick={() => {
                setStatusFilter(filter.key)
                setPage(1)
              }}
            >
              {filter.label}
            </QuickFilterChip>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Product list"
        title="Products ready for daily use"
        description="The list keeps the essentials visible first: product name, codes, category, type, price, stock, and status."
      >
        {isTableLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <EmptyCard
            icon={Package}
            title={activeFilterCount > 0 ? 'No products match these filters' : 'No products created yet'}
            message={
              activeFilterCount > 0
                ? 'Try changing the search, category, type, or quick status filter.'
                : 'Add your first product to start billing, barcode scanning, pricing, and stock tracking.'
            }
            action={
              canCreateProduct ? (
                <button type="button" onClick={openCreateForm} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {displayProducts.map((product) => {
                const productType = getProductType(product)
                const stockMeta = getStockMeta(product)
                const availabilityTone = product.isAvailable ? 'emerald' : 'slate'

                return (
                  <div key={product._id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.sku || 'No SKU'}
                          {product.barcode ? ` / ${product.barcode}` : ''}
                        </p>
                      </div>
                      <StatusBadge tone={availabilityTone}>
                        {product.isAvailable ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Category
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {getDisplayCategory(product)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Type
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                          {productType}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Selling price
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatCurrencyNpr(product.sellingPrice)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Stock
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {productType === 'service'
                            ? 'Service item'
                            : `${formatCount(product.stockQty)} ${product.unit || 'pcs'}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <StatusBadge tone={stockMeta.tone}>{stockMeta.label}</StatusBadge>
                      <p className="text-xs text-slate-500">{stockMeta.helper}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {canUpdateProduct ? (
                        <button type="button" onClick={() => openEditForm(product)} className="btn-secondary">
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                      ) : null}
                      {canUpdateProduct ? (
                        <button
                          type="button"
                          onClick={() => handleAvailability(product)}
                          className="btn-secondary"
                        >
                          {product.isAvailable ? 'Mark inactive' : 'Mark active'}
                        </button>
                      ) : null}
                      {canDeleteProduct ? (
                        <button
                          type="button"
                          onClick={() => handleArchive(product)}
                          className="btn-secondary text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            <DataTableShell className="hidden md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Product Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">SKU / Barcode</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Selling Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Stock</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {displayProducts.map((product) => {
                    const productType = getProductType(product)
                    const stockMeta = getStockMeta(product)
                    const availabilityTone = product.isAvailable ? 'emerald' : 'slate'

                    return (
                      <tr key={product._id}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Cost {formatCurrencyNpr(product.costPrice || 0)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <p>{product.sku || '-'}</p>
                          <p className="mt-1 text-xs text-slate-400">{product.barcode || 'No barcode'}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{getDisplayCategory(product)}</td>
                        <td className="px-4 py-4">
                          <StatusBadge tone={productType === 'service' ? 'blue' : 'slate'}>
                            {productType === 'service' ? 'Service' : 'Stock'}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {formatCurrencyNpr(product.sellingPrice)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {productType === 'service' ? (
                            <span>Service item</span>
                          ) : (
                            <>
                              <p className="font-semibold text-slate-900">
                                {formatCount(product.stockQty)} {product.unit || 'pcs'}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Reorder at {formatCount(product.lowStockAlert)}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge tone={availabilityTone}>
                              {product.isAvailable ? 'Active' : 'Inactive'}
                            </StatusBadge>
                            <StatusBadge tone={stockMeta.tone}>{stockMeta.label}</StatusBadge>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{stockMeta.helper}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {canUpdateProduct ? (
                              <button
                                type="button"
                                onClick={() => openEditForm(product)}
                                className="btn-secondary px-3 py-2 text-xs"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>
                            ) : null}
                            {canUpdateProduct ? (
                              <button
                                type="button"
                                onClick={() => handleAvailability(product)}
                                className="btn-secondary px-3 py-2 text-xs"
                              >
                                {product.isAvailable ? 'Inactive' : 'Active'}
                              </button>
                            ) : null}
                            {canDeleteProduct ? (
                              <button
                                type="button"
                                onClick={() => handleArchive(product)}
                                className="btn-secondary px-3 py-2 text-xs text-rose-600"
                              >
                                Archive
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </DataTableShell>

            {!usingClientLowStockFilter && pagination.pages > 1 ? (
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages} ({formatCount(pagination.total)} products)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="btn-secondary"
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
                    className="btn-secondary"
                    disabled={page >= pagination.pages}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </SectionCard>

      {showModal ? (
        <ProductFormModal
          businessType={businessType}
          categoryOptions={categoryOptions}
          editingId={editingId}
          form={form}
          inventoryItems={inventoryItems}
          inventoryLoading={inventoryQuery.isLoading}
          onClose={closeModal}
          onSubmit={handleSubmit}
          saving={createMutation.isPending || updateMutation.isPending}
          setForm={setForm}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
        />
      ) : null}
    </WorkspacePage>
  )
}
