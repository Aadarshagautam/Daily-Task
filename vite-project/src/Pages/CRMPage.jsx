import React, { useState, useEffect, useContext, useRef } from 'react'
import axios from 'axios'
import { AppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { Plus, Search, GripVertical, DollarSign, Phone, Mail, Building2, X, ChevronDown, Trash2, ArrowRightLeft } from 'lucide-react'

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-500', lightColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500', lightColor: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-500', lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-500', lightColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-500', lightColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'won', label: 'Won', color: 'bg-green-500', lightColor: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500', lightColor: 'bg-red-50 text-red-700 border-red-200' },
]

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}

const SOURCES = ['website', 'referral', 'social', 'email', 'cold_call', 'advertisement', 'other']

const CRMPage = () => {
  const { backendUrl } = useContext(AppContext)
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [draggedLead, setDraggedLead] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLeads = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/crm`)
      setLeads(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/crm/stats`)
      setStats(data)
    } catch (err) { /* silent */ }
  }

  useEffect(() => {
    fetchLeads()
    fetchStats()
  }, [])

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', lead._id)
  }

  const handleDragOver = (e, stageKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageKey)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e, stageKey) => {
    e.preventDefault()
    setDragOverStage(null)
    if (!draggedLead || draggedLead.stage === stageKey) {
      setDraggedLead(null)
      return
    }

    // Optimistic update
    setLeads(prev => prev.map(l => l._id === draggedLead._id ? { ...l, stage: stageKey } : l))

    try {
      await axios.patch(`${backendUrl}/api/crm/${draggedLead._id}/stage`, { stage: stageKey })
      fetchStats()
    } catch (err) {
      toast.error('Failed to move lead')
      fetchLeads()
    }
    setDraggedLead(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return
    try {
      await axios.delete(`${backendUrl}/api/crm/${id}`)
      setLeads(prev => prev.filter(l => l._id !== id))
      fetchStats()
      toast.success('Lead deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const handleConvert = async (id) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/crm/${id}/convert`)
      if (data.success) {
        toast.success('Lead converted to customer!')
        fetchLeads()
        fetchStats()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Conversion failed')
    }
  }

  const filteredLeads = search
    ? leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()))
    : leads

  const getStageLeads = (stageKey) => filteredLeads.filter(l => l.stage === stageKey)

  return (
    <div className="lg:ml-64 mt-16 min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CRM Pipeline</h1>
            {stats && (
              <p className="text-sm text-slate-500 mt-1">
                {stats.total} leads &middot; Expected: ₹{stats.totalExpectedRevenue?.toLocaleString('en-IN')} &middot; Weighted: ₹{Math.round(stats.weightedRevenue || 0).toLocaleString('en-IN')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent w-64"
              />
            </div>
            <button
              onClick={() => { setEditLead(null); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageLeads = getStageLeads(stage.key)
            const stageRevenue = stageLeads.reduce((sum, l) => sum + (l.expectedRevenue || 0), 0)

            return (
              <div
                key={stage.key}
                className={`w-72 flex-shrink-0 rounded-xl transition-all ${dragOverStage === stage.key ? 'ring-2 ring-slate-400 bg-slate-50/50' : 'bg-slate-100'}`}
                onDragOver={e => handleDragOver(e, stage.key)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, stage.key)}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                    </div>
                    <span className="text-xs text-slate-500">₹{stageRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-slate-300 rounded-full border-t-transparent animate-spin" />
                    </div>
                  ) : stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      {dragOverStage === stage.key ? 'Drop here' : 'No leads'}
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead)}
                        className={`bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${draggedLead?._id === lead._id ? 'opacity-50 scale-95' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <GripVertical className="w-3 h-3 text-slate-300" />
                            <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{lead.name}</h3>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditLead(lead); setShowForm(true) }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDelete(lead._id)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {lead.company && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                            <Building2 className="w-3 h-3" /> {lead.company}
                          </div>
                        )}

                        {lead.expectedRevenue > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-2">
                            <DollarSign className="w-3 h-3" /> ₹{lead.expectedRevenue.toLocaleString('en-IN')}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[lead.priority]}`}>
                            {lead.priority}
                          </span>
                          {/* Probability bar */}
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-500 rounded-full" style={{ width: `${lead.probability}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400">{lead.probability}%</span>
                          </div>
                        </div>

                        {/* Contact icons */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                          {lead.email && <Mail className="w-3 h-3 text-slate-400" />}
                          {lead.phone && <Phone className="w-3 h-3 text-slate-400" />}
                          {stage.key !== 'won' && stage.key !== 'lost' && !lead.customerId && (
                            <button
                              onClick={() => handleConvert(lead._id)}
                              className="ml-auto flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-800 font-medium"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Convert
                            </button>
                          )}
                          {lead.customerId && (
                            <span className="ml-auto text-[10px] text-green-600 font-medium">Converted</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lead Form Modal */}
      {showForm && (
        <LeadFormModal
          lead={editLead}
          backendUrl={backendUrl}
          onClose={() => { setShowForm(false); setEditLead(null) }}
          onSaved={() => { fetchLeads(); fetchStats(); setShowForm(false); setEditLead(null) }}
        />
      )}
    </div>
  )
}

const LeadFormModal = ({ lead, backendUrl, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    stage: lead?.stage || 'new',
    expectedRevenue: lead?.expectedRevenue || 0,
    probability: lead?.probability || 10,
    source: lead?.source || 'other',
    priority: lead?.priority || 'medium',
    tags: lead?.tags?.join(', ') || '',
    notes: lead?.notes || '',
    nextFollowUp: lead?.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().split('T')[0] : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        expectedRevenue: Number(form.expectedRevenue) || 0,
        probability: Number(form.probability) || 10,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        nextFollowUp: form.nextFollowUp || null,
      }

      if (lead) {
        await axios.put(`${backendUrl}/api/crm/${lead._id}`, payload)
        toast.success('Lead updated')
      } else {
        await axios.post(`${backendUrl}/api/crm`, payload)
        toast.success('Lead created')
      }
      onSaved()
    } catch (err) {
      toast.error('Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{lead ? 'Edit Lead' : 'New Lead'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" required />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
              <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400">
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Revenue (₹)</label>
              <input type="number" value={form.expectedRevenue} onChange={e => setForm({ ...form, expectedRevenue: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Probability (%)</label>
              <input type="number" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" min="0" max="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400">
                {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Follow-Up</label>
              <input type="date" value={form.nextFollowUp} onChange={e => setForm({ ...form, nextFollowUp: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. enterprise, urgent, follow-up" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
              {saving ? 'Saving...' : lead ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CRMPage
