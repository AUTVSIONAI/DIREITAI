import React, { useState, useEffect } from 'react'
import { Award, Trophy, Star, Lock, Calendar, Target, Users, Zap, BookOpen, MapPin } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { apiRequest } from '../../../utils/apiClient'
import { supabase } from '../../../lib/supabase'

const Achievements = () => {
  const { userProfile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const categories = [
    { id: 'all', name: 'Todas', icon: Award },
    { id: 'checkin', name: 'Check-ins', icon: MapPin },
    { id: 'social', name: 'Social', icon: Users },
    { id: 'ai', name: 'IA', icon: Zap },
    { id: 'learning', name: 'Aprendizado', icon: BookOpen },
    { id: 'special', name: 'Especiais', icon: Star }
  ]

  // Definir conquistas disponíveis com suas configurações
  const availableAchievements = [
    {
      id: 'first_quiz',
      title: 'Primeiro Quiz',
      description: 'Completou seu primeiro quiz da Constituição',
      category: 'learning',
      icon: BookOpen,
      points: 20,
      rarity: 'common'
    },
    {
      id: 'perfect_score',
      title: 'Pontuação Perfeita',
      description: 'Acertou todas as questões em um quiz',
      category: 'learning',
      icon: Trophy,
      points: 50,
      rarity: 'rare'
    },
    {
      id: 'expert_level',
      title: 'Nível Expert',
      description: 'Obteve 90% ou mais de acertos em um quiz',
      category: 'learning',
      icon: Target,
      points: 30,
      rarity: 'uncommon'
    },
    {
      id: 'quiz_enthusiast',
      title: 'Entusiasta dos Quizzes',
      description: 'Completou 5 quizzes da Constituição',
      category: 'learning',
      icon: BookOpen,
      points: 40,
      rarity: 'uncommon'
    },
    {
      id: 'constitution_scholar',
      title: 'Estudioso da Constituição',
      description: 'Completou 10 quizzes da Constituição',
      category: 'learning',
      icon: Star,
      points: 60,
      rarity: 'epic'
    }
  ]

  // Buscar conquistas reais do usuário
  useEffect(() => {
    const fetchAchievements = async () => {
      console.log('🔍 Achievements - userProfile:', userProfile)
      console.log('🔍 Achievements - userProfile.id:', userProfile?.id)
      
      if (!userProfile?.id) {
        console.log('❌ Achievements - userProfile.id não encontrado, retornando')
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        console.log('🚀 Achievements - Fazendo requisição para:', `/gamification/users/${userProfile.id}/achievements`)
        
        // Usar a nova API de gamificação
        const response = await apiRequest(`/gamification/users/${userProfile.id}/achievements`)
        
        console.log('📥 Achievements - Resposta recebida:', response)
        
        if (!response.success) {
          console.error('Erro ao buscar conquistas:', response.error)
          setError('Erro ao carregar conquistas')
          return
        }
        
        // A API de gamificação já retorna as conquistas formatadas
        const achievementsData = response.data || []
        
        // Mapear para o formato esperado pelo componente
        const mappedAchievements = achievementsData.map(achievement => {
          // Mapear ícones baseado na categoria
          let IconComponent = Award
          switch (achievement.category) {
            case 'learning':
              IconComponent = BookOpen
              break
            case 'checkin':
              IconComponent = MapPin
              break
            case 'ai':
              IconComponent = Zap
              break
            case 'social':
              IconComponent = Users
              break
            case 'special':
              IconComponent = Star
              break
            default:
              IconComponent = Award
          }
          
          return {
            id: achievement.id,
            title: achievement.name,
            description: achievement.description,
            category: achievement.category,
            icon: IconComponent,
            points: achievement.points,
            rarity: achievement.rarity,
            unlocked: achievement.unlocked,
            unlockedAt: achievement.unlockedAt,
            progress: achievement.progress ? {
              current: achievement.progress,
              total: 100
            } : null
          }
        })
        
        setAchievements(mappedAchievements)
        
      } catch (error) {
        console.error('Erro ao carregar conquistas:', error)
        setError('Erro ao carregar conquistas')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAchievements()
  }, [userProfile?.id])

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  )

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0)

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'uncommon': return 'text-green-600 bg-green-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRarityLabel = (rarity) => {
    switch (rarity) {
      case 'common': return 'Comum'
      case 'uncommon': return 'Incomum'
      case 'rare': return 'Raro'
      case 'epic': return 'Épico'
      case 'legendary': return 'Lendário'
      default: return 'Comum'
    }
  }

  const getProgressPercentage = (achievement) => {
    // Se não há progresso definido, retorna 100% para achievements desbloqueados ou 0% para bloqueados
    if (!achievement.progress || !achievement.progress.current || !achievement.progress.total) {
      return achievement.unlocked ? 100 : 0
    }
    return Math.min((achievement.progress.current / achievement.progress.total) * 100, 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conquistas</h2>
          <p className="text-gray-600">Acompanhe seu progresso e desbloqueie recompensas</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{unlockedAchievements.length}</h3>
          <p className="text-sm text-gray-600">Conquistas Desbloqueadas</p>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
            <Star className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalPoints}</h3>
          <p className="text-sm text-gray-600">Pontos de Conquistas</p>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {achievements.length > 0 ? Math.round((unlockedAchievements.length / achievements.length) * 100) : 0}%
          </h3>
          <p className="text-sm text-gray-600">Progresso Total</p>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {unlockedAchievements.filter(a => a.rarity === 'legendary' || a.rarity === 'epic').length}
          </h3>
          <p className="text-sm text-gray-600">Conquistas Raras</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map(category => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{category.name}</span>
            </button>
          )
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Carregando conquistas...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Achievements Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map(achievement => {
          const Icon = achievement.icon
          const isUnlocked = achievement.unlocked
          const progressPercentage = getProgressPercentage(achievement)
          
          return (
            <div
              key={achievement.id}
              className={`card transition-all duration-200 ${
                isUnlocked 
                  ? 'hover:shadow-lg border-l-4 border-l-green-500' 
                  : 'opacity-75 hover:opacity-90'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                  isUnlocked 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {isUnlocked ? (
                    <Icon className="h-6 w-6" />
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`font-semibold ${
                      isUnlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getRarityColor(achievement.rarity)
                    }`}>
                      {getRarityLabel(achievement.rarity)}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    isUnlocked ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar */}
                  {!isUnlocked && achievement.progress && achievement.progress.current !== undefined && achievement.progress.total !== undefined && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progresso</span>
                        <span>{achievement.progress.current}/{achievement.progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className={`text-sm font-medium ${
                        isUnlocked ? 'text-yellow-600' : 'text-gray-400'
                      }`}>
                        {achievement.points} pontos
                      </span>
                    </div>
                    
                    {isUnlocked && achievement.unlockedAt && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Recent Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conquistas Recentes</h3>
          <div className="space-y-3">
            {unlockedAchievements
              .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
              .slice(0, 3)
              .map(achievement => {
                const Icon = achievement.icon
                return (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">
                        Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-600">+{achievement.points}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Dicas para Conquistar Mais</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Participe regularmente de manifestações para desbloquear conquistas de check-in</li>
              <li>• Use o DireitaIA diariamente para progredir nas conquistas de IA</li>
              <li>• Convide amigos para ganhar pontos sociais</li>
              <li>• Mantenha uma sequência diária para conquistas especiais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Achievements