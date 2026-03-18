import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Building2,
  Check,
  CircleCheckBig,
  CreditCard,
  Eye,
  EyeOff,
  Package,
  Receipt,
  ShieldCheck,
  Smartphone,
  Store,
  Table2,
  TrendingUp,
} from 'lucide-react'
import AppContext from '../../context/app-context.js'
import { softwareBySlug, softwareCatalog } from '../../data/softwareCatalog.js'
import api from '../../lib/api.js'
import { DEFAULT_PHONE_PLACEHOLDER, POS_PAYMENT_METHODS, TAX_REGISTRATION_LABEL } from '../../utils/nepal.js'

const DEFAULT_SOFTWARE = softwareCatalog[0]?.slug || 'restaurant'

const SIGNUP_STEPS = [
  { id: 'business-type', label: 'Business', title: 'Choose your business type', description: 'Pick the setup that matches how you sell every day.' },
  { id: 'business-profile', label: 'Profile', title: 'Business profile', description: 'Add the owner, business, and main branch basics.' },
  { id: 'billing-tax', label: 'Billing', title: 'Billing and tax', description: 'Keep billing simple, NPR-ready, and clear for Nepal businesses.' },
  { id: 'payment-methods', label: 'Payments', title: 'Payment methods', description: 'Choose how you expect to collect money on the first day.' },
  { id: 'starter-items', label: 'Items', title: 'First products or menu', description: 'Add a few starter items now, or skip and do it later.' },
  { id: 'review-start', label: 'Start', title: 'Review and start', description: 'Confirm the setup, create the business account, and open the dashboard.' },
]

const TRUST_POINTS = [
  { icon: Receipt, title: 'VAT-friendly billing', detail: 'Keep receipts, bills, and daily checkout practical for Nepal business use.' },
  { icon: Package, title: 'Inventory and buying', detail: 'Track products, low stock, and purchases from one connected system.' },
  { icon: TrendingUp, title: 'Daily reports', detail: 'See sales, expenses, dues, and daily performance without technical screens.' },
  { icon: Table2, title: 'Restaurant tables', detail: 'For restaurants, tables, orders, and billing stay in one service flow.' },
]

const PAYMENT_METHOD_OPTIONS = POS_PAYMENT_METHODS.filter(method => !['credit', 'mixed'].includes(method.key))

const STARTER_TEMPLATES = {
  restaurant: [
    { name: 'Veg Momo', category: 'Momo', sellingPrice: '180' },
    { name: 'Chicken Chowmein', category: 'Noodles', sellingPrice: '220' },
    { name: 'Milk Tea', category: 'Beverages', sellingPrice: '35' },
  ],
  cafe: [
    { name: 'Cappuccino', category: 'Coffee', sellingPrice: '220' },
    { name: 'Cold Coffee', category: 'Beverages', sellingPrice: '260' },
    { name: 'Club Sandwich', category: 'Snacks', sellingPrice: '240' },
  ],
  shop: [
    { name: 'Mineral Water 1L', category: 'Beverages', sellingPrice: '30', stockQty: '48' },
    { name: 'Wai Wai Noodles', category: 'Food', sellingPrice: '25', stockQty: '120' },
    { name: 'Dettol Soap', category: 'Personal Care', sellingPrice: '55', stockQty: '40' },
  ],
}

const INVOICE_PREFIX_BY_BUSINESS = {
  restaurant: 'RES',
  cafe: 'CAF',
  shop: 'SHP',
}

const fieldClassName =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60'

const panelCardClassName = 'rounded-3xl border border-slate-200 bg-slate-50 p-5'

const createItemId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const getModeFromSearch = (search) => (new URLSearchParams(search).get('mode') === 'signup' ? 'signup' : 'login')
const getDefaultPlan = (product) => product?.licenseOptions.find((option) => option.recommended) || product?.licenseOptions[0]
const getSuggestedInvoicePrefix = (businessType) => INVOICE_PREFIX_BY_BUSINESS[businessType] || 'INV'

