import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Map, 
  MapPin,
  Shield, 
  Store, 
  CreditCard,
  TrendingUp, 
  Settings, 
  FileText, 
  Megaphone,
  Bell,
  UserCheck,
  Bot,
  BookOpen,
  Star,
  BarChart3,
  X,
  CheckCircle,
  Server,
  Video,
  Mic
} from 'lucide-react'

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()
  const { userProfile } = useAuth()
  // Se for admin flag, força role admin para ver tudo
  const role = userProfile?.is_admin ? 'admin' : String(userProfile?.role || '').toLowerCase()
  const plan = String(userProfile?.plan || 'gratuito').toLowerCase()

  const tierOrder = { gratuito: 0, patriota: 1, cidadao: 2, cidadão: 2, premium: 3, pro: 4, elite: 5 }
  const tier = tierOrder[plan] ?? 0

  const baseByRole = {
    journalist: ['dashboard', 'blog', 'ratings', 'moderation', 'announcements', 'notifications', 'surveys'],
    politician: ['dashboard', 'agents', 'events', 'unified-map', 'ratings', 'surveys', 'politicians'],
    party: ['dashboard', 'events', 'affiliates', 'politicians', 'surveys', 'announcements'],
    admin: ['all'],
    super_admin: ['all']
  }

  const tierUnlocks = {
    journalist: {
      0: ['blog', 'surveys'],
      1: ['ratings'],
      2: ['moderation'],
      3: ['announcements'],
      4: ['notifications'],
      5: ['blog', 'ratings', 'moderation', 'announcements', 'notifications', 'surveys']
    },
    politician: {
      0: ['agents', 'surveys'],
      1: ['events'],
      2: ['unified-map'],
      3: ['ratings'],
      4: ['politicians'],
      5: ['agents', 'events', 'unified-map', 'ratings', 'surveys', 'politicians']
    },
    party: {
      0: ['events'],
      1: ['affiliates'],
      2: ['politicians'],
      3: ['surveys'],
      4: ['announcements'],
      5: ['events', 'affiliates', 'politicians', 'surveys', 'announcements']
    }
  }

  const can = (section) => {
    if (!section) return false
    if (baseByRole[role]?.includes('all')) return true
    const base = new Set(baseByRole[role] || [])
    const unlocks = new Set((tierUnlocks[role]?.[tier] || []))
    const allowed = new Set([...base, ...unlocks])
    if (section.startsWith('politicians.')) {
      return allowed.has('politicians')
    }
    return allowed.has(section)
  }
  
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin'
    },
    {
      name: 'Usuários',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users'
    },
    {
      name: 'Eventos',
      href: '/admin/events',
      icon: Calendar,
      current: location.pathname === '/admin/events'
    },
    {
      name: 'Arena do Povo',
      href: '/admin/arenas',
      icon: Video,
      current: location.pathname === '/admin/arenas'
    },
    {
      name: 'Políticos',
      href: '/admin/politicians',
      icon: UserCheck,
      current: location.pathname === '/admin/politicians',
      submenu: [
        {
          name: 'Gerenciar',
          href: '/admin/politicians',
          current: location.pathname === '/admin/politicians'
        },
        {
          name: 'Aprovações',
          href: '/admin/politicians/approval',
          current: location.pathname === '/admin/politicians/approval'
        },
        {
          name: 'Sincronização',
          href: '/admin/politicians/sync',
          current: location.pathname === '/admin/politicians/sync'
        }
      ]
    },
    {
      name: 'Agentes IA',
      href: '/admin/agents',
      icon: Bot,
      current: location.pathname === '/admin/agents'
    },
    {
      name: 'Voz e Custos',
      href: '/admin/voice',
      icon: Mic,
      current: location.pathname === '/admin/voice'
    },
    {
      name: 'Blog Patriota',
      href: '/admin/blog',
      icon: BookOpen,
      current: location.pathname === '/admin/blog'
    },
    {
      name: 'Avaliações',
      href: '/admin/ratings',
      icon: Star,
      current: location.pathname === '/admin/ratings'
    },
    {
      name: 'Pesquisas DireitaJá',
      href: '/admin/surveys',
      icon: BarChart3,
      current: location.pathname === '/admin/surveys'
    },
    {
      name: 'Gerenciar Manifestações',
      href: '/admin/unified-map',
      icon: MapPin,
      current: location.pathname === '/admin/unified-map'
    },
    {
      name: 'Mapa ao Vivo',
      href: '/admin/unified-map',
      icon: Map,
      current: location.pathname === '/admin/unified-map'
    },
    {
      name: 'Moderação',
      href: '/admin/moderation',
      icon: Shield,
      current: location.pathname === '/admin/moderation'
    },
    {
      name: 'Loja',
      href: '/admin/store',
      icon: Store,
      current: location.pathname === '/admin/store'
    },
    {
      name: 'Gerenciar Planos',
      href: '/admin/plans',
      icon: CreditCard,
      current: location.pathname === '/admin/plans'
    },
    {
      name: 'Relatórios',
      href: '/admin/reports',
      icon: TrendingUp,
      current: location.pathname === '/admin/reports'
    },
   {
     name: 'Afiliados',
     href: '/admin/affiliates',
     icon: TrendingUp,
     current: location.pathname === '/admin/affiliates'
   },
    {
      name: 'Logs da API',
      href: '/admin/logs',
      icon: FileText,
      current: location.pathname === '/admin/logs'
    },
    {
      name: 'Anúncios',
      href: '/admin/announcements',
      icon: Megaphone,
      current: location.pathname === '/admin/announcements'
    },
    {
      name: 'Notificações',
      href: '/admin/notifications',
      icon: Bell,
      current: location.pathname === '/admin/notifications'
    },
    {
      name: 'Configurações',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname === '/admin/settings'
    }
  ]

  const itemSection = (item) => {
    const href = String(item.href || '')
    if (href === '/admin') return 'dashboard'
    if (href.includes('/admin/users')) return 'users'
    if (href.includes('/admin/events')) return 'events'
    if (href.includes('/admin/arenas')) return 'arenas'
    if (href.includes('/admin/politicians/approval')) return 'politicians.approval'
    if (href.includes('/admin/politicians/sync')) return 'politicians.sync'
    if (href.includes('/admin/politicians')) return 'politicians'
    if (href.includes('/admin/agents')) return 'agents'
    if (href.includes('/admin/blog')) return 'blog'
    if (href.includes('/admin/ratings')) return 'ratings'
    if (href.includes('/admin/surveys')) return 'surveys'
    if (href.includes('/admin/unified-map')) return 'unified-map'
    if (href.includes('/admin/moderation')) return 'moderation'
    if (href.includes('/admin/store')) return 'store'
    if (href.includes('/admin/plans')) return 'plans'
    if (href.includes('/admin/reports')) return 'reports'
    if (href.includes('/admin/affiliates')) return 'affiliates'
    if (href.includes('/admin/voice')) return 'voice'
    if (href.includes('/admin/logs')) return 'logs'
    if (href.includes('/admin/announcements')) return 'announcements'
    if (href.includes('/admin/notifications')) return 'notifications'
    if (href.includes('/admin/settings')) return 'settings'
    return ''
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-patriotic-blue to-primary-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-patriotic-blue flex-shrink-0 border-b border-primary-800">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Admin Panel" className="h-8 w-auto" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
            <div className="w-8 h-8 bg-patriotic-green rounded-lg flex items-center justify-center" style={{display: 'none'}}>
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-bold text-lg">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-patriotic-yellow"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-8 px-4 pb-20">
          <div className="space-y-2">
            {menuItems
              .filter((item) => {
                const section = itemSection(item)
                return can(section)
              })
              .map((item) => {
                const Icon = item.icon
                const hasSubmenu = item.submenu && item.submenu.length > 0
                const isParentActive = hasSubmenu && item.submenu.some(sub => sub.current)
                
                return (
                  <div key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                        ${item.current || isParentActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                    
                  {hasSubmenu && (
                      <div className="ml-6 mt-1 space-y-1">
                      {item.submenu
                        .filter((subItem) => {
                          const section = itemSection(subItem)
                          return can(section)
                        })
                        .map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block px-3 py-1 text-xs font-medium rounded transition-colors duration-200
                              ${subItem.current
                                ? 'bg-primary-500 text-white'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                              }
                            `}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </nav>

        {/* Admin Info */}
        <div className="flex-shrink-0 p-4 bg-gray-900 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Admin
              </p>
              <p className="text-xs text-gray-400 truncate">
                Central de Comando
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminSidebar
