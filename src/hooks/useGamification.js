import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { GamificationService } from '../services/gamification'
import { GoalsService } from '../services/goals'
import { apiClient } from '../lib/api'
import { supabase } from '../lib/supabase'

export const useGamification = () => {
  console.log('🎮 useGamification - Hook inicializado')
  const { userProfile } = useAuth()
  
  console.log('🎮 useGamification - userProfile:', userProfile)
  
  const [userPoints, setUserPoints] = useState({
    total: 0,
    level: 1,
    nextLevelPoints: 100,
    weeklyPoints: 0
  })
  const [userStats, setUserStats] = useState({
    badges: 0,
    checkins: 0,
    conversations: 0
  })
  const [userGoals, setUserGoals] = useState({
    monthlyGoal: null,
    weeklyGoal: 200 // Valor padrão para meta semanal
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Função para obter o user_id correto da tabela public.users
  const getUserId = async () => {
    console.log('🔍 getUserId - userProfile:', userProfile)
    if (!userProfile?.id) {
      console.log('❌ getUserId - userProfile.id não encontrado')
      return null
    }
    
    try {
      console.log('🔍 getUserId - Buscando user_id para auth_id:', userProfile.id)
      // Buscar o user_id da tabela public.users usando o auth_id
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userProfile.id)
        .single()
      
      if (error) {
        console.error('❌ Erro ao buscar user_id:', error)
        console.log('🔄 getUserId - Usando fallback para auth_id:', userProfile.id)
        return userProfile.id // fallback para auth_id
      }
      
      console.log('✅ getUserId - user_id encontrado:', user.id, 'para auth_id:', userProfile.id)
      return user.id
    } catch (error) {
      console.error('❌ Erro ao resolver user_id:', error)
      console.log('🔄 getUserId - Usando fallback para auth_id:', userProfile.id)
      return userProfile.id // fallback para auth_id
    }
  }

  const fetchUserPoints = async () => {
    console.log('🎮 fetchUserPoints - INÍCIO DA FUNÇÃO')
    try {
      console.log('🎮 fetchUserPoints - Iniciando busca de pontos')
      if (!userProfile?.id) {
        console.log('❌ fetchUserPoints - userProfile.id não encontrado')
        return
      }

      console.log('🎮 fetchUserPoints - Chamando getUserId()')
      // Usar user_id correto da tabela public.users
      const userId = await getUserId()
      console.log('🔑 fetchUserPoints - userId resolvido:', userId)
      if (!userId) {
        console.log('❌ fetchUserPoints - userId é null, retornando')
        return
      }
      
      console.log('🎮 fetchUserPoints - Preparando requisição')
      // Buscar pontos do usuário
      console.log('📡 fetchUserPoints - Fazendo requisição para:', `/gamification/users/${userId}/points`)
      
      console.log('🚀 fetchUserPoints - ANTES da requisição para /points')
      try {
        console.log('🚀 fetchUserPoints - Executando apiClient.get...')
        const pointsResponse = await apiClient.get(`/gamification/users/${userId}/points`)
        console.log('📊 fetchUserPoints - Resposta completa:', pointsResponse)
        console.log('📊 fetchUserPoints - Resposta.data:', pointsResponse.data)
        
        // O apiClient retorna { data, status, statusText, headers, success }
        const responseData = pointsResponse.data || pointsResponse
        console.log('📊 fetchUserPoints - Dados extraídos:', responseData)
        
        if (responseData) {
          const newUserPoints = {
            total: responseData.total || 0,
            level: responseData.level || 1,
            nextLevelPoints: responseData.nextLevelPoints || 100,
            weeklyPoints: 0 // Será calculado separadamente
          }
          console.log('✅ fetchUserPoints - Definindo userPoints:', newUserPoints)
          setUserPoints(newUserPoints)
          console.log('✅ fetchUserPoints - userPoints definido com sucesso')
        }
      } catch (apiError) {
        console.error('❌ fetchUserPoints - Erro ESPECÍFICO na requisição da API:', apiError)
        console.error('❌ fetchUserPoints - Detalhes do erro:', apiError.response || apiError.message)
        throw apiError
      }
      console.log('🚀 fetchUserPoints - DEPOIS da requisição para /points')

      // Buscar estatísticas do usuário
      const statsResponse = await apiClient.get(`/gamification/users/${userId}/stats`)
      
      if (statsResponse) {
        setUserStats({
          badges: statsResponse.badges || 0,
          checkins: statsResponse.checkins || 0,
          conversations: statsResponse.conversations || 0
        })
      }

      // Calcular pontos semanais com base nas transações dos últimos 7 dias
      try {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const transactionsResponse = await apiClient.get(`/gamification/users/${userId}/points/transactions?since=${weekAgo.toISOString()}`)
        // A API retorna um array diretamente
        const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : (transactionsResponse?.data || [])
        const weeklyPoints = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
        
        setUserPoints(prev => ({
          ...prev,
          weeklyPoints
        }))
      } catch (transactionError) {
        // Fallback: estimar pontos semanais como 30% dos pontos totais
        setUserPoints(prev => ({
          ...prev,
          weeklyPoints: Math.floor((prev.total || 0) * 0.3)
        }))
      }

    } catch (error) {
      console.error('❌ fetchUserPoints - Erro geral na função:', error)
      console.error('❌ fetchUserPoints - Stack trace:', error.stack)
      setError(error.message)
    } finally {
      console.log('🎮 fetchUserPoints - FIM DA FUNÇÃO')
    }
  }

  const fetchRecentActivities = async () => {
    try {
      if (!userProfile?.id) {
        console.log('❌ UserProfile não disponível para atividades recentes')
        return
      }

      console.log('🎯 Buscando atividades recentes para usuário:', userProfile?.id)

      // Usar getUserId para buscar atividades recentes
      const userId = await getUserId()
      console.log('🎯 User ID para atividades:', userId)
      
      if (!userId) return
      
      // Buscar atividades recentes
      const activitiesResponse = await apiClient.get(`/gamification/users/${userId}/activities?limit=10`)
      console.log('🎯 Resposta completa das atividades:', activitiesResponse)
      console.log('🎯 Dados das atividades:', activitiesResponse?.data)
      console.log('🎯 Tipo da resposta:', typeof activitiesResponse)
      console.log('🎯 É array?', Array.isArray(activitiesResponse))
      
      if (activitiesResponse && Array.isArray(activitiesResponse)) {
        console.log('✅ Definindo atividades recentes:', activitiesResponse.length, 'itens')
        setRecentActivities(activitiesResponse)
      } else if (activitiesResponse?.data && Array.isArray(activitiesResponse.data)) {
        console.log('✅ Definindo atividades recentes (via .data):', activitiesResponse.data.length, 'itens')
        setRecentActivities(activitiesResponse.data)
      } else {
        console.log('❌ Nenhuma atividade encontrada ou formato inválido')
        setRecentActivities([])
      }
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error)
      setRecentActivities([])
    }
  }

  const fetchUserGoals = async () => {
    try {
      const userId = await getUserId()
      
      if (!userId) {
        return
      }
      
      // Buscar meta mensal atual
      const monthlyGoal = await GoalsService.getCurrentMonthlyGoal(userId)
      console.log('🎯 Meta mensal retornada:', monthlyGoal)
      console.log('🎯 Tipo da meta mensal:', typeof monthlyGoal)
      
      if (monthlyGoal) {
        // Atualizar o progresso da meta mensal com os pontos atuais
        const updatedGoal = {
          ...monthlyGoal,
          current_value: userPoints.total || 0
        }
        
        setUserGoals(prev => ({
          ...prev,
          monthlyGoal: updatedGoal
        }))
        
        // Atualizar no backend se necessário
        if (monthlyGoal.current_value !== (userPoints.total || 0)) {
          try {
            await GoalsService.updateMonthlyProgress(userId, userPoints.total || 0)
          } catch (updateError) {
            console.error('Erro ao atualizar progresso no backend:', updateError)
          }
        }
      } else {
        // Se não há meta mensal, tentar criar uma automaticamente
        console.log('🎯 Nenhuma meta mensal encontrada, criando automaticamente')
        try {
          const createdGoal = await GoalsService.createMonthlyGoal(userId, userPoints.level || 1)
          if (createdGoal) {
            const updatedGoal = {
              ...createdGoal,
              current_value: userPoints.total || 0
            }
            setUserGoals(prev => ({
              ...prev,
              monthlyGoal: updatedGoal
            }))
            console.log('✅ Meta mensal criada automaticamente:', createdGoal)
          } else {
            throw new Error('Falha ao criar meta mensal')
          }
        } catch (createError) {
          console.error('❌ Erro ao criar meta mensal automaticamente:', createError)
          // Fallback: usar meta local sem salvar no backend
          const fallbackGoal = {
            target_value: Math.max(500, (userPoints.level || 1) * 100),
            current_value: userPoints.total || 0,
            goal_type: 'monthly_points',
            status: 'active',
            is_fallback: true
          }
          setUserGoals(prev => ({
            ...prev,
            monthlyGoal: fallbackGoal
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar metas do usuário:', error)
      // Fallback: usar meta baseada no nível do usuário
      const fallbackGoal = {
        target_value: Math.max(500, (userPoints.level || 1) * 100),
        current_value: userPoints.total || 0,
        goal_type: 'monthly_points',
        status: 'active',
        is_fallback: true
      }
      setUserGoals(prev => ({
        ...prev,
        monthlyGoal: fallbackGoal
      }))
    }
  }



  const refreshData = async () => {
    console.log('🔄 refreshData - Iniciando atualização de dados')
    setLoading(true)
    setError(null)
    
    try {
      // Carregar pontos e atividades primeiro
      console.log('📊 refreshData - Carregando pontos e atividades')
      
      console.log('🔄 refreshData - Chamando fetchUserPoints()')
      try {
        await fetchUserPoints()
        console.log('✅ refreshData - fetchUserPoints() concluído')
      } catch (pointsError) {
        console.error('❌ refreshData - Erro em fetchUserPoints():', pointsError)
      }
      
      console.log('🔄 refreshData - Chamando fetchRecentActivities()')
      try {
        await fetchRecentActivities()
        console.log('✅ refreshData - fetchRecentActivities() concluído')
      } catch (activitiesError) {
        console.error('❌ refreshData - Erro em fetchRecentActivities():', activitiesError)
      }
      
      // Carregar metas depois dos pontos (já inclui atualização automática do progresso)
      console.log('🎯 refreshData - Carregando metas')
      await fetchUserGoals()
      
      console.log('✅ refreshData - Dados carregados com sucesso')
    } catch (error) {
      console.error('❌ refreshData - Erro ao atualizar dados de gamificação:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🎮 useEffect - userProfile?.id:', userProfile?.id, 'isInitialized:', isInitialized)
    if (userProfile?.id && !isInitialized) {
      console.log('🎮 Inicializando gamificação para usuário:', userProfile.id)
      refreshData().finally(() => {
        setIsInitialized(true)
      })
    } else if (!userProfile?.id) {
      console.log('🎮 useEffect - userProfile não encontrado, resetando estado')
      setLoading(false)
      setIsInitialized(false)
    } else {
      console.log('🎮 useEffect - Condições não atendidas para inicialização')
    }
  }, [userProfile?.id, isInitialized])

  // Forçar nova busca da meta mensal
  useEffect(() => {
    if (userProfile?.id) {
      const forceGoalRefresh = async () => {
        try {
          console.log('🔄 Forçando nova busca da meta mensal...');
          await fetchUserGoals();
        } catch (error) {
          console.error('🔄 Erro ao forçar busca da meta:', error);
        }
      };
      // Aguardar um pouco para garantir que os pontos foram carregados
      setTimeout(forceGoalRefresh, 2000);
    }
  }, [userProfile?.id])

  const updateGoalProgress = async (goalId, currentValue) => {
    try {
      const userId = await getUserId()
      await GoalsService.updateGoal(userId, goalId, { current_value: currentValue })
      await fetchUserGoals() // Recarregar metas após atualização
    } catch (error) {
      console.error('Erro ao atualizar progresso da meta:', error)
    }
  }

  return {
    userPoints,
    userStats,
    userGoals,
    recentActivities,
    loading,
    error,
    refreshData,
    updateGoalProgress
  }
}