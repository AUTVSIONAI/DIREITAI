import { useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api'
import { supabase } from '../lib/supabase'

/**
 * Hook para integrar autenticação com o apiClient
 * Automaticamente aplica o token de acesso a todas as requisições
 */
export const useApiAuth = () => {
  const { user } = useAuth()

  const setupAuthToken = useCallback(async () => {
    if (user) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (token) {
          apiClient.setAuthToken(token)
        } else {
          apiClient.clearAuthToken()
        }
      } catch (error) {
        console.error('Erro ao obter token:', error)
        apiClient.clearAuthToken()
      }
    } else {
      // Usuário não logado, limpar token
      apiClient.clearAuthToken()
    }
  }, [user])

  useEffect(() => {
    setupAuthToken()
  }, [setupAuthToken])

  return { user }
}

export default useApiAuth