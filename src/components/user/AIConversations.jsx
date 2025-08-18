import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { apiClient } from '../../lib/api.ts'
import { 
  MessageCircle, 
  Clock, 
  User, 
  Bot, 
  TrendingUp,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react'

const AIConversations = () => {
  const { userProfile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalTokens: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userProfile?.id) {
      fetchConversations()
      fetchConversationStats()
    }
  }, [userProfile])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      // Usar a mesma lógica das atividades recentes que já funciona
      const response = await apiClient.get(`/gamification/users/${userProfile.id}/activities?limit=10`)
      
      // A resposta pode estar em response.data ou diretamente em response
      const activities = Array.isArray(response) ? response : (response.data || [])
      
      // Filtrar apenas conversas de IA das atividades
      const aiConversations = activities.filter(activity => activity.type === 'ai_conversation')
      
      // Transformar para o formato esperado pelo componente
      const formattedConversations = aiConversations.map(activity => ({
        id: activity.id,
        conversation_id: activity.id.replace('conversation-', ''),
        title: activity.description || activity.title || 'Conversa sem título',
        created_at: activity.timestamp,
        updated_at: activity.timestamp,
        message_count: 2,
        last_message_preview: activity.description || ''
      }))
      
      setConversations(formattedConversations)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      setError('Erro ao carregar conversas')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationStats = async () => {
    try {
      // Buscar todas as atividades para contar conversas
      const response = await apiClient.get(`/gamification/users/${userProfile.id}/activities?limit=100`)
      
      // A resposta pode estar em response.data ou diretamente em response
      const activities = Array.isArray(response) ? response : (response.data || [])
      const aiConversations = activities.filter(activity => activity.type === 'ai_conversation')
      
      // Calcular estatísticas semanais e mensais
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      
      const thisWeekConversations = aiConversations.filter(conv => 
        new Date(conv.timestamp) >= weekAgo
      ).length
      
      const thisMonthConversations = aiConversations.filter(conv => 
        new Date(conv.timestamp) >= monthAgo
      ).length
      
      setStats({
        total: aiConversations.length,
        thisWeek: thisWeekConversations,
        thisMonth: thisMonthConversations,
        totalTokens: aiConversations.length * 150 // Estimativa de tokens por conversa
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Agora mesmo'
    } else if (diffInHours < 24) {
      return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Conversas com IA</h3>
          <MessageCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando conversas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas das Conversas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-xl font-bold text-gray-900">{stats.thisWeek}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Este Mês</p>
              <p className="text-xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tokens</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalTokens.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Conversas Recentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Conversas Recentes</h3>
          <Link 
            to="/dashboard/direitagpt" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
          >
            Ver todas
            <Eye className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando conversas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{error}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma conversa encontrada</p>
            <Link 
              to="/dashboard/direitagpt" 
              className="btn-primary"
            >
              Iniciar primeira conversa
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Bot className="h-4 w-4 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-900 truncate">
                        {conversation.title || 'Conversa sem título'}
                      </h4>
                    </div>
                    
                    {conversation.last_message_preview && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {conversation.last_message_preview}
                      </p>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTimeAgo(conversation.created_at)}</span>
                      <span className="mx-2">•</span>
                      <span>{conversation.message_count || 2} mensagens</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <Link 
                        to="/dashboard/direitagpt"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Conversar
                      </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIConversations