import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Flag, Shield, Users, ArrowLeft } from 'lucide-react'
import { apiClient } from '../../lib/api'
import AuthService from '../../services/auth'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, userProfile, loading: authLoading } = useAuth()

  const withTimeout = (promise, ms = 12000) => {
    let timeoutId
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Tempo limite atingido. Tente novamente.')), ms)
    })
    return Promise.race([promise.finally(() => clearTimeout(timeoutId)), timeout])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (!isLogin && !username) {
      setError('Por favor, informe um nome de usuário')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const signInPromise = supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })

        const { data, error } = await withTimeout(signInPromise)

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData?.session?.access_token
        if (accessToken) {
          apiClient.setAuthToken(accessToken)
        } else {
          console.warn('Login realizado, mas sessão não contém access_token')
        }

        const userEmail = data?.user?.email
        if (userEmail === 'admin@direitai.com') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        // Cadastro de usuário via AuthService para garantir auto-login se possível
        const result = await AuthService.register({
            email: trimmedEmail,
            password,
            username,
            full_name: username
        });

        if (!result.success) {
            setError(result.error || 'Erro ao realizar cadastro');
            setLoading(false);
            return;
        }

        if (result.session) {
            // Sessão criada com sucesso (auto-login)
            const token = result.session.access_token;
            if (token) apiClient.setAuthToken(token);
            navigate('/dashboard');
        } else {
            // Fallback caso não tenha sessão
             setError('Cadastro realizado! Verifique seu email para confirmar a conta e depois faça login.')
        }
      }
    } catch (error) {
      setError(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Voltar para Site</span>
            </button>
            <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Direitai" className="h-64 w-auto" onError={(e) => { e.target.style.display = 'none' }} />
          </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
          <h2 className="text-xl text-gray-600">
            {isLogin ? 'Entre na Central do Patriota' : 'Junte-se ao Movimento'}
          </h2>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                isLogin ? 'Entrar' : 'Cadastrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-gray-600 hover:text-primary-600 text-sm"
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}


        </div>
      </div>
    </div>
  )
}

export default Login