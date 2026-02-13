import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { Building2, Users, ScrollText, Save, Shield } from 'lucide-react'

const TABS = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'audit', label: 'Audit Log', icon: ScrollText },
]

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('company')

  return (
    <div className="lg:ml-64 mt-16 min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your organization</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-slate-600 text-slate-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6 max-w-4xl">
        {activeTab === 'company' && <CompanyTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}

// ── Company Tab ──
const CompanyTab = () => {
  const { backendUrl } = useContext(AppContext)
  const [form, setForm] = useState({ name: '', phone: '', email: '', gstin: '', currency: 'INR', invoicePrefix: 'INV', financialYearStart: 'April' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axios.get(`${backendUrl}/api/org`).then(({ data }) => {
      if (data.success && data.org) {
        setForm({
          name: data.org.name || '',
          phone: data.org.phone || '',
          email: data.org.email || '',
          gstin: data.org.gstin || '',
          currency: data.org.currency || 'INR',
          invoicePrefix: data.org.invoicePrefix || 'INV',
          financialYearStart: data.org.financialYearStart || 'April',
        })
      }
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await axios.put(`${backendUrl}/api/org`, form)
      if (data.success) toast.success('Settings saved')
      else toast.error(data.message)
    } catch (err) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Company Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
          <input type="text" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
          <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400">
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Prefix</label>
          <input type="text" value={form.invoicePrefix} onChange={e => setForm({ ...form, invoicePrefix: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Financial Year Start</label>
          <select value={form.financialYearStart} onChange={e => setForm({ ...form, financialYearStart: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400">
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── Team Tab ──
const TeamTab = () => {
  const { backendUrl, userRole } = useContext(AppContext)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${backendUrl}/api/org/members`).then(({ data }) => {
      if (data.success) setMembers(data.members)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const { data } = await axios.patch(`${backendUrl}/api/org/members/${memberId}/role`, { role: newRole })
      if (data.success) {
        setMembers(prev => prev.map(m => m._id === memberId ? { ...m, role: newRole } : m))
        toast.success('Role updated')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  const ROLE_BADGES = {
    owner: 'bg-yellow-100 text-yellow-700',
    admin: 'bg-red-100 text-red-700',
    manager: 'bg-purple-100 text-purple-700',
    member: 'bg-blue-100 text-blue-700',
    viewer: 'bg-slate-100 text-slate-600',
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-slate-300 rounded-full border-t-transparent animate-spin" /></div>
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Team Members</h2>
        <p className="text-sm text-slate-500 mt-1">{members.length} member(s) in this organization</p>
      </div>
      <div className="divide-y divide-slate-100">
        {members.map(member => (
          <div key={member._id} className="flex items-center justify-between p-4 hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                {member.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{member.username}</p>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(userRole === 'owner' || userRole === 'admin') && member.role !== 'owner' ? (
                <select
                  value={member.role}
                  onChange={e => handleRoleChange(member._id, e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${ROLE_BADGES[member.role]}`}>
                  <Shield className="w-3 h-3 inline mr-1" />{member.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Audit Tab ──
const AuditTab = () => {
  const { backendUrl } = useContext(AppContext)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchLogs = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/audit?page=${p}&limit=30`)
      if (data.success) {
        setLogs(data.logs)
        setPagination(data.pagination)
        setPage(p)
      }
    } catch (err) {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const ACTION_COLORS = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    login: 'bg-slate-100 text-slate-700',
    stage_change: 'bg-purple-100 text-purple-700',
    convert: 'bg-yellow-100 text-yellow-700',
    status_change: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Audit Log</h2>
        <p className="text-sm text-slate-500 mt-1">Track all actions in your organization</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-slate-300 rounded-full border-t-transparent animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No audit logs yet</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {logs.map(log => (
              <div key={log._id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 whitespace-nowrap ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{log.description || `${log.action} on ${log.module}`}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {log.userName || 'System'} &middot; {log.module} &middot; {new Date(log.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">Page {pagination.page} of {pagination.pages} ({pagination.total} entries)</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
                <button disabled={page >= pagination.pages} onClick={() => fetchLogs(page + 1)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SettingsPage
