import React, { useState, useContext } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LayoutGrid, Bell, LogOut, User, Mail, LayoutDashboard, ChevronRight } from 'lucide-react'
import { AppContext } from '../context/AppContext'
import { apps, getActiveApp, isMenuItemActive } from '../config/sidebarConfig'
import axios from 'axios'
import toast from 'react-hot-toast'

/* ─── accent color lookup (tailwind classes) ─── */
const accentClasses = {
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-500',  icon: 'bg-violet-100 text-violet-600' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-500',    icon: 'bg-blue-100 text-blue-600' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-500',  icon: 'bg-orange-100 text-orange-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', icon: 'bg-emerald-100 text-emerald-600' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   border: 'border-green-500',   icon: 'bg-green-100 text-green-600' },
  gray:    { bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-500',    icon: 'bg-gray-200 text-gray-600' },
}

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const activeApp = getActiveApp(location.pathname)

  return (
    <>
      <TopBar
        activeApp={activeApp}
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(prev => !prev)}
      />
      <OdooSidebar
        activeApp={activeApp}
        pathname={location.pathname}
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />
      <Outlet />
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   TOP BAR
   ═══════════════════════════════════════════════════════ */
const TopBar = ({ activeApp, sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate()
  const {
    userData, backendUrl, setUserData, setIsLoggedin,
    isLoggedin, currentOrgName,
  } = useContext(AppContext)

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/api/auth/send-verify-opt')
      data.success ? toast.success(data.message) : toast.error(data.message)
      if (data.success) navigate('/email-verifty')
    } catch (e) { toast.error(e.message) }
  }

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/api/auth/logout')
      if (data.success) {
        setIsLoggedin(false)
        setUserData(null)
        toast.success('Logged out successfully')
        navigate('/login')
      }
    } catch (e) { toast.error(e.message) }
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4 lg:pl-[17rem]">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="hidden sm:block text-base font-bold text-gray-900">ThinkBoard</span>
          </Link>

          {/* Breadcrumb-style active app indicator */}
          {activeApp && (
            <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 ml-2">
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-700">{activeApp.name}</span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {isLoggedin ? (
            <>
              <Link
                to="/apps"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="All Apps"
              >
                <LayoutGrid className="w-5 h-5 text-gray-500" />
              </Link>

              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                {userData && !userData.isAccountVerified && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* User dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                    {userData?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {userData?.username || 'User'}
                  </span>
                </button>

                <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userData?.username || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                    {currentOrgName && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{currentOrgName}</p>
                    )}
                  </div>

                  <div className="p-1.5">
                    {userData && !userData.isAccountVerified && (
                      <button
                        onClick={sendVerificationOtp}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Mail className="w-4 h-4 text-indigo-500" /> Verify Email
                      </button>
                    )}
                    <Link
                      to="/dashboard"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-500" /> My Profile
                    </Link>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

/* ═══════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════ */
const OdooSidebar = ({ activeApp, pathname, isOpen, closeSidebar }) => {
  const navigate = useNavigate()

  // Separate settings from the rest
  const mainApps = apps.filter(a => a.id !== 'settings')
  const settingsApp = apps.find(a => a.id === 'settings')

  const handleAppClick = (app) => {
    navigate(app.basePath)
    closeSidebar()
  }

  const handleMenuClick = (path) => {
    navigate(path)
    closeSidebar()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200
        z-40 flex flex-col transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Dashboard quick link */}
        <div className="px-3 pt-4 pb-2">
          <Link
            to="/dashboard"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
        </div>

        <div className="h-px bg-gray-100 mx-4" />

        {/* App list */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {mainApps.map(app => {
            const Icon = app.icon
            const isActive = activeApp?.id === app.id
            const accent = accentClasses[app.accent] || accentClasses.gray

            return (
              <div key={app.id}>
                {/* App row */}
                <button
                  onClick={() => handleAppClick(app)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? `${accent.bg} ${accent.text} font-semibold`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? accent.icon : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{app.name}</span>
                  {isActive && app.menu.length > 1 && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40 rotate-90" />
                  )}
                </button>

                {/* Submenu (expanded only for active app) */}
                {isActive && app.menu.length > 1 && (
                  <div className="ml-5 pl-4 border-l-2 border-gray-200 mt-1 mb-2 space-y-0.5">
                    {app.menu.map(item => {
                      const ItemIcon = item.icon
                      const menuActive = isMenuItemActive(item, pathname)

                      return (
                        <button
                          key={item.path}
                          onClick={() => handleMenuClick(item.path)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            menuActive
                              ? `${accent.text} font-medium bg-white shadow-sm border border-gray-100`
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Settings — pinned at bottom */}
        {settingsApp && (
          <div className="border-t border-gray-100 px-3 py-3">
            <button
              onClick={() => handleAppClick(settingsApp)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeApp?.id === 'settings'
                  ? 'bg-gray-100 text-gray-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeApp?.id === 'settings' ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <settingsApp.icon className="w-4 h-4" />
              </div>
              <span className="text-sm">Settings</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export default DashboardLayout
