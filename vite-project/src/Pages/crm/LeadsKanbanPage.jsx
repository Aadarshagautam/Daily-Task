import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, GripVertical, DollarSign, Phone, Mail,
  Building2, Trash2, Edit
} from 'lucide-react'
import leadsApi from './leadsApi'
import toast from 'react-hot-toast'

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-500', lightColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-500', lightColor: 'bg-slate-50 text-indigo-700 border-indigo-200' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-500', lightColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'won', label: 'Won', color: 'bg-green-500', lightColor: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500', lightColor: 'bg-red-50 text-red-700 border-red-200' },
]

const LeadsKanbanPage = () => {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [draggedLead, setDraggedLead] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)

  const fetchLeads = async () => {
    try {
      const { data } = await leadsApi.list()
      setLeads(data.data || [])
    } catch (err) {
      toast.error('Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  // --- Drag & Drop ---
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
    setLeads(prev => prev.map(l =>
      l._id === draggedLead._id ? { ...l, stage: stageKey } : l
    ))

    try {
      await leadsApi.updateStage(draggedLead._id, stageKey)
      toast.success(`Moved to ${stageKey}`)
    } catch (err) {
      toast.error('Failed to move lead')
      fetchLeads() // revert
    }
    setDraggedLead(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return
    try {
      await leadsApi.delete(id)
      setLeads(prev => prev.filter(l => l._id !== id))
      toast.success('Lead deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  // --- Filtering ---
  const filteredLeads = search
    ? leads.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : leads

  const getStageLeads = (stageKey) => filteredLeads.filter(l => l.stage === stageKey)

  const totalRevenue = leads.reduce((sum, l) => sum + (l.expectedRevenue || 0), 0)

  return (
    <div className="lg:ml-64 mt-16 min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pipeline Board</h1>
            <p className="text-sm text-slate-500 mt-1">
              {leads.length} leads &middot; Revenue: ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
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
              onClick={() => navigate('/crm/leads/new')}
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
                className={`w-72 flex-shrink-0 rounded-xl transition-all ${
                  dragOverStage === stage.key
                    ? 'ring-2 ring-slate-400 bg-slate-50/50'
                    : 'bg-slate-100'
                }`}
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
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        {stageLeads.length}
                      </span>
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
                        className={`bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
                          draggedLead?._id === lead._id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <GripVertical className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            <h3 className="text-sm font-semibold text-slate-800 truncate">{lead.name}</h3>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => navigate(`/crm/leads/${lead._id}/edit`)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(lead._id)}
                              className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Company */}
                        {lead.company && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                            <Building2 className="w-3 h-3" /> {lead.company}
                          </div>
                        )}

                        {/* Revenue */}
                        {lead.expectedRevenue > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-2">
                            <DollarSign className="w-3 h-3" /> ₹{lead.expectedRevenue.toLocaleString('en-IN')}
                          </div>
                        )}

                        {/* Source badge */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 capitalize">
                          {(lead.source || 'other').replace('_', ' ')}
                        </span>

                        {/* Contact icons */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                          {lead.email && <Mail className="w-3 h-3 text-slate-400" title={lead.email} />}
                          {lead.phone && <Phone className="w-3 h-3 text-slate-400" title={lead.phone} />}
                          {lead.notes?.length > 0 && (
                            <span className="ml-auto text-[10px] text-slate-400">
                              {lead.notes.length} note{lead.notes.length !== 1 ? 's' : ''}
                            </span>
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
    </div>
  )
}

export default LeadsKanbanPage
