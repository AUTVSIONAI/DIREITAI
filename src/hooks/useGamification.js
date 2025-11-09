import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api'
import { GamificationService } from '../services/gamification'
import { GoalsService } from '../services/goals'

export const useGamification = () => {
  const { userProfile } = useAuth()
  
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

  // Obter user_id diretamente do perfil (já mapeado para users.id no AuthProvider)
  const getUserId = async () => {
    return userProfile?.id || null
  }

  const fetchUserPoints = async () => {
    try {
      if (!userProfile?.id) {
        return
      }

      const userId = await getUserId()
      if (!userId) {
        return
      }
      
      try {
        const pointsResponse = await apiClient.get(`/gamification/users/${userId}/points`)
        const responseData = pointsResponse.data || pointsResponse
        
        if (responseData) {
          const newUserPoints = {
            total: responseData.total || 0,
            level: responseData.level || 1,
            nextLevelPoints: responseData.nextLevelPoints || 100,
            weeklyPoints: 0 // Será calculado separadamente
          }
          setUserPoints(newUserPoints)
        }
      } catch (apiError) {
        console.error('❌ Erro ao buscar pontos:', apiError)
        throw apiError
      }

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
      setError(error.message)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      if (!userProfile?.id) {
        return
      }

      const userId = await getUserId()
      if (!userId) return
      
      const activitiesResponse = await apiClient.get(`/gamification/users/${userId}/activities?limit=10`)
      
      if (activitiesResponse && Array.isArray(activitiesResponse)) {
        setRecentActivities(activitiesResponse)
      } else if (activitiesResponse?.data && Array.isArray(activitiesResponse.data)) {
        setRecentActivities(activitiesResponse.data)
      } else {
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
      
      const monthlyGoal = await GoalsService.getCurrentMonthlyGoal(userId)
      
      if (monthlyGoal) {
        const updatedGoal = {
          ...monthlyGoal,
          current_value: userPoints.total || 0
        }
        
        setUserGoals(prev => ({
          ...prev,
          monthlyGoal: updatedGoal
        }))
        
        if (monthlyGoal.current_value !== (userPoints.total || 0)) {
          try {
            await GoalsService.updateMonthlyProgress(userId, userPoints.total || 0)
          } catch (updateError) {
            console.error('Erro ao atualizar progresso no backend:', updateError)
          }
        }
      } else {
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
          } else {
            throw new Error('Falha ao criar meta mensal')
          }
        } catch (createError) {
          console.error('Erro ao criar meta mensal automaticamente:', createError)
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

  useEffect(() => {
    const init = async () => {
      if (!userProfile?.id) return
      await Promise.all([
        fetchUserPoints(),
        fetchRecentActivities(),
        fetchUserGoals()
      ])
      setIsInitialized(true)
      setLoading(false)
    }
    init()
  }, [userProfile?.id])

  return {
    userPoints,
    userStats,
    userGoals,
    recentActivities,
    loading,
    error,
    isInitialized
  }
}