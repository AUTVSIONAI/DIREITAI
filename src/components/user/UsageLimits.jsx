import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { apiClient } from '../../lib/api.ts'
import { 
  MessageCircle, 
  Search, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Sparkles
} from 'lucide-react'

const UsageLimits = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [usageStats, setUsageStats] = useState(null)
  const [planInfo, setPlanInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userProfile?.id) {
      fetchUsageData()
    }
  }, [userProfile])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      
      // Buscar estatísticas de uso
      const usageResponse = await apiClient.get('/users/usage-stats')
      setUsageStats(usageResponse.data)
      
      // Buscar informações do plano
      const planResponse = await apiClient.get('/users/plan-info')
      setPlanInfo(planResponse.data)
      
      // Buscar dados da IA Criativa
      try {
        const creativeResponse = await apiClient.get('/ai/creative-ai/usage')
        setUsageStats(prev => ({
          ...prev,
          creative_ai: {
            used: creativeResponse.data.today?.generations || 0,
            limit: creativeResponse.data.limits?.generations || 0,
            remaining: creativeResponse.data.remaining || 0,
            total: creativeResponse.data.total?.generations || 0
          }
        }))
      } catch (creativeError) {
        console.error('Erro ao carregar dados da IA Criativa:', creativeError)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados de uso:', error)
      setError('Erro ao carregar dados de uso')
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0 // Ilimitado
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (used, limit) => {
    if (limit === -1) return 'green' // Ilimitado
    const percentage = getUsagePercentage(used, limit)
    if (percentage >= 90) return 'red'
    if (percentage >= 70) return 'yellow'
    return 'green'
  }

  const getUsageIcon = (used, limit) => {
    if (limit === -1) return CheckCircle // Ilimitado
    const percentage = getUsagePercentage(used, limit)
    if (percentage >= 90) return AlertTriangle
    if (percentage >= 70) return Clock
    return CheckCircle
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Limites de Uso</h3>
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando limites...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Limites de Uso</h3>
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchUsageData}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!usageStats || !planInfo) {
    return null
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Limites de Uso</h3>
          <p className="text-sm text-gray-600">Plano: {planInfo.current_plan || 'Gratuito'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Hoje</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Conversas com IA */}
        {usageStats.usage?.ai_conversations && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className={`h-4 w-4 text-${getUsageColor(usageStats.usage.ai_conversations.used, usageStats.usage.ai_conversations.limit)}-600`} />
                <span className="text-sm font-medium text-gray-700">Conversas com IA</span>
              </div>
              <div className="flex items-center gap-2">
                {React.createElement(getUsageIcon(usageStats.usage.ai_conversations.used, usageStats.usage.ai_conversations.limit), {
                  className: `h-4 w-4 text-${getUsageColor(usageStats.usage.ai_conversations.used, usageStats.usage.ai_conversations.limit)}-600`
                })}
                <span className="text-sm font-medium text-gray-900">
                  {usageStats.usage.ai_conversations.used}/{usageStats.usage.ai_conversations.limit === -1 ? '∞' : usageStats.usage.ai_conversations.limit}
                </span>
              </div>
            </div>
            {usageStats.usage.ai_conversations.limit !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${getUsageColor(usageStats.usage.ai_conversations.used, usageStats.usage.ai_conversations.limit)}-600 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${getUsagePercentage(usageStats.usage.ai_conversations.used, usageStats.usage.ai_conversations.limit)}%` }}
                />
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Restam: {usageStats.usage.ai_conversations.remaining === -1 ? 'Ilimitado' : usageStats.usage.ai_conversations.remaining}</span>
              <span>Renova em 24h</span>
            </div>
          </div>
        )}

        {/* Análises de Fake News */}
        {usageStats.usage?.fake_news_analyses && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className={`h-4 w-4 text-${getUsageColor(usageStats.usage.fake_news_analyses.used, usageStats.usage.fake_news_analyses.limit)}-600`} />
                <span className="text-sm font-medium text-gray-700">Análises de Fake News</span>
              </div>
              <div className="flex items-center gap-2">
                {React.createElement(getUsageIcon(usageStats.usage.fake_news_analyses.used, usageStats.usage.fake_news_analyses.limit), {
                  className: `h-4 w-4 text-${getUsageColor(usageStats.usage.fake_news_analyses.used, usageStats.usage.fake_news_analyses.limit)}-600`
                })}
                <span className="text-sm font-medium text-gray-900">
                  {usageStats.usage.fake_news_analyses.used}/{usageStats.usage.fake_news_analyses.limit === -1 ? '∞' : usageStats.usage.fake_news_analyses.limit}
                </span>
              </div>
            </div>
            {usageStats.usage.fake_news_analyses.limit !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${getUsageColor(usageStats.usage.fake_news_analyses.used, usageStats.usage.fake_news_analyses.limit)}-600 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${getUsagePercentage(usageStats.usage.fake_news_analyses.used, usageStats.usage.fake_news_analyses.limit)}%` }}
                />
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Restam: {usageStats.usage.fake_news_analyses.remaining === -1 ? 'Ilimitado' : usageStats.usage.fake_news_analyses.remaining}</span>
              <span>Renova em 24h</span>
            </div>
          </div>
        )}

        {/* IA Criativa */}
        {usageStats.creative_ai && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`h-4 w-4 text-${getUsageColor(usageStats.creative_ai.used, usageStats.creative_ai.limit)}-600`} />
                <span className="text-sm font-medium text-gray-700">IA Criativa</span>
              </div>
              <div className="flex items-center gap-2">
                {React.createElement(getUsageIcon(usageStats.creative_ai.used, usageStats.creative_ai.limit), {
                  className: `h-4 w-4 text-${getUsageColor(usageStats.creative_ai.used, usageStats.creative_ai.limit)}-600`
                })}
                <span className="text-sm font-medium text-gray-900">
                  {usageStats.creative_ai.used}/{usageStats.creative_ai.limit === -1 ? '∞' : usageStats.creative_ai.limit}
                </span>
              </div>
            </div>
            {usageStats.creative_ai.limit !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${getUsageColor(usageStats.creative_ai.used, usageStats.creative_ai.limit)}-600 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${getUsagePercentage(usageStats.creative_ai.used, usageStats.creative_ai.limit)}%` }}
                />
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Restam: {usageStats.creative_ai.remaining === -1 ? 'Ilimitado' : usageStats.creative_ai.remaining}</span>
              <span>Renova em 24h</span>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade prompt se necessário */}
      {(usageStats.usage?.ai_conversations?.remaining === 0 || usageStats.usage?.fake_news_analyses?.remaining === 0 || usageStats.creative_ai?.remaining === 0) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Limite atingido</span>
          </div>
          <p className="text-xs text-yellow-700 mb-2">
            Você atingiu o limite do seu plano atual. Faça upgrade para continuar usando.
          </p>
          <button 
            onClick={() => navigate('/plan')}
            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
          >
            Ver Planos
          </button>
        </div>
      )}
    </div>
  )
}

export default UsageLimits