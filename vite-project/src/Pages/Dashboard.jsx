import React, { useState, useEffect } from 'react'
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
  Clock,
  Sparkles,
  Activity
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

  const StatCard = ({ icon: Icon, label, value, change, gradient, link, bgColor }) => (
    <Link 
      to={link}
      className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
        </div>
        
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </Link>
  )

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Preparing your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200  top-16 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
                {greeting}! 
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 rounded-xl border border-indigo-100">
                <p className="text-sm text-gray-600 mb-1">Quick Stats</p>
                <p className="text-lg font-bold gradient-text">All Systems Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <StatCard
            icon={StickyNote}
            label="Total Notes"
            value={stats.totalNotes}
            gradient="from-purple-500 to-pink-500"
            link="/"
          />
          <StatCard
            icon={CheckSquare}
            label="Tasks Progress"
            value={`${stats.completedTodos}/${stats.totalTodos}`}
            change={stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0}
            gradient="from-green-500 to-emerald-500"
            link="/todos"
          />
          <StatCard
            icon={DollarSign}
            label="Net Balance"
            value={`₹${stats.balance.toLocaleString()}`}
            change={stats.totalIncome > 0 ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100) : 0}
            gradient="from-blue-500 to-cyan-500"
            link="/accounting"
          />
          <StatCard
            icon={Package}
            label="Low Stock Alert"
            value={stats.lowStockItems}
            gradient="from-orange-500 to-red-500"
            link="/inventory"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Overview */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>
              </div>
              <Link to="/accounting" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View All →
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white shadow-lg group hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-green-100 text-sm font-medium mb-1">Total Income</p>
                      <p className="text-3xl font-bold">₹{stats.totalIncome.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-pink-600 p-5 text-white shadow-lg group hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-red-100 text-sm font-medium mb-1">Total Expenses</p>
                      <p className="text-3xl font-bold">₹{stats.totalExpense.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg border-2 border-white group hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-indigo-100 text-sm font-medium mb-1">Net Profit/Loss</p>
                      <p className="text-3xl font-bold">₹{stats.balance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <Sparkles className="absolute top-4 right-4 w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
              </div>
              <Link to="/accounting" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View All →
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-gray-600 mb-4">Start tracking your income and expenses</p>
                <Link to="/accounting" className="btn-primary inline-flex">
                  Add Transaction
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction, index) => (
                  <div 
                    key={transaction._id} 
                    className="group flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                        transaction.type === 'income' 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                          : 'bg-gradient-to-br from-red-500 to-pink-600'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-white" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
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
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-2xl p-6 flex items-start gap-4 shadow-lg animate-slide-up">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-1">⚠️ Low Stock Alert</h3>
              <p className="text-amber-800 mb-3">
                You have <strong>{stats.lowStockItems}</strong> item{stats.lowStockItems > 1 ? 's' : ''} running low on stock. 
                Take action to avoid stockouts!
              </p>
              <Link 
                to="/inventory" 
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
              >
                View Inventory →
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/create" className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 transition-all duration-200 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <StickyNote className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900">New Note</p>
              <p className="text-xs text-gray-600">Create a note</p>
            </Link>

            <Link to="/todos" className="group p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 transition-all duration-200 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900">Add Task</p>
              <p className="text-xs text-gray-600">Create a todo</p>
            </Link>

            <Link to="/accounting" className="group p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border border-blue-200 transition-all duration-200 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900">Add Transaction</p>
              <p className="text-xs text-gray-600">Track finance</p>
            </Link>

            <Link to="/inventory" className="group p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border border-orange-200 transition-all duration-200 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900">Add Product</p>
              <p className="text-xs text-gray-600">Manage stock</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard