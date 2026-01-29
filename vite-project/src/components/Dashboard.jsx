import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  CheckSquare,
  StickyNote,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from "../Pages/lib/axios"
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalTodos: 0,
    completedTodos: 0,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentTransactions, setRecentTransactions] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [notesRes, todosRes, summaryRes, inventoryRes, transactionsRes] = await Promise.all([
        api.get('/notes'),
        api.get('/todos'),
        api.get('/transactions/summary'),
        api.get('/inventory/low-stock'),
        api.get('/transactions'),
      ])

      const todos = todosRes.data
      const completedCount = todos.filter(t => t.completed).length

      setStats({
        totalNotes: notesRes.data.length,
        totalTodos: todos.length,
        completedTodos: completedCount,
        totalIncome: summaryRes.data.totalIncome || 0,
        totalExpense: summaryRes.data.totalExpense || 0,
        balance: summaryRes.data.balance || 0,
        lowStockItems: inventoryRes.data.length,
      })

      setRecentTransactions(transactionsRes.data.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, change, color, link }) => (
    <Link 
      to={link}
      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
      </div>
    </Link>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen ml-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={StickyNote}
          label="Total Notes"
          value={stats.totalNotes}
          color="from-purple-500 to-purple-600"
          link="/"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks Completed"
          value={`${stats.completedTodos}/${stats.totalTodos}`}
          color="from-green-500 to-green-600"
          link="/todos"
        />
        <StatCard
          icon={DollarSign}
          label="Balance"
          value={`₹${stats.balance.toLocaleString()}`}
          change={stats.totalIncome > 0 ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1) : 0}
          color="from-emerald-500 to-emerald-600"
          link="/accounting"
        />
        <StatCard
          icon={Package}
          label="Low Stock Items"
          value={stats.lowStockItems}
          color="from-orange-500 to-orange-600"
          link="/inventory"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Overview */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Financial Overview</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-xl font-bold text-gray-900">₹{stats.totalIncome.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expense</p>
                  <p className="text-xl font-bold text-gray-900">₹{stats.totalExpense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Balance</p>
                  <p className="text-xl font-bold text-indigo-600">₹{stats.balance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link to="/accounting" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
              <Link to="/accounting" className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
                Add your first transaction
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {stats.lowStockItems > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">Low Stock Alert</h3>
            <p className="text-sm text-amber-700 mt-1">
              You have {stats.lowStockItems} item{stats.lowStockItems > 1 ? 's' : ''} running low on stock.
            </p>
          </div>
          <Link to="/inventory" className="text-sm font-medium text-amber-600 hover:text-amber-700">
            View →
          </Link>
        </div>
      )}
    </div>
  )
}

export default Dashboard