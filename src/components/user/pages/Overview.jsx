import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useGamification } from '../../../hooks/useGamification'
import { supabase } from '../../../lib/supabase'
import { apiClient } from '../../../lib/api.ts'
import ConstitutionDownload from '../ConstitutionDownload'
import AIConversations from '../AIConversations'
import { 
  MapPin, 
  MessageCircle, 
  Trophy, 
  Award, 
  TrendingUp, 
  Users,
  Calendar,
  Target,
  BarChart3,
  Vote
} from 'lucide-react'

const Overview = () => {
  const { userProfile } = useAuth()
  const { userPoints, userStats, userGoals, recentActivities, loading: gamificationLoading } = useGamification()
  const [stats, setStats] = useState({
    totalCheckins: 0,
    chatMessages: 0,
    rankingPosition: 0,
    achievementsUnlocked: 0,
    weeklyPoints: 0,
    monthlyGoal: 500
  })
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState([])
  const [loadingSurveys, setLoadingSurveys] = useState(true)

  useEffect(() => {
    fetchUserStats()
    fetchSurveys()
  }, [])

  // Atualizar stats quando os dados de gamificação chegarem
  useEffect(() => {
    if (userStats && userPoints) {
      const monthlyGoalValue = userGoals?.monthlyGoal?.target_value || Math.max(500, (userPoints.level || 1) * 100)
      
      setStats(prev => ({
        ...prev,
        totalCheckins: userStats.checkins || 0,
        chatMessages: userStats.conversations || 0,
        weeklyPoints: userPoints.weeklyPoints || 0,
        monthlyGoal: monthlyGoalValue
      }))
    }
  }, [userStats, userPoints, userGoals])

  // Função para obter o user_id correto da tabela public.users
  const getUserId = async () => {
    if (!userProfile?.id) return null
    
    try {
      // Buscar o user_id da tabela public.users usando o auth_id
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userProfile.id)
        .single()
      
      if (error) {
        console.error('❌ Overview - Erro ao buscar user_id:', error)
        return userProfile.id // fallback para auth_id
      }
      
      console.log('🔑 Overview - user_id encontrado:', user.id, 'para auth_id:', userProfile.id)
      return user.id
    } catch (error) {
      console.error('❌ Overview - Erro ao resolver user_id:', error)
      return userProfile.id // fallback para auth_id
    }
  }

  const fetchUserStats = async () => {
    try {
      if (!userProfile?.id) {
        console.log('UserProfile não disponível ainda')
        return
      }
      
      // Usar user_id correto para buscar dados de gamificação
      const userId = await getUserId()
      if (!userId) return
      
      // Buscar dados de gamificação reais usando o user_id
      const gamificationResponse = await apiClient.get(`/gamification/users/${userId}/stats`)
      console.log('📊 Dados de gamificação:', gamificationResponse)
      
      // Buscar estatísticas do usuário (incluindo conversas de IA reais)
        const statsResponse = await apiClient.get(`/users/${userId}/stats`)
        const aiConversations = statsResponse.data?.ai_conversations || 0
      
      // Buscar conquistas reais da tabela badges
        const achievementsResponse = await apiClient.get(`/gamification/users/${userId}/achievements?status=unlocked`)
        const achievements = achievementsResponse.data?.length || 0
      
      // Buscar posição no ranking usando a rota correta
      let userPosition = 0
      try {
        const rankingResponse = await apiClient.get('/users/ranking')
        userPosition = rankingResponse?.data?.user_position || 0
      } catch (rankingError) {
        console.log('Erro ao buscar ranking:', rankingError)
      }
      
      // Calcular pontos semanais com base nas transações dos últimos 7 dias
      let weeklyPoints = 0
      try {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const transactionsResponse = await apiClient.get(`/gamification/users/${userId}/points/transactions?since=${weekAgo.toISOString()}`)
        // A API retorna um array diretamente
        const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : (transactionsResponse?.data || [])
        weeklyPoints = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
        console.log('📊 Overview - Pontos semanais calculados:', weeklyPoints, 'de', transactions.length, 'transações')
      } catch (transactionError) {
        console.log('Erro ao buscar transações semanais, usando estimativa:', transactionError)
        // Fallback: estimar pontos semanais como 30% dos pontos totais
        weeklyPoints = Math.floor((gamificationResponse?.points || 0) * 0.3)
      }
      
      setStats({
          totalCheckins: statsResponse.data?.checkins || 0,
          chatMessages: aiConversations,
          rankingPosition: userPosition,
          achievementsUnlocked: achievements,
          weeklyPoints: weeklyPoints,
          monthlyGoal: 500 // Valor padrão, será atualizado pelo useEffect com dados reais
        })
       
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      // Definir valores padrão em caso de erro
      setStats({
        totalCheckins: 0,
        chatMessages: 0,
        rankingPosition: 0,
        achievementsUnlocked: 0,
        weeklyPoints: 0,
        monthlyGoal: 500
      })
    }
  }



  const fetchSurveys = async () => {
    try {
      setLoadingSurveys(true)
      
      const response = await apiClient.get('/surveys?status=active&limit=3')
      if (response.success && response.data) {
        setSurveys(response.data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error)
    } finally {
      setLoadingSurveys(false)
    }
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkin': return <MapPin className="h-4 w-4 text-green-600" />
      case 'chat': return <MessageCircle className="h-4 w-4 text-blue-600" />
      case 'achievement': return <Award className="h-4 w-4 text-yellow-600" />
      default: return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-conservative-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Bem-vindo, {userProfile?.username || 'Patriota'}!
        </h2>
        <p className="text-primary-100">
          Continue engajado no movimento. Você está fazendo a diferença!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.checkins || 0}</p>
            </div>
          </div>
        </div>



        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ranking</p>
              <p className="text-2xl font-bold text-gray-900">#{stats.rankingPosition}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conquistas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.achievementsUnlocked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Constitution Download */}
      <ConstitutionDownload />

      {/* AI Conversations Section */}
      <AIConversations />

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progresso Semanal</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pontos desta semana</span>
              <span className="font-medium">{userPoints.weeklyPoints || 0} pts</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${((userPoints.weeklyPoints || 0) / (stats.weeklyGoal || 200)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">Meta semanal: {stats.weeklyGoal || 200} pontos</p>
          </div>
        </div>

        {/* Monthly Goal */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Meta Mensal</h3>
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso do mês</span>
              <span className="font-medium">{userPoints.total || 0}/{userGoals?.monthlyGoal?.target_value || stats.monthlyGoal} pts</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${((userPoints.total || 0) / (userGoals?.monthlyGoal?.target_value || stats.monthlyGoal)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">Continue assim para alcançar sua meta!</p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {gamificationLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando atividades...</p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma atividade recente encontrada.</p>
              <p className="text-sm text-gray-400 mt-1">Faça seu primeiro check-in para começar!</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description || activity.title}
                  </p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    +{activity.points} pts
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pesquisas Ativas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Pesquisas Ativas
          </h3>
          <Link 
            to="/pesquisas" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todas
          </Link>
        </div>
        
        <div className="space-y-3">
          {loadingSurveys ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando pesquisas...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-4">
              <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma pesquisa ativa no momento</p>
            </div>
          ) : (
            surveys.map((survey) => (
              <div key={survey.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{survey.titulo}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{survey.descricao}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Vote className="h-3 w-3 mr-1" />
                        {survey.total_votes || 0} votos
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {survey.data_expiracao ? 
                          `Expira em ${new Date(survey.data_expiracao).toLocaleDateString('pt-BR')}` : 
                          'Sem prazo'
                        }
                      </span>
                    </div>
                  </div>
                  <Link 
                    to={`/pesquisa/${survey.id}`}
                    className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Participar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/dashboard/checkin" className="card hover:shadow-lg transition-shadow duration-200 text-left block">
          <div className="flex items-center space-x-3">
            <MapPin className="h-8 w-8 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Fazer Check-in</h4>
              <p className="text-sm text-gray-500">Registrar presença em evento</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/direitagpt" className="card hover:shadow-lg transition-shadow duration-200 text-left block">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900">DireitaIA</h4>
              <p className="text-sm text-gray-500">Conversar com a IA</p>
            </div>
          </div>
        </Link>

        <Link to="/pesquisas" className="card hover:shadow-lg transition-shadow duration-200 text-left block">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div>
              <h4 className="font-medium text-gray-900">Pesquisas</h4>
              <p className="text-sm text-gray-500">Participar de pesquisas</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/ranking" className="card hover:shadow-lg transition-shadow duration-200 text-left block">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-yellow-600" />
            <div>
              <h4 className="font-medium text-gray-900">Ver Ranking</h4>
              <p className="text-sm text-gray-500">Sua posição no ranking</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Overview