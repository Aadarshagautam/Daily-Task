import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const ProtectedRoute = ({ children }) => {
  const { isLoggedin, loading } = useContext(AppContext)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (!isLoggedin) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute