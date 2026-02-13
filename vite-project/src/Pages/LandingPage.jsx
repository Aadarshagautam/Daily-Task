import { useContext } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import {
  Kanban, Package, FileText, DollarSign, ShoppingCart,
  CheckSquare, StickyNote, Monitor, TrendingUp, ArrowRight, Github, Linkedin
} from 'lucide-react'

const features = [
  { icon: Kanban, name: 'CRM', desc: 'Pipeline management with drag-and-drop Kanban boards, lead tracking, and conversion to customers.' },
  { icon: Monitor, name: 'Point of Sale', desc: 'Fast billing interface, product catalog, customer lookup, and sales history with invoice generation.' },
  { icon: FileText, name: 'Invoicing', desc: 'Create professional invoices, track payment status, and manage customer billing.' },
  { icon: Package, name: 'Inventory', desc: 'Product management with stock levels, low-stock alerts, cost/selling price tracking, and VAT support.' },
  { icon: DollarSign, name: 'Accounting', desc: 'Track income and expenses, categorize transactions, and monitor cash flow with visual reports.' },
  { icon: CheckSquare, name: 'Tasks & Notes', desc: 'Organize work with to-do lists, priority levels, due dates, and rich-text note taking.' },
]

const techStack = ['React 19', 'Express', 'MongoDB', 'Tailwind CSS', 'JWT Auth', 'RBAC']

const LandingPage = () => {
  const { isLoggedin, hasCheckedAuth } = useContext(AppContext)

  if (hasCheckedAuth && isLoggedin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">ThinkBoard</span>
          </div>
          <Link
            to="/login"
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
          All-in-one business<br />management platform
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          CRM, Point of Sale, Invoicing, Inventory, Accounting, and more — built as a modern, open-source alternative inspired by Odoo.
        </p>

        {/* Demo CTA */}
        <div className="inline-flex flex-col items-center gap-4 mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Try the Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="mx-auto max-w-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Demo Account</p>
          <p className="text-sm text-slate-700 font-mono">demo@thinkboard.app</p>
          <p className="text-sm text-slate-700 font-mono">Demo@1234</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div key={f.name} className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{f.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Built with</p>
          <div className="flex flex-wrap justify-center gap-2">
            {techStack.map(t => (
              <span key={t} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Built by <span className="font-medium text-slate-700">Aashish Sunar</span>
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Aashish-Sunar" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com/in/aashish-sunar" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
