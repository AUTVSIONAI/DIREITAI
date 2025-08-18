import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const PublicRoute = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se requireAuth é true e não há usuário logado, redireciona para cadastro
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location, showRegister: true }} replace />
  }

  return children
}

export default PublicRoute