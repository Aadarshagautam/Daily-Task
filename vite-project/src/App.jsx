import React, { useContext } from 'react'
import{Routes, Route} from "react-router-dom"
import CreatePages from './Pages/CreatePages.jsx'
import NoteDetailPage from './Pages/NoteDetailPage.jsx'
import HomePages from './Pages/HomePages.jsx'
import Login from './Pages/Auth/Login.jsx'
import EmailVerifty from './Pages/Auth/EmailVerifty.jsx'
import ResetPassword from './Pages/Auth/ResetPassword.jsx'
import Dashboard from './Pages/Dashboard.jsx'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'
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
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { Toaster } from 'react-hot-toast'
import { AppContext } from './context/AppContext.jsx'



const App = () => {
  const { hasCheckedAuth } = useContext(AppContext)

  if (!hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_60%,#00FF9D40_100%)] " />
      <Toaster position="top-right" />
      <Navbar />
      <Sidebar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><HomePages /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreatePages /></ProtectedRoute>} />
        <Route path="/notes/:id" element={<ProtectedRoute><NoteDetailPage/></ProtectedRoute>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/email-verifty" element={<EmailVerifty/>} />
        <Route path="/reset-password" element={<ResetPassword/>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/todos" element={<ProtectedRoute><TodoPage/></ProtectedRoute>} />
        <Route path="/accounting" element={<ProtectedRoute><AccountingPage/></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><InventoryPage/></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage/></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><PurchasePage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
