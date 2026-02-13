import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Phone, Mail, Building2, DollarSign,
  Edit, Trash2, Users, Filter, Eye
} from 'lucide-react'
import leadsApi from './leadsApi'
import toast from 'react-hot-toast'

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-700' },
  { key: 'won', label: 'Won', color: 'bg-green-100 text-green-700' },
  { key: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))

const LeadListPage = () => {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = {}
      if (stageFilter) params.stage = stageFilter
      if (search.trim()) params.search = search.trim()
      const { data } = await leadsApi.list(params)
      setLeads(data.data || [])
    } catch (err) {
      console.error('Error fetching leads:', err)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [stageFilter])

  useEffect(() => {
    const timeout = setTimeout(() => fetchLeads(), 400)
    return () => clearTimeout(timeout)
  }, [search])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete lead "${name}"?`)) return
    try {
      await leadsApi.delete(id)
      setLeads(prev => prev.filter(l => l._id !== id))
      toast.success('Lead deleted')
    } catch (err) {
      toast.error('Failed to delete lead')
    }
  }

  const stats = {
    total: leads.length,
    totalRevenue: leads.reduce((sum, l) => sum + (l.expectedRevenue || 0), 0),
    byStage: STAGES.map(s => ({
      ...s,
      count: leads.filter(l => l.stage === s.key).length,
    })),
  }

  if (loading && leads.length === 0) {
    return (
      <div className="lg:ml-64 mt-16 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 mt-16 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="text-sm text-slate-500 mt-1">
              {stats.total} leads &middot; Revenue: ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </p>
          </div>
          <button
            onClick={() => navigate('/crm/leads/new')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stats.byStage.map(s => (
            <div
              key={s.key}
              onClick={() => setStageFilter(stageFilter === s.key ? '' : s.key)}
              className={`bg-white rounded-xl p-4 border cursor-pointer transition-all ${
                stageFilter === s.key ? 'border-slate-400 ring-2 ring-slate-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-slate-900">{s.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-6 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Stages</option>
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {leads.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No leads found</h3>
            <p className="text-slate-600 mb-4">
              {search || stageFilter ? 'Try different filters' : 'Create your first lead to get started'}
            </p>
            {!search && !stageFilter && (
              <button
                onClick={() => navigate('/crm/leads/new')}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
              >
                Create First Lead
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Company</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Stage</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Revenue</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">Source</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map(lead => {
                    const stage = STAGE_MAP[lead.stage] || STAGES[0]
                    return (
                      <tr key={lead._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{lead.name}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {lead.company ? (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {lead.company}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-3 text-slate-600">
                            {lead.email && (
                              <span className="flex items-center gap-1" title={lead.email}>
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1" title={lead.phone}>
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            )}
                            {!lead.email && !lead.phone && <span className="text-slate-400">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${stage.color}`}>
                            {stage.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          {lead.expectedRevenue > 0 ? (
                            <span className="flex items-center justify-end gap-1 text-green-600 font-medium">
                              <DollarSign className="w-3.5 h-3.5" />
                              ₹{lead.expectedRevenue.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-slate-600 capitalize">{(lead.source || 'other').replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/crm/leads/${lead._id}/edit`)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(lead._id, lead.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeadListPage
