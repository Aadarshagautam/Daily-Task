import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  ShoppingCart,
  Package,
  Truck,
  Edit2,
  Trash2,
  X,
  Save,
  Calendar,
  DollarSign,
  User,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const PurchasePage = () => {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedPurchase, setExpandedPurchase] = useState(null)

  const [formData, setFormData] = useState({
    supplierName: '',
    supplierContact: '',
    productName: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    deliveryStatus: 'pending',
    notes: ''
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      // Load purchases
      const savedPurchases = localStorage.getItem('thinkboard_purchases')
      if (savedPurchases) {
        const parsed = JSON.parse(savedPurchases)
        setPurchases(parsed)
        console.log('Loaded purchases:', parsed)
      } else {
        console.log('No purchases found in localStorage')
      }

      // Load suppliers
      const savedSuppliers = localStorage.getItem('thinkboard_suppliers')
      if (savedSuppliers) {
        setSuppliers(JSON.parse(savedSuppliers))
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const saveSupplier = (name, contact) => {
    if (!name) return
    
    const existing = suppliers.find(s => s.name === name)
    if (!existing) {
      const updated = [...suppliers, { name, contact }]
      setSuppliers(updated)
      localStorage.setItem('thinkboard_suppliers', JSON.stringify(updated))
      console.log('Supplier saved:', name)
    }
  }

  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0
    const price = parseFloat(formData.unitPrice) || 0
    return (qty * price).toFixed(2)
  }

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalAmount: calculateTotal()
    }))
  }, [formData.quantity, formData.unitPrice])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.supplierName || !formData.productName || !formData.quantity || !formData.unitPrice) {
      toast.error('Please fill all required fields')
      return
    }

    const purchaseData = {
      ...formData,
      quantity: parseInt(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      totalAmount: parseFloat(formData.totalAmount)
    }

    try {
      let updatedPurchases

      if (editingId) {
        // Update existing
        updatedPurchases = purchases.map(p => 
          p.id === editingId ? { ...purchaseData, id: editingId, createdAt: p.createdAt } : p
        )
        toast.success('✅ Purchase updated!')
      } else {
        // Create new
        const newPurchase = {
          ...purchaseData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }
        updatedPurchases = [newPurchase, ...purchases]
        toast.success('✅ Purchase added!')
      }

      // Save to localStorage
      localStorage.setItem('thinkboard_purchases', JSON.stringify(updatedPurchases))
      setPurchases(updatedPurchases)
      
      console.log('Purchases saved:', updatedPurchases)

      // Save supplier
      saveSupplier(formData.supplierName, formData.supplierContact)

      resetForm()
    } catch (error) {
      console.error('Error saving purchase:', error)
      toast.error('Failed to save purchase')
    }
  }

  const startEdit = (purchase) => {
    setEditingId(purchase.id)
    setFormData({
      supplierName: purchase.supplierName,
      supplierContact: purchase.supplierContact,
      productName: purchase.productName,
      quantity: purchase.quantity.toString(),
      unitPrice: purchase.unitPrice.toString(),
      totalAmount: purchase.totalAmount.toString(),
      purchaseDate: purchase.purchaseDate,
      paymentStatus: purchase.paymentStatus,
      paymentMethod: purchase.paymentMethod,
      deliveryStatus: purchase.deliveryStatus,
      notes: purchase.notes || ''
    })
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this purchase record?')) return

    try {
      const updated = purchases.filter(p => p.id !== id)
      setPurchases(updated)
      localStorage.setItem('thinkboard_purchases', JSON.stringify(updated))
      toast.success('🗑️ Deleted successfully')
      console.log('Purchase deleted, remaining:', updated)
    } catch (error) {
      console.error('Error deleting purchase:', error)
      toast.error('Failed to delete')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      supplierName: '',
      supplierContact: '',
      productName: '',
      quantity: '',
      unitPrice: '',
      totalAmount: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      deliveryStatus: 'pending',
      notes: ''
    })
  }

  // Statistics
  const stats = {
    total: purchases.length,
    totalAmount: purchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0),
    pending: purchases.filter(p => p.paymentStatus === 'pending').length,
    paid: purchases.filter(p => p.paymentStatus === 'paid').length,
    delivered: purchases.filter(p => p.deliveryStatus === 'delivered').length
  }

  // Filtered purchases
  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = 
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || p.paymentStatus === filterStatus
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading purchases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛒 Purchase Management</h1>
              <p className="text-sm text-gray-600 mt-1">Track all product purchases from suppliers</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm)
                if (editingId) resetForm()
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Purchase
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-5 border-2 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border-2 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">{'\u20B9'}{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border-2 border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pending Payment</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border-2 border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border-2 border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? '✏️ Edit Purchase' : '➕ Add New Purchase'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Supplier Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Supplier Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      list="suppliers"
                      value={formData.supplierName}
                      onChange={(e) => {
                        setFormData({ ...formData, supplierName: e.target.value })
                        const supplier = suppliers.find(s => s.name === e.target.value)
                        if (supplier) {
                          setFormData(prev => ({ ...prev, supplierContact: supplier.contact }))
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter supplier name"
                      required
                    />
                    <datalist id="suppliers">
                      {suppliers.map((s, idx) => (
                        <option key={idx} value={s.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={formData.supplierContact}
                      onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone/Email"
                    />
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Product Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Unit Price (\u20B9) *
                    </label>
                    <input
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300">
                  <p className="text-sm text-gray-600">Total Amount:</p>
                  <p className="text-3xl font-bold text-purple-600">{'\u20B9'}{formData.totalAmount || '0.00'}</p>
                </div>
              </div>

              {/* Purchase Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit">Credit (Pay Later)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Delivery Status
                  </label>
                  <select
                    value={formData.deliveryStatus}
                    onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Any additional information..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Purchase' : 'Save Purchase'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Payment</option>
            <option value="partial">Partial Paid</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>

        {/* Purchases List */}
        {filteredPurchases.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No purchases yet</h3>
            <p className="text-gray-600 mb-6">Start tracking your product purchases from suppliers</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
            >
              Add First Purchase
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => (
              <div key={purchase.id} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                {/* Purchase Header */}
                <div
                  onClick={() => setExpandedPurchase(expandedPurchase === purchase.id ? null : purchase.id)}
                  className="p-5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-7 h-7 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{purchase.productName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            purchase.paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-700'
                              : purchase.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {purchase.paymentStatus === 'paid' ? '✓ Paid' : purchase.paymentStatus === 'partial' ? '⏳ Partial' : '⏱ Pending'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            purchase.deliveryStatus === 'delivered' 
                              ? 'bg-green-100 text-green-700'
                              : purchase.deliveryStatus === 'in_transit'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {purchase.deliveryStatus === 'delivered' ? '📦 Delivered' : purchase.deliveryStatus === 'in_transit' ? '🚚 In Transit' : '⏳ Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {purchase.supplierName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>Qty: {purchase.quantity}</span>
                        </div>
                      </div>

                      <div className="text-right mr-4">
                        <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-600">{'\u20B9'}{parseFloat(purchase.totalAmount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{'\u20B9'}{purchase.unitPrice}/unit</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {expandedPurchase === purchase.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedPurchase === purchase.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Supplier Contact</p>
                        <p className="font-medium text-gray-900">{purchase.supplierContact || 'N/A'}</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                        <p className="font-medium text-gray-900 capitalize">{purchase.paymentMethod.replace('_', ' ')}</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Unit Price</p>
                        <p className="font-medium text-gray-900">{'\u20B9'}{purchase.unitPrice} × {purchase.quantity} = {'\u20B9'}{purchase.totalAmount}</p>
                      </div>
                    </div>

                    {purchase.notes && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                        <p className="text-xs font-bold text-amber-800 mb-1">📝 Notes:</p>
                        <p className="text-sm text-gray-700">{purchase.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(purchase)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Purchase
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(purchase.id)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchasePage

