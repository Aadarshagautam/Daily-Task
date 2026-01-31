import React, { useContext } from 'react'
import { Plus, User, LogOut, Mail } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, backendUrl, setUserData, setIsLoggedin, isLoggedin } = useContext(AppContext);

  // Don't show navbar on login/signup/auth pages
  const hideNavbar = ['/login', '/register', '/email-verifty', '/reset-password'].includes(location.pathname);
  
  // Show minimal navbar on note create/edit pages
  const isEditorPage = location.pathname.includes('/create') || (location.pathname.includes('/notes/') && location.pathname !== '/notes');
  
  if (hideNavbar || isEditorPage) return null;

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + "/api/auth/send-verify-opt");
      if (data.success) {
        toast.success(data.message);
        navigate('/email-verifty');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + "/api/auth/logout");
      if (data.success) {
        setIsLoggedin(false);
        setUserData(null);
        toast.success("Logged out successfully");
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto px-6 ml-64"> {/* Added ml-64 for sidebar space */}
        <div className="flex items-center justify-between h-14">
          
          {/* Logo/Brand */}
          <Link to="/dashboard" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-base">T</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              ThinkBoard
            </h1>
          </Link>

          {/* Right side - User actions */}
          <div className="flex items-center gap-3">
            {isLoggedin ? (
              <>
                {/* New Note Button */}
                {/* <Link 
                  to="/create" 
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Note</span>
                </Link> */}

                {/* User Menu */}
                <div className="relative group">
                  <button className="w-8 h-8 flex justify-center items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:scale-110 transition-transform">
                    {userData?.username?.[0]?.toUpperCase() || userData?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userData?.username || userData?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {userData?.email || 'user@example.com'}
                      </p>
                      {userData && !userData.isAccountVerified && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          Email not verified
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {userData && !userData.isAccountVerified && (
                        <button
                          onClick={sendVerificationOtp}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Verify Email
                        </button>
                      )}
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Login Button */
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar