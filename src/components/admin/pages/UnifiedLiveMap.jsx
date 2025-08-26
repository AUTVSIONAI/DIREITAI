import React, { useState, useEffect, useRef, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl, ScaleControl, FullscreenControl, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  MapPin,
  Users,
  Calendar,
  Activity,
  Filter,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  Layers,
  Settings,
  Thermometer,
  Target,
  Zap,
  Globe
} from 'lucide-react'
import LiveMapService from '../../../services/liveMap'
import { apiClient } from '../../../lib/api.ts'
import { useAuth } from '../../../hooks/useAuth'
import RSVPButton from '../../common/RSVPButton'
import ManifestationsService from '../../../services/manifestations'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const UnifiedLiveMap = () => {
  const { user } = useAuth()
  // Estados do mapa
  const [viewport, setViewport] = useState({
    latitude: -14.2350,
    longitude: -51.9253,
    zoom: 4
  })

  // Estados de dados
  const [onlineUsers, setOnlineUsers] = useState([])
  const [activeEvents, setActiveEvents] = useState([])
  const [checkins, setCheckins] = useState([])
  const [cityStats, setCityStats] = useState([])
  const [realTimeData, setRealTimeData] = useState({})
  const [manifestations, setManifestations] = useState([])
  const [userCheckins, setUserCheckins] = useState([])

  // Estados de controle
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Estados de filtros
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Estados de visibilidade de camadas
  const [layerVisibility, setLayerVisibility] = useState({
    users: true,
    events: true,
    manifestations: true,
    heatmap: false,
    stats: true,
    clusters: false,
    density: false
  })

  // Estados de heatmap
  const [heatmapData, setHeatmapData] = useState([])
  const [heatmapConfig, setHeatmapConfig] = useState({
    includeUsers: true,
    includeEvents: true,
    includeCheckins: true,
    includeManifestations: true,
    weights: {
      users: 1,
      events: 3,
      checkins: 2,
      manifestations: 4
    },
    colorScheme: 'heat',
    intensity: 0.6,
    radius: 20,
    blur: 15
  })

  // Estados de popups
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedManifestation, setSelectedManifestation] = useState(null)
  const [selectedUserCheckin, setSelectedUserCheckin] = useState(null)
  const [selectedCluster, setSelectedCluster] = useState(null)

  // Estados de modal de manifestações
  const [showManifestationModal, setShowManifestationModal] = useState(false)
  const [editingManifestation, setEditingManifestation] = useState(null)
  const [manifestationForm, setManifestationForm] = useState({
    name: '',
    description: '',
    status: 'active',
    city: '',
    state: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 500,
    start_date: '',
    end_date: '',
    max_participants: ''
  })
  const [addressSearch, setAddressSearch] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    loadMapData()
  }, [])

  const loadMapData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersResponse, eventsResponse, checkinsResponse, statsResponse, manifestationsResponse, userCheckinsResponse] = await Promise.all([
        apiClient.get('/users/online'),
        apiClient.get('/events/active'),
        apiClient.get('/checkins/recent'),
        apiClient.get('/admin/city-stats'),
        apiClient.get('/manifestations'),
        apiClient.get('/manifestations/checkins/map')
      ])

      setOnlineUsers(Array.isArray(usersResponse.data) ? usersResponse.data : [])
      setActiveEvents(Array.isArray(eventsResponse.data) ? eventsResponse.data : [])
      setCheckins(Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [])
      setCityStats(Array.isArray(statsResponse.data) ? statsResponse.data : [])
      setManifestations(Array.isArray(manifestationsResponse.data?.data) ? manifestationsResponse.data.data : [])
      setUserCheckins(Array.isArray(userCheckinsResponse.data?.data) ? userCheckinsResponse.data.data : [])
      setLastRefresh(new Date())

    } catch (err) {
      console.error('Erro ao carregar dados do mapa:', err)
      setError('Erro ao carregar dados do mapa')
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar manifestações
  const fetchManifestations = async () => {
    try {
      const response = await apiClient.get('/manifestations')
      if (response.data && response.data.data) {
        setManifestations(Array.isArray(response.data.data) ? response.data.data : [])
      }
    } catch (error) {
      console.error('Erro ao buscar manifestações:', error)
    }
  }

  // Função para buscar check-ins de usuários
  const fetchUserCheckins = async () => {
    try {
      const response = await apiClient.get('/manifestations/checkins/map')
      if (response.success && response.data) {
        setUserCheckins(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error('Erro ao buscar check-ins de usuários:', error)
    }
  }

  // Gerar dados do heatmap
  const generateHeatmapData = useCallback(() => {
    const points = []

    if (heatmapConfig.includeUsers) {
      onlineUsers.forEach(user => {
        points.push({
          latitude: user.latitude,
          longitude: user.longitude,
          weight: heatmapConfig.weights.users
        })
      })
    }

    if (heatmapConfig.includeEvents) {
      activeEvents.forEach(event => {
        points.push({
          latitude: event.latitude,
          longitude: event.longitude,
          weight: heatmapConfig.weights.events
        })
      })
    }

    if (heatmapConfig.includeCheckins) {
      checkins.forEach(checkin => {
        points.push({
          latitude: checkin.latitude,
          longitude: checkin.longitude,
          weight: heatmapConfig.weights.checkins
        })
      })
    }

    if (heatmapConfig.includeManifestations) {
      manifestations.forEach(manifestation => {
        points.push({
          latitude: manifestation.latitude,
          longitude: manifestation.longitude,
          weight: heatmapConfig.weights.manifestations
        })
      })
    }

    setHeatmapData(points)
  }, [onlineUsers, activeEvents, checkins, manifestations, heatmapConfig])

  useEffect(() => {
    generateHeatmapData()
  }, [generateHeatmapData])

  // Função para buscar endereços usando Mapbox Geocoding
  const searchAddresses = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=BR&types=place,locality,neighborhood,address&language=pt&limit=5`
      )
      const data = await response.json()
      
      if (data.features) {
        const suggestions = data.features.map(feature => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center,
          context: feature.context || [],
          text: feature.text
        }))
        setAddressSuggestions(suggestions)
        setShowAddressSuggestions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error)
    }
  }

  // Função para selecionar um endereço da lista de sugestões
  const selectAddress = (suggestion) => {
    const [longitude, latitude] = suggestion.center
    
    // Extrair cidade e estado do contexto
    let city = suggestion.text
    let state = ''
    
    if (suggestion.context) {
      const cityContext = suggestion.context.find(c => c.id.includes('place'))
      const stateContext = suggestion.context.find(c => c.id.includes('region'))
      
      if (cityContext) city = cityContext.text
      if (stateContext) state = stateContext.short_code?.replace('BR-', '') || stateContext.text
    }
    
    setManifestationForm(prev => ({
      ...prev,
      address: suggestion.place_name,
      city: city,
      state: state,
      latitude: latitude.toString(),
      longitude: longitude.toString()
    }))
    
    setAddressSearch(suggestion.place_name)
    setShowAddressSuggestions(false)
  }

  // Função para atualizar campos do formulário
  const updateFormField = (field, value) => {
    setManifestationForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Função para gerar dados GeoJSON dos círculos de manifestações
  const generateManifestationCircles = () => {
    if (!manifestations || manifestations.length === 0) return null

    const features = manifestations.map(manifestation => {
      // Criar um círculo aproximado usando pontos
      const center = [manifestation.longitude, manifestation.latitude]
      const radiusInKm = manifestation.radius / 1000 // converter metros para km
      const points = 64 // número de pontos para formar o círculo
      const coordinates = []

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * 2 * Math.PI
        const dx = radiusInKm * Math.cos(angle) / 111.32 // aproximação para graus
        const dy = radiusInKm * Math.sin(angle) / (111.32 * Math.cos(manifestation.latitude * Math.PI / 180))
        coordinates.push([center[0] + dx, center[1] + dy])
      }
      coordinates.push(coordinates[0]) // fechar o polígono

      return {
        type: 'Feature',
        properties: {
          id: manifestation.id,
          name: manifestation.name,
          radius: manifestation.radius
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    })

    return {
      type: 'FeatureCollection',
      features
    }
  }

  // Estilo da camada de círculos de manifestações
  const manifestationCircleLayer = {
    id: 'manifestation-circles',
    type: 'fill',
    paint: {
      'fill-color': '#10b981', // verde
      'fill-opacity': 0.2
    }
  }

  const manifestationCircleBorderLayer = {
    id: 'manifestation-circles-border',
    type: 'line',
    paint: {
      'line-color': '#059669', // verde mais escuro
      'line-width': 2,
      'line-opacity': 0.8
    }
  }

  // Função para submeter o formulário de manifestação
  const handleManifestationSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Validação básica
      if (!manifestationForm.name || !manifestationForm.city || !manifestationForm.latitude || !manifestationForm.longitude) {
        alert('Por favor, preencha todos os campos obrigatórios.')
        return
      }

      const manifestationData = {
        name: manifestationForm.name,
        description: manifestationForm.description,
        status: manifestationForm.status,
        city: manifestationForm.city,
        state: manifestationForm.state,
        latitude: parseFloat(manifestationForm.latitude),
        longitude: parseFloat(manifestationForm.longitude),
        radius: parseInt(manifestationForm.radius) || 500,
        start_date: manifestationForm.start_date || new Date().toISOString(),
        end_date: manifestationForm.end_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas depois
        max_participants: manifestationForm.max_participants ? parseInt(manifestationForm.max_participants) : null,
        created_by: user?.id
      }

      let response
      if (editingManifestation) {
        // Atualizar manifestação existente
        response = await apiClient.put(`/manifestations/${editingManifestation.id}`, manifestationData)
      } else {
        // Criar nova manifestação
        response = await apiClient.post('/manifestations', manifestationData)
      }

      if (response.data) {
        // Recarregar dados das manifestações e check-ins
        await fetchManifestations()
        await fetchUserCheckins()
        
        // Fechar modal e limpar formulário
        setShowManifestationModal(false)
        setEditingManifestation(null)
        setManifestationForm({
          name: '',
          description: '',
          status: 'active',
          city: '',
          state: '',
          latitude: '',
          longitude: '',
          radius: 500,
          start_date: '',
          end_date: '',
          max_participants: ''
        })
        setAddressSearch('')
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
        
        alert(editingManifestation ? 'Manifestação atualizada com sucesso!' : 'Manifestação criada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar manifestação:', error)
      alert('Erro ao salvar manifestação. Tente novamente.')
    }
  }

  // Esquemas de cores para heatmap
  const colorSchemes = {
    heat: [
      'rgba(0, 0, 255, 0)',
      'rgba(0, 0, 255, 1)',
      'rgba(0, 255, 255, 1)',
      'rgba(0, 255, 0, 1)',
      'rgba(255, 255, 0, 1)',
      'rgba(255, 0, 0, 1)'
    ],
    cool: [
      'rgba(0, 0, 255, 0)',
      'rgba(0, 100, 255, 1)',
      'rgba(0, 200, 255, 1)',
      'rgba(100, 255, 200, 1)',
      'rgba(200, 255, 100, 1)',
      'rgba(255, 255, 0, 1)'
    ],
    warm: [
      'rgba(255, 0, 0, 0)',
      'rgba(255, 50, 0, 1)',
      'rgba(255, 100, 0, 1)',
      'rgba(255, 150, 0, 1)',
      'rgba(255, 200, 0, 1)',
      'rgba(255, 255, 0, 1)'
    ]
  }

  // Configurações avançadas do heatmap
  const heatmapLayerConfig = {
    id: 'heatmap',
    type: 'heatmap',
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'weight'],
        0, 0,
        6, 1
      ],
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, heatmapConfig.intensity,
        9, heatmapConfig.intensity * 3
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 0, 255, 0)',
        0.1, 'rgba(0, 0, 255, 0.5)',
        0.3, 'rgba(0, 255, 255, 0.7)',
        0.5, 'rgba(0, 255, 0, 0.8)',
        0.7, 'rgba(255, 255, 0, 0.9)',
        1, 'rgba(255, 0, 0, 1)'
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, heatmapConfig.radius,
        9, heatmapConfig.radius * 2
      ],
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7, 1,
        9, 0.8
      ]
    }
  }

  // Alternar visibilidade de camadas
  const toggleLayer = (layer) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }))
  }

  // Análise de densidade
  const analyzeDensity = useCallback(() => {
    const allPoints = [...onlineUsers, ...activeEvents, ...checkins, ...manifestations]
    const clusters = []
    const processed = new Set()

    allPoints.forEach((point, index) => {
      if (processed.has(index)) return

      const cluster = {
        center: { lat: point.latitude, lng: point.longitude },
        points: [point],
        totalWeight: 1,
        types: {}
      }

      // Encontrar pontos próximos (raio de ~1km)
      allPoints.forEach((otherPoint, otherIndex) => {
        if (index === otherIndex || processed.has(otherIndex)) return

        const distance = calculateDistance(
          point.latitude, point.longitude,
          otherPoint.latitude, otherPoint.longitude
        )

        if (distance < 1000) { // 1km
          cluster.points.push(otherPoint)
          cluster.totalWeight += 1
          processed.add(otherIndex)
        }
      })

      // Categorizar tipos de pontos no cluster
      cluster.points.forEach(p => {
        if (p.username) cluster.types.users = (cluster.types.users || 0) + 1
        else if (p.title) cluster.types.events = (cluster.types.events || 0) + 1
        else if (p.user_id) cluster.types.checkins = (cluster.types.checkins || 0) + 1
        else if (p.name) cluster.types.manifestations = (cluster.types.manifestations || 0) + 1
      })

      if (cluster.points.length > 1) {
        clusters.push(cluster)
      }
      processed.add(index)
    })

    return clusters
  }, [onlineUsers, activeEvents, checkins, manifestations])

  // Calcular distância entre dois pontos
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000 // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Personalização de estilo do mapa
  const mapStyles = {
    streets: 'mapbox://styles/mapbox/streets-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    dark: 'mapbox://styles/mapbox/dark-v10',
    light: 'mapbox://styles/mapbox/light-v10',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11'
  }

  const [currentMapStyle, setCurrentMapStyle] = useState('streets')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadMapData}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mapa Unificado ao Vivo</h1>
          <p className="text-sm sm:text-base text-gray-600">Visualização em tempo real de usuários, eventos, manifestações e atividades</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowManifestationModal(true)}
            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center space-x-2 text-sm"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Manifestação</span>
            <span className="sm:hidden">Nova Manif.</span>
          </button>
          <button
            onClick={loadMapData}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Filtros</h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 md:hidden"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${showFilters === false ? 'hidden md:grid' : ''}`}>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filtrar por cidade"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              type="text"
              value={filters.state}
              onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filtrar por estado"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Controles de Camadas */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Controles de Camadas</h3>
          </div>
          {/* Seletor de Estilo de Mapa */}
          <div className="flex items-center space-x-2">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <select
              value={currentMapStyle}
              onChange={(e) => setCurrentMapStyle(e.target.value)}
              className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="streets">🗺️ Ruas</option>
              <option value="satellite">🛰️ Satélite</option>
              <option value="dark">🌙 Escuro</option>
              <option value="light">☀️ Claro</option>
              <option value="outdoors">🏞️ Outdoor</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
          <button
            onClick={() => toggleLayer('users')}
            className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              layerVisibility.users
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {layerVisibility.users ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">Usuários</span>
            <span className="sm:hidden">Users</span>
          </button>
          <button
            onClick={() => toggleLayer('events')}
            className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              layerVisibility.events
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {layerVisibility.events ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">Eventos</span>
            <span className="sm:hidden">Events</span>
          </button>
          <button
            onClick={() => toggleLayer('manifestations')}
            className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              layerVisibility.manifestations
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {layerVisibility.manifestations ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">Manifestações</span>
            <span className="sm:hidden">Manif</span>
          </button>
          <button
            onClick={() => toggleLayer('heatmap')}
            className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              layerVisibility.heatmap
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {layerVisibility.heatmap ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">Heatmap</span>
            <span className="sm:hidden">Heat</span>
          </button>
          <button
            onClick={() => toggleLayer('stats')}
            className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              layerVisibility.stats
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {layerVisibility.stats ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">Estatísticas</span>
            <span className="sm:hidden">Stats</span>
          </button>
          <button
            onClick={() => toggleLayer('clusters')}
            className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              layerVisibility.clusters
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {layerVisibility.clusters ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">Clusters</span>
            <span className="sm:hidden">Clust</span>
          </button>
          <button
            onClick={() => toggleLayer('density')}
            className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium ${
              layerVisibility.density
                ? 'bg-teal-100 text-teal-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {layerVisibility.density ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">Densidade</span>
            <span className="sm:hidden">Dens</span>
          </button>
        </div>
      </div>

      {/* Mapa */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="h-64 sm:h-80 md:h-96 lg:h-[600px]">
          <Map
            {...viewport}
            onMove={evt => setViewport(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle={mapStyles[currentMapStyle]}
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            {/* Controles de Navegação */}
            <NavigationControl position="top-right" />
            <ScaleControl position="bottom-left" />
            <FullscreenControl position="top-left" />
            {/* Camada de heatmap */}
            {layerVisibility.heatmap && heatmapData.length > 0 && (
              <Source
                id="heatmap-source"
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: heatmapData.map(point => ({
                    type: 'Feature',
                    properties: { weight: point.weight },
                    geometry: {
                      type: 'Point',
                      coordinates: [point.longitude, point.latitude]
                    }
                  }))
                }}
              >
                <Layer {...heatmapLayerConfig} />
              </Source>
            )}

            {/* Círculos de raio das manifestações */}
            {layerVisibility.manifestations && generateManifestationCircles() && (
              <Source id="manifestation-circles" type="geojson" data={generateManifestationCircles()}>
                <Layer {...manifestationCircleLayer} />
                <Layer {...manifestationCircleBorderLayer} />
              </Source>
            )}

            {/* Marcadores de eventos */}
            {layerVisibility.events && activeEvents.map((event) => (
              <Marker
                key={event.id}
                latitude={event.latitude}
                longitude={event.longitude}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="bg-green-500 rounded-full p-2 cursor-pointer hover:bg-green-600 transition-colors">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </Marker>
            ))}

            {/* Marcadores de manifestações */}
            {layerVisibility.manifestations && manifestations.map((manifestation) => (
              <Marker
                key={manifestation.id}
                latitude={manifestation.latitude}
                longitude={manifestation.longitude}
                onClick={() => setSelectedManifestation(manifestation)}
              >
                <div className="bg-red-500 rounded-full p-2 cursor-pointer hover:bg-red-600 transition-colors">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </Marker>
            ))}

            {/* Marcadores de usuários com check-in */}
            {layerVisibility.users && userCheckins.map((checkin) => (
              <Marker
                key={checkin.id}
                latitude={checkin.latitude}
                longitude={checkin.longitude}
                onClick={() => setSelectedUserCheckin(checkin)}
              >
                <div className="bg-blue-500 rounded-full p-1.5 cursor-pointer hover:bg-blue-600 transition-colors border-2 border-white shadow-lg">
                  <Users className="h-3 w-3 text-white" />
                </div>
              </Marker>
            ))}

            {/* Popups de eventos */}
            {selectedEvent && (
              <Popup
                latitude={selectedEvent.latitude}
                longitude={selectedEvent.longitude}
                onClose={() => setSelectedEvent(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-2">
                  <h4 className="font-semibold text-sm">{selectedEvent.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{selectedEvent.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedEvent.location?.city}, {selectedEvent.location?.state}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedEvent.date).toLocaleDateString()}
                  </p>
                </div>
              </Popup>
            )}

            {/* Popups de manifestações */}
            {selectedManifestation && (
              <Popup
                latitude={selectedManifestation.latitude}
                longitude={selectedManifestation.longitude}
                onClose={() => setSelectedManifestation(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-red-700">{selectedManifestation.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{selectedManifestation.description}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      📍 {selectedManifestation.city}, {selectedManifestation.state}
                    </p>
                    <p className="text-xs text-gray-500">
                      📅 {new Date(selectedManifestation.start_date).toLocaleDateString()} - {new Date(selectedManifestation.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      📏 Raio: {selectedManifestation.radius}m
                    </p>
                    <p className="text-xs text-gray-500">
                      👥 Limite: {selectedManifestation.max_participants || 'Ilimitado'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                         selectedManifestation.status === 'active' 
                           ? 'bg-green-100 text-green-800' 
                           : selectedManifestation.status === 'scheduled'
                           ? 'bg-yellow-100 text-yellow-800'
                           : 'bg-gray-100 text-gray-800'
                       }`}>
                         {selectedManifestation.status === 'active' ? '🟢 Ativa' : 
                          selectedManifestation.status === 'scheduled' ? '🟡 Agendada' : '🔴 Inativa'}
                       </span>
                     </div>
                     
                     {/* RSVP Button */}
                     <div className="mt-3">
                       <RSVPButton 
                         eventId={selectedManifestation.id}
                         type="manifestation"
                         size="sm"
                       />
                     </div>
                     
                     <div className="flex space-x-2 mt-3">
                       <button
                         onClick={() => {
                           setEditingManifestation(selectedManifestation)
                           setShowManifestationModal(true)
                           setSelectedManifestation(null)
                         }}
                         className="flex-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                       >
                         ✏️ Editar
                       </button>
                       <button
                         onClick={async () => {
                           if (confirm('Tem certeza que deseja excluir esta manifestação?')) {
                             try {
                               await ManifestationsService.deleteManifestation(selectedManifestation.id)
                               // Recarregar dados das manifestações
                               await fetchManifestations()
                               setSelectedManifestation(null)
                               alert('Manifestação excluída com sucesso!')
                             } catch (error) {
                               console.error('Erro ao excluir manifestação:', error)
                               alert('Erro ao excluir manifestação. Tente novamente.')
                             }
                           }
                         }}
                         className="flex-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                       >
                         🗑️ Excluir
                       </button>
                     </div>
                  </div>
                </div>
              </Popup>
            )}

            {/* Popup de check-ins de usuários */}
            {selectedUserCheckin && (
              <Popup
                latitude={selectedUserCheckin.latitude}
                longitude={selectedUserCheckin.longitude}
                onClose={() => setSelectedUserCheckin(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-blue-700">Check-in de Usuário</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">
                      👤 <strong>{selectedUserCheckin.user.full_name || selectedUserCheckin.user.username}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      📍 Manifestação: {selectedUserCheckin.manifestation.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      🏙️ {selectedUserCheckin.manifestation.city}, {selectedUserCheckin.manifestation.state}
                    </p>
                    <p className="text-xs text-gray-500">
                      🕒 {new Date(selectedUserCheckin.checked_in_at).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✅ Check-in Confirmado
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            )}

            {/* Marcadores de usuários */}
            {layerVisibility.users && onlineUsers.map((user) => (
              <Marker
                key={user.id}
                latitude={user.latitude}
                longitude={user.longitude}
                onClick={() => setSelectedUser(user)}
              >
                <div className="bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </Marker>
            ))}

            {/* Popups de usuários */}
            {selectedUser && (
              <Popup
                latitude={selectedUser.latitude}
                longitude={selectedUser.longitude}
                onClose={() => setSelectedUser(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-2">
                  <h4 className="font-semibold text-sm">{selectedUser.username}</h4>
                  <p className="text-xs text-gray-600">
                    {selectedUser.location?.city}, {selectedUser.location?.state}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {selectedUser.status === 'online' ? 'Online' : 'Em evento'}
                  </p>
                </div>
              </Popup>
            )}

            {/* Popups de clusters */}
            {selectedCluster && (
              <Popup
                latitude={selectedCluster.center.lat}
                longitude={selectedCluster.center.lng}
                onClose={() => setSelectedCluster(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-3">
                  <h4 className="font-semibold text-sm mb-2">Cluster de Densidade</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de pontos:</span>
                      <span className="font-medium">{selectedCluster.points.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso total:</span>
                      <span className="font-medium">{selectedCluster.totalWeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usuários:</span>
                      <span className="font-medium">{selectedCluster.types.users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Eventos:</span>
                      <span className="font-medium">{selectedCluster.types.events || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-ins:</span>
                      <span className="font-medium">{selectedCluster.types.checkins || 0}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>

      {/* Estatísticas por cidade */}
      {layerVisibility.stats && cityStats.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Estatísticas por Cidade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {cityStats.slice(0, 6).map((city, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-xs sm:text-sm text-gray-900">
                  {city.city}, {city.state}
                </h4>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Usuários:</span>
                    <span className="font-medium">{city.users}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Eventos:</span>
                    <span className="font-medium">{city.events}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Check-ins:</span>
                    <span className="font-medium">{city.checkins}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Manifestações */}
      {showManifestationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full sm:w-11/12 md:w-3/4 lg:w-1/2 max-w-4xl shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingManifestation ? 'Editar Manifestação' : 'Nova Manifestação'}
              </h3>
              <button
                onClick={() => {
                  setShowManifestationModal(false)
                  setEditingManifestation(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Nome da Manifestação *
                  </label>
                  <input
                    type="text"
                    value={manifestationForm.name}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Digite o nome da manifestação"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    value={manifestationForm.status}
                    onChange={(e) => updateFormField('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="scheduled">Agendada</option>
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={manifestationForm.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 sm:rows-3"
                  placeholder="Descreva a manifestação"
                />
              </div>
              
              {/* Campo de busca de endereço */}
              <div className="relative">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Buscar Endereço *
                </label>
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => {
                    setAddressSearch(e.target.value)
                    searchAddresses(e.target.value)
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Digite o endereço, cidade ou rua..."
                />
                
                {/* Lista de sugestões */}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => selectAddress(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{suggestion.text}</div>
                        <div className="text-xs text-gray-500">{suggestion.place_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={manifestationForm.city}
                    onChange={(e) => updateFormField('city', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Cidade"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={manifestationForm.state}
                    onChange={(e) => updateFormField('state', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Estado"
                    readOnly
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Raio (metros) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    value={manifestationForm.radius}
                    onChange={(e) => updateFormField('radius', parseInt(e.target.value) || 500)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={manifestationForm.latitude}
                    onChange={(e) => updateFormField('latitude', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="-23.5505"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={manifestationForm.longitude}
                    onChange={(e) => updateFormField('longitude', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="-46.6333"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="datetime-local"
                    value={manifestationForm.start_date}
                    onChange={(e) => updateFormField('start_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Data de Fim *
                  </label>
                  <input
                    type="datetime-local"
                    value={manifestationForm.end_date}
                    onChange={(e) => updateFormField('end_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Máx. Participantes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manifestationForm.max_participants}
                    onChange={(e) => updateFormField('max_participants', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowManifestationModal(false)
                    setEditingManifestation(null)
                    setManifestationForm({
                      name: '',
                      description: '',
                      status: 'active',
                      city: '',
                      state: '',
                      address: '',
                      latitude: '',
                      longitude: '',
                      radius: 500,
                      start_date: '',
                      end_date: '',
                      max_participants: ''
                    })
                    setAddressSearch('')
                    setAddressSuggestions([])
                    setShowAddressSuggestions(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleManifestationSubmit}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 order-1 sm:order-2"
                >
                  {editingManifestation ? 'Atualizar' : 'Criar'} Manifestação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedLiveMap