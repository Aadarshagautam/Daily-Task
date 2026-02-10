import React, { useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppContext } from './context/AppContext.jsx'

// Layout
import DashboardLayout from './components/DashboardLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Auth (no layout)
import Login from './Pages/Auth/Login.jsx'
import EmailVerifty from './Pages/Auth/EmailVerifty.jsx'
import ResetPassword from './Pages/Auth/ResetPassword.jsx'

// Full-screen editors (no sidebar)
import CreatePages from './Pages/CreatePages.jsx'
import NoteDetailPage from './Pages/NoteDetailPage.jsx'

// Pages rendered inside DashboardLayout
import Dashboard from './Pages/Dashboard.jsx'
import HomePages from './Pages/HomePages.jsx'
import TodoPage from './Pages/TodoPage.jsx'
import AccountingPage from './Pages/AccountingPage.jsx'
import InventoryPage from './Pages/InventoryPage.jsx'
import ReportsPage from './Pages/ReportsPage.jsx'
import PurchasePage from './Pages/PurchasePage.jsx'
import CustomersPage from './Pages/CustomersPage.jsx'
import InvoicesPage from './Pages/InvoicesPage.jsx'
import InvoiceFormPage from './Pages/InvoiceFormPage.jsx'
import InvoiceDetailPage from './Pages/InvoiceDetailPage.jsx'
import CRMPage from './Pages/CRMPage.jsx'
import LeadListPage from './Pages/crm/LeadListPage.jsx'
import LeadFormPage from './Pages/crm/LeadFormPage.jsx'
import LeadsKanbanPage from './Pages/crm/LeadsKanbanPage.jsx'
import AppSwitcher from './components/AppSwitcher.jsx'
import SettingsPage from './Pages/SettingsPage.jsx'

const App = () => {
  const { hasCheckedAuth } = useContext(AppContext)

  if (!hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Routes>
        {/* ── Auth pages (no layout) ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/email-verifty" element={<EmailVerifty />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Full-screen editors (no sidebar) ── */}
        <Route path="/create" element={<ProtectedRoute><CreatePages /></ProtectedRoute>} />
        <Route path="/notes/:id" element={<ProtectedRoute><NoteDetailPage /></ProtectedRoute>} />

        {/* ── All other pages: DashboardLayout provides Odoo sidebar + topbar ── */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePages />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/todos" element={<TodoPage />} />
          <Route path="/accounting" element={<AccountingPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/purchases" element={<PurchasePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/new" element={<InvoiceFormPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/crm/leads" element={<LeadListPage />} />
          <Route path="/crm/leads/new" element={<LeadFormPage />} />
          <Route path="/crm/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/crm/pipeline" element={<LeadsKanbanPage />} />
          <Route path="/apps" element={<AppSwitcher />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
