import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import {
  LayoutDashboard, StickyNote, CheckSquare, DollarSign, Package,
  TrendingUp, Users, FileText, Kanban, Settings
} from 'lucide-react'

const modules = [
  { icon: LayoutDashboard, name: 'Dashboard', description: 'Overview & analytics', path: '/dashboard', permission: null },
  { icon: StickyNote, name: 'Notes', description: 'Quick notes & docs', path: '/notes', permission: 'notes.read' },
  { icon: CheckSquare, name: 'Tasks', description: 'To-do management', path: '/todos', permission: 'todos.read' },
  { icon: DollarSign, name: 'Accounting', description: 'Income & expenses', path: '/accounting', permission: 'accounting.read' },
  { icon: Package, name: 'Inventory', description: 'Stock management', path: '/inventory', permission: 'inventory.read' },
  { icon: FileText, name: 'Invoicing', description: 'Create & send invoices', path: '/invoices', permission: 'invoices.read' },
  { icon: Users, name: 'Customers', description: 'Contact database', path: '/customers', permission: 'customers.read' },
  { icon: Kanban, name: 'CRM', description: 'Pipeline & leads', path: '/crm', permission: 'crm.read' },
  { icon: TrendingUp, name: 'Reports', description: 'Business insights', path: '/reports', permission: 'reports.read' },
  { icon: Settings, name: 'Settings', description: 'Company & team', path: '/settings', permission: 'settings.read' },
]

const AppSwitcher = () => {
  const { hasPermission, currentOrgName } = useContext(AppContext)

  const visibleModules = modules.filter(m => !m.permission || hasPermission(m.permission))

  return (
    <div className="lg:ml-64 mt-14 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {currentOrgName || 'Your Workspace'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Select an app to get started</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {visibleModules.map(mod => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-0.5">{mod.name}</h3>
                <p className="text-xs text-slate-500">{mod.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AppSwitcher
