import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Eager imports (needed immediately)
import DashboardLayout from './components/DashboardLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Lazy-loaded pages
const LandingPage = lazy(() => import('./Pages/LandingPage.jsx'))
const Login = lazy(() => import('./Pages/Auth/Login.jsx'))
const EmailVerify = lazy(() => import('./Pages/Auth/EmailVerifty.jsx'))
const ResetPassword = lazy(() => import('./Pages/Auth/ResetPassword.jsx'))
const CreatePages = lazy(() => import('./Pages/CreatePages.jsx'))
const NoteDetailPage = lazy(() => import('./Pages/NoteDetailPage.jsx'))
const Dashboard = lazy(() => import('./Pages/Dashboard.jsx'))
const HomePages = lazy(() => import('./Pages/HomePages.jsx'))
const TodoPage = lazy(() => import('./Pages/TodoPage.jsx'))
const AccountingPage = lazy(() => import('./Pages/AccountingPage.jsx'))
const InventoryPage = lazy(() => import('./Pages/InventoryPage.jsx'))
const ReportsPage = lazy(() => import('./Pages/ReportsPage.jsx'))
const CustomersPage = lazy(() => import('./Pages/CustomersPage.jsx'))
const InvoicesPage = lazy(() => import('./Pages/InvoicesPage.jsx'))
const InvoiceFormPage = lazy(() => import('./Pages/InvoiceFormPage.jsx'))
const InvoiceDetailPage = lazy(() => import('./Pages/InvoiceDetailPage.jsx'))
const CRMPage = lazy(() => import('./Pages/CRMPage.jsx'))
const AppSwitcher = lazy(() => import('./components/AppSwitcher.jsx'))
const SettingsPage = lazy(() => import('./Pages/SettingsPage.jsx'))
const POSDashboard = lazy(() => import('./features/pos/POSDashboard.jsx'))
const ProductManagement = lazy(() => import('./features/pos/ProductManagement.jsx'))
const CustomerManagement = lazy(() => import('./features/pos/CustomerManagement.jsx'))
const BillingScreen = lazy(() => import('./features/pos/BillingScreen.jsx'))
const SalesHistory = lazy(() => import('./features/pos/SalesHistory.jsx'))
const PosInvoiceDetail = lazy(() => import('./features/pos/InvoiceDetail.jsx'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
  </div>
)

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth pages (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/email-verify" element={<EmailVerify />} />
          <Route path="/email-verifty" element={<Navigate to="/email-verify" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Full-screen editors (no sidebar) */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/:id"
            element={
              <ProtectedRoute>
                <NoteDetailPage />
              </ProtectedRoute>
            }
          />

          {/* All other pages: DashboardLayout provides sidebar + topbar */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<HomePages />} />
            <Route path="/todos" element={<TodoPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/pos" element={<POSDashboard />} />
            <Route path="/pos/products" element={<ProductManagement />} />
            <Route path="/pos/customers" element={<CustomerManagement />} />
            <Route path="/pos/billing" element={<BillingScreen />} />
            <Route path="/pos/sales" element={<SalesHistory />} />
            <Route path="/pos/sales/:id" element={<PosInvoiceDetail />} />
            <Route path="/apps" element={<AppSwitcher />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
