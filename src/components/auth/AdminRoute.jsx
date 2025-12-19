import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin } from '../../lib/supabase'
import { Loader2, Shield } from 'lucide-react'

const AdminRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const role = userProfile?.role
        const allowedRoles = ['admin', 'super_admin', 'journalist', 'politician', 'party']
        if (user.email === 'admin@direitai.com') {
          setIsAdminUser(true)
        } else if (allowedRoles.includes(String(role))) {
          setIsAdminUser(true)
        } else if (user.email_confirmed_at) {
          const adminStatus = await isAdmin(user.id)
          setIsAdminUser(adminStatus)
        } else {
          setIsAdminUser(false)
        }
      }
      setCheckingAdmin(false)
    }

    if (!loading) {
      checkAdminStatus()
    }
  }, [user, userProfile, loading])

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta área.</p>
          <button
            onClick={() => window.history.back()}
            className="btn-primary"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default AdminRoute
