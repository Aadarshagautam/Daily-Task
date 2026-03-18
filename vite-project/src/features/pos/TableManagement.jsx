import React, { useContext, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  ChefHat,
  Clock3,
  DoorOpen,
  Edit3,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  Trash2,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { posSaleApi, posTableApi } from '../../api/posApi'
import StatePanel from '../../components/StatePanel.jsx'
import {
  EmptyCard,
  FieldLabel,
  KpiCard,
  PageHeader,
  SearchField,
  SectionCard,
  StatusBadge,
  WorkspacePage,
} from '../../components/ui/ErpPrimitives.jsx'
import { getBusinessPosMeta } from '../../config/businessConfigs.js'
import AppContext from '../../context/app-context.js'
import {
  DEFAULT_PHONE_PLACEHOLDER,
  formatCurrencyNpr,
  formatDateTimeNepal,
} from '../../utils/nepal.js'

const TABLE_FORM = { number: '', name: '', capacity: 4, section: 'Main Hall' }
const RESERVATION_FORM = {
  customerName: '',
  phone: '',
  partySize: 2,
  reservationAt: '',
  source: 'phone',
  notes: '',
}

const SERVICE_META = {
  free: { label: 'Free', tone: 'emerald', card: 'border-emerald-200 bg-white' },
  occupied: { label: 'Occupied', tone: 'rose', card: 'border-rose-200 bg-white' },
  reserved: { label: 'Reserved', tone: 'amber', card: 'border-amber-200 bg-white' },
  billing: { label: 'Billing', tone: 'blue', card: 'border-sky-200 bg-white' },
  cleaning: { label: 'Cleaning', tone: 'slate', card: 'border-slate-200 bg-white' },
}

const ORDER_META = {
  pending: { label: 'Open order', tone: 'amber', helper: 'Waiting to send to kitchen' },
  preparing: { label: 'In kitchen', tone: 'blue', helper: 'Kitchen is preparing this order' },
  ready: { label: 'Ready to serve', tone: 'teal', helper: 'Food is ready for service' },
  served: { label: 'Ready to bill', tone: 'emerald', helper: 'Service is done. Close the table after billing.' },
}

const VIEW_FILTERS = [
  { value: 'all', label: 'All tables' },
  { value: 'free', label: 'Free' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'billing', label: 'Billing' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cleaning', label: 'Cleaning' },
]

const toDateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

const elapsed = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (diffMinutes < 1) return 'Opened just now'
  if (diffMinutes < 60) return `Open ${diffMinutes}m ago`
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  return `Open ${hours}h ${minutes}m ago`
}

const getServiceState = (table) => {
  if (table.status === 'available') return 'free'
  if (table.status === 'reserved') return 'reserved'
  if (table.status === 'cleaning') return 'cleaning'
  if (table.status === 'occupied' && table.currentOrderId?.orderStatus === 'served') return 'billing'
  if (table.status === 'occupied') return 'occupied'
  return 'free'
}

const TableSetupModal = ({ editingTableId, form, saving, onClose, onChange, onSubmit }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
    <div className="panel w-full max-w-lg overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
        <div>
          <p className="section-kicker">Floor setup</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {editingTableId ? 'Edit table' : 'Add table'}
          </h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="px-6 py-6">
        <div className="erp-stack">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Table number</FieldLabel>
              <input type="number" min="1" required value={form.number} onChange={(event) => onChange('number', event.target.value)} className="input-primary" />
            </div>
            <div>
              <FieldLabel>Capacity</FieldLabel>
              <input type="number" min="1" required value={form.capacity} onChange={(event) => onChange('capacity', event.target.value)} className="input-primary" />
            </div>
            <div>
              <FieldLabel optional>Table name</FieldLabel>
              <input type="text" value={form.name} onChange={(event) => onChange('name', event.target.value)} className="input-primary" placeholder="Window seat" />
            </div>
            <div>
              <FieldLabel optional>Section</FieldLabel>
              <input type="text" value={form.section} onChange={(event) => onChange('section', event.target.value)} className="input-primary" placeholder="Main Hall" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : editingTableId ? 'Update table' : 'Add table'}</button>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  </div>
)

const ReservationModal = ({ table, form, saving, onClose, onChange, onSubmit }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
    <div className="panel w-full max-w-2xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
        <div>
          <p className="section-kicker">Reservation</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {table ? `Table ${table.number}` : 'Reserve table'}
          </h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="px-6 py-6">
        <div className="erp-stack">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Guest name</FieldLabel>
              <input type="text" required value={form.customerName} onChange={(event) => onChange('customerName', event.target.value)} className="input-primary" />
            </div>
            <div>
              <FieldLabel optional>Phone</FieldLabel>
              <input type="text" value={form.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder={DEFAULT_PHONE_PLACEHOLDER} className="input-primary" />
            </div>
            <div>
              <FieldLabel>Party size</FieldLabel>
              <input type="number" min="1" value={form.partySize} onChange={(event) => onChange('partySize', event.target.value)} className="input-primary" />
            </div>
            <div>
              <FieldLabel>Source</FieldLabel>
              <select value={form.source} onChange={(event) => onChange('source', event.target.value)} className="input-primary">
                <option value="phone">Phone</option>
                <option value="walk-in">Walk-in</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel>Reservation time</FieldLabel>
            <input type="datetime-local" required value={form.reservationAt} onChange={(event) => onChange('reservationAt', event.target.value)} className="input-primary" />
          </div>
          <div>
            <FieldLabel optional>Notes</FieldLabel>
            <textarea value={form.notes} onChange={(event) => onChange('notes', event.target.value)} className="input-primary min-h-28 resize-y" placeholder="Birthday setup, terrace preference, special instruction" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save reservation'}</button>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  </div>
)

export default function TableManagement() {
  const { orgBusinessType, hasPermission } = useContext(AppContext)
  const qc = useQueryClient()
  const posMeta = getBusinessPosMeta(orgBusinessType)
  const [showTableModal, setShowTableModal] = useState(false)
  const [tableForm, setTableForm] = useState(TABLE_FORM)
  const [editingTableId, setEditingTableId] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [reservationForm, setReservationForm] = useState(RESERVATION_FORM)
  const [reservationTarget, setReservationTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const canCreateTable = hasPermission('pos.tables.create')
  const canUpdateTable = hasPermission('pos.tables.update')
  const canDeleteTable = hasPermission('pos.tables.delete')
  const canCreateSale = hasPermission('pos.sales.create')
  const canReadSales = hasPermission('pos.sales.read')
  const canUpdateSales = hasPermission('pos.sales.update')
  const canReadKitchen = hasPermission('pos.kitchen.read')
  const canUpdateKitchen = hasPermission('pos.kitchen.update')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pos-tables'],
    queryFn: () => posTableApi.list(),
    refetchInterval: 15000,
  })

  const tables = Array.isArray(data?.data) ? data.data : []

  const invalidateTables = () => {
    qc.invalidateQueries({ queryKey: ['pos-tables'] })
    qc.invalidateQueries({ queryKey: ['pos-kds'] })
    qc.invalidateQueries({ queryKey: ['pos-sales'] })
  }

  const createTableMut = useMutation({
    mutationFn: (payload) => posTableApi.create(payload),
    onSuccess: () => {
      toast.success('Table added')
      invalidateTables()
      setShowTableModal(false)
      setEditingTableId(null)
      setTableForm(TABLE_FORM)
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to add table'),
  })

  const updateTableMut = useMutation({
    mutationFn: ({ id, payload }) => posTableApi.update(id, payload),
    onSuccess: () => {
      toast.success('Table updated')
      invalidateTables()
      setShowTableModal(false)
      setEditingTableId(null)
      setTableForm(TABLE_FORM)
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update table'),
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) => posTableApi.updateStatus(id, status),
    onSuccess: () => invalidateTables(),
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update table status'),
  })

  const reserveTableMut = useMutation({
    mutationFn: ({ id, payload }) => posTableApi.reserve(id, payload),
    onSuccess: () => {
      toast.success('Reservation saved')
      invalidateTables()
      setShowReservationModal(false)
      setReservationTarget(null)
      setReservationForm(RESERVATION_FORM)
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to save reservation'),
  })

  const cancelReservationMut = useMutation({
    mutationFn: (id) => posTableApi.cancelReservation(id),
    onSuccess: () => {
      toast.success('Reservation cleared')
      invalidateTables()
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to clear reservation'),
  })

  const deleteTableMut = useMutation({
    mutationFn: (id) => posTableApi.delete(id),
    onSuccess: () => {
      toast.success('Table removed')
      invalidateTables()
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to remove table'),
  })

  const orderStatusMut = useMutation({
    mutationFn: ({ id, orderStatus }) => posSaleApi.updateOrderStatus(id, orderStatus),
    onSuccess: (_, variables) => {
      toast.success(variables.orderStatus === 'preparing' ? 'Order sent to kitchen' : 'Table closed')
      invalidateTables()
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update order'),
  })

  const openCreateTable = () => {
    setEditingTableId(null)
    setTableForm(TABLE_FORM)
    setShowTableModal(true)
  }

  const openEditTable = (table) => {
    setEditingTableId(table._id)
    setTableForm({
      number: table.number,
      name: table.name || '',
      capacity: table.capacity || 4,
      section: table.section || 'Main Hall',
    })
    setShowTableModal(true)
  }

  const openReservation = (table) => {
    setReservationTarget(table)
    setReservationForm({
      customerName: table.reservation?.customerName || '',
      phone: table.reservation?.phone || '',
      partySize: table.reservation?.partySize || table.capacity || 2,
      reservationAt: toDateTimeLocal(table.reservation?.reservationAt),
      source: table.reservation?.source || 'phone',
      notes: table.reservation?.notes || '',
    })
    setShowReservationModal(true)
  }

  const handleTableSubmit = (event) => {
    event.preventDefault()
    const payload = {
      number: Number(tableForm.number),
      name: tableForm.name.trim(),
      capacity: Number(tableForm.capacity),
      section: tableForm.section.trim() || 'Main Hall',
    }

    if (editingTableId) {
      updateTableMut.mutate({ id: editingTableId, payload })
      return
    }

    createTableMut.mutate(payload)
  }

  const handleReservationSubmit = (event) => {
    event.preventDefault()
    if (!reservationTarget) return

    reserveTableMut.mutate({
      id: reservationTarget._id,
      payload: {
        ...reservationForm,
        partySize: Number(reservationForm.partySize),
        reservationAt: new Date(reservationForm.reservationAt).toISOString(),
      },
    })
  }

  if (!posMeta.allowTables) {
    return (
      <WorkspacePage>
        <StatePanel
          title="Tables are not enabled for this package"
          message="This workspace is using a simpler cafe or shop flow, so the restaurant floor screen stays hidden."
          tone="slate"
          action={<Link to="/pos" className="btn-primary">Back to POS</Link>}
        />
      </WorkspacePage>
    )
  }

  if (isLoading) {
    return (
      <WorkspacePage>
        <StatePanel
          icon={UtensilsCrossed}
          title="Loading restaurant floor"
          message="Bringing together live tables, reservations, and open dine-in bills for this branch."
          tone="teal"
        />
      </WorkspacePage>
    )
  }

  if (isError) {
    return (
      <WorkspacePage>
        <StatePanel
          icon={RefreshCcw}
          title="Could not load tables"
          message="We could not load the live restaurant floor right now. Please retry and check the connection."
          tone="rose"
          action={<button onClick={() => refetch()} className="btn-primary"><RefreshCcw className="h-4 w-4" />Retry</button>}
        />
      </WorkspacePage>
    )
  }

  const enrichedTables = tables.map((table) => {
    const serviceState = getServiceState(table)
    const serviceMeta = SERVICE_META[serviceState] || SERVICE_META.free
    const orderMeta = ORDER_META[table.currentOrderId?.orderStatus] || null
    return { ...table, serviceState, serviceMeta, orderMeta }
  })

  const openOrdersCount = enrichedTables.filter((table) => Boolean(table.currentOrderId?._id)).length
  const billingReadyCount = enrichedTables.filter((table) => table.serviceState === 'billing').length
  const occupiedCount = enrichedTables.filter((table) => ['occupied', 'billing'].includes(table.serviceState)).length
  const freeCount = enrichedTables.filter((table) => table.serviceState === 'free').length
  const activeBillsTotal = enrichedTables.reduce(
    (sum, table) => sum + (Number(table.currentOrderId?.grandTotal) || 0),
    0
  )

  const searchValue = searchTerm.trim().toLowerCase()
  const filteredTables = enrichedTables.filter((table) => {
    const matchesStatus = statusFilter === 'all' || table.serviceState === statusFilter
    const matchesSearch =
      !searchValue ||
      [
        table.number,
        table.name,
        table.section,
        table.reservation?.customerName,
        table.currentOrderId?.invoiceNo,
      ].some((value) => String(value || '').toLowerCase().includes(searchValue))

    return matchesStatus && matchesSearch
  })

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Restaurant Tables"
        title="See the whole dining floor at a glance and act fast during service."
        description="Keep free, occupied, reserved, and billing tables easy to scan so staff can move from seating to kitchen to bill close without confusion."
        badges={[`${enrichedTables.length} tables`, `${openOrdersCount} open orders`, `${billingReadyCount} ready to bill`]}
        actions={
          <div className="flex flex-wrap gap-3">
            {canReadKitchen ? <Link to="/pos/kds" className="btn-secondary"><ChefHat className="h-4 w-4" />Kitchen / KOT</Link> : null}
            {canCreateTable ? <button onClick={openCreateTable} className="btn-primary"><Plus className="h-4 w-4" />Add table</button> : null}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} title="Total Tables" value={enrichedTables.length} detail="Tables configured for this restaurant floor" tone="blue" />
        <KpiCard icon={UtensilsCrossed} title="Occupied Tables" value={occupiedCount} detail={`${billingReadyCount} waiting to close`} tone="rose" />
        <KpiCard icon={DoorOpen} title="Free Tables" value={freeCount} detail="Ready for the next walk-in or booking" tone="emerald" />
        <KpiCard icon={Wallet} title="Open Orders / Bills" value={openOrdersCount} detail={`${formatCurrencyNpr(activeBillsTotal)} active bill value`} tone="amber" />
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</p>
              <SearchField value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by table, section, reservation, or bill no..." />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">View</p>
              <div className="flex flex-wrap gap-2">
                {VIEW_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === filter.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canCreateSale ? <Link to="/pos/billing" className="btn-secondary">Open billing</Link> : null}
            <button onClick={() => refetch()} className="btn-secondary"><RefreshCcw className="h-4 w-4" />Refresh</button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="erp-chip">{filteredTables.length} visible</span>
          <span className="erp-chip">{filteredTables.filter((table) => table.currentOrderId?._id).length} with active bill</span>
          <span className="erp-chip">{filteredTables.filter((table) => table.serviceState === 'reserved').length} reserved</span>
        </div>
      </section>

      <SectionCard
        eyebrow="Live Floor"
        title={statusFilter === 'all' ? 'All active tables' : `${SERVICE_META[statusFilter]?.label || 'Filtered'} tables`}
        description="Each card keeps the live status, bill amount, service stage, and the next useful action in one place."
      >
        {filteredTables.length === 0 ? (
          <EmptyCard
            icon={UtensilsCrossed}
            title={searchTerm || statusFilter !== 'all' ? 'No tables match this view' : 'No tables added yet'}
            message={
              searchTerm || statusFilter !== 'all'
                ? 'Try another search term or switch the table view filter.'
                : 'Add your first table to start tracking dine-in activity, reservations, and live bills.'
            }
            action={
              searchTerm || statusFilter !== 'all'
                ? <button onClick={() => { setSearchTerm(''); setStatusFilter('all') }} className="btn-secondary">Clear filters</button>
                : canCreateTable
                  ? <button onClick={openCreateTable} className="btn-primary">Add first table</button>
                  : null
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredTables.map((table) => {
              const order = table.currentOrderId
              const hasReservation = Boolean(table.reservation?.customerName)
              const canReturnToAvailable = table.serviceState === 'cleaning'
              const canRemove = canDeleteTable && !order && !hasReservation
              const canCloseTable = canUpdateSales && order && order.orderStatus === 'served'

              return (
                <article key={table._id} className={`rounded-3xl border p-5 shadow-sm ${table.serviceMeta.card}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-kicker">{table.section || 'Dining floor'}</p>
                      <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {table.name?.trim() ? table.name : `Table ${table.number}`}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">Table #{table.number} · {table.capacity || 0} seats</p>
                    </div>
                    <StatusBadge tone={table.serviceMeta.tone}>{table.serviceMeta.label}</StatusBadge>
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    {order ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active bill</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrencyNpr(order.grandTotal || 0)}</p>
                            <p className="mt-1 text-sm text-slate-500">{order.invoiceNo || 'Open dine-in order'}</p>
                          </div>
                          {table.orderMeta ? <StatusBadge tone={table.orderMeta.tone}>{table.orderMeta.label}</StatusBadge> : null}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white bg-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Handled by</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{order.soldBy?.username || 'Waiter not assigned'}</p>
                          </div>
                          <div className="rounded-2xl border border-white bg-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time open</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{elapsed(order.createdAt) || 'Open now'}</p>
                          </div>
                        </div>
                        {table.orderMeta ? <p className="text-sm leading-6 text-slate-600">{table.orderMeta.helper}</p> : null}
                      </div>
                    ) : hasReservation ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reservation</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{table.reservation.customerName}</p>
                          </div>
                          <StatusBadge tone="amber">{table.reservation.partySize || 1} guests</StatusBadge>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /><span>{formatDateTimeNepal(table.reservation.reservationAt)}</span></div>
                          {table.reservation.phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span>{table.reservation.phone}</span></div> : null}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{table.serviceState === 'cleaning' ? 'Cleaning' : 'Ready for service'}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {table.serviceState === 'cleaning' ? 'Table is being reset for the next guests.' : 'No active bill on this table right now.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {!order && canCreateSale ? (
                      <Link to="/pos/billing" state={{ tableId: table._id, orderType: 'dine-in' }} className="btn-primary">
                        <DoorOpen className="h-4 w-4" />
                        Open table
                      </Link>
                    ) : null}
                    {order && canReadSales ? (
                      <Link to={`/pos/sales/${order._id}`} state={{ backTo: '/pos/tables' }} className="btn-secondary">
                        <ReceiptText className="h-4 w-4" />
                        View order
                      </Link>
                    ) : null}
                    {order && order.orderStatus === 'pending' && canUpdateKitchen ? (
                      <button onClick={() => orderStatusMut.mutate({ id: order._id, orderStatus: 'preparing' })} className="btn-secondary text-amber-700" disabled={orderStatusMut.isPending}>
                        <ChefHat className="h-4 w-4" />
                        Send to kitchen
                      </button>
                    ) : null}
                    {order && canReadSales ? (
                      <Link to={`/pos/sales/${order._id}`} state={{ autoPrint: true, backTo: '/pos/tables' }} className="btn-secondary">
                        <Printer className="h-4 w-4" />
                        Print bill
                      </Link>
                    ) : null}
                    {canCloseTable ? (
                      <button onClick={() => orderStatusMut.mutate({ id: order._id, orderStatus: 'completed' })} className="btn-secondary text-emerald-700" disabled={orderStatusMut.isPending}>
                        <Wallet className="h-4 w-4" />
                        Close table
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {canUpdateTable ? (
                      <button onClick={() => openEditTable(table)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
                        <Edit3 className="h-4 w-4" />
                        Edit table
                      </button>
                    ) : null}
                    {canUpdateTable && !order ? (
                      <button onClick={() => openReservation(table)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
                        <Calendar className="h-4 w-4" />
                        {hasReservation ? 'Edit reservation' : 'Reserve'}
                      </button>
                    ) : null}
                    {canUpdateTable && hasReservation ? (
                      <button onClick={() => cancelReservationMut.mutate(table._id)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
                        Clear reservation
                      </button>
                    ) : null}
                    {canUpdateTable && !order && table.serviceState !== 'cleaning' ? (
                      <button onClick={() => updateStatusMut.mutate({ id: table._id, status: 'cleaning' })} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
                        Mark cleaning
                      </button>
                    ) : null}
                    {canUpdateTable && canReturnToAvailable ? (
                      <button onClick={() => updateStatusMut.mutate({ id: table._id, status: 'available' })} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
                        Mark free
                      </button>
                    ) : null}
                    {canRemove ? (
                      <button onClick={() => { if (window.confirm(`Remove table #${table.number}?`)) deleteTableMut.mutate(table._id) }} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </SectionCard>

      {showTableModal ? (
        <TableSetupModal
          editingTableId={editingTableId}
          form={tableForm}
          saving={createTableMut.isPending || updateTableMut.isPending}
          onClose={() => { setShowTableModal(false); setEditingTableId(null); setTableForm(TABLE_FORM) }}
          onChange={(field, value) => setTableForm((current) => ({ ...current, [field]: value }))}
          onSubmit={handleTableSubmit}
        />
      ) : null}

      {showReservationModal ? (
        <ReservationModal
          table={reservationTarget}
          form={reservationForm}
          saving={reserveTableMut.isPending}
          onClose={() => { setShowReservationModal(false); setReservationTarget(null); setReservationForm(RESERVATION_FORM) }}
          onChange={(field, value) => setReservationForm((current) => ({ ...current, [field]: value }))}
          onSubmit={handleReservationSubmit}
        />
      ) : null}
    </WorkspacePage>
  )
}
