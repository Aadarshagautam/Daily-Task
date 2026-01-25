import React, { useContext } from 'react'
import { PlusIcon, User, LogOut, Mail } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, backendUrl, setUserData, setIsLoggedin, isLoggedin } = useContext(AppContext);

  // Don't show navbar on login/signup pages
  const hideNavbar = ['/login', '/register'].includes(location.pathname);
  
  if (hideNavbar) return null;

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

  console.log("Navbar - isLoggedin:", isLoggedin, "userData:", userData); // Debug log

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-indigo-500/20 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">
              ThinkBoard
            </h1>
          </Link>

          {/* Right side - User actions */}
          <div className="flex items-center gap-3">
            {isLoggedin ? (
              <>
                {/* New Note Button - Always show when logged in */}
                <Link 
                  to="/create" 
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>New Note</span>
                </Link>

                {/* User Menu */}
                <div className="relative group">
                  <button className="w-10 h-10 flex justify-center items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                    {userData?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {/* User Info */}
                    {userData && (
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{userData.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{userData.email || ''}</p>
                        {!userData.isAccountVerified && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Not Verified
                          </span>
                        )}
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-1">
                      {userData && !userData.isAccountVerified && (
                        <button
                          onClick={sendVerificationOtp}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Verify Email
                        </button>
                      )}
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Login Button for non-authenticated users */
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-indigo-400/30 rounded-lg px-6 py-2 text-indigo-300 hover:text-white transition-all duration-200"
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