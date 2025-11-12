import { createClient } from '@supabase/supabase-js'
import { apiClient } from './api'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Usar fluxo implícito para evitar exigência de code_verifier em links de email
    flowType: 'implicit'
  },
  global: {
    headers: {
      'X-Client-Info': 'direitai-frontend'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})



// Função para verificar se o usuário está autenticado
export const isAuthenticated = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return false
  }
}

// Função para obter o usuário atual
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      // Se for erro de sessão faltando, não é um erro real - apenas não há usuário logado
      if (error.message.includes('Auth session missing')) {
        return null
      }
      console.error('Erro ao obter usuário atual:', error)
      return null
    }
    return user
  } catch (error) {
    // Se for erro de sessão faltando, não é um erro real - apenas não há usuário logado
    if (error.message && error.message.includes('Auth session missing')) {
      return null
    }
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
}

// Função para fazer login
export const signIn = async (email, password) => {
  try {
    // Verificar se as variáveis estão definidas
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configuração do Supabase não encontrada')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw error
    }
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Função para fazer cadastro
export const signUp = async (email, password, userData = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao fazer cadastro:', error)
    return { data: null, error }
  }
}

// Função para fazer logout
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      // Se for erro de rede, ainda considerar logout como sucesso localmente
      if (error.message?.includes('ERR_ABORTED') || error.message?.includes('network')) {
        console.warn('Erro de rede no logout, mas limpando sessão local:', error.message)
        return { success: true }
      }
      throw error
    }
    return { success: true }
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    // Para erros de rede, ainda retornar sucesso para limpar a sessão local
    if (error.message?.includes('ERR_ABORTED') || error.message?.includes('network')) {
      return { success: true }
    }
    return { success: false, error }
  }
}

// Função para verificar se é admin via backend
export const isAdmin = async (_userId) => {
  try {
    const resp = await apiClient.get('/auth/me')
    const profile = resp?.data?.profile
    if (!profile) return false
    return profile?.role === 'admin' || profile?.is_admin === true
  } catch (error) {
    console.error('Erro ao verificar se é admin via backend:', error)
    return false
  }
}

// Função para reenviar email de confirmação
export const resendConfirmation = async (email) => {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao reenviar confirmação:', error)
    return { data: null, error }
  }
}