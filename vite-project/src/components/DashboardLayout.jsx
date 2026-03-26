import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  LogOut,
  Mail,
  Menu,
  ShoppingCart,
  Table2,
  User,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AppContext from '../context/app-context.js'
import {
  getActiveAppForBusiness,
  getSidebarSectionsForBusiness,
  isMenuItemActive,
} from '../config/businessConfigs'
import { getRoleMeta } from '../config/roleMeta.js'
import api from '../lib/api.js'

const getPrimaryActionForBusiness = (businessType) => {
  if (businessType === 'shop') {
    return { label: 'New sale', path: '/pos/billing', icon: ShoppingCart }
  }

  if (businessType === 'restaurant') {
    return { label: 'Open tables', path: '/pos/tables', icon: Table2 }
  }

  if (businessType === 'cafe') {
    return { label: 'New order', path: '/pos/billing', icon: ShoppingCart }
  }

  return { label: 'New sale', path: '/pos/billing', icon: ShoppingCart }
}

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { orgBusinessType } = useContext(AppContext)
  const activeApp = getActiveAppForBusiness(location.pathname, orgBusinessType)

  return (
    <div className="erp-app-shell">
      <Sidebar
        pathname={location.pathname}
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        businessType={orgBusinessType}
      />
      <div className="erp-app-main">
        <TopBar activeApp={activeApp} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(previous => !previous)} />
        <main className="erp-app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const TopBar = ({ activeApp, sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const { userData, userRole, setUserData, setIsLoggedin, isLoggedin, currentOrgName, orgBusinessType } = useContext(AppContext)
  const primaryAction = getPrimaryActionForBusiness(orgBusinessType)
  const roleMeta = getRoleMeta(userRole)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sendVerificationOtp = async () => {
    try {
      const { data } = await api.post('/auth/send-verify-opt')
      if (data.success) {
        toast.success(data.message)
        navigate('/email-verifty')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const logout = async () => {
    try {
      const { data } = await api.post('/auth/logout')
      if (data.success) {
        setIsLoggedin(false)
        setUserData(null)
        toast.success('Logged out successfully')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <header className="erp-shell-topbar">
      <div className="erp-shell-topbar-inner">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="erp-topbar-button p-2 lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-3 lg:hidden">
            <div className="erp-sidebar-brand-mark h-10 w-10 rounded-[16px]">
              CO
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">CommerceOS</p>
              <p className="text-xs text-slate-500">Nepal business software</p>
            </div>
          </Link>

          {activeApp ? (
            <div className="erp-topbar-active-pill hidden min-w-0 lg:flex">
              <div className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                Active
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{activeApp.name}</p>
                <p className="truncate text-xs text-slate-500">{activeApp.description}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {currentOrgName ? (
            <div className="erp-topbar-pill hidden xl:flex">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="max-w-[11rem] truncate">{currentOrgName}</span>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700">NPR</span>
            </div>
          ) : null}

          {isLoggedin ? (
            <>
              <button
                onClick={() => navigate(primaryAction.path)}
                className="hidden btn-primary lg:inline-flex"
              >
                {primaryAction.label}
              </button>

              <button className="erp-topbar-button relative p-2">
                <Bell className="h-5 w-5" />
                {userData && !userData.isAccountVerified ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" /> : null}
              </button>

              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className="erp-profile-trigger"
                >
                  <div className="erp-avatar-shell h-9 w-9 rounded-[16px]">
                    {userData?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden min-w-0 text-left md:block">
                    <p className="max-w-[8rem] truncate text-sm font-medium text-slate-900">{userData?.username || 'User'}</p>
                    <p className="max-w-[8rem] truncate text-xs text-slate-500">
                      {roleMeta.label} / {currentOrgName || 'Business'}
                    </p>
                  </div>
                </button>

                <div className={`erp-menu-surface absolute right-0 mt-2 w-72 overflow-hidden transition-all duration-150 ${profileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
                  <div className="border-b border-slate-100 px-4 py-4">
                    <p className="truncate text-sm font-semibold text-slate-900">{userData?.username || 'User'}</p>
                    <p className="truncate text-xs text-slate-500">{userData?.email}</p>
                    <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                      {roleMeta.label}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{roleMeta.summary}</p>
                    {currentOrgName ? <p className="truncate text-xs text-slate-400">{currentOrgName}</p> : null}
                  </div>

                  <div className="p-2">
                    {userData && !userData.isAccountVerified ? (
                      <button
                        onClick={sendVerificationOtp}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-blue-50"
                      >
                        <Mail className="h-4 w-4 text-blue-500" />
                        Verify email
                      </button>
                    ) : null}

                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      My profile
                    </Link>

                    <div className="my-2 h-px bg-slate-100" />

                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

const Sidebar = ({ pathname, isOpen, closeSidebar, businessType }) => {
  const navigate = useNavigate()
  const { hasPermission } = useContext(AppContext)
  const sidebarSections = getSidebarSectionsForBusiness(businessType)
  const visibleSections = sidebarSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.permission || hasPermission(item.permission)),
    }))
    .filter(section => section.items.length > 0)

  const handleMenuClick = (path) => {
    navigate(path)
    closeSidebar()
  }

  return (
    <>
      {isOpen ? <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={closeSidebar} /> : null}

      <aside
        className={`erp-shell-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="erp-sidebar-surface">
          <div className="erp-sidebar-brand-row">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="erp-sidebar-brand-mark">
                CO
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">CommerceOS</p>
                <p className="truncate text-xs text-slate-300">Nepal business software</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5">
            {visibleSections.map(section => (
              <div key={section.title} className="mb-6">
                <div className="erp-sidebar-section">{section.title}</div>
                <div className="mt-3 space-y-2">
                  {section.items.map(item => {
                    const ItemIcon = item.icon
                    const isActive = isMenuItemActive(item, pathname)

                    return (
                      <button
                        key={item.path}
                        onClick={() => handleMenuClick(item.path)}
                        className={`erp-sidebar-item ${isActive ? 'erp-sidebar-item-active' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="erp-sidebar-icon-shell">
                            <ItemIcon className="h-5 w-5" />
                          </div>
                          <span className="erp-sidebar-item-label">
                            {item.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default DashboardLayout