const getDefaultPaymentMethods = (businessType) => {
  if (businessType === 'shop') return ['cash', 'esewa', 'bank_transfer']
  if (businessType === 'cafe') return ['cash', 'esewa', 'card']
  return ['cash', 'esewa', 'khalti']
}

const createStarterItem = (businessType, seed = {}) => ({
  id: createItemId(),
  name: seed.name || '',
  category: seed.category || '',
  sellingPrice: seed.sellingPrice || '',
  stockQty: businessType === 'shop' ? seed.stockQty || '' : '',
})

const buildSuggestedStarterItems = (businessType) => (STARTER_TEMPLATES[businessType] || []).map((item) => createStarterItem(businessType, item))
const buildBlankStarterItems = (businessType) => [createStarterItem(businessType), createStarterItem(businessType)]

const createInitialForm = (businessType = DEFAULT_SOFTWARE, planKey = null) => {
  const product = softwareBySlug[businessType] || softwareBySlug[DEFAULT_SOFTWARE]
  const defaultPlan = getDefaultPlan(product)

  return {
    username: '',
    email: '',
    password: '',
    orgName: '',
    branchName: '',
    phone: '',
    city: '',
    businessType,
    softwarePlan: planKey || defaultPlan?.planKey || 'single-branch',
    vatMode: 'not_registered',
    gstin: '',
    invoicePrefix: getSuggestedInvoicePrefix(businessType),
    paymentMethods: getDefaultPaymentMethods(businessType),
    starterMode: 'skip',
    starterItems: [],
  }
}

const Login = () => {
  const { setIsLoggedin, getUserData, setCurrentOrgId, setCurrentOrgName } = useContext(AppContext)
  const location = useLocation()
  const navigate = useNavigate()

  const [authMode, setAuthMode] = useState('login')
  const [signupStep, setSignupStep] = useState(0)
  const [formData, setFormData] = useState(createInitialForm())
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const redirectTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
    : '/dashboard'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const requestedMode = getModeFromSearch(location.search)
    const requestedSoftware = softwareBySlug[params.get('software')] ? params.get('software') : DEFAULT_SOFTWARE
    const product = softwareBySlug[requestedSoftware]
    const requestedPlan = product?.licenseOptions.some((option) => option.planKey === params.get('plan'))
      ? params.get('plan')
      : getDefaultPlan(product)?.planKey || 'single-branch'

    setAuthMode(requestedMode)
    setSignupStep(0)
    setShowPassword(false)
    setSubmitError('')
    setFormData((previous) => ({
      ...createInitialForm(requestedSoftware, requestedPlan),
      username: previous.username,
      email: previous.email,
      password: previous.password,
      orgName: previous.orgName,
      branchName: previous.branchName,
      phone: previous.phone,
      city: previous.city,
      gstin: previous.gstin,
    }))
  }, [location.search])

  const isSignup = authMode === 'signup'
  const selectedProduct = softwareBySlug[formData.businessType] || softwareBySlug[DEFAULT_SOFTWARE]
  const selectedPlan = selectedProduct?.licenseOptions.find((option) => option.planKey === formData.softwarePlan) || getDefaultPlan(selectedProduct)
  const ProductIcon = selectedProduct?.icon || Store
  const activeSignupStep = SIGNUP_STEPS[signupStep]
  const progressPercent = ((signupStep + 1) / SIGNUP_STEPS.length) * 100

  const normalizedStarterItems = formData.starterMode === 'skip'
    ? []
    : formData.starterItems
        .filter((item) => [item.name, item.category, item.sellingPrice, item.stockQty].some((value) => String(value || '').trim() !== ''))
        .map((item) => ({
          ...item,
          name: item.name.trim(),
          category: item.category.trim(),
          sellingPrice: item.sellingPrice,
          stockQty: item.stockQty,
        }))

  const paymentMethodLabels = formData.paymentMethods
    .map((key) => PAYMENT_METHOD_OPTIONS.find((option) => option.key === key)?.label)
    .filter(Boolean)

  const handleChange = (event) => {
    const { name, value } = event.target
    setSubmitError('')
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSoftwareChange = (slug) => {
    const product = softwareBySlug[slug]
    const defaultPlan = getDefaultPlan(product)

    setSubmitError('')
    setFormData((previous) => ({
      ...previous,
      businessType: slug,
      softwarePlan: defaultPlan?.planKey || 'single-branch',
      invoicePrefix: getSuggestedInvoicePrefix(slug),
      paymentMethods: getDefaultPaymentMethods(slug),
      starterItems:
        previous.starterMode === 'skip'
          ? []
          : previous.starterMode === 'suggested'
            ? buildSuggestedStarterItems(slug)
            : buildBlankStarterItems(slug),
    }))
  }

  const handleModeToggle = () => {
    setAuthMode((current) => (current === 'signup' ? 'login' : 'signup'))
    setSignupStep(0)
    setShowPassword(false)
    setSubmitError('')
  }

  const handlePaymentToggle = (key) => {
    setSubmitError('')
    setFormData((previous) => ({
      ...previous,
      paymentMethods: previous.paymentMethods.includes(key)
        ? previous.paymentMethods.filter((item) => item !== key)
        : [...previous.paymentMethods, key],
    }))
  }

  const handleStarterModeChange = (mode) => {
    setSubmitError('')
    setFormData((previous) => ({
      ...previous,
      starterMode: mode,
      starterItems:
        mode === 'skip'
          ? []
          : mode === 'suggested'
            ? buildSuggestedStarterItems(previous.businessType)
            : buildBlankStarterItems(previous.businessType),
    }))
  }

  const handleStarterItemChange = (id, field, value) => {
    setSubmitError('')
    setFormData((previous) => ({
      ...previous,
      starterItems: previous.starterItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }))
  }

  const handleAddStarterItem = () => {
    setFormData((previous) => ({
      ...previous,
      starterItems: [...previous.starterItems, createStarterItem(previous.businessType)],
    }))
  }

  const handleRemoveStarterItem = (id) => {
    setFormData((previous) => ({
      ...previous,
      starterItems: previous.starterItems.filter((item) => item.id !== id),
    }))
  }

  const validateLogin = () => {
    if (!formData.email.trim()) return 'Enter the email address linked to your business account'
    if (!formData.password) return 'Enter your password'
    return ''
  }

  const validateSignupStep = (stepIndex) => {
    if (stepIndex === 0) {
      if (!formData.businessType) return 'Choose the business type that matches your software'
      if (!formData.softwarePlan) return 'Choose a package to continue'
    }

    if (stepIndex === 1) {
      if (!formData.username.trim()) return 'Enter the owner or admin name'
      if (!formData.orgName.trim()) return 'Enter the business name'
      if (!formData.branchName.trim()) return 'Enter the main branch name'
      if (!formData.email.trim()) return 'Enter the business email address'
      if (!formData.password) return 'Create a password for the owner account'
      if (formData.password.length < 8) return 'Use at least 8 characters for the owner password'
    }

    if (stepIndex === 2) {
      if (formData.vatMode === 'registered' && !formData.gstin.trim()) {
        return `Add your ${TAX_REGISTRATION_LABEL} number or choose "Not registered yet"`
      }
      if (!formData.invoicePrefix.trim()) return 'Enter a short invoice prefix for billing'
    }

    if (stepIndex === 3) {
      if (formData.paymentMethods.length === 0) {
        return 'Choose at least one payment method to start with'
      }
    }

    if (stepIndex === 4) {
      const hasInvalidItem = normalizedStarterItems.some((item) => !item.name || item.sellingPrice === '')
      if (hasInvalidItem) return 'Each starter item needs at least a name and selling price'

      const hasNegativePrice = normalizedStarterItems.some((item) => Number(item.sellingPrice) < 0)
      if (hasNegativePrice) return 'Starter item prices must be 0 or more'

      const hasNegativeStock =
        formData.businessType === 'shop' &&
        normalizedStarterItems.some((item) => String(item.stockQty || '').trim() !== '' && Number(item.stockQty) < 0)
      if (hasNegativeStock) return 'Opening stock cannot be negative'
    }

    return ''
  }

  const handleContinue = () => {
    const validationMessage = validateSignupStep(signupStep)
    if (validationMessage) {
      setSubmitError(validationMessage)
      toast.error(validationMessage)
      return
    }

    setSubmitError('')
    setSignupStep((previous) => Math.min(previous + 1, SIGNUP_STEPS.length - 1))
  }

  const handleBack = () => {
    setSubmitError('')
    setSignupStep((previous) => Math.max(previous - 1, 0))
  }

  const buildOrgSetupPayload = () => ({
    phone: formData.phone.trim(),
    email: formData.email.trim(),
    gstin: formData.vatMode === 'registered' ? formData.gstin.trim().toUpperCase() : '',
    currency: 'NPR',
    invoicePrefix: formData.invoicePrefix.trim().toUpperCase() || getSuggestedInvoicePrefix(formData.businessType),
    businessType: formData.businessType,
    address: {
      street: '',
      city: formData.city.trim(),
      state: '',
      pincode: '',
      country: 'Nepal',
    },
  })

  const buildStarterProducts = () =>
    normalizedStarterItems.map((item) => ({
      name: item.name,
      category: item.category || (formData.businessType === 'shop' ? 'General' : 'Menu'),
      type: formData.businessType === 'shop' ? 'stock' : 'service',
      costPrice: 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      stockQty: formData.businessType === 'shop' ? Number(item.stockQty) || 0 : 0,
      trackStock: formData.businessType === 'shop',
      taxRate: formData.vatMode === 'registered' ? 13 : 0,
      isAvailable: true,
      isActive: true,
    }))

  const submitAuth = async () => {
    if (isSignup) {
      for (let index = 0; index < SIGNUP_STEPS.length - 1; index += 1) {
        const validationMessage = validateSignupStep(index)
        if (validationMessage) {
          setSignupStep(index)
          setSubmitError(validationMessage)
          toast.error(validationMessage)
          return
        }
      }
    } else {
      const validationMessage = validateLogin()
      if (validationMessage) {
        setSubmitError(validationMessage)
        toast.error(validationMessage)
        return
      }
    }

    setLoading(true)
    setSubmitError('')

    try {
      const endpoint = isSignup ? '/auth/register' : '/auth/login'
      const payload = isSignup
        ? {
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
            orgName: formData.orgName.trim(),
            branchName: formData.branchName.trim(),
            businessType: formData.businessType,
            softwarePlan: formData.softwarePlan,
          }
        : {
            email: formData.email.trim(),
            password: formData.password,
          }

      const { data } = await api.post(endpoint, payload)

      if (!data.success) {
        const message = data.message || 'Request failed'
        setSubmitError(message)
        toast.error(message)
        setIsLoggedin(false)
        setCurrentOrgId(null)
        setCurrentOrgName(null)
        return
      }

      setIsLoggedin(true)
      setCurrentOrgId(data.data?.orgId || null)
      setCurrentOrgName(data.data?.orgName || null)

      if (isSignup) {
        const setupCalls = [
          api.put('/org/', buildOrgSetupPayload()),
          ...buildStarterProducts().map((product) => api.post('/pos/products', product)),
        ]

        const results = await Promise.allSettled(setupCalls)
        const failedSetupCount = results.filter((result) => result.status === 'rejected').length

        await getUserData()
        toast.success(
          failedSetupCount === 0
            ? 'Business setup created'
            : 'Business account created. Finish the remaining setup from the dashboard.'
        )
        navigate('/dashboard', { replace: true })
        return
      }

      await getUserData()
      toast.success('Login successful')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error.response?.data?.message || 'Request failed'
      setSubmitError(message)
      toast.error(message)
      setIsLoggedin(false)
      setCurrentOrgId(null)
      setCurrentOrgName(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault()

    if (isSignup && signupStep < SIGNUP_STEPS.length - 1) {
      handleContinue()
      return
    }

    await submitAuth()
  }

  const renderSignupStep = () => {
    if (signupStep === 0) {
      return (
        <div className="space-y-6">
          <div className={panelCardClassName}>
            <p className="text-sm font-semibold text-slate-900">Choose business type</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {softwareCatalog.map((product) => {
                const SoftwareIcon = product.icon
                const isActive = formData.businessType === product.slug

                return (
                  <button
                    key={product.slug}
                    type="button"
                    onClick={() => handleSoftwareChange(product.slug)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      isActive ? `${product.border} ${product.surface} shadow-sm ring-2 ring-slate-200` : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${product.surface}`}>
                        <SoftwareIcon className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{product.shortName}</p>
                        <p className="mt-1 text-xs text-slate-500">{product.badge}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{product.audience}</p>
                  </button>
                )
              })}

              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-left opacity-80">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                    <Building2 className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Hotel</p>
                    <p className="mt-1 text-xs text-slate-500">Coming later</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">Hotel setup will be added later with room, booking, and front-desk flow.</p>
              </div>
            </div>
          </div>

          <div className={panelCardClassName}>
            <p className="text-sm font-semibold text-slate-900">Choose package / setup</p>
            <p className="mt-1 text-sm text-slate-500">Keep this matched to how much control you need on day one.</p>
            <div className="mt-4 grid gap-3">
              {selectedProduct?.licenseOptions.map((option) => (
                <button
                  key={option.planKey}
                  type="button"
                  onClick={() => {
                    setSubmitError('')
                    setFormData((previous) => ({ ...previous, softwarePlan: option.planKey }))
                  }}
                  className={`rounded-3xl border p-4 text-left transition ${
                    formData.softwarePlan === option.planKey
                      ? `${selectedProduct.border} ${selectedProduct.surface} shadow-sm`
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{option.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{option.note}</p>
                    </div>
                    {option.recommended ? (
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${selectedProduct.soft}`}>
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {option.points.map((point) => (
                      <span key={point} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {point}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (signupStep === 1) {
      return (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Owner name</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className={fieldClassName} placeholder="Owner or admin name" autoComplete="name" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Business email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={fieldClassName} placeholder="owner@business.com" autoComplete="email" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Owner password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className={`${fieldClassName} pr-14`} placeholder="Use 8+ characters, Aa1" autoComplete="new-password" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Use 8+ characters with uppercase, lowercase, and a number.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Business name</label>
              <input type="text" name="orgName" value={formData.orgName} onChange={handleChange} className={fieldClassName} placeholder="Business or company name" autoComplete="organization" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Main branch name</label>
              <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} className={fieldClassName} placeholder="Main branch or head office" required />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={fieldClassName} placeholder={DEFAULT_PHONE_PLACEHOLDER} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">City / municipality</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className={fieldClassName} placeholder="Kathmandu, Pokhara, Butwal" />
            </div>
          </div>
        </div>
      )
    }

    if (signupStep === 2) {
      return (
        <div className="space-y-6">
          <div className={panelCardClassName}>
            <p className="text-sm font-semibold text-slate-900">Billing identity</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Currency</p>
                <p className="mt-2 text-base font-semibold text-emerald-900">NPR</p>
                <p className="mt-1 text-sm text-emerald-800">Nepali Rupee is the default billing currency for this setup.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Invoice prefix</label>
                <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={(event) => handleChange({ target: { name: 'invoicePrefix', value: event.target.value.toUpperCase() } })} className={fieldClassName} placeholder="INV" maxLength={6} />
                <p className="mt-2 text-xs leading-5 text-slate-500">Short prefixes like `SHP`, `CAF`, or `RES` keep bills easy to read.</p>
              </div>
            </div>
          </div>

          <div className={panelCardClassName}>
            <p className="text-sm font-semibold text-slate-900">{TAX_REGISTRATION_LABEL} setup</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => setFormData((previous) => ({ ...previous, vatMode: 'not_registered', gstin: '' }))} className={`rounded-3xl border p-4 text-left transition ${formData.vatMode === 'not_registered' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className="text-sm font-semibold">Not registered yet</p>
                <p className={`mt-2 text-sm leading-6 ${formData.vatMode === 'not_registered' ? 'text-slate-200' : 'text-slate-500'}`}>Keep setup simple for now. You can add the number later from settings.</p>
              </button>
              <button type="button" onClick={() => setFormData((previous) => ({ ...previous, vatMode: 'registered' }))} className={`rounded-3xl border p-4 text-left transition ${formData.vatMode === 'registered' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className="text-sm font-semibold">{TAX_REGISTRATION_LABEL} registered</p>
                <p className={`mt-2 text-sm leading-6 ${formData.vatMode === 'registered' ? 'text-slate-200' : 'text-slate-500'}`}>Save the number now so billing can be ready from the start.</p>
              </button>
            </div>

            {formData.vatMode === 'registered' ? (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">{TAX_REGISTRATION_LABEL} number</label>
                <input type="text" name="gstin" value={formData.gstin} onChange={(event) => handleChange({ target: { name: 'gstin', value: event.target.value.toUpperCase() } })} className={fieldClassName} placeholder={`Enter ${TAX_REGISTRATION_LABEL} number`} />
              </div>
            ) : null}
          </div>
        </div>
      )
    }

    if (signupStep === 3) {
      return (
        <div className="space-y-6">
          <div className={panelCardClassName}>
            <p className="text-sm font-semibold text-slate-900">Choose the payment methods you want to start with</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              These choices help you start the first day with the right checkout habits. You can fine-tune them later inside billing and settings.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {PAYMENT_METHOD_OPTIONS.map((method) => {
                const active = formData.paymentMethods.includes(method.key)
                const MethodIcon =
                  method.key === 'cash'
                    ? Receipt
                    : method.key === 'card'
                      ? CreditCard
                      : method.key === 'bank_transfer'
                        ? Building2
                        : Smartphone

                return (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => handlePaymentToggle(method.key)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-white/10' : 'bg-slate-100'}`}>
                          <MethodIcon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-700'}`} />
                        </div>
                        <p className="text-sm font-semibold">{method.label}</p>
                      </div>
                      {active ? <CircleCheckBig className="h-5 w-5" /> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    if (signupStep === 4) {
      return (
        <div className="space-y-6">
          <div className={panelCardClassName}>
            <p className="text-sm font-semibold text-slate-900">
              Add your first {formData.businessType === 'shop' ? 'products' : 'menu items'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep it light. Add a few items now if you want to start faster, or skip and manage them later.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { key: 'skip', title: 'Skip for now', detail: 'Finish signup quickly and add items later from products.' },
                { key: 'suggested', title: 'Use starter suggestions', detail: 'Start with simple sample items that you can edit right away.' },
                { key: 'manual', title: 'Enter my own items', detail: 'Add the first items yourself before opening the dashboard.' },
              ].map((option) => {
                const active = formData.starterMode === option.key

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleStarterModeChange(option.key)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.title}</p>
                    <p className={`mt-2 text-sm leading-6 ${active ? 'text-slate-200' : 'text-slate-500'}`}>{option.detail}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {formData.starterMode !== 'skip' ? (
            <div className={panelCardClassName}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Starter items</p>
                <button type="button" onClick={handleAddStarterItem} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Add another
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {formData.starterItems.map((item, index) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {formData.businessType === 'shop' ? 'Product' : 'Item'} {index + 1}
                      </p>
                      {formData.starterItems.length > 1 ? (
                        <button type="button" onClick={() => handleRemoveStarterItem(item.id)} className="text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className={`mt-4 grid gap-4 ${formData.businessType === 'shop' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                        <input type="text" value={item.name} onChange={(event) => handleStarterItemChange(item.id, 'name', event.target.value)} className={fieldClassName} placeholder={formData.businessType === 'shop' ? 'Product name' : 'Menu item name'} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                        <input type="text" value={item.category} onChange={(event) => handleStarterItemChange(item.id, 'category', event.target.value)} className={fieldClassName} placeholder={formData.businessType === 'shop' ? 'General' : 'Menu category'} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Selling price</label>
                        <input type="number" min="0" step="0.01" value={item.sellingPrice} onChange={(event) => handleStarterItemChange(item.id, 'sellingPrice', event.target.value)} className={fieldClassName} placeholder="0.00" />
                      </div>
                      {formData.businessType === 'shop' ? (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Opening stock</label>
                          <input type="number" min="0" step="1" value={item.stockQty} onChange={(event) => handleStarterItemChange(item.id, 'stockQty', event.target.value)} className={fieldClassName} placeholder="0" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className={panelCardClassName}>
          <p className="text-sm font-semibold text-slate-900">Review your setup</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Business type and package</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedProduct?.title}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedPlan?.name || 'Selected package'}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Business profile</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formData.orgName || 'Business name pending'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formData.branchName || 'Main branch pending'}
                {formData.phone ? ` / ${formData.phone}` : ''}
                {formData.city ? ` / ${formData.city}` : ''}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Billing and tax</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                NPR / {formData.invoicePrefix || getSuggestedInvoicePrefix(formData.businessType)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formData.vatMode === 'registered' ? `${TAX_REGISTRATION_LABEL}: ${formData.gstin || 'Pending'}` : `${TAX_REGISTRATION_LABEL}: Add later`}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Payment methods to start with</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {paymentMethodLabels.map((label) => (
                  <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-500">You can adjust checkout methods later from billing and settings.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Starter items</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {normalizedStarterItems.length === 0
                  ? 'No starter items yet'
                  : `${normalizedStarterItems.length} starter ${formData.businessType === 'shop' ? 'products' : 'menu items'}`}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {normalizedStarterItems.length === 0
                  ? 'You can add products or menu items later from the products screen.'
                  : 'These starter items will be created automatically after signup.'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-sm font-semibold">Invite staff later</p>
          <p className="mt-2 text-sm leading-6">
            Finish the owner account first. You can add cashier, manager, kitchen, or accountant users later from settings.
          </p>
        </div>
      </div>
    )
  }

  const heroTitle = isSignup
    ? 'Simple business setup for shops, cafes, and restaurants'
    : 'Business software for Nepali shops, cafes, and restaurants'

  const heroDescription = isSignup
    ? 'Choose the business type, set up billing basics, and get ready to start with less confusion.'
    : 'Sign in to handle billing, inventory, purchases, reports, and restaurant tables from one serious daily business system.'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.16),_transparent_36%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-6 sm:px-6 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.55)] lg:grid-cols-[1.08fr,0.92fr]">
          <section className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0">
              <div className="absolute left-10 top-10 h-44 w-44 rounded-full bg-teal-400/18 blur-3xl" />
              <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-amber-400/18 blur-3xl" />
            </div>

            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-left transition hover:bg-white/15">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedProduct?.gradient || 'from-slate-600 to-slate-800'} shadow-lg`}>
                    <ProductIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Nepal business software</p>
                    <p className="text-sm font-semibold text-white">{selectedProduct?.title || 'Business Software'}</p>
                  </div>
                </Link>

                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Link>
              </div>

              <div className="mt-10">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100">
                  {isSignup ? 'Guided onboarding' : 'Secure sign in'}
                </span>
                <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">{heroTitle}</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">{heroDescription}</p>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                {isSignup ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Step {signupStep + 1} of {SIGNUP_STEPS.length}
                    </p>
                    <p className="mt-3 text-xl font-semibold text-white">{activeSignupStep.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{activeSignupStep.description}</p>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-amber-400 transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{selectedProduct?.shortName} / {selectedPlan?.name}</p>
                        <p className="mt-1 text-sm text-slate-300">{formData.orgName ? formData.orgName : 'Business name not added yet'}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                        {formData.paymentMethods.length} payment method{formData.paymentMethods.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Built for daily operations</p>
                    <p className="mt-3 text-xl font-semibold text-white">One serious login for everyday business work</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Billing, inventory, purchases, reports, and restaurant service stay in one connected business system.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(isSignup ? selectedProduct?.modules?.slice(0, 4) || [] : TRUST_POINTS).map((item, index) => {
                  const Icon = item.icon
                  const title = item.title
                  const description = isSignup ? item.description : item.detail

                  return (
                    <div key={`${title}-${index}`} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <Icon className="h-5 w-5 text-teal-300" />
                      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-auto pt-6">
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">Secure login and role-based access</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Owner, manager, cashier, kitchen, and accountant accounts open only the areas they need.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {isSignup ? 'Business onboarding' : 'Account access'}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {isSignup ? 'Set up your business step by step' : 'Sign in to continue'}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {isSignup
                      ? 'Short steps, practical labels, and only the details you need to start properly.'
                      : 'Use the email linked to your business account. Password recovery is available if you need it.'}
                  </p>
                </div>

                <button type="button" onClick={handleModeToggle} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  {isSignup ? 'Sign in instead' : 'Start onboarding'}
                </button>
              </div>

              {isSignup ? (
                <div className="mt-6">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {SIGNUP_STEPS.map((step, index) => {
                      const completed = index < signupStep
                      const active = index === signupStep

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => index <= signupStep && setSignupStep(index)}
                          className={`flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : completed
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${active ? 'bg-white/15' : completed ? 'bg-emerald-100' : 'bg-white'}`}>
                            {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          {step.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {submitError ? (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {submitError}
                </div>
              ) : null}

              <form onSubmit={handleFormSubmit} className="mt-8 space-y-6">
                {isSignup ? (
                  renderSignupStep()
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className={fieldClassName} placeholder="owner@business.com" autoComplete="email" required />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <Link to="/reset-password" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                          Forgot password?
                        </Link>
                      </div>

                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className={`${fieldClassName} pr-14`} placeholder="Enter your password" autoComplete="current-password" required />
                        <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Secure login opens the right billing, stock, and reporting access for your role.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  {isSignup ? (
                    <button type="button" onClick={handleBack} disabled={signupStep === 0 || loading} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      selectedProduct?.button || 'bg-slate-900 hover:bg-slate-800'
                    } ${isSignup ? 'sm:min-w-[260px]' : 'w-full sm:w-auto sm:min-w-[220px]'}`}
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {isSignup ? 'Creating business setup...' : 'Signing in...'}
                      </>
                    ) : (
                      <>{isSignup ? (signupStep === SIGNUP_STEPS.length - 1 ? 'Create setup and open dashboard' : 'Continue') : 'Sign in'}</>
                    )}
                  </button>
                </div>
              </form>

              {!isSignup ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Need a new business setup?</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Start with your business type, billing basics, payment methods, and first items.
                      </p>
                    </div>
                    <button type="button" onClick={handleModeToggle} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                      Start onboarding
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Login
