import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import {
  LayoutDashboard, StickyNote, CheckSquare, DollarSign, Package,
  TrendingUp, ShoppingCart, Users, FileText, Kanban, Settings
} from 'lucide-react'

const modules = [
  { icon: LayoutDashboard, name: 'Dashboard', description: 'Overview & analytics', path: '/dashboard', gradient: 'from-blue-500 to-cyan-500', permission: null },
  { icon: StickyNote, name: 'Notes', description: 'Quick notes & docs', path: '/', gradient: 'from-purple-500 to-pink-500', permission: 'notes.read' },
  { icon: CheckSquare, name: 'Tasks', description: 'To-do management', path: '/todos', gradient: 'from-green-500 to-emerald-500', permission: 'todos.read' },
  { icon: DollarSign, name: 'Accounting', description: 'Income & expenses', path: '/accounting', gradient: 'from-emerald-500 to-teal-500', permission: 'accounting.read' },
  { icon: Package, name: 'Inventory', description: 'Stock management', path: '/inventory', gradient: 'from-orange-500 to-red-500', permission: 'inventory.read' },
  { icon: FileText, name: 'Invoicing', description: 'Create & send invoices', path: '/invoices', gradient: 'from-teal-500 to-cyan-500', permission: 'invoices.read' },
  { icon: Users, name: 'Customers', description: 'Contact database', path: '/customers', gradient: 'from-indigo-500 to-violet-500', permission: 'customers.read' },
  { icon: Kanban, name: 'CRM', description: 'Pipeline & leads', path: '/crm', gradient: 'from-violet-500 to-purple-500', permission: 'crm.read' },
  { icon: ShoppingCart, name: 'Purchases', description: 'Purchase orders', path: '/purchases', gradient: 'from-blue-500 to-indigo-500', permission: 'purchases.read' },
  { icon: TrendingUp, name: 'Reports', description: 'Business insights', path: '/reports', gradient: 'from-pink-500 to-rose-500', permission: 'reports.read' },
  { icon: Settings, name: 'Settings', description: 'Company & team', path: '/settings', gradient: 'from-gray-500 to-gray-700', permission: 'settings.read' },
]

const AppSwitcher = () => {
  const { hasPermission, currentOrgName } = useContext(AppContext)

  const visibleModules = modules.filter(m => !m.permission || hasPermission(m.permission))

  return (
    <div className="lg:ml-64 mt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {currentOrgName || 'Your Workspace'}
          </h1>
          <p className="text-gray-500 mt-1">Select an app to get started</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleModules.map(mod => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{mod.name}</h3>
                <p className="text-xs text-gray-500">{mod.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AppSwitcher
