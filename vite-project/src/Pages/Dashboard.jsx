import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  CheckSquare,
  StickyNote,
  AlertCircle,
  ArrowUpRight,
  Calendar,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from './lib/axios'
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
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
    fetchDashboardData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [notesRes, todosRes, summaryRes, inventoryRes, transactionsRes] = await Promise.all([
        api.get('/notes'),
        api.get('/todos'),
        api.get('/transactions/summary'),
        api.get('/inventory/low-stock'),
        api.get('/transactions'),
      ])

      const notes = Array.isArray(notesRes.data?.data) ? notesRes.data.data : []
      const todos = Array.isArray(todosRes.data?.data) ? todosRes.data.data : []
      const summary = summaryRes.data?.data || {}
      const lowStockItems = Array.isArray(inventoryRes.data?.data) ? inventoryRes.data.data : []
      const transactions = Array.isArray(transactionsRes.data?.data)
        ? transactionsRes.data.data
        : []

      const completedCount = todos.filter(t => t.completed).length

      setStats({
        totalNotes: notes.length,
        totalTodos: todos.length,
        completedTodos: completedCount,
        totalIncome: summary.totalIncome || 0,
        totalExpense: summary.totalExpense || 0,
        balance: summary.balance || 0,
        lowStockItems: lowStockItems.length,
      })

      setRecentTransactions(transactions.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, change, link }) => (
    <Link
      to={link}
      className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>

      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <h3 className="text-2xl font-semibold text-slate-900 mb-1">{value}</h3>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        )}
      </div>
    </Link>
  )

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 mb-0.5">
                {greeting}
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={StickyNote}
            label="Total Notes"
            value={stats.totalNotes}
            link="/notes"
          />
          <StatCard
            icon={CheckSquare}
            label="Tasks Progress"
            value={`${stats.completedTodos}/${stats.totalTodos}`}
            change={stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0}
            link="/todos"
          />
          <StatCard
            icon={DollarSign}
            label="Net Balance"
            value={`\u20B9${stats.balance.toLocaleString()}`}
            change={stats.totalIncome > 0 ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100) : 0}
            link="/accounting"
          />
          <StatCard
            icon={Package}
            label="Low Stock Items"
            value={stats.lowStockItems}
            link="/inventory"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Overview */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900">Financial Overview</h2>
              <Link to="/accounting" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Income</p>
                    <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{stats.totalIncome.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Expenses</p>
                    <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{stats.totalExpense.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net Profit/Loss</p>
                    <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{stats.balance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
              <Link to="/accounting" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                View All
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">No Transactions Yet</h3>
                <p className="text-sm text-slate-500 mb-4">Start tracking your income and expenses</p>
                <Link to="/accounting" className="btn-primary inline-flex text-sm">
                  Add Transaction
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income'
                          ? 'bg-emerald-100'
                          : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{'\u20B9'}{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStockItems > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">Low Stock Alert</h3>
              <p className="text-sm text-amber-800 mb-3">
                You have <strong>{stats.lowStockItems}</strong> item{stats.lowStockItems > 1 ? 's' : ''} running low on stock.
              </p>
              <Link
                to="/inventory"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
              >
                View Inventory <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/create" className="group p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                <StickyNote className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-900">New Note</p>
              <p className="text-xs text-slate-500 mt-0.5">Create a note</p>
            </Link>

            <Link to="/todos" className="group p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                <CheckSquare className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-900">Add Task</p>
              <p className="text-xs text-slate-500 mt-0.5">Create a todo</p>
            </Link>

            <Link to="/accounting" className="group p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-900">Add Transaction</p>
              <p className="text-xs text-slate-500 mt-0.5">Track finance</p>
            </Link>

            <Link to="/inventory" className="group p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-900">Add Product</p>
              <p className="text-xs text-slate-500 mt-0.5">Manage stock</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
