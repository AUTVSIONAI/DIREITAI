import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Se já há usuário, renderiza imediatamente para evitar loading infinito
  if (user) {
    return children
  }

  // Enquanto verifica sessão sem usuário definido, mostra loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Sem usuário e não está carregando: redireciona para login
  return <Navigate to="/login" state={{ from: location }} replace />
}

export default ProtectedRoute