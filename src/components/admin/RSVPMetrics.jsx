import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, Calendar, BarChart3, Eye, CheckCircle } from 'lucide-react'
import { apiClient } from '../../lib/api'

const RSVPMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalRSVPs: 0,
    eventRSVPs: 0,
    manifestationRSVPs: 0,
    recentRSVPs: [],
    topEvents: [],
    topManifestations: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('7d') // 7d, 30d, 90d

  useEffect(() => {
    loadMetrics()
  }, [timeRange])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar métricas gerais
      const [generalResponse, eventsResponse, manifestationsResponse] = await Promise.all([
        apiClient.get(`/rsvp/metrics?timeRange=${timeRange}`),
        apiClient.get(`/rsvp/events/top?timeRange=${timeRange}&limit=5`),
        apiClient.get(`/rsvp/manifestations/top?timeRange=${timeRange}&limit=5`)
      ])

      setMetrics({
        totalRSVPs: generalResponse.data.totalRSVPs || 0,
        eventRSVPs: generalResponse.data.eventRSVPs || 0,
        manifestationRSVPs: generalResponse.data.manifestationRSVPs || 0,
        recentRSVPs: generalResponse.data.recentRSVPs || [],
        topEvents: eventsResponse.data.events || [],
        topManifestations: manifestationsResponse.data.manifestations || []
      })
    } catch (error) {
      console.error('Erro ao carregar métricas RSVP:', error)
      setError('Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRange = (range) => {
    switch (range) {
      case '7d': return 'Últimos 7 dias'
      case '30d': return 'Últimos 30 dias'
      case '90d': return 'Últimos 90 dias'
      default: return 'Período selecionado'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar métricas</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadMetrics}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Métricas RSVP</h2>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Cards de métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total RSVPs</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalRSVPs}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Eventos</p>
                <p className="text-2xl font-bold text-green-900">{metrics.eventRSVPs}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Manifestações</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.manifestationRSVPs}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Listas de top eventos e manifestações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Eventos */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Eventos com Mais RSVPs</h3>
            <div className="space-y-3">
              {metrics.topEvents.length > 0 ? (
                metrics.topEvents.map((event, index) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.city}, {event.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">{event.rsvp_count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum evento com RSVPs no período</p>
              )}
            </div>
          </div>

          {/* Top Manifestações */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manifestações com Mais RSVPs</h3>
            <div className="space-y-3">
              {metrics.topManifestations.length > 0 ? (
                metrics.topManifestations.map((manifestation, index) => (
                  <div key={manifestation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{manifestation.title}</p>
                        <p className="text-xs text-gray-500">{manifestation.city}, {manifestation.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">{manifestation.rsvp_count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma manifestação com RSVPs no período</p>
              )}
            </div>
          </div>
        </div>

        {/* RSVPs Recentes */}
        {metrics.recentRSVPs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">RSVPs Recentes</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {metrics.recentRSVPs.slice(0, 5).map((rsvp, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {rsvp.user_name} confirmou presença em {rsvp.event_title || rsvp.manifestation_title}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(rsvp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RSVPMetrics