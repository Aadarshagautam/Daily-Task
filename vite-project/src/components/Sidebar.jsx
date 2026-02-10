import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  StickyNote, 
  CheckSquare, 
  DollarSign, 
  Package,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  Zap,
  ShoppingCart,
  Users,
  FileText,
  Kanban,
  Settings
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()

  const hideOnPages = ['/login', '/register', '/email-verifty', '/reset-password']
  const shouldHide = hideOnPages.includes(location.pathname)
  const isEditorPage = location.pathname.includes('/create') || (location.pathname.includes('/notes/') && location.pathname !== '/notes')

  if (shouldHide || isEditorPage) return null

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: StickyNote, 
      label: 'Notes', 
      path: '/',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      icon: CheckSquare, 
      label: 'To-Do List', 
      path: '/todos',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      icon: DollarSign, 
      label: 'Accounting', 
      path: '/accounting',
      gradient: 'from-emerald-500 to-teal-500'
    },
    { 
      icon: Package, 
      label: 'Inventory', 
      path: '/inventory',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      icon: TrendingUp, 
      label: 'Reports', 
      path: '/reports',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: ShoppingCart,
      label: 'Purchases',
      path: '/purchases',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Kanban,
      label: 'CRM Pipeline',
      path: '/crm',
      gradient: 'from-violet-500 to-purple-500',
      section: 'CRM'
    },
    {
      icon: Users,
      label: 'Customers',
      path: '/customers',
      gradient: 'from-indigo-500 to-violet-500'
    },
    {
      icon: FileText,
      label: 'Invoices',
      path: '/invoices',
      gradient: 'from-teal-500 to-cyan-500'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      gradient: 'from-gray-500 to-gray-700',
      section: 'Settings'
    },
  ]

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
        transition-all duration-300 ease-in-out z-40 w-64
        shadow-xl lg:shadow-none
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Workspace</h2>
              <p className="text-xs text-gray-500">Manage everything</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-180px)]">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <React.Fragment key={item.path}>
                {item.section && (
                  <div className="pt-4 pb-2 px-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.section}</p>
                  </div>
                )}
              <Link
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  group relative flex items-center justify-between px-4 py-3 rounded-xl 
                  transition-all duration-200 overflow-hidden
                  ${active 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r`}></div>
                )}
                
                <div className="flex items-center gap-3 flex-1">
                  <div className={`
                    w-9 h-9 rounded-xl flex items-center justify-center
                    ${active 
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                    }
                    transition-all duration-200
                  `}>
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </div>
                
                {active && (
                  <ChevronRight className="w-4 h-4 text-indigo-600 animate-pulse" />
                )}
              </Link>
              </React.Fragment>
            )
          })}
        </nav>

        {/* Bottom Help Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Need Help?</p>
                <p className="text-xs text-gray-500 truncate">View documentation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar