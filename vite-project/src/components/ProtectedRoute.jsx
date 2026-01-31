import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const ProtectedRoute = ({ children }) => {
  const { isLoggedin } = useContext(AppContext)

  if (!isLoggedin) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute