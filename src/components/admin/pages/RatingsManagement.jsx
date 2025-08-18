import React, { useState, useEffect } from 'react'
import { Search, Star, Trash2, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { apiClient } from '../../../lib/api'

const RatingsManagement = () => {
  const [ratings, setRatings] = useState([])
  const [politicians, setPoliticians] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPolitician, setFilterPolitician] = useState('')
  const [filterRating, setFilterRating] = useState('')

  useEffect(() => {
    fetchRatings()
    fetchPoliticians()
  }, [])

  const fetchRatings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/ratings')
      setRatings(response.data?.data || [])
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
    const matchesPolitician = !filterPolitician || rating.politician_id === parseInt(filterPolitician)
    const matchesRating = !filterRating || rating.rating === parseInt(filterRating)
    return matchesSearch && matchesPolitician && matchesRating
  }) : []

  const getAverageRating = (politicianId) => {
    const politicianRatings = Array.isArray(ratings) ? ratings.filter(r => r.politician_id === politicianId) : []
    if (politicianRatings.length === 0) return 0
    const sum = politicianRatings.reduce((acc, r) => acc + r.rating, 0)
    return (sum / politicianRatings.length).toFixed(1)
  }

  const getRatingStats = () => {
    const ratingsArray = Array.isArray(ratings) ? ratings : []
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Avaliações</h1>
          <p className="text-gray-600">Monitore e gerencie as avaliações dos políticos</p>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por político, usuário ou comentário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterPolitician}
              onChange={(e) => setFilterPolitician(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os políticos</option>
              {Array.isArray(politicians) && politicians.map(politician => (
                <option key={politician.id} value={politician.id}>
                  {politician.name} - {politician.party}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as notas</option>
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ratings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Político
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avaliação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comentário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRatings.map((rating) => (
                <tr key={rating.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {rating.politician?.photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={rating.politician.photo_url}
                            alt={rating.politician.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {rating.politician?.name?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {rating.politician?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rating.politician?.party}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rating.user?.name || 'Usuário anônimo'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {rating.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {renderStars(rating.rating)}
                      <span className="ml-2 text-sm text-gray-600">({rating.rating})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {rating.comment || 'Sem comentário'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(rating.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(rating.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRatings.length === 0 && (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma avaliação encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterPolitician || filterRating ? 'Tente ajustar os filtros.' : 'Ainda não há avaliações cadastradas.'}
            </p>
          </div>
        )}
      </div>

      {/* Politicians Summary */}
      {politicians.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Resumo por Político</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(politicians) && politicians.map(politician => {
                const avgRating = getAverageRating(politician.id)
                const totalRatings = Array.isArray(ratings) ? ratings.filter(r => r.politician_id === politician.id).length : 0
                return (
                  <div key={politician.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 h-8 w-8">
                        {politician.photo_url ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={politician.photo_url}
                            alt={politician.name}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {politician.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{politician.name}</p>
                        <p className="text-xs text-gray-500">{politician.party}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStars(Math.round(avgRating))}
                        <span className="ml-1 text-sm text-gray-600">({avgRating})</span>
                      </div>
                      <span className="text-xs text-gray-500">{totalRatings} avaliações</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RatingsManagement