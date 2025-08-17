import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Users, Calendar, Award, MapPin } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiClient } from '../lib/api'
import { supabase } from '../lib/supabase'

const SurveyResults = () => {
  const [surveys, setSurveys] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all') // all, week, month

  useEffect(() => {
    fetchResults()
    fetchStats()
  }, [selectedPeriod])

  const fetchResults = async () => {
    try {
      setLoading(true)
      
      // Configurar token de autenticação se disponível
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.get(`/surveys/results?period=${selectedPeriod}`)
      setSurveys(response.data?.surveys || [])
    } catch (error) {
      console.error('Erro ao carregar resultados:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Configurar token de autenticação se disponível
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.get(`/surveys/stats?period=${selectedPeriod}`)
      setStats(response.data || {})
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  const prepareChartData = (survey) => {
    const totalVotes = survey.total_votes || 0
    return survey.opcoes.map((option, index) => {
      const votes = survey.vote_counts?.[option] || 0
      const percentage = calculatePercentage(votes, totalVotes)
      return {
        name: option,
        value: votes,
        percentage,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      }
    })
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-primary-900 text-xl">Carregando resultados...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resultados das Pesquisas</h1>
                <p className="text-gray-600">Análise completa dos resultados e tendências</p>
              </div>
            </div>
            <Link
              to="/pesquisas"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Voltar às Pesquisas
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros de Período */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Período de Análise</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Última Semana
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Último Mês
              </button>
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos os Tempos
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <div>
                <p className="text-gray-600 text-sm">Total de Pesquisas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSurveys || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-secondary-600" />
              <div>
                <p className="text-gray-600 text-sm">Total de Votos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVotes || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-success-600" />
              <div>
                <p className="text-gray-600 text-sm">Participação Média</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageParticipation || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-warning-600" />
              <div>
                <p className="text-gray-600 text-sm">Mais Votada</p>
                <p className="text-lg font-bold text-gray-900 truncate">{stats.mostVoted?.titulo || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking das Pesquisas Mais Votadas */}
        {stats.topSurveys && stats.topSurveys.length > 0 && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-soft border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Award className="h-6 w-6 text-warning-600" />
              <span>Ranking - Pesquisas Mais Votadas</span>
            </h2>
            <div className="space-y-4">
              {stats.topSurveys.map((survey, index) => (
                <div key={survey.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-warning-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-warning-600 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{survey.titulo}</h3>
                    <p className="text-gray-600 text-sm">{survey.total_votes} votos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-medium">{survey.total_votes}</p>
                    <p className="text-gray-600 text-sm">votos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados Detalhados */}
        <div className="space-y-8">
          {surveys.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-soft border border-gray-200">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-600">Não há resultados disponíveis para o período selecionado.</p>
            </div>
          ) : (
            surveys.map((survey) => {
              const chartData = prepareChartData(survey)
              const totalVotes = survey.total_votes || 0

              return (
                <div key={survey.id} className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{survey.titulo}</h3>
                      {survey.descricao && (
                        <p className="text-gray-700 mb-3">{survey.descricao}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{totalVotes} votos</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Criada em {formatDate(survey.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Expirou em {formatDate(survey.expiracao)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Gráfico de Pizza */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribuição dos Votos</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Gráfico de Barras */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparação de Votos</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'white', fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fill: 'white' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.8)', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: 'white'
                            }}
                          />
                          <Bar dataKey="value" fill="#8884d8">
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Resultados Detalhados */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Resultados Detalhados</h4>
                    <div className="space-y-3">
                      {chartData.map((option, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{option.name}</span>
                            <div className="text-right">
                              <span className="text-white font-bold">{option.value} votos</span>
                              <span className="text-white/70 ml-2">({option.percentage}%)</span>
                            </div>
                          </div>
                          <div className="bg-white/20 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${option.percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default SurveyResults