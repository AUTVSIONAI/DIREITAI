import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  User, 
  MessageCircle, 
  MapPin, 
  Trophy, 
  ShoppingBag, 
  Sparkles, 
  Award, 
  Crown,
  Home,
  Flag,
  UserCheck,
  BookOpen,
  Bot,
  BarChart3,
  TrendingUp,
  Shield,
  History,
  Brain,
  Map,
  Activity,
  Star,
  Video
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  const { userProfile } = useAuth()

  const isPolitician = userProfile?.role === 'politician'
  const isJournalist = userProfile?.role === 'journalist'
  const isParty = userProfile?.role === 'party'

  const defaultMenu = [
    { path: '/dashboard', icon: Home, label: 'Visão Geral' },
    { path: '/dashboard/profile', icon: User, label: 'Perfil' },
    { path: '/politicians', icon: UserCheck, label: 'Políticos' },
    { path: '/blog', icon: BookOpen, label: 'Blog Patriota' },
    { path: '/quizzes', icon: Brain, label: 'Quizzes' },
    { path: '/pesquisas', icon: BarChart3, label: 'Pesquisas DireitaJá' },
    { path: '/resultados', icon: TrendingUp, label: 'Resultados' },
    { path: '/verdade-ou-fake', icon: Shield, label: 'Verdade ou Fake' },
    { path: '/dashboard/direitagpt', icon: MessageCircle, label: 'DireitaGPT' },
    { path: '/dashboard/agents', icon: Bot, label: 'Chat Político' },
    { path: '/dashboard/checkin', icon: MapPin, label: 'Check-in' },
    { path: '/dashboard/events', icon: Map, label: 'Mapa de Eventos' },
    { path: '/arena', icon: Video, label: 'Arena do Povo' },
    { path: '/dashboard/ranking', icon: Trophy, label: 'Ranking' },
    { path: '/dashboard/store', icon: ShoppingBag, label: 'Loja' },
    { path: '/dashboard/achievements', icon: Award, label: 'Conquistas' },
    { path: '/dashboard/plan', icon: Crown, label: 'Plano' },
    { path: '/dashboard/affiliates', icon: Activity, label: 'Afiliados' }
  ]

  const politicianMenu = [
    { path: '/dashboard/profile', icon: User, label: 'Perfil do Político' },
    { path: '/dashboard/arenas', icon: Video, label: 'Minhas Arenas' },
    { path: '/dashboard/agents', icon: Bot, label: 'Gerenciamento do Agente' },
    { path: '/dashboard/direitagpt', icon: MessageCircle, label: 'DireitaGPT' },
    { path: '/dashboard/creative', icon: Sparkles, label: 'IA Criativa' },
    { path: '/dashboard/admin-role', icon: Star, label: 'Gerenciamento de Avaliações' },
    { path: '/dashboard/suggestions', icon: MessageCircle, label: 'Sugestões' },
    { path: '/verdade-ou-fake', icon: Shield, label: 'Verdade ou Fake' }
  ]

  const journalistMenu = [
    { path: '/dashboard/profile', icon: User, label: 'Perfil' },
    { path: '/blog', icon: BookOpen, label: 'Blog Patriota' },
    { path: '/pesquisas', icon: BarChart3, label: 'Pesquisas DireitaJá' },
    { path: '/verdade-ou-fake', icon: Shield, label: 'Verdade ou Fake' },
    { path: '/dashboard/direitagpt', icon: MessageCircle, label: 'DireitaGPT' },
    { path: '/dashboard/admin-role', icon: Shield, label: 'Admin Jornalista' }
  ]

  const partyMenu = [
    { path: '/dashboard/admin-role', icon: UserCheck, label: 'Gerenciar Políticos' },
    { path: '/dashboard/direitagpt', icon: MessageCircle, label: 'DireitaGPT' },
    { path: '/dashboard/creative', icon: Sparkles, label: 'IA Criativa' },
    { path: '/resultados', icon: TrendingUp, label: 'Resultado Pesquisa' },
    { path: '/verdade-ou-fake', icon: Shield, label: 'Detector de Fake News' }
  ]

  const menuItems = isPolitician ? politicianMenu : isJournalist ? journalistMenu : isParty ? partyMenu : defaultMenu

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <Flag className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Direitai</span>
            </div>
            
            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-item ${
                      isActive ? 'active' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            
            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Central do Patriota v1.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <Flag className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Direitai</span>
          </div>
          
          <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`sidebar-item ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Central do Patriota v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
