import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import PublicRoute from './components/auth/PublicRoute'
import AuthProvider from './contexts/AuthProvider'
import useApiAuth from './hooks/useApiAuth'
import { supabase, getCurrentUser } from './lib/supabase'


// Componente de loading
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
)

// Lazy loading dos componentes principais
const HomePage = lazy(() => import('./pages/HomePage.tsx'))
const TestPage = lazy(() => import('./pages/TestPage.jsx'))
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const UserDashboard = lazy(() => import('./components/user/UserDashboard'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))

// Lazy loading das páginas secundárias
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Politicians = lazy(() => import('./pages/Politicians'))
const PoliticianProfile = lazy(() => import('./pages/PoliticianProfile'))
const PoliticianRegistration = lazy(() => import('./pages/PoliticianRegistration'))
const AgentChat = lazy(() => import('./pages/AgentChat'))
const Surveys = lazy(() => import('./pages/Surveys'))
const SurveyResults = lazy(() => import('./pages/SurveyResults'))
const SurveyDetail = lazy(() => import('./pages/SurveyDetail'))
const VerdadeOuFake = lazy(() => import('./pages/VerdadeOuFake'))
const ConstitutionQuiz = lazy(() => import('./components/user/ConstitutionQuiz'))
const QuizzesPage = lazy(() => import('./pages/Quizzes'))
const ConstitutionQuizLevel2 = lazy(() => import('./components/user/ConstitutionQuizLevel2'))
const ConstitutionQuizLevel3 = lazy(() => import('./components/user/ConstitutionQuizLevel3'))
const ConstitutionQuizLevel4 = lazy(() => import('./components/user/ConstitutionQuizLevel4'))
const ConstitutionQuizLevel5 = lazy(() => import('./components/user/ConstitutionQuizLevel5'))

// Store (pública)
const Store = lazy(() => import('./components/user/pages/Store'))

// Helper para affiliate tracking
const setAffiliateCode = (code) => {
  try {
    if (!code) return
    localStorage.setItem('affiliate_code', code)
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `affiliate_code=${encodeURIComponent(code)}; path=/; expires=${expires.toUTCString()}`
  } catch {}
}

const getAffiliateCode = () => {
  try {
    const ls = localStorage.getItem('affiliate_code')
    if (ls) return ls
    const match = document.cookie.match(/(?:^|; )affiliate_code=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

const recordAffiliateClick = async (code, route) => {
  try {
    // Evitar múltiplos registros na mesma sessão
    const key = `aff_click_${code}_${route}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    const user = await getCurrentUser()
    await supabase.from('affiliate_clicks').insert({
      affiliate_code: code,
      click_url: route || window.location.pathname,
      referrer: document.referrer || null,
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
    })
  } catch (err) {
    // Ignorar silenciosamente erros de RLS; tracking é melhor effort
    console.warn('Falha ao registrar clique de afiliado:', err?.message || err)
  }
}

// Componente interno sem useApiAuth global
const AppWithApiAuth = () => {
  // Removido useApiAuth global para evitar loops infinitos
  return <AppContent />;
};

const AppContent = () => {
  const location = useLocation()

  // Capturar parâmetro ?aff e registrar clique
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('aff') || params.get('affiliate') || params.get('ref')
    if (code) {
      setAffiliateCode(code)
      recordAffiliateClick(code, location.pathname)
    } else {
      const stored = getAffiliateCode()
      if (stored) {
        // Persistir em cookie caso só exista em localStorage
        setAffiliateCode(stored)
      }
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<HomePage />} />
          <Route path="/test" element={<TestPage />} />
          
          {/* Rota de login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rotas do usuário */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Rotas do admin */}
          <Route 
            path="/admin/*" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          {/* Páginas que requerem autenticação */}
          <Route path="/blog" element={<PublicRoute requireAuth={true}><Blog /></PublicRoute>} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/politicos" element={<PublicRoute requireAuth={true}><Politicians /></PublicRoute>} />
          <Route path="/politicos/:id" element={<PoliticianProfile />} />
          <Route path="/cadastro-politico" element={<PoliticianRegistration />} />
          <Route path="/agente/:politicianId" element={<AgentChat />} />
          
          {/* Rotas de Pesquisas */}
          <Route path="/pesquisas" element={<PublicRoute requireAuth={true}><Surveys /></PublicRoute>} />
          <Route path="/resultados" element={<PublicRoute requireAuth={true}><SurveyResults /></PublicRoute>} />
          <Route path="/pesquisa/:id" element={<SurveyDetail />} />
          
          {/* Rota Verdade ou Fake */}
          <Route path="/verdade-ou-fake" element={<PublicRoute requireAuth={true}><VerdadeOuFake /></PublicRoute>} />
          
          {/* Quiz da Constituição – Nível 1 */}
          <Route path="/quiz-constituicao" element={<ConstitutionQuiz />} />
          
          {/* Página de Quizzes com bloqueios por metas */}
          <Route path="/quizzes" element={<PublicRoute requireAuth={true}><QuizzesPage /></PublicRoute>} />
          {/* Rotas dos níveis da Constituição */}
          <Route path="/quiz-constituicao/level2" element={<ConstitutionQuizLevel2 />} />
          <Route path="/quiz-constituicao/level3" element={<ConstitutionQuizLevel3 />} />
          <Route path="/quiz-constituicao/level4" element={<ConstitutionQuizLevel4 />} />
          <Route path="/quiz-constituicao/level5" element={<ConstitutionQuizLevel5 />} />
          
          {/* Página da Loja */}
          <Route path="/store" element={<Store />} />

          {/* Redirecionamentos para compatibilidade */}
          <Route path="/politicians" element={<Navigate to="/politicos" replace />} />
          <Route path="/politicians/:id" element={<Navigate to="/politicos" replace />} />
          </Routes>
        </Suspense>
      </div>
  )
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppWithApiAuth />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App