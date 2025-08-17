import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Clock, Users, TrendingUp, MessageCircle, Vote, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../lib/api'
import { supabase } from '../lib/supabase'

const Surveys = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // active, completed, all
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingVote, setPendingVote] = useState(null)

  useEffect(() => {
    fetchSurveys()
  }, [filter])

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      
      // Configurar token de autenticação se disponível
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.get(`/surveys?status=${filter}&search=${searchTerm}`)
      // A API retorna { success: true, data: [...], pagination: {...} }
      // response.data é o objeto completo da API, então precisamos acessar response.data.data
      setSurveys(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVoteClick = (surveyId, option, surveyTitle, optionText, userVoted) => {
    if (!user) {
      alert('Você precisa estar logado para votar')
      return
    }

    // Verificar se o usuário já votou
    if (userVoted) {
      const survey = surveys.find(s => s.id === surveyId)
      const votedOption = survey?.opcoes.find(opt => (opt.id || opt.texto || opt) === userVoted)
      const votedOptionText = votedOption?.texto || votedOption || userVoted
      
      alert(`Você já votou nesta pesquisa!\n\nSeu voto: ${votedOptionText}`)
      return
    }

    setPendingVote({ surveyId, option, surveyTitle, optionText })
    setShowConfirmModal(true)
  }

  const confirmVote = async () => {
    if (!pendingVote) return

    try {
      // Configurar token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.post(`/surveys/${pendingVote.surveyId}/vote`, { opcao_id: pendingVote.option })

      if (response.success) {
        fetchSurveys() // Recarregar pesquisas
        alert('Voto registrado com sucesso!')
      } else {
        const error = response.error
        if (error.previous_vote) {
          alert(`Você já votou nesta pesquisa!\n\nSeu voto anterior: ${error.previous_vote.opcao_texto}\nData do voto: ${new Date(error.previous_vote.data_voto).toLocaleString('pt-BR')}`)
        } else {
          alert(error.message || 'Erro ao votar')
        }
      }
    } catch (error) {
      console.error('Erro ao votar:', error)
      alert('Erro ao registrar voto')
    } finally {
      setShowConfirmModal(false)
      setPendingVote(null)
    }
  }

  const cancelVote = () => {
    setShowConfirmModal(false)
    setPendingVote(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isExpired = (expirationDate) => {
    return new Date(expirationDate) < new Date()
  }

  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && !isExpired(survey.expiracao)) ||
      (filter === 'completed' && isExpired(survey.expiracao))
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Carregando pesquisas...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-primary-700 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar</span>
              </button>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Pesquisas DireitaJá</h1>
                  <p className="text-gray-600">Participe das pesquisas e faça sua voz ser ouvida</p>
                </div>
              </div>
            </div>
            <Link
              to="/resultados"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Ver Resultados
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-soft">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ativas
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Encerradas
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
            </div>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar pesquisas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Lista de Pesquisas */}
        <div className="grid gap-6">
          {filteredSurveys.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-soft">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma pesquisa encontrada</h3>
              <p className="text-gray-600">Não há pesquisas disponíveis no momento.</p>
            </div>
          ) : (
            filteredSurveys.map((survey) => {
              const expired = isExpired(survey.expiracao)
              const totalVotes = survey.total_votes || 0
              const userVoted = survey.user_voted

              return (
                <div key={survey.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{survey.titulo}</h3>
                      {survey.descricao && (
                        <p className="text-gray-600 mb-3">{survey.descricao}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{totalVotes} votos</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Expira em {formatDate(survey.expiracao)}</span>
                        </div>
                        {survey.tipo === 'multipla' && (
                          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">Múltipla escolha</span>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      expired ? 'bg-error-100 text-error-700' : 'bg-success-100 text-success-700'
                    }`}>
                      {expired ? 'Encerrada' : 'Ativa'}
                    </div>
                  </div>

                  {/* Opções de Voto */}
                  <div className="space-y-3">
                    {survey.opcoes.map((option, index) => {
                      const optionKey = option.id || option.texto || option
                      const votes = survey.vote_counts?.[optionKey] || 0
                      const percentage = calculatePercentage(votes, totalVotes)
                      const isSelected = userVoted === optionKey

                      return (
                        <div key={index} className="relative">
                          <button
                            onClick={() => handleVoteClick(survey.id, option.id || option, survey.titulo, option.texto || option, userVoted)}
                            disabled={expired}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                              expired
                                ? 'cursor-not-allowed bg-gray-50 border-gray-200'
                                : userVoted
                                ? 'cursor-pointer bg-gray-50 border-gray-300 hover:bg-gray-100'
                                : 'hover:bg-primary-50 bg-white border-primary-200 hover:border-primary-300'
                            } ${
                              isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-900 font-medium">{option.texto || option}</span>
                              <div className="flex items-center space-x-2">
                                {(expired || userVoted) && (
                                  <span className="text-gray-600 text-sm">{percentage}%</span>
                                )}
                                {isSelected && <Vote className="h-4 w-4 text-primary-600" />}
                              </div>
                            </div>
                            {(expired || userVoted) && (
                              <div className="mt-2 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        {survey.comentarios_count > 0 && (
                          <div className="flex items-center space-x-1 text-gray-600">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">{survey.comentarios_count} comentários</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/pesquisa/${survey.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Voto */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Voto</h3>
            <p className="text-gray-600 mb-2">
              <strong>Pesquisa:</strong> {pendingVote?.surveyTitle}
            </p>
            <p className="text-gray-600 mb-6">
              <strong>Sua escolha:</strong> {pendingVote?.optionText}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja registrar este voto? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelVote}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmVote}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Confirmar Voto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Surveys