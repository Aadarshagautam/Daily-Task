import React, { useContext, useEffect, useState } from 'react'
import { Building2, CalendarDays, Edit, Mail, MapPin, Phone, Plus, Star, Trash2, Users, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { posCustomerApi } from '../api/posApi.js'
import StatePanel from '../components/StatePanel.jsx'
import { EmptyCard, FieldLabel, KpiCard, PageHeader, SearchField, SectionCard, WorkspacePage } from '../components/ui/ErpPrimitives.jsx'
import { getBusinessPosMeta } from '../config/businessConfigs.js'
import AppContext from '../context/app-context.js'
import api from '../lib/api.js'
import { DEFAULT_COUNTRY, DEFAULT_PHONE_PLACEHOLDER, TAX_REGISTRATION_LABEL, formatCurrencyNpr, formatDateNepal } from '../utils/nepal.js'

const TIERS = {
  bronze: { label: 'Bronze', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  silver: { label: 'Silver', className: 'border-slate-200 bg-slate-100 text-slate-700' },
  gold: { label: 'Gold', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  platinum: { label: 'Platinum', className: 'border-violet-200 bg-violet-50 text-violet-700' },
}

const makeAddress = () => ({ street: '', city: '', state: '', pincode: '', country: DEFAULT_COUNTRY })
const makeCustomer = () => ({ name: '', email: '', phone: '', company: '', birthday: '', address: makeAddress(), gstin: '', notes: '' })
const num = (value) => Number(value) || 0

const normalizeAddress = (value) => {
  if (!value) return makeAddress()
  if (typeof value === 'string') return { ...makeAddress(), street: value }
  return { ...makeAddress(), ...value }
}

const formatAddress = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  return [value.street, value.city, value.state, value.pincode].filter(Boolean).join(', ')
}

export default function CustomersPage({ scope = 'standard' }) {
  const isPosScope = scope === 'pos'
  const { hasPermission, orgBusinessType } = useContext(AppContext)
  const posMeta = getBusinessPosMeta(orgBusinessType)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [draft, setDraft] = useState(makeCustomer())

  const canCreate = hasPermission(isPosScope ? 'pos.customers.create' : 'customers.create')
  const canUpdate = hasPermission(isPosScope ? 'pos.customers.update' : 'customers.update')
  const canDelete = hasPermission(isPosScope ? 'pos.customers.delete' : 'customers.delete')

  useEffect(() => {
    loadCustomers()
  }, [isPosScope])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = isPosScope ? await posCustomerApi.list() : await api.get('/customers')
      const payload = isPosScope ? response?.data : response.data?.data
      setCustomers(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const saveCreated = async (payload) => {
    const response = isPosScope ? await posCustomerApi.create(payload) : await api.post('/customers', payload)
    return isPosScope ? response?.data : response.data?.data
  }

  const saveUpdated = async (id, payload) => {
    const response = isPosScope ? await posCustomerApi.update(id, payload) : await api.put(`/customers/${id}`, payload)
    return isPosScope ? response?.data : response.data?.data
  }

  const removeCustomer = async (id) => {
    if (isPosScope) {
      await posCustomerApi.delete(id)
      return
    }
    await api.delete(`/customers/${id}`)
  }

  const openCreate = () => {
    if (!canCreate) return toast.error('Your role cannot add customer records.')
    setEditingCustomer(null)
    setDraft(makeCustomer())
    setShowForm((open) => !open)
  }

  const openEdit = (customer) => {
    if (!canUpdate) return toast.error('Your role cannot edit customer records.')
    setEditingCustomer({
      ...customer,
      birthday: customer.birthday || '',
      gstin: customer.gstin || customer.taxNumber || '',
      address: normalizeAddress(customer.addressText || customer.address),
    })
    setShowForm(false)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCustomer(null)
    setDraft(makeCustomer())
  }

  const activeCustomer = editingCustomer || draft
  const setField = (field, value) => {
    if (editingCustomer) return setEditingCustomer({ ...editingCustomer, [field]: value })
    setDraft({ ...draft, [field]: value })
  }

  const setAddressField = (field, value) => {
    if (editingCustomer) return setEditingCustomer({ ...editingCustomer, address: { ...(editingCustomer.address || makeAddress()), [field]: value } })
    setDraft({ ...draft, address: { ...(draft.address || makeAddress()), [field]: value } })
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!canCreate) return toast.error('Your role cannot add customer records.')
    if (!draft.name.trim() && !draft.phone.trim()) return toast.error('Customer name or phone is required')
    try {
      const created = await saveCreated(draft)
      if (created) {
        setCustomers((prev) => [created, ...(Array.isArray(prev) ? prev : [])])
        closeForm()
        toast.success('Customer added')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error(error.response?.data?.message || 'Failed to add customer')
    }
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!canUpdate) return toast.error('Your role cannot update customer records.')
    if (!editingCustomer?.name?.trim() && !editingCustomer?.phone?.trim()) return toast.error('Customer name or phone is required')
    try {
      const updated = await saveUpdated(editingCustomer._id, editingCustomer)
      if (updated) {
        setCustomers((prev) => (Array.isArray(prev) ? prev : []).map((customer) => (customer._id === editingCustomer._id ? updated : customer)))
        setEditingCustomer(null)
        toast.success('Customer updated')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error(error.response?.data?.message || 'Failed to update customer')
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) return toast.error('Your role cannot delete customer records.')
    if (!window.confirm('Delete this customer?')) return
    try {
      await removeCustomer(id)
      setCustomers((prev) => (Array.isArray(prev) ? prev.filter((customer) => customer._id !== id) : []))
      toast.success('Customer deleted')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error(error.response?.data?.message || 'Failed to delete customer')
    }
  }

  const safeCustomers = Array.isArray(customers) ? customers : []
  const filteredCustomers = safeCustomers.filter((customer) => {
    const term = searchTerm.toLowerCase()
    const address = customer.addressText || formatAddress(customer.address)
    const matchesSearch =
      !term ||
      [customer.name, customer.phone, customer.email, customer.company, customer.notes, customer.gstin, customer.taxNumber, address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    return matchesSearch && (!tierFilter || (customer.tier || 'bronze') === tierFilter)
  })

  const stats = {
    total: safeCustomers.length,
    reachable: safeCustomers.filter((customer) => customer.phone || customer.email).length,
    dueAccounts: safeCustomers.filter((customer) => num(customer.creditBalance) > 0).length,
    totalDue: safeCustomers.reduce((sum, customer) => sum + num(customer.creditBalance), 0),
    returning: safeCustomers.filter((customer) => num(customer.visitCount) > 0 || num(customer.totalSpent) > 0).length,
    visits: safeCustomers.reduce((sum, customer) => sum + num(customer.visitCount), 0),
  }

  const header = isPosScope
    ? {
        eyebrow: posMeta.customerTitle,
        title: `${posMeta.customerTitle} stay easy to search, bill, and follow up.`,
        description: 'Phone, due, loyalty, and notes now live in one shared customer workspace instead of two duplicate pages.',
        badges: [`${stats.total} records`, posMeta.controlLabel],
      }
    : {
        eyebrow: 'Customer Accounts',
        title: 'Customer records stay easy to search, bill, and follow up.',
        description: 'Contact details, due, loyalty, and billing notes now live in one shared customer workspace.',
        badges: [`${stats.total} accounts`, 'Nepal billing ready'],
      }

  if (loading) {
    return (
      <WorkspacePage>
        <StatePanel
          title={isPosScope ? 'Loading customer records' : 'Loading customer accounts'}
          message="Collecting customer profiles, billing details, and repeat-sale activity for this workspace."
          tone="teal"
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        description={header.description}
        badges={header.badges}
        actions={canCreate ? <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" />{showForm ? 'Close form' : 'Add customer'}</button> : null}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} title="Total customers" value={stats.total} detail="Saved records ready for billing and follow-up" tone="blue" />
        <KpiCard icon={Phone} title="Reachable" value={stats.reachable} detail="Phone or email is ready for quick lookup" tone="teal" />
        <KpiCard icon={Wallet} title="Customer due" value={formatCurrencyNpr(stats.totalDue)} detail={stats.dueAccounts > 0 ? `${stats.dueAccounts} account${stats.dueAccounts === 1 ? '' : 's'} waiting collection` : 'No pending customer due right now'} tone="amber" />
        <KpiCard icon={Star} title="Returning" value={stats.returning} detail={stats.visits > 0 ? `${stats.visits} visits recorded across saved customers` : 'Repeat-sale activity will appear here as staff use the system'} tone="emerald" />
      </section>

      <div className="erp-toolbar">
        <div className="flex-1">
          <SearchField value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by customer name, phone, email, company, or address..." />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTierFilter('')} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${tierFilter === '' ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>All tiers</button>
          {Object.entries(TIERS).map(([tier, meta]) => (
            <button key={tier} type="button" onClick={() => setTierFilter((current) => (current === tier ? '' : tier))} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${tierFilter === tier ? meta.className : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              {meta.label} {safeCustomers.filter((customer) => (customer.tier || 'bronze') === tier).length}
            </button>
          ))}
        </div>
      </div>

      {(showForm || editingCustomer) && (
        <SectionCard eyebrow={editingCustomer ? 'Edit Account' : 'New Account'} title={editingCustomer ? 'Update customer details' : 'Add a customer account'} description="Owners, cashiers, and accountants now work from this same customer form.">
          <form onSubmit={editingCustomer ? handleUpdate : handleCreate} className="erp-stack">
            <div className="erp-form-grid">
              <div><FieldLabel>Name</FieldLabel><input type="text" value={activeCustomer.name || ''} onChange={(event) => setField('name', event.target.value)} className="input-primary" placeholder="Enter customer name" /></div>
              <div><FieldLabel optional>Phone</FieldLabel><input type="tel" value={activeCustomer.phone || ''} onChange={(event) => setField('phone', event.target.value)} className="input-primary" placeholder={DEFAULT_PHONE_PLACEHOLDER} /></div>
              <div><FieldLabel optional>Email</FieldLabel><input type="email" value={activeCustomer.email || ''} onChange={(event) => setField('email', event.target.value)} className="input-primary" placeholder="customer@example.com" /></div>
              <div><FieldLabel optional>Birthday</FieldLabel><input type="date" value={activeCustomer.birthday || ''} onChange={(event) => setField('birthday', event.target.value)} className="input-primary" /></div>
              <div><FieldLabel optional>Company</FieldLabel><input type="text" value={activeCustomer.company || ''} onChange={(event) => setField('company', event.target.value)} className="input-primary" placeholder="Company or trade name" /></div>
              <div><FieldLabel optional>{TAX_REGISTRATION_LABEL}</FieldLabel><input type="text" value={activeCustomer.gstin || ''} onChange={(event) => setField('gstin', event.target.value.toUpperCase())} className="input-primary" placeholder="PAN or VAT number" maxLength={20} /></div>
              <div><FieldLabel optional>Street address</FieldLabel><input type="text" value={activeCustomer.address?.street || ''} onChange={(event) => setAddressField('street', event.target.value)} className="input-primary" placeholder="Street, landmark, or area" /></div>
              <div><FieldLabel optional>City / Municipality</FieldLabel><input type="text" value={activeCustomer.address?.city || ''} onChange={(event) => setAddressField('city', event.target.value)} className="input-primary" placeholder="Kathmandu" /></div>
              <div><FieldLabel optional>Province</FieldLabel><input type="text" value={activeCustomer.address?.state || ''} onChange={(event) => setAddressField('state', event.target.value)} className="input-primary" placeholder="Bagmati" /></div>
              <div><FieldLabel optional>Postal code</FieldLabel><input type="text" value={activeCustomer.address?.pincode || ''} onChange={(event) => setAddressField('pincode', event.target.value)} className="input-primary" placeholder="44600" maxLength={10} /></div>
              <div><FieldLabel optional>Country</FieldLabel><input type="text" value={activeCustomer.address?.country || ''} onChange={(event) => setAddressField('country', event.target.value)} className="input-primary" placeholder={DEFAULT_COUNTRY} /></div>
              <div className="md:col-span-2"><FieldLabel optional>Notes</FieldLabel><textarea value={activeCustomer.notes || ''} onChange={(event) => setField('notes', event.target.value)} className="input-primary min-h-28 resize-y" placeholder="Add context that helps billing, follow-up, or repeat sales stay easy." /></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">{editingCustomer ? 'Save changes' : 'Add customer'}</button>
              <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard eyebrow="Customer List" title="Customer records" description="This one table now handles both customer accounts and POS regulars, so staff only learn one customer workflow.">
        {filteredCustomers.length === 0 ? (
          <EmptyCard
            icon={Users}
            title="No customers found"
            message={searchTerm || tierFilter ? 'Try a different search or clear the tier filter to see more customer records.' : 'Start by adding your first customer so due, repeat sales, and contact lookup stay organized.'}
            action={!searchTerm && !tierFilter && canCreate ? <button onClick={openCreate} className="btn-primary">Add first customer</button> : null}
          />
        ) : (
          <>
            <div className="hidden md:block erp-table-shell">
              <table className="erp-table">
                <thead><tr><th>Customer</th><th>Contact</th><th>Activity</th><th>Balance</th><th>Address</th><th>Updated</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const tier = TIERS[customer.tier] || TIERS.bronze
                    const address = customer.addressText || formatAddress(customer.address)
                    const due = num(customer.creditBalance)
                    return (
                      <tr key={customer._id}>
                        <td><p className="font-semibold text-slate-900">{customer.name || 'Unnamed customer'}</p><p className="mt-1 text-xs text-slate-500">{customer.notes || 'No notes added'}</p></td>
                        <td>
                          <div className="space-y-1">
                            {customer.phone ? <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-slate-900"><Phone className="h-3.5 w-3.5 text-slate-400" /><span>{customer.phone}</span></a> : null}
                            {customer.email ? <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-slate-700 hover:text-slate-900"><Mail className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{customer.email}</span></a> : null}
                            {customer.company ? <div className="flex items-center gap-2 text-slate-600"><Building2 className="h-3.5 w-3.5 text-slate-400" /><span>{customer.company}</span></div> : <span className="text-slate-400">No company</span>}
                          </div>
                        </td>
                        <td><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tier.className}`}>{tier.label}</span><p className="mt-2 text-xs text-slate-500">Visits {num(customer.visitCount)} / Points {num(customer.loyaltyPoints)}</p>{customer.birthday ? <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />{formatDateNepal(customer.birthday)}</p> : null}</td>
                        <td><p className="font-semibold text-slate-900">{formatCurrencyNpr(customer.totalSpent)}</p><p className={`mt-1 text-xs font-medium ${due > 0 ? 'text-amber-700' : 'text-slate-500'}`}>Due {formatCurrencyNpr(due)}</p></td>
                        <td>{address ? <div className="space-y-2"><div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 text-slate-400" /><span>{address}</span></div>{customer.gstin || customer.taxNumber ? <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{customer.gstin || customer.taxNumber}</span> : null}</div> : <span className="text-slate-400">{customer.gstin || customer.taxNumber || 'No address'}</span>}</td>
                        <td className="text-slate-500">{formatDateNepal(customer.updatedAt)}</td>
                        <td><div className="flex justify-end gap-2">{canUpdate ? <button onClick={() => openEdit(customer)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><span className="inline-flex items-center gap-2"><Edit className="h-4 w-4" />Edit</span></button> : null}{canDelete ? <button onClick={() => handleDelete(customer._id)} className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"><span className="inline-flex items-center gap-2"><Trash2 className="h-4 w-4" />Delete</span></button> : null}</div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {filteredCustomers.map((customer) => {
                const tier = TIERS[customer.tier] || TIERS.bronze
                const due = num(customer.creditBalance)
                const address = customer.addressText || formatAddress(customer.address)
                return (
                  <div key={customer._id} className="card p-5">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold text-slate-900">{customer.name || 'Unnamed customer'}</p>{customer.company ? <p className="mt-1 text-sm text-slate-500">{customer.company}</p> : null}</div><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tier.className}`}>{tier.label}</span></div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">{customer.phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span>{customer.phone}</span></div> : null}{customer.email ? <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><span>{customer.email}</span></div> : null}{address ? <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" /><span>{address}</span></div> : null}{customer.birthday ? <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" /><span>{formatDateNepal(customer.birthday)}</span></div> : null}</div>
                    <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Spent</p><p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrencyNpr(customer.totalSpent)}</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Due</p><p className={`mt-2 text-sm font-semibold ${due > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{formatCurrencyNpr(due)}</p></div></div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500"><span className="erp-chip">Visits {num(customer.visitCount)}</span><span className="erp-chip">Points {num(customer.loyaltyPoints)}</span>{customer.gstin || customer.taxNumber ? <span className="erp-chip">{customer.gstin || customer.taxNumber}</span> : null}</div>
                    {customer.notes ? <p className="mt-4 text-sm text-slate-500">{customer.notes}</p> : null}
                    {(canUpdate || canDelete) ? <div className="mt-5 flex gap-2">{canUpdate ? <button onClick={() => openEdit(customer)} className="btn-secondary flex-1 justify-center"><Edit className="h-4 w-4" />Edit</button> : null}{canDelete ? <button onClick={() => handleDelete(customer._id)} className="btn-danger flex-1 justify-center"><Trash2 className="h-4 w-4" />Delete</button> : null}</div> : null}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </SectionCard>
    </WorkspacePage>
  )
}
