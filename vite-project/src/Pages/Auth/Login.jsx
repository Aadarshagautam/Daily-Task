import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const Login = () => {
  const { backendUrl, setIsLoggedin, getUserData, setCurrentOrgId, setCurrentOrgName } = useContext(AppContext)
  const navigate = useNavigate()
  
  const [state, setState] = useState('Login')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
        { withCredentials: true } // Important for cookies
      )

      if (data.success) {
        // Set logged in state
        setIsLoggedin(true)
        setCurrentOrgId(data.orgId || null)
        setCurrentOrgName(data.orgName || null)
        
        // Get user data
        await getUserData()
        
        toast.success(state === 'Sign Up' ? 'Account created!' : 'Login successful!')
        
        // Navigate to dashboard
        navigate('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {state === 'Login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {state === 'Login' 
              ? 'Sign in to your ThinkBoard account' 
              : 'Join ThinkBoard today'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {state === 'Sign Up' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          {state === 'Login' && (
            <div className="text-right">
              <Link
                to="/reset-password"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : state === 'Login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {state === 'Login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setState(state === 'Login' ? 'Sign Up' : 'Login')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {state === 'Login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
