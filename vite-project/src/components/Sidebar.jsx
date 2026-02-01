import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  StickyNote, 
  CheckSquare, 
  DollarSign, 
  Package,
  TrendingUp,
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()

  // Hide sidebar on auth pages
  const hideOnPages = ['/login', '/register', '/email-verifty', '/reset-password']
  const shouldHide = hideOnPages.includes(location.pathname)

  // Also hide on note create/edit pages
  const isEditorPage = location.pathname.includes('/create') || (location.pathname.includes('/notes/') && location.pathname !== '/notes')

  if (shouldHide || isEditorPage) return null

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      color: 'text-blue-500'
    },
    { 
      icon: StickyNote, 
      label: 'Notes', 
      path: '/',
      color: 'text-purple-500'
    },
    { 
      icon: CheckSquare, 
      label: 'To-Do List', 
      path: '/todos',
      color: 'text-green-500'
    },
    { 
      icon: DollarSign, 
      label: 'Accounting', 
      path: '/accounting',
      color: 'text-emerald-500'
    },
    { 
      icon: Package, 
      label: 'Inventory', 
      path: '/inventory',
      color: 'text-orange-500'
    },
    { 
      icon: TrendingUp, 
      label: 'Reports', 
      path: '/reports',
      color: 'text-pink-500'
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
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white border-r border-gray-200 
        transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'w-64' : 'lg:w-64'}
        overflow-y-auto
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Workspace</h2>
          <p className="text-xs text-gray-500 mt-1">Manage your business</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Close on mobile after click
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                  ${active 
                    ? 'bg-indigo-50 text-indigo-600 font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? item.color : 'text-gray-400'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-800">Need help?</p>
              <p className="text-xs text-gray-500">Check our docs</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar