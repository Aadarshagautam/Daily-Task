import React, { useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Building2,
  ChefHat,
  CreditCard,
  GitBranch,
  Package,
  Plus,
  Receipt,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'
import StatePanel from '../components/StatePanel.jsx'
import {
  DataTableShell,
  EmptyCard,
  FieldLabel,
  KpiCard,
  PageHeader,
  SearchField,
  SectionCard,
  StatusBadge,
  WorkspacePage,
} from '../components/ui/ErpPrimitives.jsx'
import AppContext from '../context/app-context.js'
import { getBusinessMeta, normalizeBusinessType } from '../config/businessConfigs.js'
import {
  ASSIGNABLE_ROLE_OPTIONS,
  getRoleHighlights,
  getRoleMeta,
  getRoleModuleAccess,
} from '../config/roleMeta.js'
import api from '../lib/api.js'
import { DEFAULT_PHONE_PLACEHOLDER, PAYMENT_METHOD_LABELS } from '../utils/nepal.js'

const SOFTWARE_STYLES = {
  restaurant: { icon: ChefHat, base: 'border-amber-300 bg-amber-50 text-amber-800', active: 'border-amber-500 bg-amber-100 ring-2 ring-amber-400', dot: 'bg-amber-500' },
  cafe: { icon: ShoppingCart, base: 'border-teal-300 bg-teal-50 text-teal-800', active: 'border-teal-500 bg-teal-100 ring-2 ring-teal-400', dot: 'bg-teal-500' },
  shop: { icon: Package, base: 'border-blue-300 bg-blue-50 text-blue-800', active: 'border-blue-500 bg-blue-100 ring-2 ring-blue-400', dot: 'bg-blue-500' },
  general: { icon: Building2, base: 'border-stone-300 bg-stone-50 text-stone-700', active: 'border-stone-400 bg-stone-100 ring-2 ring-stone-300', dot: 'bg-stone-500' },
}

const SETTINGS_SECTIONS = [
  { id: 'business-profile', label: 'Business Profile' },
  { id: 'billing-receipt', label: 'Billing & Receipt' },
  { id: 'tax-vat', label: 'Tax / VAT' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'users-roles', label: 'Staff Management' },
  { id: 'security-access', label: 'Security / Access' },
  { id: 'branches', label: 'Branches' },
  { id: 'advanced-settings', label: 'Advanced Later' },
]

const CURRENCY_OPTIONS = [
  { value: 'NPR', label: 'Nepali Rupee (NPR)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
]

const MONTH_OPTIONS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' }, { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

const PAYMENT_METHOD_TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash counter' },
  { value: 'digital', label: 'Digital wallet / QR' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'due', label: 'Due / Credit' },
  { value: 'card', label: 'Card machine' },
  { value: 'other', label: 'Other' },
]

const PAYMENT_METHOD_TYPE_BY_KEY = {
  cash: 'cash',
  card: 'card',
  bank_transfer: 'bank',
  esewa: 'digital',
  khalti: 'digital',
  credit: 'due',
  cheque: 'other',
  mixed: 'other',
  other: 'other',
}

const PAYMENT_METHOD_ICON_BY_KEY = {
  cash: Wallet,
  esewa: CreditCard,
  khalti: CreditCard,
  bank_transfer: Building2,
  credit: Receipt,
  card: CreditCard,
}

const DEFAULT_PAYMENT_METHOD_SETTINGS = [
  {
    key: 'cash',
    name: 'Cash',
    type: 'cash',
    isActive: true,
    isDefault: true,
    description: 'Default counter payment for daily billing.',
  },
  {
    key: 'esewa',
    name: 'eSewa',
    type: 'digital',
    isActive: true,
    isDefault: false,
    description: 'Useful for QR and wallet collections in Nepal.',
  },
  {
    key: 'khalti',
    name: 'Khalti',
    type: 'digital',
    isActive: true,
    isDefault: false,
    description: 'Popular for cafe, restaurant, and shop digital payments.',
  },
  {
    key: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank',
    isActive: true,
    isDefault: false,
    description: 'Best for supplier settlements and larger customer bills.',
  },
  {
    key: 'credit',
    name: 'Due / Credit',
    type: 'due',
    isActive: false,
    isDefault: false,
    description: 'Enable only when you want to track customer due balances.',
  },
]

const ROLE_SURFACE_CLASSES = {
  amber: 'border-amber-200 bg-amber-50/80',
  teal: 'border-emerald-200 bg-emerald-50/80',
  emerald: 'border-emerald-200 bg-emerald-50/80',
  blue: 'border-sky-200 bg-sky-50/80',
  rose: 'border-rose-200 bg-rose-50/80',
  orange: 'border-orange-200 bg-orange-50/80',
  slate: 'border-slate-200 bg-slate-50',
}

const ACCESS_SURFACE_CLASSES = {
  none: 'border-slate-200 bg-slate-50',
  view: 'border-slate-200 bg-white',
  work: 'border-sky-200 bg-sky-50/70',
  manage: 'border-emerald-200 bg-emerald-50/70',
  full: 'border-amber-200 bg-amber-50/80',
}

const STAFF_STATUS_OPTIONS = [
  { value: 'all', label: 'All staff' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
]

const createEmptyOrgForm = (businessType = 'shop') => ({
  name: '',
  phone: '',
  email: '',
  gstin: '',
  currency: 'NPR',
  financialYearStart: 4,
  invoicePrefix: 'INV',
  businessType: normalizeBusinessType(businessType),
  address: { street: '', city: '', state: '', pincode: '', country: 'Nepal' },
})

const buildSoftwareOptions = () =>
  ['restaurant', 'cafe', 'shop'].map(value => ({
    value,
    label: getBusinessMeta(value).label,
    description: getBusinessMeta(value).settingsDescription,
    ...SOFTWARE_STYLES[value],
  }))

const normalizeAddress = (address = {}) => ({
  street: address.street || '',
  city: address.city || '',
  state: address.state || '',
  pincode: address.pincode || '',
  country: address.country || 'Nepal',
})

const mapOrganizationToForm = organization => ({
  name: organization.name || '',
  phone: organization.phone || '',
  email: organization.email || '',
  gstin: organization.gstin || '',
  currency: organization.currency || 'NPR',
  financialYearStart: Number(organization.financialYearStart) || 4,
  invoicePrefix: organization.invoicePrefix || 'INV',
  businessType: normalizeBusinessType(organization.businessType),
  address: normalizeAddress(organization.address),
})

const serializeOrgForm = form => JSON.stringify({ ...form, address: normalizeAddress(form.address) })

const getPlanLabel = plan => (plan === 'multi-branch' ? 'Multi-branch' : plan === 'growth' ? 'Growth plan' : 'Single branch')
const getMonthLabel = month => MONTH_OPTIONS.find(option => option.value === Number(month))?.label || 'April'
const hasValue = value => (typeof value === 'number' ? true : String(value || '').trim() !== '')
const createDefaultPaymentMethodSettings = () => DEFAULT_PAYMENT_METHOD_SETTINGS.map(method => ({ ...method }))

const getPaymentMethodType = key => PAYMENT_METHOD_TYPE_BY_KEY[key] || 'other'
const getPaymentMethodTypeLabel = value => PAYMENT_METHOD_TYPE_OPTIONS.find(option => option.value === value)?.label || 'Other'

const getPaymentMethodTone = method => {
  if (method.isActive === false) return 'slate'
  if (method.type === 'cash') return 'emerald'
  if (method.type === 'digital') return 'sky'
  if (method.type === 'bank') return 'blue'
  if (method.type === 'due') return 'amber'
  return 'slate'
}

const normalizePaymentMethodSettings = methods => {
  const defaults = createDefaultPaymentMethodSettings()
  const validTypes = new Set(PAYMENT_METHOD_TYPE_OPTIONS.map(option => option.value))
  const incoming = Array.isArray(methods) ? methods : []
  const incomingByKey = new Map()

  incoming.forEach(method => {
    const key = String(method?.key || '').trim()
    if (!key) return
    incomingByKey.set(key, method)
  })

  let nextMethods = defaults.map(defaultMethod => {
    const current = incomingByKey.get(defaultMethod.key) || {}
    return {
      ...defaultMethod,
      name: String(current.name || defaultMethod.name).trim() || defaultMethod.name,
      type: validTypes.has(current.type) ? current.type : defaultMethod.type,
      isActive: current.isActive === undefined ? defaultMethod.isActive : Boolean(current.isActive),
      isDefault: Boolean(current.isDefault),
      description: String(current.description || defaultMethod.description || '').trim(),
    }
  })

  const additionalMethods = incoming
    .filter(method => {
      const key = String(method?.key || '').trim()
      return key && !nextMethods.some(entry => entry.key === key)
    })
    .map(method => {
      const key = String(method?.key || '').trim()
      if (!key) return null
      return {
        key,
        name: String(method?.name || PAYMENT_METHOD_LABELS[key] || key).trim(),
        type: validTypes.has(method?.type) ? method.type : getPaymentMethodType(key),
        isActive: method?.isActive === undefined ? true : Boolean(method.isActive),
        isDefault: Boolean(method?.isDefault),
        description: String(method?.description || '').trim(),
      }
    })
    .filter(Boolean)

  nextMethods = [...nextMethods, ...additionalMethods]

  if (!nextMethods.some(method => method.isActive)) {
    nextMethods = nextMethods.map(method => (method.key === 'cash' ? { ...method, isActive: true } : method))
  }

  const defaultMethod = nextMethods.find(method => method.isDefault && method.isActive) || nextMethods.find(method => method.isActive) || nextMethods[0]

  return nextMethods.map(method => ({
    ...method,
    isDefault: defaultMethod ? method.key === defaultMethod.key : false,
  }))
}

const serializePaymentMethodSettings = methods => JSON.stringify(
  normalizePaymentMethodSettings(methods).map(({ key, name, type, isActive, isDefault, description }) => ({
    key,
    name,
    type,
    isActive,
    isDefault,
    description,
  }))
)

const getSavedLabel = value => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('en-NP', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  } catch {
    return ''
  }
}

const AccessPill = ({ access }) => (
  <StatusBadge tone={access.accessTone}>{access.accessLabel}</StatusBadge>
)

const RoleOverviewCard = ({ roleKey, memberCount, active, onClick }) => {
  const roleMeta = getRoleMeta(roleKey)
  const quickModules = getRoleHighlights(roleKey, 3)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-5 text-left transition ${ROLE_SURFACE_CLASSES[roleMeta.tone] || ROLE_SURFACE_CLASSES.slate} ${active ? 'ring-2 ring-slate-900/10' : 'hover:border-slate-300 hover:bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{roleMeta.label}</p>
            <StatusBadge tone={memberCount > 0 ? 'emerald' : 'slate'}>
              {memberCount > 0 ? `${memberCount} user${memberCount === 1 ? '' : 's'}` : 'Ready to use'}
            </StatusBadge>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{roleMeta.audience}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{roleMeta.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickModules.map(module => (
          <StatusBadge key={`${roleKey}-${module.key}`} tone="slate">
            {module.label}
          </StatusBadge>
        ))}
      </div>
    </button>
  )
}

const SettingsPage = () => {
  const { currentOrgId, orgBusinessType, setOrgBusinessType, setCurrentOrgName, hasPermission } = useContext(AppContext)
  const canReadUsers = hasPermission('users.read')
  const canInviteUsers = hasPermission('users.invite')
  const canUpdateUsers = hasPermission('users.update')
  const canReadSettings = hasPermission('settings.read')
  const canUpdateSettings = hasPermission('settings.update')

  const [loading, setLoading] = useState(true)
  const [noOrg, setNoOrg] = useState(false)
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [organizationMeta, setOrganizationMeta] = useState({ softwarePlan: 'single-branch', enabledModules: [] })
  const [paymentMethods, setPaymentMethods] = useState(() => createDefaultPaymentMethodSettings())
  const [initialPaymentMethods, setInitialPaymentMethods] = useState(() => createDefaultPaymentMethodSettings())
  const [activePaymentMethodKey, setActivePaymentMethodKey] = useState('cash')
  const [orgForm, setOrgForm] = useState(createEmptyOrgForm(orgBusinessType || 'shop'))
  const [initialOrgForm, setInitialOrgForm] = useState(createEmptyOrgForm(orgBusinessType || 'shop'))
  const [lastSavedAt, setLastSavedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember] = useState({
    username: '',
    phone: '',
    email: '',
    password: '',
    role: 'cashier',
    branchId: '',
    isActive: true,
    notes: '',
  })
  const [addingMember, setAddingMember] = useState(false)
  const [selectedRoleKey, setSelectedRoleKey] = useState('owner')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState('all')
  const [memberStatusFilter, setMemberStatusFilter] = useState('all')
  const [activeMemberId, setActiveMemberId] = useState('')
  const [memberDraft, setMemberDraft] = useState({
    role: '',
    branchId: '',
    phone: '',
    notes: '',
    isActive: true,
  })
  const [savingMemberId, setSavingMemberId] = useState('')
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [newBranch, setNewBranch] = useState({ name: '', code: '', email: '', phone: '' })
  const [addingBranch, setAddingBranch] = useState(false)

  const softwareOptions = buildSoftwareOptions()
  const selectedSoftware = softwareOptions.find(option => option.value === orgForm.businessType) || softwareOptions[0]
  const planLabel = getPlanLabel(organizationMeta.softwarePlan)
  const lastSavedLabel = getSavedLabel(lastSavedAt)
  const hasBusinessChanges = serializeOrgForm(orgForm) !== serializeOrgForm(initialOrgForm)
  const hasPaymentMethodChanges = serializePaymentMethodSettings(paymentMethods) !== serializePaymentMethodSettings(initialPaymentMethods)
  const profileCompletion = [orgForm.name, orgForm.phone, orgForm.email, orgForm.address.street, orgForm.address.city, orgForm.address.state].filter(hasValue).length
  const branchAssignedMembers = members.filter(member => Boolean(member.branchId)).length
  const activeBranches = branches.filter(branch => branch.isActive !== false).length
  const vatReady = Boolean(orgForm.gstin.trim())
  const moduleCount = organizationMeta.enabledModules.length
  const activePaymentMethodCount = paymentMethods.filter(method => method.isActive).length
  const digitalPaymentMethodCount = paymentMethods.filter(method => method.isActive && method.type === 'digital').length
  const defaultPaymentMethod = paymentMethods.find(method => method.isDefault) || paymentMethods[0] || null
  const dueEnabled = paymentMethods.some(method => method.key === 'credit' && method.isActive)
  const activeStaffCount = members.filter(member => member.isActive !== false).length
  const inactiveStaffCount = Math.max(members.length - activeStaffCount, 0)
  const roleCounts = members.reduce((counts, member) => {
    counts[member.role] = (counts[member.role] || 0) + 1
    return counts
  }, {})
  const roleCount = Object.keys(roleCounts).length
  const businessRoleKeys = ['owner', 'manager', 'cashier', ...(selectedSoftware.value === 'restaurant' || selectedSoftware.value === 'cafe' ? ['waiter', 'kitchen'] : []), 'accountant']
  const legacyRoleKeys = ['admin', 'member', 'viewer'].filter(role => members.some(member => member.role === role))
  const roleOverviewKeys = Array.from(new Set([...businessRoleKeys, ...legacyRoleKeys]))
  const normalizedMemberSearch = memberSearch.trim().toLowerCase()
  const filteredMembers = members.filter(member => {
    const matchesStatus =
      memberStatusFilter === 'all' ||
      (memberStatusFilter === 'active' ? member.isActive !== false : member.isActive === false)
    const matchesSearch =
      normalizedMemberSearch === '' ||
      [member.username, member.email, member.phone, member.branchName, getRoleMeta(member.role).label]
        .some(value => String(value || '').toLowerCase().includes(normalizedMemberSearch))
    const matchesRole = memberRoleFilter === 'all' || member.role === memberRoleFilter
    return matchesStatus && matchesSearch && matchesRole
  })
  const activeMember = members.find(member => member._id === activeMemberId) || null
  const activePaymentMethod = paymentMethods.find(method => method.key === activePaymentMethodKey) || paymentMethods[0] || null
  const ActivePaymentMethodIcon = activePaymentMethod ? PAYMENT_METHOD_ICON_BY_KEY[activePaymentMethod.key] || CreditCard : CreditCard
  const activeRoleKey = activeMember ? memberDraft.role || activeMember.role : selectedRoleKey
  const activeRoleMeta = getRoleMeta(activeRoleKey)
  const activeRoleAccess = getRoleModuleAccess(activeRoleKey)
  const activeRoleHighlights = getRoleHighlights(activeRoleKey, 4)
  const memberEditDirty = activeMember
    ? activeMember.role !== memberDraft.role ||
      (activeMember.branchId || '') !== (memberDraft.branchId || '') ||
      (activeMember.phone || '') !== (memberDraft.phone || '') ||
      (activeMember.notes || '') !== (memberDraft.notes || '') ||
      Boolean(activeMember.isActive) !== Boolean(memberDraft.isActive)
    : false

  useEffect(() => {
    if (!currentOrgId) {
      setNoOrg(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setNoOrg(false)

    const load = async () => {
      try {
        const [orgRes, membersRes, branchesRes] = await Promise.all([
          api.get('/org/'),
          canReadUsers ? api.get('/org/members') : Promise.resolve(null),
          canReadSettings ? api.get('/org/branches') : Promise.resolve(null),
        ])
        if (orgRes.data?.success) {
          const organization = orgRes.data.data
          const nextForm = mapOrganizationToForm(organization)
          const nextPaymentMethods = normalizePaymentMethodSettings(organization.settings?.paymentMethods)
          setOrgForm(nextForm)
          setInitialOrgForm(nextForm)
          setPaymentMethods(nextPaymentMethods)
          setInitialPaymentMethods(nextPaymentMethods)
          setActivePaymentMethodKey(previous => (nextPaymentMethods.some(method => method.key === previous) ? previous : nextPaymentMethods[0]?.key || 'cash'))
          setLastSavedAt(organization.updatedAt || organization.createdAt || '')
          setOrganizationMeta({ softwarePlan: organization.softwarePlan || 'single-branch', enabledModules: organization.settings?.enabledModules || [] })
        } else if (orgRes.data?.message === 'No organization selected') {
          setNoOrg(true)
        }
        if (membersRes?.data?.success) setMembers(membersRes.data.data || [])
        if (branchesRes?.data?.success) setBranches(branchesRes.data.data || [])
      } catch (error) {
        if (error.response?.status === 400) setNoOrg(true)
        else toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [currentOrgId, canReadSettings, canReadUsers, orgBusinessType])

  useEffect(() => {
    if (activeMemberId && !members.some(member => member._id === activeMemberId)) {
      setActiveMemberId('')
      setMemberDraft({ role: '', branchId: '', phone: '', notes: '', isActive: true })
    }

    if (!roleOverviewKeys.includes(selectedRoleKey)) {
      setSelectedRoleKey(roleOverviewKeys[0] || 'owner')
    }
  }, [activeMember, activeMemberId, members, roleOverviewKeys, selectedRoleKey])

  useEffect(() => {
    if (activePaymentMethodKey && !paymentMethods.some(method => method.key === activePaymentMethodKey)) {
      setActivePaymentMethodKey(paymentMethods[0]?.key || 'cash')
    }
  }, [activePaymentMethodKey, paymentMethods])

  const handleOrgFieldChange = (field, value) => setOrgForm(previous => ({ ...previous, [field]: value }))
  const handleAddressChange = (field, value) => setOrgForm(previous => ({ ...previous, address: { ...previous.address, [field]: value } }))
  const openRolePreview = roleKey => {
    setSelectedRoleKey(roleKey)
    setActiveMemberId('')
    setMemberDraft({ role: '', branchId: '', phone: '', notes: '', isActive: true })
  }

  const openMemberEditor = member => {
    setShowAddMember(false)
    setSelectedRoleKey(member.role)
    setActiveMemberId(member._id)
    setMemberDraft({
      role: member.role,
      branchId: member.branchId || '',
      phone: member.phone || '',
      notes: member.notes || '',
      isActive: member.isActive !== false,
    })
  }

  const closeMemberEditor = () => {
    setActiveMemberId('')
    setMemberDraft({ role: '', branchId: '', phone: '', notes: '', isActive: true })
  }

  const updatePaymentMethods = updater => {
    setPaymentMethods(previous => normalizePaymentMethodSettings(typeof updater === 'function' ? updater(previous) : updater))
  }

  const handlePaymentMethodFieldChange = (methodKey, field, value) => {
    updatePaymentMethods(previous => previous.map(method => {
      if (method.key !== methodKey) return method
      if (field === 'isActive') return { ...method, isActive: Boolean(value), isDefault: value ? method.isDefault : false }
      return { ...method, [field]: value }
    }))
  }

  const handleDefaultPaymentMethodChange = (methodKey, shouldBeDefault) => {
    updatePaymentMethods(previous => {
      if (shouldBeDefault) {
        return previous.map(method => (method.key === methodKey ? { ...method, isDefault: true, isActive: true } : { ...method, isDefault: false }))
      }

      const fallbackKey = previous.find(method => method.key !== methodKey && method.isActive)?.key || previous.find(method => method.key !== methodKey)?.key
      if (!fallbackKey) return previous

      return previous.map(method => {
        if (method.key === methodKey) return { ...method, isDefault: false }
        if (method.key === fallbackKey) return { ...method, isDefault: true, isActive: true }
        return method
      })
    })
  }

  const handleTogglePaymentMethodStatus = methodKey => {
    updatePaymentMethods(previous => previous.map(method => {
      if (method.key !== methodKey) return method
      const nextActive = !method.isActive
      return {
        ...method,
        isActive: nextActive,
        isDefault: nextActive ? method.isDefault : false,
      }
    }))
  }

  const handleResetPaymentMethods = () => {
    setPaymentMethods(initialPaymentMethods)
    setActivePaymentMethodKey(previous => (initialPaymentMethods.some(method => method.key === previous) ? previous : initialPaymentMethods[0]?.key || 'cash'))
  }

  const handleSavePaymentMethods = async () => {
    if (!canUpdateSettings) return

    setSavingPaymentMethods(true)
    try {
      const { data } = await api.put('/org/', { paymentMethods })
      if (data.success) {
        const nextPaymentMethods = normalizePaymentMethodSettings(data.data.settings?.paymentMethods || paymentMethods)
        setPaymentMethods(nextPaymentMethods)
        setInitialPaymentMethods(nextPaymentMethods)
        setActivePaymentMethodKey(previous => (nextPaymentMethods.some(method => method.key === previous) ? previous : nextPaymentMethods[0]?.key || 'cash'))
        setLastSavedAt(data.data.updatedAt || new Date().toISOString())
        toast.success('Payment methods saved')
      } else {
        toast.error(data.message || 'Failed to save payment methods')
      }
    } catch {
      toast.error('Failed to save payment methods')
    } finally {
      setSavingPaymentMethods(false)
    }
  }

  const handleSave = async () => {
    if (!canUpdateSettings) return
    if (!orgForm.name.trim()) return toast.error('Business name is required')
    setSaving(true)
    try {
      const payload = {
        name: orgForm.name.trim(),
        phone: orgForm.phone.trim(),
        email: orgForm.email.trim(),
        gstin: orgForm.gstin.trim().toUpperCase(),
        currency: orgForm.currency,
        financialYearStart: Number(orgForm.financialYearStart) || 4,
        invoicePrefix: orgForm.invoicePrefix.trim().toUpperCase() || 'INV',
        businessType: orgForm.businessType,
        address: {
          street: orgForm.address.street.trim(),
          city: orgForm.address.city.trim(),
          state: orgForm.address.state.trim(),
          pincode: orgForm.address.pincode.trim(),
          country: orgForm.address.country.trim() || 'Nepal',
        },
      }
      const { data } = await api.put('/org/', payload)
      if (data.success) {
        const nextForm = mapOrganizationToForm(data.data)
        const nextPaymentMethods = normalizePaymentMethodSettings(data.data.settings?.paymentMethods || paymentMethods)
        setOrgForm(nextForm)
        setInitialOrgForm(nextForm)
        setPaymentMethods(nextPaymentMethods)
        setInitialPaymentMethods(nextPaymentMethods)
        setActivePaymentMethodKey(previous => (nextPaymentMethods.some(method => method.key === previous) ? previous : nextPaymentMethods[0]?.key || 'cash'))
        setLastSavedAt(data.data.updatedAt || new Date().toISOString())
        setOrganizationMeta(previous => ({ ...previous, softwarePlan: data.data.softwarePlan || previous.softwarePlan, enabledModules: data.data.settings?.enabledModules || previous.enabledModules }))
        setOrgBusinessType(nextForm.businessType)
        setCurrentOrgName(nextForm.name)
        toast.success('Business settings saved')
      } else {
        toast.error(data.message || 'Save failed')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMember.username || !newMember.email || !newMember.role) return toast.error('Full name, email, and role are required')
    setAddingMember(true)
    try {
      const payload = { ...newMember }
      if (!payload.branchId) delete payload.branchId
      if (!payload.password) delete payload.password
      const { data } = await api.post('/org/members', payload)
      if (data.success) {
        setMembers(previous => [...previous, data.data])
        setNewMember({
          username: '',
          phone: '',
          email: '',
          password: '',
          role: 'cashier',
          branchId: '',
          isActive: true,
          notes: '',
        })
        setShowAddMember(false)
        setSelectedRoleKey(data.data.role || 'cashier')
        toast.success('Staff member added')
      } else toast.error(data.message || 'Failed to add member')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleCreateBranch = async () => {
    if (!newBranch.name.trim()) return toast.error('Branch name is required')
    setAddingBranch(true)
    try {
      const { data } = await api.post('/org/branches', { name: newBranch.name.trim(), code: newBranch.code.trim(), email: newBranch.email.trim(), phone: newBranch.phone.trim() })
      if (data.success) {
        setBranches(previous => [...previous, data.data])
        setNewBranch({ name: '', code: '', email: '', phone: '' })
        setShowAddBranch(false)
        toast.success('Branch created')
      } else toast.error(data.message || 'Failed to create branch')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create branch')
    } finally {
      setAddingBranch(false)
    }
  }

  const handleMemberUpdate = async (memberId, nextRole, nextBranchId) => {
    const current = members.find(member => member._id === memberId)
    if (!current) return false
    const payload = {
      role: nextRole || current.role,
      branchId: typeof nextBranchId === 'string' ? nextBranchId || null : current.branchId || null,
      phone: activeMemberId === memberId ? memberDraft.phone.trim() : current.phone || '',
      notes: activeMemberId === memberId ? memberDraft.notes.trim() : current.notes || '',
      isActive: activeMemberId === memberId ? Boolean(memberDraft.isActive) : current.isActive !== false,
    }
    setSavingMemberId(memberId)
    try {
      const { data } = await api.patch(`/org/members/${memberId}/role`, payload)
      if (data.success) {
        setMembers(previous => previous.map(member => member._id !== memberId ? member : {
          ...member,
          role: payload.role,
          branchId: payload.branchId,
          branchName: payload.branchId ? branches.find(branch => branch._id === payload.branchId)?.name || '' : '',
          phone: payload.phone,
          notes: payload.notes,
          isActive: payload.isActive,
        }))
        toast.success('Staff details updated')
        return true
      }

      toast.error(data.message || 'Failed to update member')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update member')
    } finally {
      setSavingMemberId('')
    }
    return false
  }

  const handleSaveMemberAccess = async () => {
    if (!activeMember) return
    const didSave = await handleMemberUpdate(activeMember._id, memberDraft.role, memberDraft.branchId)
    if (didSave) {
      setSelectedRoleKey(memberDraft.role)
      closeMemberEditor()
    }
  }

  if (loading) {
    return <WorkspacePage><StatePanel tone="teal" title="Loading settings" message="Preparing business profile, VAT billing details, team access, and branch setup for this workspace." /></WorkspacePage>
  }

  if (noOrg) {
    return <WorkspacePage><StatePanel tone="amber" icon={Building2} title="No organization linked" message="Your account is not linked to an organization yet. Please log out and register again, or contact support if this workspace should already be active." /></WorkspacePage>
  }

  return (
    <WorkspacePage className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Clear, manageable business settings"
        description="Keep business identity, VAT billing, receipt setup, user access, and branch details organized in one owner-friendly workspace."
        badges={[selectedSoftware.label, planLabel, vatReady ? 'PAN / VAT added' : 'PAN / VAT pending']}
        actions={
          <div className="flex flex-col gap-2 sm:items-end">
            <StatusBadge tone={canUpdateSettings ? (hasBusinessChanges ? 'amber' : 'emerald') : 'slate'}>
              {canUpdateSettings ? (hasBusinessChanges ? 'Unsaved business changes' : 'Business settings saved') : 'View only access'}
            </StatusBadge>
            {lastSavedLabel ? <p className="text-xs text-slate-500">Last saved {lastSavedLabel}</p> : null}
            {canUpdateSettings ? (
              <button
                onClick={handleSave}
                disabled={saving || !hasBusinessChanges}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving settings...' : 'Save business settings'}
              </button>
            ) : (
              <p className="text-xs leading-5 text-slate-500">Ask an owner or admin if you need to change these settings.</p>
            )}
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Building2}
          title="Business Profile"
          value={`${profileCompletion}/6`}
          detail="Core identity details ready for receipts and printed bills"
          tone={profileCompletion >= 5 ? 'emerald' : 'amber'}
        />
        <KpiCard
          icon={Receipt}
          title="Billing & VAT"
          value={vatReady ? 'Ready' : 'Needs setup'}
          detail={`${orgForm.invoicePrefix || 'INV'} prefix / ${orgForm.currency} / FY starts ${getMonthLabel(orgForm.financialYearStart)}`}
          tone={vatReady ? 'teal' : 'amber'}
        />
        <KpiCard
          icon={Users}
          title="Staff"
          value={canReadUsers ? members.length : 'Restricted'}
          detail={canReadUsers ? `${activeStaffCount} active, ${roleCount} roles in use` : 'Staff access is limited for your role'}
          tone="blue"
        />
        <KpiCard
          icon={GitBranch}
          title="Branches"
          value={canReadSettings ? activeBranches || branches.length : 'Restricted'}
          detail={`${planLabel} workspace / ${moduleCount} active modules`}
          tone="slate"
        />
      </section>

      <section className="panel sticky top-4 z-10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SECTIONS.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {section.label}
              </a>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Change only what matters today. Advanced setup stays tucked away.
          </p>
        </div>
      </section>

      <div id="business-profile">
        <SectionCard
          eyebrow="Business Profile"
          title="Keep your business identity clean and bill-ready."
          description="These are the everyday details owners and admins usually need most. They also feed into receipts, billing, and branch setup."
          action={<StatusBadge tone="blue">{selectedSoftware.label}</StatusBadge>}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Business name</FieldLabel>
                <input
                  value={orgForm.name}
                  onChange={event => handleOrgFieldChange('name', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="My Business"
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input
                  value={orgForm.phone}
                  onChange={event => handleOrgFieldChange('phone', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={DEFAULT_PHONE_PLACEHOLDER}
                />
              </div>
              <div>
                <FieldLabel>Business email</FieldLabel>
                <input
                  value={orgForm.email}
                  onChange={event => handleOrgFieldChange('email', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="contact@mybusiness.com"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Street / local address</FieldLabel>
                <input
                  value={orgForm.address.street}
                  onChange={event => handleAddressChange('street', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Baneshwor, Kathmandu"
                />
              </div>
              <div>
                <FieldLabel>City / municipality</FieldLabel>
                <input
                  value={orgForm.address.city}
                  onChange={event => handleAddressChange('city', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Kathmandu"
                />
              </div>
              <div>
                <FieldLabel>District / province</FieldLabel>
                <input
                  value={orgForm.address.state}
                  onChange={event => handleAddressChange('state', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Bagmati"
                />
              </div>
              <div>
                <FieldLabel>Postal code</FieldLabel>
                <input
                  value={orgForm.address.pincode}
                  onChange={event => handleAddressChange('pincode', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="44600"
                />
              </div>
              <div>
                <FieldLabel>Country</FieldLabel>
                <input
                  value={orgForm.address.country}
                  onChange={event => handleAddressChange('country', event.target.value)}
                  disabled
                  className="input-primary cursor-not-allowed opacity-60"
                  placeholder="Nepal"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Business type</FieldLabel>
                <div className={`grid gap-3 sm:grid-cols-2 ${softwareOptions.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                  {softwareOptions.map(option => {
                    const Icon = option.icon
                    const isActive = orgForm.businessType === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => canUpdateSettings && handleOrgFieldChange('businessType', option.value)}
                        disabled={!canUpdateSettings}
                        className={`rounded-3xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isActive ? option.active : `${option.base} hover:shadow-sm`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="text-sm font-semibold">{option.label}</span>
                          {isActive ? <div className={`ml-auto h-2.5 w-2.5 rounded-full ${option.dot}`} /> : null}
                        </div>
                        <p className="mt-3 text-xs leading-5 opacity-80">{option.description}</p>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  This keeps products, reports, and daily work areas more practical for your business type.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Owner-friendly setup tips</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the phone and address that customers already know. This keeps walk-in trust, deliveries, and printed bills more consistent.
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current workspace</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedSoftware.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Focused workflows stay matched to this business type.</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current plan</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{planLabel}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Branch availability and workspace expansion depend on this plan.</p>
                </div>
                {!canUpdateSettings ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                    You can review business settings here, but only owners or admins can save changes.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div id="billing-receipt">
        <SectionCard
          eyebrow="Billing & Receipt Settings"
          title="Keep billing simple, readable, and ready for Nepal business use."
          description="Focus on the few details that matter most every day: invoice prefix, currency, and financial year."
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Invoice prefix</FieldLabel>
                <input
                  value={orgForm.invoicePrefix}
                  onChange={event => handleOrgFieldChange('invoicePrefix', event.target.value.toUpperCase())}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="INV"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">Keep this short and easy to read on printed bills.</p>
              </div>
              <div>
                <FieldLabel>Billing currency</FieldLabel>
                <select
                  value={orgForm.currency}
                  onChange={event => handleOrgFieldChange('currency', event.target.value)}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {CURRENCY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Financial year starts in</FieldLabel>
                <select
                  value={orgForm.financialYearStart}
                  onChange={event => handleOrgFieldChange('financialYearStart', Number(event.target.value))}
                  disabled={!canUpdateSettings}
                  className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {MONTH_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  April is a practical default for many Nepal businesses, but you can keep this aligned with your actual reporting cycle.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <p className="text-sm font-semibold">Receipt setup guidance</p>
                <p className="mt-2 text-sm leading-6">
                  Your business name, phone, address, invoice prefix, and PAN / VAT details are the key settings that make receipts feel trustworthy.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Printer setup</p>
                  <StatusBadge tone="amber">Coming soon</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Thermal printer profiles, receipt footer text, and layout controls will be added here later so this page stays simple for now.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
      <div id="tax-vat">
        <SectionCard
          eyebrow="Tax / VAT Settings"
          title="Make PAN / VAT setup visible without making tax settings heavy."
          description="Small businesses can keep this simple. Add your registration when ready and leave it blank if the business is not registered yet."
          action={<StatusBadge tone={vatReady ? 'emerald' : 'amber'}>{vatReady ? 'PAN / VAT ready' : 'Needs PAN / VAT'}</StatusBadge>}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <FieldLabel>PAN / VAT registration number</FieldLabel>
              <input
                value={orgForm.gstin}
                onChange={event => handleOrgFieldChange('gstin', event.target.value.toUpperCase())}
                disabled={!canUpdateSettings}
                className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Enter PAN or VAT number"
              />
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This is the number that should appear on customer bills and official receipts when your business is VAT-registered.
              </p>
            </div>

            <div className="space-y-4">
              <div className={`rounded-3xl border p-5 ${vatReady ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                <p className="text-sm font-semibold">{vatReady ? 'Tax identity added' : 'Tax identity not added yet'}</p>
                <p className="mt-2 text-sm leading-6">
                  {vatReady
                    ? 'Your current PAN / VAT number is saved and ready to appear in billing-related views.'
                    : 'You can keep billing active without this for now, then add the number later when registration is complete.'}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Practical note</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep tax wording simple for staff. Owners and accountants can manage the number here without turning the whole settings page into accounting software.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div id="payment-methods">
        <SectionCard
          eyebrow="Payment Methods"
          title="Keep billing methods practical for cashiers and owners."
          description="Show the payment methods your team actually uses at the counter. Keep cash obvious, make eSewa and Khalti first-class, and enable due billing only when you really need it."
          action={
            <div className="flex flex-col gap-2 sm:items-end">
              <StatusBadge tone={canUpdateSettings ? (hasPaymentMethodChanges ? 'amber' : 'emerald') : 'slate'}>
                {canUpdateSettings ? (hasPaymentMethodChanges ? 'Unsaved payment changes' : 'Payment methods saved') : 'View only access'}
              </StatusBadge>
              {canUpdateSettings ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleResetPaymentMethods}
                    disabled={!hasPaymentMethodChanges || savingPaymentMethods}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear changes
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePaymentMethods}
                    disabled={!hasPaymentMethodChanges || savingPaymentMethods}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPaymentMethods ? 'Saving methods...' : 'Save payment methods'}
                  </button>
                </div>
              ) : (
                <p className="text-xs leading-5 text-slate-500">Ask an owner or admin if you need to change billing methods.</p>
              )}
            </div>
          }
        >
          {!paymentMethods.length ? (
            <EmptyCard
              icon={Wallet}
              title="No payment methods ready"
              message="Add at least one billing method so cashiers know what they can accept during billing."
            />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Active Methods</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-900">{activePaymentMethodCount}</p>
                  <p className="mt-2 text-sm text-emerald-800">Shown to cashiers during billing right now.</p>
                </div>
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Digital Methods</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-sky-900">{digitalPaymentMethodCount}</p>
                  <p className="mt-2 text-sm text-sky-800">Wallet and QR-ready methods currently enabled.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Default Billing Method</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{defaultPaymentMethod?.name || 'Not set'}</p>
                  <p className="mt-2 text-sm text-slate-600">This shows first when staff record a payment.</p>
                </div>
                <div className={`rounded-3xl border p-5 ${dueEnabled ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-900'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dueEnabled ? 'text-amber-700' : 'text-slate-500'}`}>Due / Credit</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{dueEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p className={`mt-2 text-sm ${dueEnabled ? 'text-amber-800' : 'text-slate-600'}`}>
                    {dueEnabled ? 'Trusted customers can pay later and dues stay visible.' : 'Keep this off until you are ready to track customer credit.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Billing methods in use</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Keep this list simple so owners and staff can understand payment setup at a glance.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="slate">{paymentMethods.length} listed</StatusBadge>
                        <StatusBadge tone="blue">{paymentMethods.filter(method => method.isDefault).length > 0 ? 'Default ready' : 'Default missing'}</StatusBadge>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="hidden grid-cols-[1.3fr_0.9fr_0.85fr_0.8fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                      <p>Method</p>
                      <p>Type</p>
                      <p>Status</p>
                      <p>Default</p>
                      <p className="text-right">Actions</p>
                    </div>

                    <div className="hidden lg:block">
                      {paymentMethods.map(method => {
                        const Icon = PAYMENT_METHOD_ICON_BY_KEY[method.key] || CreditCard
                        const isSelected = activePaymentMethodKey === method.key

                        return (
                          <div
                            key={method.key}
                            className={`grid grid-cols-[1.3fr_0.9fr_0.85fr_0.8fr_auto] gap-4 border-b border-slate-100 px-5 py-4 transition last:border-b-0 ${isSelected ? 'bg-slate-50/80' : 'bg-white'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-2xl bg-slate-100 p-3">
                                <Icon className="h-4 w-4 text-slate-700" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{method.name}</p>
                                  {method.key === 'esewa' || method.key === 'khalti' ? <StatusBadge tone="sky">Nepal wallet</StatusBadge> : null}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-500">{method.description || 'No extra note added yet.'}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <StatusBadge tone={getPaymentMethodTone(method)}>{getPaymentMethodTypeLabel(method.type)}</StatusBadge>
                            </div>
                            <div className="flex items-center">
                              <StatusBadge tone={method.isActive ? 'emerald' : 'slate'}>{method.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                            </div>
                            <div className="flex items-center">
                              <StatusBadge tone={method.isDefault ? 'amber' : 'slate'}>{method.isDefault ? 'Default' : 'Standard'}</StatusBadge>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setActivePaymentMethodKey(method.key)}
                                className={isSelected ? 'btn-primary' : 'btn-secondary'}
                              >
                                {isSelected ? 'Editing' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePaymentMethodKey(method.key)
                                  handleTogglePaymentMethodStatus(method.key)
                                }}
                                disabled={!canUpdateSettings}
                                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {method.isActive ? 'Disable' : 'Enable'}
                              </button>
                              {!method.isDefault ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePaymentMethodKey(method.key)
                                    handleDefaultPaymentMethodChange(method.key, true)
                                  }}
                                  disabled={!canUpdateSettings}
                                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Make default
                                </button>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="grid gap-3 p-4 lg:hidden">
                      {paymentMethods.map(method => {
                        const Icon = PAYMENT_METHOD_ICON_BY_KEY[method.key] || CreditCard
                        const isSelected = activePaymentMethodKey === method.key

                        return (
                          <button
                            key={method.key}
                            type="button"
                            onClick={() => setActivePaymentMethodKey(method.key)}
                            className={`rounded-3xl border p-4 text-left transition ${isSelected ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-slate-100 p-3">
                                  <Icon className="h-4 w-4 text-slate-700" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900">{method.name}</p>
                                    <StatusBadge tone={method.isActive ? 'emerald' : 'slate'}>{method.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                                  </div>
                                  <p className="mt-2 text-sm text-slate-500">{method.description || 'No extra note added yet.'}</p>
                                </div>
                              </div>
                              {method.isDefault ? <StatusBadge tone="amber">Default</StatusBadge> : null}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <StatusBadge tone={getPaymentMethodTone(method)}>{getPaymentMethodTypeLabel(method.type)}</StatusBadge>
                              {method.key === 'esewa' || method.key === 'khalti' ? <StatusBadge tone="sky">Nepal wallet</StatusBadge> : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Custom methods later</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Keep launch simple with cash, eSewa, Khalti, bank transfer, and due. Extra methods can be added later when your billing workflow really needs them.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  {activePaymentMethod ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                          <ActivePaymentMethodIcon className="h-5 w-5 text-slate-700" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{activePaymentMethod.name}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              Update how this method appears to cashiers and owners during billing.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone={getPaymentMethodTone(activePaymentMethod)}>{getPaymentMethodTypeLabel(activePaymentMethod.type)}</StatusBadge>
                          <StatusBadge tone={activePaymentMethod.isDefault ? 'amber' : 'slate'}>
                            {activePaymentMethod.isDefault ? 'Default method' : 'Standard method'}
                          </StatusBadge>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div>
                          <FieldLabel>Method name</FieldLabel>
                          <input
                            value={activePaymentMethod.name}
                            onChange={event => handlePaymentMethodFieldChange(activePaymentMethod.key, 'name', event.target.value)}
                            disabled={!canUpdateSettings}
                            className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                            placeholder="Enter payment method name"
                          />
                        </div>

                        <div>
                          <FieldLabel>Type</FieldLabel>
                          <select
                            value={activePaymentMethod.type}
                            onChange={event => handlePaymentMethodFieldChange(activePaymentMethod.key, 'type', event.target.value)}
                            disabled={!canUpdateSettings}
                            className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {PAYMENT_METHOD_TYPE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <FieldLabel>Status</FieldLabel>
                            <select
                              value={activePaymentMethod.isActive ? 'active' : 'inactive'}
                              onChange={event => handlePaymentMethodFieldChange(activePaymentMethod.key, 'isActive', event.target.value === 'active')}
                              disabled={!canUpdateSettings}
                              className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>

                          <div>
                            <FieldLabel>Default billing method</FieldLabel>
                            <select
                              value={activePaymentMethod.isDefault ? 'default' : 'standard'}
                              onChange={event => handleDefaultPaymentMethodChange(activePaymentMethod.key, event.target.value === 'default')}
                              disabled={!canUpdateSettings}
                              className="input-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="standard">Standard method</option>
                              <option value="default">Default method</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <FieldLabel optional>Description</FieldLabel>
                          <textarea
                            value={activePaymentMethod.description}
                            onChange={event => handlePaymentMethodFieldChange(activePaymentMethod.key, 'description', event.target.value)}
                            disabled={!canUpdateSettings}
                            className="input-primary min-h-28 resize-y disabled:cursor-not-allowed disabled:opacity-60"
                            placeholder="Optional note for owners and staff"
                          />
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">Practical guidance</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Keep only the payment methods your staff really uses. Too many choices slow down billing and make training harder for small teams.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyCard
                      icon={CreditCard}
                      title="Select a payment method"
                      message="Choose a payment method from the list to review its status, default setting, and cashier-facing label."
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div id="users-roles">
        <SectionCard
          eyebrow="Staff Management"
          title="Manage staff, roles, and daily access clearly."
          description="Keep employee setup practical for shops, cafes, and restaurants. Add staff quickly, assign the right role, and review access without a heavy HR or admin workflow."
          action={
            canReadUsers ? (
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="blue">{members.length} staff</StatusBadge>
                <StatusBadge tone="slate">{roleCount} roles in use</StatusBadge>
              </div>
            ) : (
              <StatusBadge tone="amber">Restricted</StatusBadge>
            )
          }
        >
          {!canReadUsers ? (
            <EmptyCard
              icon={Shield}
              title="Staff access is restricted"
              message="You can review business settings, but only users with team access permission can see and manage staff here."
            />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total staff</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{members.length}</p>
                  <p className="mt-2 text-sm text-slate-600">Everyone added to this business workspace.</p>
                </div>
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Active staff</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-900">{activeStaffCount}</p>
                  <p className="mt-2 text-sm text-emerald-800">People who can currently use the software.</p>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Inactive staff</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-amber-900">{inactiveStaffCount}</p>
                  <p className="mt-2 text-sm text-amber-800">Kept on record but currently blocked from access.</p>
                </div>
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Role count</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-sky-900">{roleCount}</p>
                  <p className="mt-2 text-sm text-sky-800">Different staff roles active in your team today.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Role guide</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Review common staff roles here before you assign access to someone new.
                    </p>
                  </div>
                  <StatusBadge tone="slate">Module-based access</StatusBadge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {roleOverviewKeys.map(roleKey => (
                    <RoleOverviewCard
                      key={roleKey}
                      roleKey={roleKey}
                      memberCount={roleCounts[roleKey] || 0}
                      active={!activeMemberId && selectedRoleKey === roleKey}
                      onClick={() => openRolePreview(roleKey)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    {canInviteUsers ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMember(previous => !previous)
                          setSelectedRoleKey(newMember.role)
                          closeMemberEditor()
                        }}
                        className="btn-primary"
                      >
                        <Plus className="h-4 w-4" />
                        {showAddMember ? 'Hide form' : 'Add staff'}
                      </button>
                    ) : null}
                    <span className="text-sm text-slate-500">
                      Keep staffing simple: search quickly, filter by role or status, then review access before you save.
                    </span>
                  </div>

                  {showAddMember ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Add staff member</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Keep onboarding simple: basic details first, then choose role, status, and contact information.
                          </p>
                        </div>
                        <StatusBadge tone={getRoleMeta(newMember.role).tone}>{getRoleMeta(newMember.role).label}</StatusBadge>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Full name</FieldLabel>
                          <input
                            value={newMember.username}
                            onChange={event => setNewMember(previous => ({ ...previous, username: event.target.value }))}
                            className="input-primary"
                            placeholder="Sita Sharma"
                          />
                        </div>
                        <div>
                          <FieldLabel optional>Phone</FieldLabel>
                          <input
                            value={newMember.phone}
                            onChange={event => setNewMember(previous => ({ ...previous, phone: event.target.value }))}
                            className="input-primary"
                            placeholder={DEFAULT_PHONE_PLACEHOLDER}
                          />
                        </div>
                        <div>
                          <FieldLabel>Email</FieldLabel>
                          <input
                            value={newMember.email}
                            onChange={event => setNewMember(previous => ({ ...previous, email: event.target.value }))}
                            className="input-primary"
                            placeholder="sita@example.com"
                          />
                        </div>
                        <div>
                          <FieldLabel>Password (new users only)</FieldLabel>
                          <input
                            type="password"
                            value={newMember.password}
                            onChange={event => setNewMember(previous => ({ ...previous, password: event.target.value }))}
                            className="input-primary"
                            placeholder="Min 8 characters"
                          />
                        </div>
                        <div>
                          <FieldLabel>Role</FieldLabel>
                          <select
                            value={newMember.role}
                            onChange={event => {
                              setNewMember(previous => ({ ...previous, role: event.target.value }))
                              setSelectedRoleKey(event.target.value)
                            }}
                            className="input-primary"
                          >
                            {ASSIGNABLE_ROLE_OPTIONS.map(role => (
                              <option key={role} value={role}>
                                {getRoleMeta(role).label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Status</FieldLabel>
                          <select
                            value={newMember.isActive ? 'active' : 'inactive'}
                            onChange={event => setNewMember(previous => ({ ...previous, isActive: event.target.value === 'active' }))}
                            className="input-primary"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        {branches.length > 1 ? (
                          <div>
                            <FieldLabel>Branch</FieldLabel>
                            <select
                              value={newMember.branchId}
                              onChange={event => setNewMember(previous => ({ ...previous, branchId: event.target.value }))}
                              className="input-primary"
                            >
                              <option value="">Primary branch</option>
                              {branches.map(branch => (
                                <option key={branch._id} value={branch._id}>
                                  {branch.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                        <div className={branches.length > 1 ? 'sm:col-span-2' : 'sm:col-span-2'}>
                          <FieldLabel optional>Notes</FieldLabel>
                          <textarea
                            value={newMember.notes}
                            onChange={event => setNewMember(previous => ({ ...previous, notes: event.target.value }))}
                            className="input-primary min-h-28 resize-y"
                            placeholder="Short reminder about duty, shift, or hiring note"
                          />
                        </div>
                      </div>

                      <div className={`mt-4 rounded-3xl border p-4 ${ROLE_SURFACE_CLASSES[getRoleMeta(newMember.role).tone] || ROLE_SURFACE_CLASSES.slate}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Selected role access</p>
                            <p className="mt-1 text-sm text-slate-600">{getRoleMeta(newMember.role).summary}</p>
                          </div>
                          <StatusBadge tone={getRoleMeta(newMember.role).tone}>{getRoleMeta(newMember.role).label}</StatusBadge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {getRoleHighlights(newMember.role, 4).map(module => (
                            <StatusBadge key={`new-member-${module.key}`} tone="slate">
                              {module.label}
                            </StatusBadge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={addingMember}
                          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {addingMember ? 'Adding...' : 'Add staff'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddMember(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Staff list</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Search by name, phone, or email, then review one staff member at a time before you change access.
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3 md:items-end">
                        <div>
                          <FieldLabel>Search team</FieldLabel>
                          <SearchField
                            value={memberSearch}
                            onChange={event => setMemberSearch(event.target.value)}
                            placeholder="Search by name, phone, or email..."
                          />
                        </div>
                        <div>
                          <FieldLabel>Filter by role</FieldLabel>
                          <select
                            value={memberRoleFilter}
                            onChange={event => setMemberRoleFilter(event.target.value)}
                            className="input-primary"
                          >
                            <option value="all">All roles</option>
                            {roleOverviewKeys.map(role => (
                              <option key={role} value={role}>
                                {getRoleMeta(role).label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Filter by status</FieldLabel>
                          <select
                            value={memberStatusFilter}
                            onChange={event => setMemberStatusFilter(event.target.value)}
                            className="input-primary"
                          >
                            {STAFF_STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      {members.length === 0 ? (
                        <EmptyCard
                          icon={Users}
                          title="No staff added yet"
                          message="Add the people who handle sales, billing, kitchen, or daily management so staffing stays clear from the beginning."
                          action={
                            canInviteUsers ? (
                              <button type="button" onClick={() => setShowAddMember(true)} className="btn-primary">
                                <Plus className="h-4 w-4" />
                                Add first staff
                              </button>
                            ) : null
                          }
                        />
                      ) : filteredMembers.length === 0 ? (
                        <EmptyCard
                          icon={Users}
                          title="No staff match these filters"
                          message="Try a different name search or clear the role or status filters to see your team again."
                        />
                      ) : (
                        <>
                          <div className="space-y-3 md:hidden">
                            {filteredMembers.map(member => {
                              const roleMeta = getRoleMeta(member.role)

                              return (
                                <div
                                  key={member._id}
                                  className={`rounded-3xl border p-5 ${activeMemberId === member._id ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{member.username}</p>
                                        <StatusBadge tone={roleMeta.tone}>{roleMeta.label}</StatusBadge>
                                        <StatusBadge tone={member.isActive === false ? 'amber' : 'emerald'}>
                                          {member.isActive === false ? 'Inactive' : 'Active'}
                                        </StatusBadge>
                                      </div>
                                      <p className="mt-2 text-sm text-slate-500">{member.phone || member.email}</p>
                                      <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {member.branchName || 'Primary branch'} and {roleMeta.summary}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                                      <p className="mt-1 text-sm font-semibold text-slate-900">{member.phone || 'No phone added'}</p>
                                      <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</p>
                                      <p className="mt-1 text-sm font-semibold text-slate-900">{member.branchName || 'Primary branch'}</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Added {new Intl.DateTimeFormat('en-NP', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(member.createdAt))}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openRolePreview(member.role)}
                                      className="btn-secondary"
                                    >
                                      View role
                                    </button>
                                    {canUpdateUsers && member.role !== 'owner' ? (
                                      <button
                                        type="button"
                                        onClick={() => openMemberEditor(member)}
                                        className={activeMemberId === member._id ? 'btn-primary' : 'btn-secondary'}
                                      >
                                        {activeMemberId === member._id ? 'Editing staff' : 'Edit staff'}
                                      </button>
                                    ) : (
                                      <StatusBadge tone="slate">{member.role === 'owner' ? 'Owner fixed' : 'Read only'}</StatusBadge>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <DataTableShell className="hidden md:block">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Contact</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Branch</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredMembers.map(member => {
                                  const roleMeta = getRoleMeta(member.role)

                                  return (
                                    <tr
                                      key={member._id}
                                      className={activeMemberId === member._id ? 'bg-emerald-50/60' : ''}
                                    >
                                      <td className="px-4 py-4">
                                        <p className="font-semibold text-slate-900">{member.username}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                          Added {new Intl.DateTimeFormat('en-NP', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(member.createdAt))}
                                        </p>
                                      </td>
                                      <td className="px-4 py-4">
                                        <StatusBadge tone={roleMeta.tone}>{roleMeta.label}</StatusBadge>
                                      </td>
                                      <td className="px-4 py-4 text-slate-600">
                                        <p>{member.phone || 'No phone added'}</p>
                                        <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                                      </td>
                                      <td className="px-4 py-4 text-slate-600">{member.branchName || 'Primary branch'}</td>
                                      <td className="px-4 py-4">
                                        <StatusBadge tone={member.isActive === false ? 'amber' : 'emerald'}>
                                          {member.isActive === false ? 'Inactive' : 'Active'}
                                        </StatusBadge>
                                      </td>
                                      <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => openRolePreview(member.role)}
                                            className="btn-secondary"
                                          >
                                            View role
                                          </button>
                                          {canUpdateUsers && member.role !== 'owner' ? (
                                            <button
                                              type="button"
                                              onClick={() => openMemberEditor(member)}
                                              className={activeMemberId === member._id ? 'btn-primary' : 'btn-secondary'}
                                            >
                                              {activeMemberId === member._id ? 'Editing staff' : 'Edit staff'}
                                            </button>
                                          ) : (
                                            <StatusBadge tone="slate">{member.role === 'owner' ? 'Owner fixed' : 'Read only'}</StatusBadge>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </DataTableShell>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 xl:sticky xl:top-24">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="section-kicker">{activeMember ? 'Staff Details' : 'Role Guide'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {activeMember ? activeMember.username : activeRoleMeta.label}
                      </h3>
                      <StatusBadge tone={activeRoleMeta.tone}>{activeRoleMeta.label}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {activeMember ? 'Review the role and branch here before you save access changes.' : activeRoleMeta.audience}
                    </p>

                    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Basic info
                      </p>
                      {activeMember ? (
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <p>
                            <span className="font-semibold text-slate-900">Full name:</span> {activeMember.username}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Email:</span> {activeMember.email}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Phone:</span> {activeMember.phone || 'Not added yet'}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Current branch:</span>{' '}
                            {activeMember.branchName || 'Primary branch'}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Current role:</span> {getRoleMeta(activeMember.role).label}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Status:</span> {activeMember.isActive === false ? 'Inactive' : 'Active'}
                          </p>
                          {activeMember.notes ? (
                            <p>
                              <span className="font-semibold text-slate-900">Notes:</span> {activeMember.notes}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <p>{activeRoleMeta.summary}</p>
                          <p>
                            <span className="font-semibold text-slate-900">In use now:</span>{' '}
                            {roleCounts[activeRoleKey] || 0} user{roleCounts[activeRoleKey] === 1 ? '' : 's'}
                          </p>
                        </div>
                      )}
                    </div>

                    {activeMember ? (
                      canUpdateUsers && activeMember.role !== 'owner' ? (
                        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Edit staff
                          </p>
                          <div className="mt-4 grid gap-3">
                            <div>
                              <FieldLabel>Full name</FieldLabel>
                              <input
                                value={activeMember.username}
                                readOnly
                                className="input-primary cursor-not-allowed opacity-60"
                              />
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Staff name currently follows the existing account username setup.
                              </p>
                            </div>
                            <div>
                              <FieldLabel>Email</FieldLabel>
                              <input
                                value={activeMember.email}
                                readOnly
                                className="input-primary cursor-not-allowed opacity-60"
                              />
                            </div>
                            <div>
                              <FieldLabel optional>Phone</FieldLabel>
                              <input
                                value={memberDraft.phone}
                                onChange={event => setMemberDraft(previous => ({ ...previous, phone: event.target.value }))}
                                className="input-primary"
                                placeholder={DEFAULT_PHONE_PLACEHOLDER}
                              />
                            </div>
                            <div>
                              <FieldLabel>Role</FieldLabel>
                              <select
                                value={memberDraft.role}
                                onChange={event => setMemberDraft(previous => ({ ...previous, role: event.target.value }))}
                                className="input-primary"
                              >
                                {ASSIGNABLE_ROLE_OPTIONS.map(role => (
                                  <option key={role} value={role}>
                                    {getRoleMeta(role).label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <FieldLabel>Status</FieldLabel>
                              <select
                                value={memberDraft.isActive ? 'active' : 'inactive'}
                                onChange={event => setMemberDraft(previous => ({ ...previous, isActive: event.target.value === 'active' }))}
                                className="input-primary"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                            {branches.length > 1 ? (
                              <div>
                                <FieldLabel>Branch</FieldLabel>
                                <select
                                  value={memberDraft.branchId}
                                  onChange={event => setMemberDraft(previous => ({ ...previous, branchId: event.target.value }))}
                                  className="input-primary"
                                >
                                  <option value="">Primary branch</option>
                                  {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>
                                      {branch.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : null}
                            <div>
                              <FieldLabel optional>Notes</FieldLabel>
                              <textarea
                                value={memberDraft.notes}
                                onChange={event => setMemberDraft(previous => ({ ...previous, notes: event.target.value }))}
                                className="input-primary min-h-28 resize-y"
                                placeholder="Short note about duty, shift, or internal reminder"
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={handleSaveMemberAccess}
                              disabled={!memberEditDirty || savingMemberId === activeMemberId}
                              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingMemberId === activeMemberId ? 'Saving access...' : 'Save access'}
                            </button>
                            <button
                              type="button"
                              onClick={closeMemberEditor}
                              className="btn-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">Access editing is limited</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {activeMember.role === 'owner'
                              ? 'Owner access stays fixed here for safety.'
                              : 'Only users with update permission can change team access.'}
                          </p>
                        </div>
                      )
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {activeRoleHighlights.map(module => (
                        <StatusBadge key={`active-role-${module.key}`} tone="slate">
                          {module.label}
                        </StatusBadge>
                      ))}
                    </div>

                    <div className="mt-5 space-y-3">
                      <p className="text-sm font-semibold text-slate-900">Module access</p>
                      {activeRoleAccess.map(access => (
                        <div
                          key={`${activeRoleKey}-${access.key}`}
                          className={`rounded-3xl border px-4 py-4 ${ACCESS_SURFACE_CLASSES[access.accessLevel] || ACCESS_SURFACE_CLASSES.none}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{access.label}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{access.description}</p>
                            </div>
                            <AccessPill access={access} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">Included actions</p>
                      <ul className="mt-3 space-y-2">
                        {activeRoleMeta.includedActions.map(action => (
                          <li key={action} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">Safety note</p>
                      <p className="mt-2 text-sm leading-6 text-amber-800">{activeRoleMeta.caution}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div id="security-access">
        <SectionCard
          eyebrow="Security / Access"
          title="Keep access safer without turning settings into a technical maze."
          description="This view focuses on the practical controls already active today, and keeps deeper security tools clearly marked for later."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Role-based access</p>
                <StatusBadge tone="emerald">Active</StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Owners and admins can manage settings, while staff roles stay focused on the work they actually do.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Branch access</p>
                <StatusBadge tone={branches.length > 1 || branchAssignedMembers > 0 ? 'teal' : 'slate'}>
                  {branches.length > 1 || branchAssignedMembers > 0 ? 'In use' : 'Ready later'}
                </StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Assigning staff to branches keeps multi-outlet operations cleaner as your business expands.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Advanced security</p>
                <StatusBadge tone="amber">Coming soon</StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Device approval, password policy, and login history will live here later when you need stricter controls.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
      <div id="branches">
        <SectionCard
          eyebrow="Branches"
          title="Keep branch setup available, but out of the way until you need it."
          description="This section is useful for growing shops, cafes, and restaurants. It stays lighter so single-branch businesses are not overwhelmed."
          action={<StatusBadge tone="slate">{planLabel}</StatusBadge>}
        >
          {!canReadSettings ? (
            <EmptyCard
              icon={GitBranch}
              title="Branch setup is restricted"
              message="Only users with branch settings access can review or add branches in this workspace."
            />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                {canUpdateSettings ? (
                  <button
                    type="button"
                    onClick={() => setShowAddBranch(previous => !previous)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                    {showAddBranch ? 'Hide form' : 'Add branch'}
                  </button>
                ) : null}
                <span className="text-sm text-slate-500">
                  Your current plan decides how many branches you can add, and the system will guide the limits when you save.
                </span>
              </div>

              {showAddBranch ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">New branch</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Branch name</FieldLabel>
                      <input
                        value={newBranch.name}
                        onChange={event => setNewBranch(previous => ({ ...previous, name: event.target.value }))}
                        className="input-primary"
                        placeholder="Pokhara Branch"
                      />
                    </div>
                    <div>
                      <FieldLabel>Code</FieldLabel>
                      <input
                        value={newBranch.code}
                        onChange={event => setNewBranch(previous => ({ ...previous, code: event.target.value.toUpperCase() }))}
                        className="input-primary"
                        placeholder="PKR01"
                      />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <input
                        value={newBranch.email}
                        onChange={event => setNewBranch(previous => ({ ...previous, email: event.target.value }))}
                        className="input-primary"
                        placeholder="branch@example.com"
                      />
                    </div>
                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <input
                        value={newBranch.phone}
                        onChange={event => setNewBranch(previous => ({ ...previous, phone: event.target.value }))}
                        className="input-primary"
                        placeholder={DEFAULT_PHONE_PLACEHOLDER}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCreateBranch}
                      disabled={addingBranch}
                      className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingBranch ? 'Creating...' : 'Create branch'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddBranch(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {branches.length === 0 ? (
                <EmptyCard
                  icon={GitBranch}
                  title="No branches yet"
                  message="Single-location businesses can safely ignore this. Add a branch later when you open another outlet."
                  action={
                    canUpdateSettings ? (
                      <button type="button" onClick={() => setShowAddBranch(true)} className="btn-primary">
                        <Plus className="h-4 w-4" />
                        Add first branch
                      </button>
                    ) : null
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {branches.map(branch => (
                    <div key={branch._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{branch.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{branch.code || 'Code will be auto-created'}</p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {branch.isPrimary ? <StatusBadge tone="blue">Primary</StatusBadge> : null}
                          <StatusBadge tone={branch.isActive === false ? 'amber' : 'emerald'}>
                            {branch.isActive === false ? 'Inactive' : 'Active'}
                          </StatusBadge>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>{branch.phone || 'No phone added'}</p>
                        <p>{branch.email || 'No email added'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div id="advanced-settings">
        <SectionCard
          eyebrow="Advanced Settings Later"
          title="Keep deeper controls available without making today's setup feel heavy."
          description="Module controls, printer profiles, and deeper workflow settings will live here later as the software grows."
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Active modules in this workspace</p>
                <StatusBadge tone="blue">{moduleCount} active</StatusBadge>
              </div>
              {organizationMeta.enabledModules.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {organizationMeta.enabledModules.map(module => (
                    <span key={module} className="status-pill">
                      {module}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No module list is available for this workspace yet.</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Receipt printers</p>
                  <StatusBadge tone="amber">Later</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add thermal printer profiles, counter printer selection, and receipt footer options here later.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Module controls</p>
                  <StatusBadge tone="amber">Later</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Turn modules on or off only when you need that flexibility, so the main settings view stays easy to manage.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </WorkspacePage>
  )
}

export default SettingsPage
