import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Edit2,
  X,
  Save,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'

const AccountingPage = () => {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })
  const [monthlySummaries, setMonthlySummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  
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
    date: new Date().toISOString().split('T')[0],
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [transactionsRes, summaryRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/summary')
      ])
      
      const allTransactions = transactionsRes.data
      setTransactions(allTransactions)
      setSummary(summaryRes.data)
      
      // Get available years
      const years = [...new Set(allTransactions.map(t => new Date(t.date).getFullYear()))]
      setAvailableYears(years.sort((a, b) => b - a))
      
      calculateMonthlySummaries(allTransactions)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

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
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Filter summaries based on selected year and month
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
          toast.success('✅ Updated successfully!')
        }
      } else {
        const res = await api.post('/transactions', {
          ...formData,
          amount: parseFloat(formData.amount)
        })

        if (res.data.success) {
          toast.success('✅ Added successfully!')
        }
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to save')
    }
  }

  const startEdit = (transaction) => {
    setEditingId(transaction._id)
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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

  const incomeCategories = ['Sales', 'Services', 'Investment', 'Other Income']
  const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Marketing', 'Transport', 'Food', 'Other']

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your finances...</p>
        </div>
      </div>
    )
  }

  const filteredSummaries = getFilteredSummaries()
  const filteredTotals = getFilteredSummary()

  return (
    <div className="lg:ml-64 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💰 Money Manager</h1>
              <p className="text-sm text-gray-600 mt-1">Track all your income and expenses</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm)
                if (editingId) resetForm()
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-medium transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Money In/Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Collapsible Date Selector */}
        <div className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden shadow-lg">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Time Period</h3>
                <p className="text-sm text-gray-600">
                  Currently viewing: {selectedMonth === 'all' 
                    ? `All of ${selectedYear}` 
                    : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                </p>
              </div>
            </div>
            {showDatePicker ? (
              <ChevronUp className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </button>

          {showDatePicker && (
            <div className="border-t border-gray-200 p-5 bg-gray-50">
              {/* Year Selector */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-3">Year:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={previousYear}
                    disabled={selectedYear <= Math.min(...availableYears)}
                    className="p-2 bg-white border-2 border-gray-300 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex-1 grid grid-cols-4 gap-2">
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year)
                          setSelectedMonth('all')
                        }}
                        className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                          selectedYear === year
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextYear}
                    disabled={selectedYear >= Math.max(...availableYears)}
                    className="p-2 bg-white border-2 border-gray-300 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Month Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Month:</label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {months.map(month => (
                    <button
                      key={month.value}
                      onClick={() => setSelectedMonth(month.value)}
                      className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                        selectedMonth === month.value
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-emerald-300'
                      } ${month.value === 'all' ? 'md:col-span-1 font-bold' : ''}`}
                    >
                      {month.value === 'all' ? month.label : month.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <ArrowDownCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Money In</p>
                <p className="text-3xl font-bold text-green-700">₹{filteredTotals.income.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <ArrowUpCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Money Out</p>
                <p className="text-3xl font-bold text-red-700">₹{filteredTotals.expense.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-800">Balance</p>
                <p className={`text-3xl font-bold ${filteredTotals.balance >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                  ₹{filteredTotals.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? '✏️ Edit Transaction' : '➕ Add New Transaction'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                    className={`p-4 rounded-lg border-2 font-medium transition-all ${
                      formData.type === 'income'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                    }`}
                  >
                    <ArrowDownCircle className={`w-8 h-8 mx-auto mb-2 ${formData.type === 'income' ? 'text-green-500' : 'text-gray-400'}`} />
                    Money In
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                    className={`p-4 rounded-lg border-2 font-medium transition-all ${
                      formData.type === 'expense'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                    }`}
                  >
                    <ArrowUpCircle className={`w-8 h-8 mx-auto mb-2 ${formData.type === 'expense' ? 'text-red-500' : 'text-gray-400'}`} />
                    Money Out
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Choose --</option>
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="What was it for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['cash', 'card', 'bank_transfer', 'other'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                        className={`py-3 px-4 rounded-lg border-2 font-medium capitalize transition-all ${
                          formData.paymentMethod === method
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        {method === 'bank_transfer' ? 'Bank' : method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update' : 'Save'}
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

        {/* Filter Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              filter === 'all' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border-2 border-gray-300'
            }`}
          >
            Show All
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              filter === 'income' 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border-2 border-gray-300'
            }`}
          >
            Money In
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              filter === 'expense' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border-2 border-gray-300'
            }`}
          >
            Money Out
          </button>
        </div>

        {/* Monthly Records */}
        {filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-gray-300">
            <DollarSign className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No records for this period</h3>
            <p className="text-gray-600 mb-6">Try selecting a different time period</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSummaries.map((monthly) => {
              const filteredTransactions = filter === 'all' 
                ? monthly.transactions 
                : monthly.transactions.filter(t => t.type === filter)

              if (filteredTransactions.length === 0) return null

              return (
                <div key={monthly.monthYear} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  {/* Month Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8" />
                        <div>
                          <h3 className="text-2xl font-bold">{getMonthName(monthly.monthYear)}</h3>
                          <p className="text-indigo-100">{monthly.transactions.length} transactions</p>
                        </div>
                      </div>

                      <div className="flex gap-8">
                        <div className="text-right">
                          <p className="text-sm text-indigo-100">In</p>
                          <p className="text-2xl font-bold">₹{monthly.income.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-indigo-100">Out</p>
                          <p className="text-2xl font-bold">₹{monthly.expense.toLocaleString()}</p>
                        </div>
                        <div className="text-right bg-white/20 px-4 py-2 rounded-lg">
                          <p className="text-sm text-indigo-100">Balance</p>
                          <p className={`text-2xl font-bold ${monthly.balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            ₹{monthly.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction._id} className={`p-5 hover:bg-gray-50 ${editingId === transaction._id ? 'bg-indigo-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                              transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {transaction.type === 'income' ? (
                                <ArrowDownCircle className="w-7 h-7 text-green-600" />
                              ) : (
                                <ArrowUpCircle className="w-7 h-7 text-red-600" />
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="text-lg font-bold text-gray-900">{transaction.description}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                <span className="font-medium">{transaction.category}</span>
                                <span>•</span>
                                <span>{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span>•</span>
                                <span className="capitalize">{transaction.paymentMethod.replace('_', ' ')}</span>
                              </div>
                            </div>

                            <div className="text-right mr-4">
                              <p className={`text-2xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                              </p>
                            </div>

                            {/* Edit Button Only */}
                            <button
                              onClick={() => startEdit(transaction)}
                              className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountingPage