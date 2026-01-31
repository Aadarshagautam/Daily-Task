import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Filter,
  Calendar,
  Trash2,
  Edit,
  Download
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
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState('all') // all, income, expense
  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  })

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
      
      setTransactions(transactionsRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (e) => {
    e.preventDefault()

    if (!newTransaction.category || !newTransaction.amount || !newTransaction.description) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await api.post('/transactions', {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      })

      if (res.data.success) {
        setTransactions([res.data.transaction, ...transactions])
        
        // Update summary
        if (newTransaction.type === 'income') {
          setSummary({
            ...summary,
            totalIncome: summary.totalIncome + parseFloat(newTransaction.amount),
            balance: summary.balance + parseFloat(newTransaction.amount)
          })
        } else {
          setSummary({
            ...summary,
            totalExpense: summary.totalExpense + parseFloat(newTransaction.amount),
            balance: summary.balance - parseFloat(newTransaction.amount)
          })
        }

        setNewTransaction({
          type: 'income',
          category: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash'
        })
        setShowAddForm(false)
        toast.success('Transaction added!')
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Failed to add transaction')
    }
  }

  const handleDeleteTransaction = async (id, type, amount) => {
    if (!window.confirm('Delete this transaction?')) return

    try {
      const res = await api.delete(`/transactions/${id}`)
      if (res.data.success) {
        setTransactions(transactions.filter(t => t._id !== id))
        
        // Update summary
        if (type === 'income') {
          setSummary({
            ...summary,
            totalIncome: summary.totalIncome - amount,
            balance: summary.balance - amount
          })
        } else {
          setSummary({
            ...summary,
            totalExpense: summary.totalExpense - amount,
            balance: summary.balance + amount
          })
        }
        
        toast.success('Transaction deleted')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'income') return t.type === 'income'
    if (filter === 'expense') return t.type === 'expense'
    return true
  })

  const incomeCategories = ['Sales', 'Services', 'Investment', 'Other Income']
  const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Marketing', 'Other Expense']

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounting data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounting</h1>
        <p className="text-gray-600">Track your shop's income and expenses.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-green-100 text-sm">Total Income</p>
              <h3 className="text-3xl font-bold">₹{summary.totalIncome.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-100 text-sm">Total Expense</p>
              <h3 className="text-3xl font-bold">₹{summary.totalExpense.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Net Balance</p>
              <h3 className="text-3xl font-bold">₹{summary.balance.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'income' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'expense' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Expense
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Transaction</h3>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value, category: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select category</option>
                  {(newTransaction.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={newTransaction.paymentMethod}
                  onChange={(e) => setNewTransaction({ ...newTransaction, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter description"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Transaction
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600 mb-4">Start tracking your income and expenses.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Add First Transaction
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{transaction.paymentMethod.replace('_', ' ')}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteTransaction(transaction._id, transaction.type, transaction.amount)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountingPage