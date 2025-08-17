import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Users, Clock, MessageCircle, ThumbsUp, Flag, Vote, Send } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../lib/api'
import { supabase } from '../lib/supabase'

const SurveyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [survey, setSurvey] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchSurveyDetail()
    fetchComments()
  }, [id])

  const fetchSurveyDetail = async () => {
    try {
      setLoading(true)
      
      // Configurar token de autenticação se disponível
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.get(`/surveys/${id}`)
      if (response.success) {
        // A API retorna os dados da pesquisa diretamente em response.data
        setSurvey(response.data)
      } else {
        console.error('Pesquisa não encontrada')
        navigate('/pesquisas')
      }
    } catch (error) {
      console.error('Erro ao carregar pesquisa:', error)
      navigate('/pesquisas')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      // Configurar token de autenticação se disponível
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.get(`/surveys/${id}/comments`)
      if (response.success) {
        setComments(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    }
  }

  const handleVote = async (option) => {
    if (!user) {
      alert('Você precisa estar logado para votar')
      return
    }

    // Verificar se o usuário já votou
    if (survey.user_voted) {
      alert(`Você já votou nesta pesquisa!\n\nSeu voto: ${survey.user_voted}`)
      return
    }

    try {
      // Configurar token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.post(`/surveys/${id}/vote`, { opcao_id: option })

      if (response.success) {
        fetchSurveyDetail() // Recarregar pesquisa
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
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Você precisa estar logado para comentar')
      return
    }
    if (!newComment.trim()) return

    try {
      setSubmittingComment(true)
      
      // Configurar token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.post(`/surveys/${id}/comments`, { comentario: newComment.trim() })

      if (response.success) {
        setNewComment('')
        fetchComments() // Recarregar comentários
        fetchSurveyDetail() // Atualizar contador de comentários
      } else {
        alert(response.error?.message || 'Erro ao enviar comentário')
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      alert('Erro ao enviar comentário')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleLikeComment = async (commentId) => {
    if (!user) {
      alert('Você precisa estar logado para curtir')
      return
    }

    try {
      // Configurar token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      }
      
      const response = await apiClient.post(`/surveys/comments/${commentId}/like`)

      if (response.success) {
        fetchComments() // Recarregar comentários
      }
    } catch (error) {
      console.error('Erro ao curtir comentário:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expirationDate) => {
    return new Date(expirationDate) < new Date()
  }

  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center justify-center">
        <div className="text-white text-xl">Carregando pesquisa...</div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center justify-center">
        <div className="text-white text-xl">Pesquisa não encontrada</div>
      </div>
    )
  }

  const expired = isExpired(survey.expiracao)
  const totalVotes = survey.total_votes || 0
  const userVoted = survey.user_voted

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/pesquisas')}
              className="p-2 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-primary-700" />
            </button>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes da Pesquisa</h1>
                <p className="text-gray-600">Participe e veja os resultados em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações da Pesquisa */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{survey.titulo}</h2>
              {survey.descricao && (
                <p className="text-gray-600 mb-4 text-lg">{survey.descricao}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{totalVotes} votos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Expira em {formatDate(survey.expiracao)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length} comentários</span>
                </div>
                {survey.tipo === 'multipla' && (
                  <span className="bg-blue-500/30 px-2 py-1 rounded text-xs">Múltipla escolha</span>
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Opções de Voto</h3>
            {survey.opcoes && Array.isArray(survey.opcoes) ? survey.opcoes.map((option, index) => {
              const votes = survey.vote_counts?.[option] || 0
              const percentage = calculatePercentage(votes, totalVotes)
              const isSelected = userVoted === option

              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleVote(option)}
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
                      <span className="text-gray-900 font-medium text-lg">{option}</span>
                      <div className="flex items-center space-x-3">
                        {(expired || userVoted) && (
                          <span className="text-gray-600">{votes} votos ({percentage}%)</span>
                        )}
                        {isSelected && <Vote className="h-5 w-5 text-primary-600" />}
                      </div>
                    </div>
                    {(expired || userVoted) && (
                      <div className="mt-3 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </button>
                </div>
              )
            }) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma opção de voto disponível</p>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Comentários */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-soft">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <MessageCircle className="h-6 w-6" />
            <span>Comentários ({comments.length})</span>
          </h3>

          {/* Formulário de Novo Comentário */}
          {user && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Compartilhe sua opinião sobre esta pesquisa..."
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-right text-gray-500 text-sm mt-1">
                    {newComment.length}/500
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{submittingComment ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Lista de Comentários */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
              </div>
            ) : (
              Array.isArray(comments) ? comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {comment.usuario_nome?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">{comment.usuario_nome || 'Usuário'}</span>
                        <span className="text-gray-500 text-sm">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-800 mb-3">{comment.comentario}</p>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center space-x-1 text-sm transition-colors ${
                            comment.user_liked ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{comment.likes_count || 0}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-error-600 text-sm transition-colors">
                          <Flag className="h-4 w-4" />
                          <span>Denunciar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum comentário disponível</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveyDetail