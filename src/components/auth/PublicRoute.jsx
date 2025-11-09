import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext';

const PublicRoute = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Se a rota exige autenticação e já há usuário, renderiza imediatamente
  if (requireAuth && user) {
    return children
  }

  if (requireAuth) {
    // Enquanto verifica sessão sem usuário definido, mostra loading
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    // Sem usuário e não está carregando: redireciona para login
    if (!user) {
      return <Navigate to="/login" state={{ from: location, showRegister: true }} replace />
    }

    return children
  }

  // Rotas públicas não bloqueiam por loading
  return children
}

export default PublicRoute