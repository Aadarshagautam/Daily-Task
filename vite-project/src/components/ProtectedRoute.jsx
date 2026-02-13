import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const ProtectedRoute = ({ children }) => {
  const { isLoggedin, loading, hasCheckedAuth } = useContext(AppContext)
  const location = useLocation()

  if (!hasCheckedAuth || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-slate-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (!isLoggedin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
