import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Send, User } from 'lucide-react'
import leadsApi from './leadsApi'
import toast from 'react-hot-toast'

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

const SOURCES = [
  { key: 'website', label: 'Website' },
  { key: 'referral', label: 'Referral' },
  { key: 'social', label: 'Social' },
  { key: 'email', label: 'Email' },
  { key: 'cold_call', label: 'Cold Call' },
  { key: 'advertisement', label: 'Advertisement' },
  { key: 'other', label: 'Other' },
]

const LeadFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'other',
    stage: 'new',
    expectedRevenue: 0,
  })
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    if (!isEditMode) return

    const fetchLead = async () => {
      try {
        const { data } = await leadsApi.get(id)
        if (!data.success) {
          toast.error(data.message || 'Lead not found')
          navigate('/crm/leads')
          return
        }
        const lead = data.data
        setForm({
          name: lead.name || '',
          phone: lead.phone || '',
          email: lead.email || '',
          company: lead.company || '',
          source: lead.source || 'other',
          stage: lead.stage || 'new',
          expectedRevenue: lead.expectedRevenue || 0,
        })
        setNotes(lead.notes || [])
      } catch (err) {
        console.error('Error fetching lead:', err)
        toast.error('Failed to load lead')
        navigate('/crm/leads')
      } finally {
        setLoading(false)
      }
    }

    fetchLead()
  }, [id, isEditMode, navigate])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Lead name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        expectedRevenue: Number(form.expectedRevenue) || 0,
      }

      if (isEditMode) {
        await leadsApi.update(id, payload)
        toast.success('Lead updated')
      } else {
        await leadsApi.create(payload)
        toast.success('Lead created')
      }
      navigate('/crm/leads')
    } catch (err) {
      console.error('Error saving lead:', err)
      toast.error(err.response?.data?.message || 'Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setAddingNote(true)
    try {
      const { data } = await leadsApi.addNote(id, newNote.trim())
      if (data.success) {
        setNotes(data.data.notes || [])
        setNewNote('')
        toast.success('Note added')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="lg:ml-64 mt-16 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 mt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <button
          onClick={() => navigate('/crm/leads')}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-3 text-sm transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Leads
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Lead' : 'New Lead'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode ? 'Update lead information below' : 'Fill in the details to create a new lead'}
        </p>
      </div>

      <div className="p-6 max-w-4xl">
        <form onSubmit={handleSubmit}>
          {/* Lead Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
              <h2 className="text-base font-semibold text-indigo-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Lead Details
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="Lead / Contact name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="lead@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => handleChange('company', e.target.value)}
                    placeholder="Company name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                  <select
                    value={form.source}
                    onChange={e => handleChange('source', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                  >
                    {SOURCES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stage</label>
                  <select
                    value={form.stage}
                    onChange={e => handleChange('stage', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Expected Revenue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Revenue (₹)</label>
                  <input
                    type="number"
                    value={form.expectedRevenue}
                    onChange={e => handleChange('expectedRevenue', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card (edit mode only) */}
          {isEditMode && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                <h2 className="text-base font-semibold text-indigo-900">Notes</h2>
              </div>
              <div className="p-6">
                {/* Existing notes */}
                {notes.length > 0 ? (
                  <div className="space-y-3 mb-5">
                    {notes.map((note, i) => (
                      <div key={note._id || i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-sm text-gray-800">{note.text}</p>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {note.createdAt ? new Date(note.createdAt).toLocaleString('en-IN') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">No notes yet.</p>
                )}

                {/* Add note */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote() } }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {addingNote ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Update Lead' : 'Create Lead'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/crm/leads')}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeadFormPage
