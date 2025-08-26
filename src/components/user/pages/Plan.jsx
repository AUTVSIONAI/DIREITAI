import React, { useState, useEffect } from 'react'
import { Crown, Star, Zap, Check, X, Users, MessageSquare, Trophy, Shield, BarChart3, TrendingUp, Calendar, Sparkles } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { apiRequest } from '../../../utils/apiClient'
import { useNavigate } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const Plan = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedUpgrade, setSelectedUpgrade] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')
  const [usageStats, setUsageStats] = useState(null)
  const [usageHistory, setUsageHistory] = useState([])
  const [planInfo, setPlanInfo] = useState(null)
  const [usageLoading, setUsageLoading] = useState(false)
  const [creativeAIStats, setCreativeAIStats] = useState(null)

  // Planos de fallback
  const fallbackPlans = [
    {
      id: 'gratuito',
      name: 'Patriota Gratuito',
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: Users,
      color: 'gray',
      popular: false,
      features: [
        'Chat DireitaGPT ilimitado (LLM open-source)',
        'IA Criativa: até 5 textos por dia',
        'Detector de Fake News: 1 análise por dia',
        '1 agente político básico',
        'Quiz Constituição + gamificação',
        'Suporte básico por e-mail'
      ],
      limitations: [
        'Funcionalidades limitadas',
        'Sem acesso premium',
        'Suporte básico'
      ]
    },
    {
      id: 'cidadao',
      name: 'Patriota Cidadão',
      monthlyPrice: 19.90,
      yearlyPrice: 199.00,
      icon: Star,
      color: 'blue',
      popular: false,
      features: [
        'Chat DireitaGPT ilimitado',
        'IA Criativa: até 20 textos por dia',
        'Detector de Fake News: 5 análises por dia',
        'Até 3 agentes políticos',
        'Ranking local e check-in em eventos',
        'Suporte prioritário'
      ],
      limitations: []
    },
    {
      id: 'premium',
      name: 'Patriota Premium',
      monthlyPrice: 39.90,
      yearlyPrice: 399.00,
      icon: Zap,
      color: 'green',
      popular: true,
      features: [
        'Chat DireitaGPT ilimitado',
        'IA Criativa: até 50 textos por dia',
        'Detector de Fake News: 15 análises por dia',
        'Agentes políticos ilimitados',
        'Ranking nacional e global',
        'Relatórios simples'
      ],
      limitations: []
    },
    {
      id: 'pro',
      name: 'Patriota Pro',
      monthlyPrice: 69.90,
      yearlyPrice: 699.00,
      icon: Crown,
      color: 'purple',
      popular: false,
      features: [
        'Chat DireitaGPT ilimitado',
        'IA Criativa: até 100 textos por dia',
        'Detector de Fake News: 20 análises por dia',
        'Agentes políticos ilimitados',
        'Relatórios avançados semanais',
        'Pontos em dobro na gamificação',
        'Suporte 24/7'
      ],
      limitations: []
    },
    {
      id: 'elite',
      name: 'Patriota Elite',
      monthlyPrice: 119.90,
      yearlyPrice: 1199.00,
      icon: Trophy,
      color: 'yellow',
      popular: false,
      features: [
        'Chat DireitaGPT ilimitado',
        'IA Criativa: até 100 textos por dia',
        'Detector de Fake News: 30 análises por dia',
        'Agentes políticos ilimitados',
        'Relatórios avançados + badge VIP',
        'Suporte premium'
      ],
      limitations: []
    }
  ]

  // Função para obter classes de cor
  const getColorClasses = (color, variant) => {
    const colors = {
      gray: {
        primary: 'bg-gray-600 text-white',
        secondary: 'bg-gray-100 text-gray-800',
        border: 'border-gray-300',
        text: 'text-gray-600'
      },
      blue: {
        primary: 'bg-blue-600 text-white',
        secondary: 'bg-blue-100 text-blue-800',
        border: 'border-blue-300',
        text: 'text-blue-600'
      },
      green: {
        primary: 'bg-green-600 text-white',
        secondary: 'bg-green-100 text-green-800',
        border: 'border-green-300',
        text: 'text-green-600'
      },
      yellow: {
        primary: 'bg-yellow-600 text-white',
        secondary: 'bg-yellow-100 text-yellow-800',
        border: 'border-yellow-300',
        text: 'text-yellow-600'
      },
      purple: {
        primary: 'bg-purple-600 text-white',
        secondary: 'bg-purple-100 text-purple-800',
        border: 'border-purple-300',
        text: 'text-purple-600'
      }
    }

    return colors[color]?.[variant] || colors.gray[variant] || ''
  }

  // Função para formatar preço
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Função para calcular economia anual
  const calculateSavings = (monthlyPrice, yearlyPrice) => {
    const monthlyCost = monthlyPrice * 12
    const savings = monthlyCost - yearlyPrice
    return savings > 0 ? savings : 0
  }

  // Carregar dados de uso
  const loadUsageData = async () => {
    if (usageLoading) return
    
    setUsageLoading(true)
    try {
      const [statsResponse, historyResponse, planResponse, creativeAIResponse] = await Promise.all([
        apiRequest('/api/users/usage-stats'),
        apiRequest('/api/users/usage-history'),
        apiRequest('/api/users/plan-info'),
        apiRequest('/api/ai/creative-ai/usage')
      ])
      
      // Corrigir acesso aos dados da resposta da API
      setUsageStats(statsResponse?.success ? statsResponse.data : null)
      setUsageHistory(historyResponse?.success && Array.isArray(historyResponse.data?.history) ? historyResponse.data.history : [])
      setPlanInfo(planResponse?.success ? planResponse.data : null)
      setCreativeAIStats(creativeAIResponse?.success ? creativeAIResponse.data : null)
    } catch (error) {
      console.error('Erro ao carregar dados de uso:', error)
      setUsageStats(null)
      setUsageHistory([])
      setPlanInfo(null)
      setCreativeAIStats(null)
    } finally {
      setUsageLoading(false)
    }
  }

  // Carregar dados quando a aba usage for selecionada
  useEffect(() => {
    if (activeTab === 'usage') {
      loadUsageData()
    }
  }, [activeTab])

  // Buscar planos da API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiRequest('/plans')
        if (response && Array.isArray(response)) {
          const transformedPlans = response.map(plan => ({
            ...plan,
            icon: plan.icon === 'Crown' ? Crown : plan.icon === 'Star' ? Star : Users
          }))
          setPlans(transformedPlans)
        } else {
          setPlans(fallbackPlans)
        }
      } catch (error) {
        console.error('Erro ao buscar planos:', error)
        setPlans(fallbackPlans)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])



  const handleUpgrade = (plan) => {
    setSelectedUpgrade(plan)
    setShowUpgradeModal(true)
  }

  const handleConfirmUpgrade = async () => {
    if (!selectedUpgrade) return
    
    try {
      setProcessingPayment(true)
      
      // Criar sessão de checkout do Stripe
      const response = await apiRequest('/payments/checkout', 'POST', {
        planId: selectedUpgrade.id
      })
      
      if (response.success && response.data.url) {
        // Redirecionar para o checkout do Stripe
        window.location.href = response.data.url
      } else {
        throw new Error('Erro ao criar sessão de pagamento')
      }
    } catch (error) {
      console.error('Erro ao processar upgrade:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setProcessingPayment(false)
      setShowUpgradeModal(false)
    }
  }

  // Preparar dados do gráfico usando useMemo para otimização
  const chartData = React.useMemo(() => ({
    labels: (usageHistory || []).map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }),
    datasets: [
      {
        label: 'Conversas IA',
        data: (usageHistory || []).map(item => item.aiConversations),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Análises de Notícias',
        data: (usageHistory || []).map(item => item.newsAnalyses),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  }), [usageHistory])

  const chartOptions = React.useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Uso nos Últimos 7 Dias',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }), [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planos e Uso
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Gerencie seu plano e acompanhe seu uso
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'plans'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Planos
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'usage'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" />
              Dashboard de Uso
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === 'plans' && (
          <>
            {/* Toggle de preço */}
            <div className="mt-12 flex justify-center">
              <div className="relative bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPlan === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    selectedPlan === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Anual
                  <span className="ml-1 text-xs text-green-600 font-semibold">
                    (Economize até 20%)
                  </span>
                </button>
              </div>
            </div>

            {/* Grid de planos */}
            <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
              {plans.map((plan) => {
                const IconComponent = plan.icon
                const price = selectedPlan === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
                const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice)

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-lg shadow-lg divide-y divide-gray-200 ${
                      plan.popular
                        ? 'border-2 border-blue-500 transform scale-105'
                        : 'border border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold bg-blue-500 text-white">
                          Mais Popular
                        </span>
                      </div>
                    )}

                    <div className="p-6 bg-white rounded-t-lg">
                      <div className="flex items-center justify-center">
                        <IconComponent className={`h-8 w-8 ${getColorClasses(plan.color, 'text')}`} />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                        {plan.name}
                      </h3>
                      <div className="mt-4 text-center">
                        <span className="text-4xl font-extrabold text-gray-900">
                          {formatPrice(price)}
                        </span>
                        <span className="text-base font-medium text-gray-500">
                          /{selectedPlan === 'yearly' ? 'ano' : 'mês'}
                        </span>
                      </div>
                      {selectedPlan === 'yearly' && savings > 0 && (
                        <p className="mt-2 text-sm text-green-600 text-center">
                          Economize {formatPrice(savings)} por ano
                        </p>
                      )}
                    </div>

                    <div className="px-6 pt-6 pb-8 bg-white rounded-b-lg">
                      <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                        Recursos incluídos
                      </h4>
                      <ul className="mt-6 space-y-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex space-x-3">
                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {plan.limitations && plan.limitations.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                            Limitações
                          </h4>
                          <ul className="mt-4 space-y-4">
                            {plan.limitations.map((limitation, index) => (
                              <li key={index} className="flex space-x-3">
                                <X className="flex-shrink-0 h-5 w-5 text-red-500" />
                                <span className="text-sm text-gray-500">{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-8">
                        <button
                          onClick={() => handleUpgrade(plan)}
                          className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                            plan.popular
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {userProfile?.plan === plan.id ? 'Plano Atual' : 'Escolher Plano'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Dashboard de Uso */}
        {activeTab === 'usage' && (
          <div className="mt-12">
            {usageLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Informações do plano atual */}
                {planInfo && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Plano Atual: {planInfo.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {planInfo.billingCycle === 'yearly' ? 'Anual' : 'Mensal'} - 
                          Próxima cobrança: {planInfo.nextBilling ? 
                            new Date(planInfo.nextBilling).toLocaleDateString('pt-BR') : 
                            'Não aplicável'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPrice(planInfo.price)}
                        </p>
                        <p className="text-sm text-gray-600">
                          /{planInfo.billingCycle === 'yearly' ? 'ano' : 'mês'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estatísticas de uso */}
                {usageStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <MessageSquare className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Conversas IA</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {usageStats?.usage?.ai_conversations?.used || 0}/{usageStats?.usage?.ai_conversations?.limit || 0}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min(((usageStats?.usage?.ai_conversations?.used || 0) / (usageStats?.usage?.ai_conversations?.limit || 1)) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Shield className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Análises de Notícias</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {usageStats?.usage?.fake_news_analyses?.used || 0}/{usageStats?.usage?.fake_news_analyses?.limit || 0}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min(((usageStats?.usage?.fake_news_analyses?.used || 0) / (usageStats?.usage?.fake_news_analyses?.limit || 1)) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Users className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Agentes Políticos</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {usageStats?.usage?.political_agents?.used || 0}/{(usageStats?.usage?.political_agents?.limit || 0) === -1 ? '∞' : (usageStats?.usage?.political_agents?.limit || 0)}
                          </p>
                          {(usageStats?.usage?.political_agents?.limit || 0) !== -1 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(((usageStats?.usage?.political_agents?.used || 0) / (usageStats?.usage?.political_agents?.limit || 1)) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card da IA Criativa */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Sparkles className="h-8 w-8 text-pink-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">IA Criativa</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {creativeAIStats?.used || 0}/{creativeAIStats?.limit === -1 ? '∞' : (creativeAIStats?.limit || 0)}
                          </p>
                          {creativeAIStats?.limit !== -1 && creativeAIStats?.limit > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-pink-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(((creativeAIStats?.used || 0) / (creativeAIStats?.limit || 1)) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {creativeAIStats?.remaining || 0} restantes
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Calendar className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Dias Restantes</p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {usageStats?.daysRemaining || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            até renovação
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gráfico de uso */}
                {(usageHistory || []).length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Histórico de Uso
                    </h3>
                    <div className="h-80">
                      <Line data={chartData} options={chartOptions} />
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                {usageStats && (
                  <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                      <TrendingUp className="inline-block w-5 h-5 mr-2" />
                      Recomendações
                    </h3>
                    <div className="space-y-2">
                      {((usageStats?.usage?.ai_conversations?.used || 0) / (usageStats?.usage?.ai_conversations?.limit || 1)) > 0.8 && (
                        <p className="text-sm text-blue-800">
                          • Você está próximo do limite de conversas IA. Considere fazer upgrade para continuar usando.
                        </p>
                      )}
                      {((usageStats?.usage?.fake_news_analyses?.used || 0) / (usageStats?.usage?.fake_news_analyses?.limit || 1)) > 0.8 && (
                        <p className="text-sm text-blue-800">
                          • Você está próximo do limite de análises de notícias. Um plano superior oferece mais análises.
                        </p>
                      )}
                      {(usageStats?.daysRemaining || 0) <= 7 && (
                        <p className="text-sm text-blue-800">
                          • Seu plano será renovado em breve. Verifique se está satisfeito com seu plano atual.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Modal de upgrade */}
        {showUpgradeModal && selectedUpgrade && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar Upgrade
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Você deseja fazer upgrade para o plano {selectedUpgrade.name}?
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {formatPrice(selectedPlan === 'yearly' ? selectedUpgrade.yearlyPrice : selectedUpgrade.monthlyPrice)}
                    /{selectedPlan === 'yearly' ? 'ano' : 'mês'}
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 mr-2"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmUpgrade}
                    disabled={processingPayment}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingPayment ? 'Processando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Plan