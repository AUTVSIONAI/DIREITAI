import React, { useState, useEffect } from 'react'
import { Search, Star, Trash2, Filter, TrendingUp, TrendingDown, MessageSquare, Lightbulb, UserCheck } from 'lucide-react'
import { apiClient } from '../../../lib/api'
import { supabase } from '../../../lib/supabase.js'
import { useAuth } from '../../../contexts/AuthContext'

const RatingsManagement = ({ limitToPoliticianId = null, limitToParty = null, isPoliticianView = false }) => {
  const { userProfile } = useAuth()
  const userRole = String(userProfile?.role || '').toLowerCase()
  const effectiveIsPoliticianView = isPoliticianView || userRole === 'politician'

  const [ratings, setRatings] = useState([])
  const [politicians, setPoliticians] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPolitician, setFilterPolitician] = useState('')
  const [filterRating, setFilterRating] = useState('')

  const [resolvedPoliticianId, setResolvedPoliticianId] = useState(limitToPoliticianId)
  const [resolutionAttempted, setResolutionAttempted] = useState(false)

  const [agentStats, setAgentStats] = useState({ conversations: 0, messages: 0, suggestions: 0 })

  useEffect(() => {
    const resolveId = async () => {
      if (limitToPoliticianId) {
        setResolvedPoliticianId(limitToPoliticianId)
        setResolutionAttempted(true)
        return
      }

      if (effectiveIsPoliticianView) {
        if (userProfile?.politician_id) {
          setResolvedPoliticianId(userProfile.politician_id)
          setResolutionAttempted(true)
        } else if (userProfile?.id || userProfile?.email) {
          let foundId = null
          
          // Tentativa 1: Buscar por email (mais provável de existir e funcionar sem erro 400)
          if (userProfile.email) {
                  try {
                    const { data, error } = await supabase
                      .from('politicians')
                      .select('id')
                      .ilike('email', userProfile.email)
                      .maybeSingle()
                    if (!error && data) foundId = data.id
                  } catch (e) {
                    console.warn('Erro ao resolver ID por email:', e)
                  }
                }

          if (foundId) {
            setResolvedPoliticianId(foundId)
          }
          setResolutionAttempted(true)
        } else {
          setResolutionAttempted(true)
        }
      } else {
        setResolutionAttempted(true)
      }
    }
    resolveId()
  }, [limitToPoliticianId, effectiveIsPoliticianView, userProfile])

  useEffect(() => {
    if (effectiveIsPoliticianView && !resolvedPoliticianId) {
      if (resolutionAttempted) {
        setLoading(false)
      } else {
        setLoading(true)
      }
      return
    }

    fetchRatings()
    // Only fetch list of politicians if we are not restricted or if we want to show the name
    if (!effectiveIsPoliticianView) {
        fetchPoliticians()
    } else if (resolvedPoliticianId) {
        // We might want to fetch just the current politician to get the name, 
        // but fetchPoliticians() fetches all. For now it's okay, or we can skip it.
        // Actually, let's skip fetching all politicians if restricted, 
        // but we might need the name for the UI. 
        // fetchRatings populates politician object in the response usually.
    }

    if (resolvedPoliticianId) {
      fetchAgentStats(resolvedPoliticianId)
    }
  }, [resolvedPoliticianId, effectiveIsPoliticianView, resolutionAttempted])

  const fetchAgentStats = async (politicianId) => {
    try {
      let conversations = 0
      let suggestions = 0

      // 1. Buscar estatísticas do Agente
      const { data: agents } = await supabase
        .from('politician_agents')
        .select('id')
        .eq('politician_id', politicianId)
        .limit(1)
      
      if (agents && agents.length > 0) {
        const agentId = agents[0].id
        
        // Buscar contagem de conversas (tenta 'conversations', fallback para 'chat_sessions')
        const { count: conversationCount, error: convError } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agentId)

        if (!convError) {
          conversations = conversationCount
        } else {
             const { count: sessionCount } = await supabase
              .from('chat_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('agent_id', agentId)
             conversations = sessionCount || 0
        }
      }

      // 2. Buscar contagem de Sugestões
      // Verifica se a tabela existe primeiro ou apenas tenta (fallback para erro 42P01 tratado no catch se fosse select, mas count head é safe?)
      // Vamos tentar direto. Se der erro, assume 0.
      try {
        const { count: suggestionsCount, error: suggError } = await supabase
          .from('politician_suggestions')
          .select('*', { count: 'exact', head: true })
          .eq('politician_id', politicianId)
        
        if (!suggError) {
          suggestions = suggestionsCount
        }
      } catch (e) {
        console.warn('Erro ao contar sugestões:', e)
      }

      setAgentStats({ conversations, messages: 0, suggestions })

    } catch (error) {
      console.error('Erro ao buscar estatísticas gerais:', error)
    }
  }

  const fetchRatings = async () => {
    try {
      setLoading(true)
      // Se tiver ID de político, filtrar diretamente no backend se a rota suportar
      const endpoint = (limitToPoliticianId || resolvedPoliticianId) ? `/ratings?politician_id=${limitToPoliticianId || resolvedPoliticianId}` : '/ratings'
      
      let ratingsList = []
      try {
        const response = await apiClient.get(endpoint)
        ratingsList = response.data?.data || []
      } catch (err) {
        console.warn('Erro ao buscar ratings filtrados, tentando rota padrao:', err)
        const response = await apiClient.get('/ratings')
        ratingsList = response.data?.data || []
      }

      // Normalizar chave do político (supabase retorna 'politicians')
      ratingsList = ratingsList.map(r => ({
        ...r,
        politician: r.politician || r.politicians || null
      }))

      // Enriquecer com dados do usuário (nome e avatar)
      const userIds = [...new Set(ratingsList.map(r => r?.user_id).filter(Boolean))]
      if (userIds.length > 0) {
        try {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, username, email, avatar_url')
            .in('id', userIds)
          const usersById = Object.fromEntries((usersData || []).map(u => [u.id, u]))
          ratingsList = ratingsList.map(r => ({
            ...r,
            user: r.user || usersById[r?.user_id] || null
          }))
        } catch (e) {
          console.warn('Falha ao enriquecer usuários nas avaliações:', e)
        }
      }

      setRatings(ratingsList)
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
      setRatings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPoliticians = async () => {
    try {
      const response = await apiClient.get('/politicians')
      setPoliticians(response.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar políticos:', error)
      setPoliticians([])
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      try {
        await apiClient.delete(`/ratings/${id}`)
        fetchRatings()
      } catch (error) {
        console.error('Erro ao excluir avaliação:', error)
      }
    }
  }

  const filteredRatings = Array.isArray(ratings) ? ratings.filter(rating => {
    const matchesSearch = rating.politician?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rating.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rating.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPolitician = !filterPolitician || String(rating.politician_id) === String(filterPolitician)
    const matchesRating = !filterRating || rating.rating === parseInt(filterRating)
    const matchesLimitId = !limitToPoliticianId || String(rating.politician_id) === String(limitToPoliticianId)
    return matchesSearch && matchesPolitician && matchesRating && matchesLimitId
  }) : []

  const getRatingStats = () => {
    let ratingsArray = Array.isArray(ratings) ? ratings : []
    
    if (limitToPoliticianId) {
       ratingsArray = ratingsArray.filter(r => String(r.politician_id) === String(limitToPoliticianId))
    }

    const stats = {
      total: ratingsArray.length,
      average: ratingsArray.length > 0 ? (ratingsArray.reduce((acc, r) => acc + r.rating, 0) / ratingsArray.length).toFixed(1) : 0,
      byRating: {}
    }
    
    for (let i = 1; i <= 5; i++) {
      stats.byRating[i] = ratingsArray.filter(r => r.rating === i).length
    }
    
    return stats
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const stats = getRatingStats()

  if (loading && !ratings.length && !limitToPoliticianId && isPoliticianView) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Carregando dados do político...</p>
      </div>
    )
  }

  if (loading && !ratings.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (effectiveIsPoliticianView && !resolvedPoliticianId && !loading && resolutionAttempted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <UserCheck className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Perfil não vinculado</h2>
        <p className="text-gray-500 text-center max-w-md mb-4">
          Não foi possível encontrar o perfil de político associado à sua conta.
          <br />
          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
            Email: {userProfile?.email || 'Não identificado'}
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Apenas se não for visão de político */}
      {!limitToPoliticianId && !effectiveIsPoliticianView && (
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Avaliações</h1>
          <p className="text-gray-600">Monitore e gerencie as avaliações dos políticos</p>
        </div>
      </div>
      )}

      {/* Stats Cards para Político Específico */}
      {(limitToPoliticianId || effectiveIsPoliticianView) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
           <h2 className="text-xl font-bold text-gray-900 mb-4">Visão Geral do Político</h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                 <p className="text-sm text-blue-600 font-medium">Total de Avaliações</p>
                 <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                 <p className="text-sm text-yellow-600 font-medium">Média de Avaliação</p>
                 <div className="flex items-center">
                    <span className="text-3xl font-bold text-yellow-900 mr-2">{stats.average}</span>
                    <div className="flex">{renderStars(Math.round(Number(stats.average || 0)))}</div>
                 </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                 <p className="text-sm text-green-600 font-medium">Conversas com Agente</p>
                 <div className="flex items-center mt-1">
                    <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-3xl font-bold text-green-900">{agentStats.conversations}</p>
                 </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                 <p className="text-sm text-purple-600 font-medium">Sugestões Recebidas</p>
                 <div className="flex items-center mt-1">
                    <Lightbulb className="h-5 w-5 text-purple-600 mr-2" />
                    <p className="text-3xl font-bold text-purple-900">{agentStats.suggestions}</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Stats Cards - Global (Only show if not limited and not politician view) */}
      {!limitToPoliticianId && !effectiveIsPoliticianView && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Avaliações</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Média Geral</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.average}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">5 Estrelas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.byRating[5] || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">1 Estrela</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.byRating[1] || 0}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Filters */}
      {!limitToPoliticianId && !effectiveIsPoliticianView && (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por político, usuário ou comentário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterPolitician}
              onChange={(e) => setFilterPolitician(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os Políticos</option>
              {politicians.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as Notas</option>
              <option value="5">5 Estrelas</option>
              <option value="4">4 Estrelas</option>
              <option value="3">3 Estrelas</option>
              <option value="2">2 Estrelas</option>
              <option value="1">1 Estrela</option>
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {filteredRatings.map((rating) => (
          <div key={rating.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                {rating.user?.avatar_url && (
                   <img src={rating.user.avatar_url} alt="" className="h-10 w-10 rounded-full bg-gray-200" />
                )}
                {!rating.user?.avatar_url && (
                   <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {rating.user?.full_name?.charAt(0) || '?'}
                   </div>
                )}
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">{rating.user?.full_name || 'Usuário Anônimo'}</h3>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{formatDate(rating.created_at)}</span>
                  </div>
                  
                  {!limitToPoliticianId && !isPoliticianView && (
                    <p className="text-sm text-blue-600 mt-1">
                      Para: {rating.politician?.name}
                    </p>
                  )}
                  
                  <div className="flex items-center mt-2">
                    <div className="flex text-yellow-400">
                      {renderStars(rating.rating)}
                    </div>
                  </div>
                  
                  {rating.comment && (
                    <p className="mt-3 text-gray-600">
                      {rating.comment}
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(rating.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredRatings.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma avaliação encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRating || filterPolitician
                ? 'Tente ajustar seus filtros de busca.'
                : 'Ainda não há avaliações registradas.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RatingsManagement