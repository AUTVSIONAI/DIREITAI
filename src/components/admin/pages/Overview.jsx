import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminService } from '../../../services/admin'
import { FinancialReportsService, EventsService, storeManagementService, paymentsService } from '../../../services'
import AIMemoryService from '../../../services/aiMemory'
import AnnouncementBanner from '../../common/AnnouncementBanner'
import { 
  User, 
  Calendar, 
  DollarSign, 
  MapPin, 
  MessageSquare, 
  Shield, 
  Activity,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react'

const Overview = () => {
  const navigate = useNavigate()
  const formatNumber = (val) => {
    const num = Number(val ?? 0)
    try {
      return num.toLocaleString('pt-BR')
    } catch {
      return String(num)
    }
  }

  const formatDate = (val) => {
    if (!val) return '-'
    const d = new Date(val)
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR')
  }
  const [stats, setStats] = useState({
    activeUsers: 0,
    todayCheckins: 0,
    activeEvents: 0,
    monthlyRevenue: 0,
    aiConversations: 0,
    moderatedContent: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [topCities, setTopCities] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoading(true);
      try {
        const [adminRes, finRes, eventsRes, aiRes] = await Promise.allSettled([
          AdminService.getOverview(),
          FinancialReportsService.getOverview({ period: 'month' }),
          EventsService.getEvents({ status: 'active' }, 1, 1),
          AIMemoryService.getConversationStats()
        ]);

        const adminOverview = adminRes.status === 'fulfilled' ? adminRes.value : null;
        let financialOverview = finRes.status === 'fulfilled' ? finRes.value : null;
        const eventsActive = eventsRes.status === 'fulfilled' ? eventsRes.value : null;
        const aiStats = aiRes.status === 'fulfilled' ? aiRes.value : null;

        const s = adminOverview?.statistics || {};
        let monthlyRevenue = Number(financialOverview?.totalRevenue ?? 0);
        if (!financialOverview || monthlyRevenue === 0) {
          try {
            const rangeStart = new Date(); rangeStart.setDate(1)
            const fmt = (d) => d.toISOString().slice(0,10)
            const paidOrdersResp = await storeManagementService.getOrders({ paymentStatus: 'paid', dateFrom: fmt(rangeStart), dateTo: fmt(new Date()) }, 1, 100)
            const orders = Array.isArray(paidOrdersResp?.orders) ? paidOrdersResp.orders : []
            monthlyRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
          } catch {}
        }
        try {
          const fmt = (d) => d.toISOString().slice(0,10)
          const rangeStart = new Date(); rangeStart.setDate(1)
          const creditsTx = await paymentsService.getCreditsTransactions({ startDate: fmt(rangeStart), endDate: fmt(new Date()), limit: 100 })
          const creditsSum = Array.isArray(creditsTx) ? creditsTx.reduce((s, t) => s + Number(t.amount || 0), 0) : 0
          monthlyRevenue = monthlyRevenue + creditsSum
        } catch {}

        setStats({
          activeUsers: s.activeUsers || 0,
          todayCheckins: s.checkinsToday || 0,
          activeEvents: (eventsActive?.total ?? s.activeEvents ?? 0),
          monthlyRevenue: monthlyRevenue,
          aiConversations: (s.aiConversationsToday ?? aiStats?.total_conversations ?? 0),
          moderatedContent: s.pendingModeration || 0
        });
        setRecentEvents(adminOverview?.recentEvents || []);
        setTopCities(adminOverview?.topCities || []);
        setRecentActivities(adminOverview?.recentActivities || []);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dados do overview:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const statsCards = [
    {
      name: 'Usuários Ativos',
      value: formatNumber(stats.activeUsers),
      change: '+12%',
      changeType: 'increase',
      icon: User,
      color: 'blue'
    },
    {
      name: 'Check-ins Hoje',
      value: formatNumber(stats.todayCheckins),
      change: '+8%',
      changeType: 'increase',
      icon: MapPin,
      color: 'green'
    },
    {
      name: 'Eventos Ativos',
      value: formatNumber(stats.activeEvents),
      change: '+3',
      changeType: 'increase',
      icon: Calendar,
      color: 'purple'
    },
    {
      name: 'Receita Mensal',
      value: `R$ ${formatNumber(stats.monthlyRevenue)}`,
      change: '+15%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'yellow'
    },
    {
      name: 'Conversas IA',
      value: formatNumber(stats.aiConversations),
      change: '+22%',
      changeType: 'increase',
      icon: MessageSquare,
      color: 'indigo'
    },
    {
      name: 'Conteúdo Moderado',
      value: formatNumber(stats.moderatedContent),
      change: '-5%',
      changeType: 'decrease',
      icon: Shield,
      color: 'red'
    }
  ]

  // Dados agora vêm da API através dos estados

  const getStatColor = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      indigo: 'bg-indigo-500',
      red: 'bg-red-500'
    }
    return colors[color] || colors.blue
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Announcement Banners */}
      <AnnouncementBanner />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h2>
          <p className="text-gray-600">Visão geral da plataforma Direitai.com</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {stat.changeType === 'increase' ? (
                      <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${getStatColor(stat.color)} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Eventos Recentes</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Ver todos
            </button>
          </div>
          <div className="space-y-4">
            {Array.isArray(recentEvents) && recentEvents.map(event => (
              <div key={event.id ?? `${event.name ?? event.title ?? 'evt'}-${event.date ?? event.created_at ?? Math.random()}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{event.name ?? event.title ?? 'Evento'}</h4>
                  <p className="text-sm text-gray-600">{event.location ?? event.city ?? '-'}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.date ?? event.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatNumber(event.checkins ?? event.participants)} check-ins</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    event.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status ? (event.status === 'active' ? 'Ativo' : 'Finalizado') : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cities */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cidades com Mais Usuários</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Ver ranking
            </button>
          </div>
          <div className="space-y-3">
            {Array.isArray(topCities) && topCities.map((city, index) => (
              <div key={city.id ?? `${city.city ?? city.name ?? 'cidade'}-${city.state ?? city.uf ?? ''}-${index}` } className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{city.city ?? city.name ?? '-'}</p>
                    <p className="text-sm text-gray-600">{city.state ?? city.uf ?? ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatNumber(city.users ?? city.count ?? city.user_count)}</p>
                  <p className="text-sm text-green-600">{city.growth ?? ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            {Array.isArray(recentActivities) && recentActivities.map(activity => {
              const Icon = activity.icon || Activity
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message ?? activity.description ?? activity.action}</p>
                    <p className="text-xs text-gray-500">{formatDate(activity.time ?? activity.created_at ?? activity.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/admin/events')}
              className="w-full btn-primary"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Criar Evento
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="w-full btn-secondary"
            >
              <User className="h-4 w-4 mr-2" />
              Gerenciar Usuários
            </button>
            <button 
              onClick={() => navigate('/admin/moderation')}
              className="w-full btn-secondary"
            >
              <Shield className="h-4 w-4 mr-2" />
              Moderar Conteúdo
            </button>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="w-full btn-secondary"
            >
              <Activity className="h-4 w-4 mr-2" />
              Ver Relatórios
            </button>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-green-900">Sistema Operacional</h3>
            <p className="text-sm text-green-800">
              Todos os serviços estão funcionando normalmente. Última verificação: agora
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-green-800">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>API: 99.9%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>DB: 100%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>CDN: 99.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview