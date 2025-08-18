import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  MapPin, 
  Users, 
  Eye, 
  Filter, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Settings,
  Download,
  Share2,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import LiveMapService from '../../../services/liveMap'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const LiveMap = () => {
  const [selectedView, setSelectedView] = useState('users')
  const [selectedCity, setSelectedCity] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [mapZoom, setMapZoom] = useState(10)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Real data from API
  const [onlineUsers, setOnlineUsers] = useState([])
  const [activeEvents, setActiveEvents] = useState([])
  const [cityStats, setCityStats] = useState([])
  const [realTimeData, setRealTimeData] = useState({
    onlineUsers: 0,
    activeEvents: 0,
    totalCheckins: 0,
    lastUpdate: new Date()
  })

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersResponse, eventsResponse, statsResponse, realtimeResponse] = await Promise.all([
        LiveMapService.getOnlineUsers(),
        LiveMapService.getActiveEvents(),
        LiveMapService.getCityStats(),
        LiveMapService.getRealTimeStats()
      ])

      if (usersResponse.success) {
        setOnlineUsers(usersResponse.data.users)
      }

      if (eventsResponse.success) {
        setActiveEvents(eventsResponse.data.events)
      }

      if (statsResponse.success) {
        setCityStats(statsResponse.data.stats)
      }

      if (realtimeResponse.success) {
        setRealTimeData({
          onlineUsers: realtimeResponse.data.onlineUsers,
          activeEvents: realtimeResponse.data.activeEvents,
          totalCheckins: realtimeResponse.data.totalCheckins,
          lastUpdate: new Date(realtimeResponse.data.lastUpdate)
        })
      }
    } catch (err) {
      console.error('Error loading live map data:', err)
      setError('Erro ao carregar dados do mapa')
    } finally {
      setLoading(false)
    }
  }

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  // Real-time updates
  useEffect(() => {
    loadData()

    // Subscribe to real-time updates
    const unsubscribe = LiveMapService.subscribeToUpdates((stats) => {
      setRealTimeData({
        onlineUsers: stats.onlineUsers,
        activeEvents: stats.activeEvents,
        totalCheckins: stats.totalCheckins,
        lastUpdate: new Date(stats.lastUpdate)
      })
    })

    return unsubscribe
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'in_event': return 'bg-blue-500'
      case 'away': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getPlanBadge = (plan) => {
    const badges = {
      gratuito: { color: 'bg-gray-100 text-gray-800', label: 'Gratuito' },
      engajado: { color: 'bg-blue-100 text-blue-800', label: 'Engajado' },
      premium: { color: 'bg-purple-100 text-purple-800', label: 'Premium' }
    }
    return badges[plan] || badges.gratuito
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados do mapa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mapa ao Vivo</h2>
          <p className="text-gray-600">Monitoramento em tempo real de usuários e eventos</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Última atualização: {realTimeData.lastUpdate.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
          <button className="btn-secondary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button className="btn-secondary flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </button>
          <button className="btn-primary flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Online</p>
              <p className="text-2xl font-bold text-gray-900">{realTimeData.onlineUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% hoje
              </p>
            </div>
            <div className="relative">
              <Users className="h-8 w-8 text-green-500" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Eventos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{realTimeData.activeEvents}</p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Activity className="h-3 w-3 mr-1" />
                3 iniciando agora
              </p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Check-ins Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{realTimeData.totalCheckins.toLocaleString()}</p>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% vs ontem
              </p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Última Atualização</p>
              <p className="text-sm font-bold text-gray-900">
                {realTimeData.lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" />
                Tempo real
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Map Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedView('users')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedView === 'users'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-1" />
                  Usuários
                </button>
                <button
                  onClick={() => setSelectedView('events')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedView === 'events'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Eventos
                </button>
                <button
                  onClick={() => setSelectedView('heatmap')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedView === 'heatmap'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Layers className="h-4 w-4 inline mr-1" />
                  Mapa de Calor
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Filter className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">Todas as Cidades</option>
                      {cityStats.map(city => (
                        <option key={city.city} value={city.city}>
                          {city.city}, {city.state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="all">Todos os Status</option>
                      <option value="online">Online</option>
                      <option value="in_event">Em Evento</option>
                      <option value="away">Ausente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="all">Todos os Planos</option>
                      <option value="gratuito">Gratuito</option>
                      <option value="engajado">Engajado</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Map */}
            <div className="relative bg-gray-100 rounded-lg h-[600px] lg:h-[700px] overflow-hidden shadow-lg border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
                {/* Simulated map background */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 300">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                
                {/* User markers - mais visíveis */}
                {selectedView === 'users' && onlineUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{
                      left: `${20 + (index % 8) * 10}%`,
                      top: `${25 + Math.floor(index / 8) * 15}%`
                    }}
                    title={`${user.username} - ${user.location?.city || 'Localização desconhecida'}`}
                  >
                    <div className="relative">
                      {/* Marcador principal do usuário */}
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(user.status)} border-2 border-white shadow-lg group-hover:scale-125 transition-transform`}></div>
                      {/* Pulso animado */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full animate-ping opacity-75`}></div>
                      {/* Tooltip no hover */}
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {user.username}<br/>
                        <span className="text-gray-300">{user.location?.city}, {user.location?.state}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Event markers - apenas eventos */}
                {selectedView === 'events' && activeEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{
                      left: `${30 + (index % 6) * 12}%`,
                      top: `${35 + Math.floor(index / 6) * 20}%`
                    }}
                    onClick={() => setSelectedEvent(event)}
                    title={`${event.title} - ${event.location?.city || 'Local não informado'}`}
                  >
                    <div className="relative">
                      {/* Marcador de evento */}
                      <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg group-hover:scale-125 transition-transform flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                      {/* Pulso animado */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-pulse opacity-75"></div>
                      {/* Tooltip no hover */}
                      <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {event.title}<br/>
                        <span className="text-gray-300">{event.location?.city}, {event.location?.state}</span><br/>
                        <span className="text-blue-300">{event.participants} participantes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Legenda</h4>
                <div className="space-y-1">
                  {selectedView === 'users' && (
                    <>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Online
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Em Evento
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Ausente
                      </div>
                    </>
                  )}
                  {selectedView === 'events' && (
                    <>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Evento Ativo
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        Iniciando
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Online Users */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Usuários Online</h3>
              <span className="text-sm text-gray-500">{onlineUsers.length} usuários</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {onlineUsers.map(user => {
                const planBadge = getPlanBadge(user.plan)
                return (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border border-white`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.location.city}, {user.location.state}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${planBadge.color}`}>
                        {planBadge.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{user.lastActivity}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Events */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Eventos Ativos</h3>
              <span className="text-sm text-gray-500">{activeEvents.length} eventos</span>
            </div>
            <div className="space-y-3">
              {activeEvents.map(event => (
                <div key={event.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.location.city}, {event.location.state}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs text-gray-600 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {event.participants}
                        </span>
                        <span className="text-xs text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.startTime}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* City Statistics - Melhoradas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Estatísticas por Cidade
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cityStats.map((city, index) => (
                <div key={city.city} className="relative p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-yellow-400' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-400' : 'bg-blue-400'
                        }`}></span>
                        {city.city}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {city.users} usuários online
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{city.state}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{city.checkins}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        check-ins hoje
                      </div>
                    </div>
                  </div>
                  {/* Barra de progresso visual */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Atividade</span>
                      <span>{Math.round((city.users + city.checkins) / 50 * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((city.users + city.checkins) / 50 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Evento</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h4>
                <p className="text-gray-600">{selectedEvent.location.city}, {selectedEvent.location.state}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Participantes</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedEvent.participants}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horário</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedEvent.startTime}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Ativo
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary"
              >
                Fechar
              </button>
              <button className="btn-primary">
                Ver Mais Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMap