import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const Login = () => {
  const { backendUrl, setIsLoggedin, getUserData, setCurrentOrgId, setCurrentOrgName } = useContext(AppContext)
  const location = useLocation()
  const navigate = useNavigate()

  const [state, setState] = useState('Login')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const redirectTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
    : '/dashboard'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const fillDemo = () => {
    setFormData({ ...formData, email: 'demo@thinkboard.app', password: 'Demo@1234' })
    setState('Login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password || (state === 'Sign Up' && !formData.username)) {
      toast.error('Please fill all fields')
      return
    }

    setLoading(true)

    try {
      const endpoint = state === 'Sign Up' ? '/api/auth/register' : '/api/auth/login'
      const payload = state === 'Sign Up'
        ? { username: formData.username, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password }

      const { data } = await axios.post(
        backendUrl + endpoint,
        payload,
        { withCredentials: true }
      )

      if (data.success) {
        setIsLoggedin(true)
        setCurrentOrgId(data.data?.orgId || null)
        setCurrentOrgName(data.data?.orgName || null)
        await getUserData()
        toast.success(state === 'Sign Up' ? 'Account created!' : 'Login successful!')
        navigate(redirectTo, { replace: true })
      } else {
        toast.error(data.message || 'Login failed')
        setIsLoggedin(false)
        setCurrentOrgId(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
      setIsLoggedin(false)
      setCurrentOrgId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">
            {state === 'Login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-slate-500">
            {state === 'Login'
              ? 'Sign in to your ThinkBoard account'
              : 'Join ThinkBoard today'}
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mb-6 p-3 bg-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-slate-600">Demo Account</p>
            <button
              onClick={fillDemo}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors underline underline-offset-2"
            >
              Auto-fill
            </button>
          </div>
          <p className="text-xs text-slate-500">demo@thinkboard.app / Demo@1234</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {state === 'Sign Up' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-colors"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {state === 'Login' && (
              <div className="text-right">
                <Link
                  to="/reset-password"
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : state === 'Login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              {state === 'Login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setState(state === 'Login' ? 'Sign Up' : 'Login')}
                className="font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                {state === 'Login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
