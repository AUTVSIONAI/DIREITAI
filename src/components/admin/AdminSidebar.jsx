import React from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  UserCheck,
  Bot,
  BookOpen,
  Star,
  BarChart3,
  X,
  CheckCircle
} from 'lucide-react'

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()
  
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
      name: 'Configurações',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname === '/admin/settings'
    }
  ]

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
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-bold text-lg">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-8 px-4 pb-20">
          <div className="space-y-2">
            {menuItems.map((item) => {
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
                      {item.submenu.map((subItem) => (
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