import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LazyMap, LazyMarker, LazyPopup, LazyNavigationControl, LazyScaleControl, LazyFullscreenControl } from '../../common/LazyMapbox'
import {
  MapPin,
  Calendar,
  Users,
  Navigation,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  X,
  Target
} from 'lucide-react'
import { apiClient } from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import RSVPButton from '../../common/RSVPButton'

const EventMap = () => {
  const { user } = useAuth()
  
  // Estados do mapa
  const [viewport, setViewport] = useState({
    latitude: -14.2350,
    longitude: -51.9253,
    zoom: 6
  })

  // Estados de dados
  const [events, setEvents] = useState([])
  const [manifestations, setManifestations] = useState([])
  const [avatarError, setAvatarError] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [nearbyEvents, setNearbyEvents] = useState([])
  const [nearbyManifestations, setNearbyManifestations] = useState([])
  const [checkedInEvents, setCheckedInEvents] = useState([])
  const [checkedInManifestations, setCheckedInManifestations] = useState(() => {
    // Inicializar com dados do localStorage para evitar "piscada" do banner
    try {
      const saved = localStorage.getItem('manifestation_checkins')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  // Estados de controle
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [checkingIn, setCheckingIn] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Estados de UI
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedManifestation, setSelectedManifestation] = useState(null)
  const [nearManifestation, setNearManifestation] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    radius: 50 // km
  })

  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)

  // Obter localização do usuário
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada pelo seu navegador')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setUserLocation(location)
        setViewport(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
          zoom: 10
        }))
        setLocationError(null)
      },
      async (error) => {
        console.error('Erro ao obter localização:', error)
        // Mensagem amigável por código
        const friendly = error?.code === 1
          ? 'Permissão de localização negada. Autorize o acesso ao GPS para check-in.'
          : error?.code === 2
            ? 'A posição não pôde ser determinada. Verifique sua conexão.'
            : error?.code === 3
              ? 'Tempo excedido para obter localização.'
              : 'Não foi possível obter sua localização. Verifique as permissões.'
        
        setLocationError(friendly)
        
        // Se for desktop e negado, mostrar alerta explicativo
        if (error?.code === 1) {
             alert('Para visualizar sua posição e fazer check-ins, é necessário permitir o acesso à localização nas configurações do seu navegador (ícone de cadeado ou permissões na barra de endereço).')
        }

        // Fallback por IP: tenta obter lat/long aproximado
        try {
          const resp = await fetch('https://ipapi.co/json/')
          if (resp.ok) {
            const json = await resp.json()
            if (json && typeof json.latitude === 'number' && typeof json.longitude === 'number') {
              const approx = { latitude: json.latitude, longitude: json.longitude }
              setUserLocation(approx)
              setViewport(prev => ({
                ...prev,
                latitude: approx.latitude,
                longitude: approx.longitude,
                zoom: 8
              }))
              // Atualiza mensagem para indicar localização aproximada
              setLocationError('Usando localização aproximada por IP. Para check-in preciso, habilite o GPS.')
            }
          }
        } catch (e) {
          console.warn('Falha no fallback de IP para localização:', e)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Aumentado para 20s
        maximumAge: 0 // Forçar nova leitura
      }
    )
  }, [])

  // Calcular distância entre dois pontos
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Carregar eventos
  const loadEvents = useCallback(async () => {
    try {
      const response = await apiClient.get('/events/active')
      const eventsData = response.data.events || []
      setEvents(eventsData)

      // Filtrar eventos próximos se temos localização do usuário
      if (userLocation) {
        const nearby = eventsData.filter(event => {
          if (!event.latitude || !event.longitude) return false
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            event.latitude,
            event.longitude
          )
          return distance <= filters.radius
        })
        setNearbyEvents(nearby)
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
      setError('Erro ao carregar eventos')
    }
  }, [userLocation, filters.radius])

  // Carregar manifestações
  const loadManifestations = useCallback(async () => {
    try {
      // Aumentado o limite para 500 para garantir que todas apareçam no mapa
      const response = await apiClient.get('/manifestations?limit=500')
      const manifestationsData = response.data.data || []
      const active = Array.isArray(manifestationsData) 
        ? manifestationsData.filter(m => (m.is_active !== false) && (m.status !== 'cancelled'))
        : []
      setManifestations(active)

      // Filtrar manifestações próximas se temos localização do usuário
      if (userLocation) {
        const nearby = manifestationsData.filter(manifestation => {
          if (!manifestation.latitude || !manifestation.longitude) return false
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            manifestation.latitude,
            manifestation.longitude
          )
          return distance <= filters.radius
        })
        setNearbyManifestations(nearby)
      }
    } catch (error) {
      console.error('Erro ao carregar manifestações:', error)
    }
  }, [userLocation, filters.radius])

  // Carregar todos os dados
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await Promise.all([loadEvents(), loadManifestations()])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [loadEvents, loadManifestations])

  // Carregar check-ins do usuário
  const loadUserCheckins = useCallback(async () => {
    if (!user) return
    
    try {
      // Carregar check-ins de eventos
      const eventsResponse = await apiClient.get('/checkins/user')
      const eventCheckins = eventsResponse.data.checkins || []
      const eventIds = eventCheckins.map(checkin => checkin.event_id)
      setCheckedInEvents(eventIds)

      // Carregar check-ins de manifestações
      const manifestationsResponse = await apiClient.get('/manifestations/my-checkins')
      const manifestationCheckins = manifestationsResponse.data.data || []
      const manifestationIds = manifestationCheckins.map(checkin => checkin.manifestation_id)
      
      setCheckedInManifestations(prev => {
        // Combinar dados do backend com dados locais para evitar que o banner reapareça
        // caso o backend demore ou falhe momentaneamente
        const combined = [...new Set([...prev, ...manifestationIds])]
        // Atualizar cache local
        localStorage.setItem('manifestation_checkins', JSON.stringify(combined))
        return combined
      })
    } catch (error) {
      console.error('Erro ao carregar check-ins:', error)
    }
  }, [user])

  // Fazer check-in em evento
  const handleCheckIn = async (event) => {
    if (!user || !userLocation) {
      alert('É necessário estar logado e permitir acesso à localização')
      return
    }

    try {
      setCheckingIn(event.id)
      const response = await apiClient.post('/checkins/geographic', {
        event_id: event.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      })
      
      const data = response.data
      setCheckedInEvents(prev => [...prev, event.id])
      alert(`Check-in realizado com sucesso! Você ganhou ${data.points_awarded || 15} pontos. Distância: ${data.distance}m`)
      setSelectedEvent(null)
      loadEvents() // Refresh events to update participant count
    } catch (error) {
      console.error('Erro no check-in:', error)
      if (error.response?.data?.distance && error.response?.data?.maxDistance) {
        alert(`Você precisa estar a ${error.response.data.maxDistance}m do evento. Distância atual: ${error.response.data.distance}m`)
      } else {
        alert(error.response?.data?.error || 'Erro ao fazer check-in. Tente novamente.')
      }
    } finally {
      setCheckingIn(null)
    }
  }

  // Fazer check-in em manifestação
  const handleManifestationCheckIn = async (manifestation) => {
    if (!user || !userLocation) {
      alert('É necessário estar logado e permitir acesso à localização')
      return
    }

    try {
      setCheckingIn(manifestation.id)
      
      // Calcular distância localmente primeiro para validação rápida
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        manifestation.latitude,
        manifestation.longitude
      )
      
      // Converter para metros
      const distanceInMeters = distance * 1000
      
      if (distanceInMeters > manifestation.radius) {
        alert(`Você está a ${Math.round(distanceInMeters)}m do centro da manifestação. Aproxime-se mais ${Math.round(distanceInMeters - manifestation.radius)}m para fazer check-in.`)
        return
      }

      const response = await apiClient.post(`/manifestations/${manifestation.id}/checkin`, {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        device_info: {
          platform: 'web',
          userAgent: navigator.userAgent
        }
      })
      
      const data = response.data
      
      alert(`Check-in na manifestação realizado com sucesso!`)
      // Atualiza estado local imediatamente para esconder o banner
      const newCheckins = [...checkedInManifestations, manifestation.id]
      setCheckedInManifestations(newCheckins)
      localStorage.setItem('manifestation_checkins', JSON.stringify(newCheckins))
      
      setNearManifestation(null) // Remove o alerta após check-in
      loadManifestations() // Atualizar contadores
    } catch (error) {
      console.error('Erro no check-in da manifestação:', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Erro ao fazer check-in. Tente novamente.'
      alert(errMsg)
    } finally {
      setCheckingIn(null)
    }
  }

  // Monitorar geofence para manifestações
  useEffect(() => {
    if (!userLocation || !manifestations.length) return

    // Encontrar manifestação mais próxima que o usuário está DENTRO do raio
    const activeManifestation = manifestations.find(m => {
      if (!m.latitude || !m.longitude) return false
      
      const radius = m.radius || 500 // Default 500m se não definido
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        m.latitude,
        m.longitude
      )
      
      // Converter km para metros e comparar com raio (com margem de erro de 100m para GPS impreciso)
      // console.log(`Distância para ${m.name}: ${distance * 1000}m (Raio: ${radius}m)`)
      return (distance * 1000) <= (radius + 100)
    })

    // Se encontrou uma manifestação e ainda não fizemos check-in nela
    if (activeManifestation) {
      const isCheckedIn = checkedInManifestations.some(id => String(id) === String(activeManifestation.id))
      
      if (!isCheckedIn) {
        // Evitar re-setar se já for a mesma
        setNearManifestation(prev => prev?.id === activeManifestation.id ? prev : activeManifestation)
      } else {
        setNearManifestation(null)
      }
    } else {
      setNearManifestation(null)
    }
  }, [userLocation, manifestations, checkedInManifestations])

  // Efeitos
  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  useEffect(() => {
    loadUserCheckins()
  }, [loadUserCheckins])

  // Auto-refresh otimizado - reduz frequência quando página não está visível
  useEffect(() => {
    let interval
    
    const startAutoRefresh = () => {
      // Intervalo mais longo quando página não está visível (2 minutos)
      // Intervalo normal quando página está visível (30 segundos)
      const refreshInterval = document.hidden ? 120000 : 30000
      
      interval = setInterval(() => {
        // Só atualiza se a página estiver visível ou se passou muito tempo
        if (!document.hidden || Date.now() - lastRefresh.getTime() > 120000) {
          loadAllData()
          loadUserCheckins()
          setLastRefresh(new Date())
        }
      }, refreshInterval)
    }
    
    const handleVisibilityChange = () => {
      clearInterval(interval)
      startAutoRefresh()
    }
    
    startAutoRefresh()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadAllData, loadUserCheckins, lastRefresh])

  // Removido o listener manual de resize que causava conflitos no mobile
  // A propriedade trackResize={true} do LazyMap já lida com isso nativamente

  const getEventStatusColor = (event) => {
    const isCheckedIn = checkedInEvents.some(id => String(id) === String(event.id))
    if (isCheckedIn) return 'bg-green-500'
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        event.latitude,
        event.longitude
      )
      if (distance <= 0.1) return 'bg-blue-500' // Próximo o suficiente para check-in
      if (distance <= 1) return 'bg-yellow-500' // Próximo
    }
    return 'bg-red-500' // Distante
  }

  const getEventStatusText = (event) => {
    const isCheckedIn = checkedInEvents.some(id => String(id) === String(event.id))
    if (isCheckedIn) return 'Check-in realizado'
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        event.latitude,
        event.longitude
      )
      if (distance <= 0.1) return 'Disponível para check-in'
      if (distance <= 1) return `${distance.toFixed(1)}km de distância`
      return `${distance.toFixed(0)}km de distância`
    }
    return 'Localização necessária'
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mapa de Eventos</h1>
            <p className="text-sm sm:text-base text-gray-600">Encontre eventos próximos e faça check-in</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
            <button
              onClick={() => {
                loadEvents()
                loadUserCheckins()
                setLastRefresh(new Date())
              }}
              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </button>
            <button
              onClick={getUserLocation}
              className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Minha Localização</span>
              <span className="sm:hidden">Localização</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white shadow-sm border-b p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Raio (km)</label>
              <select
                value={filters.radius}
                onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={500}>500 km</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-white border-b px-3 sm:px-4 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span className="text-gray-600">
              {events.length} eventos, {manifestations.length} manifestações
            </span>
            {userLocation && (
              <span className="text-blue-600">
                {nearbyEvents.length + nearbyManifestations.length} próximos
              </span>
            )}
            <span className="text-green-600">
              {checkedInEvents.length + checkedInManifestations.length} check-ins realizados
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Última atualização: {lastRefresh.toLocaleTimeString()}</span>
            <span className="sm:hidden">{lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{locationError}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="flex-1 relative w-full h-full overflow-hidden isolate" ref={mapContainerRef} style={{ touchAction: 'none' }}>
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Carregando eventos...</p>
            </div>
          </div>
        )}

        <LazyMap
          ref={mapRef}
          viewState={viewport}
          onMove={evt => setViewport(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <LazyNavigationControl position="top-right" />
          <LazyScaleControl position="bottom-left" />
          <LazyFullscreenControl position="top-right" />

          {/* Marcador da localização do usuário */}
          {userLocation && (
            <LazyMarker
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
            >
              <div className="relative">
                {user?.avatar_url && !avatarError ? (
                  <div className="relative">
                    <div className="absolute -inset-1 bg-blue-600 rounded-full opacity-75 animate-pulse"></div>
                    <img 
                      src={user.avatar_url} 
                      alt="Eu" 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-lg relative z-10 object-cover bg-gray-200"
                      onError={() => setAvatarError(true)}
                    />
                  </div>
                ) : (
                  <div className="bg-blue-600 rounded-full p-2 border-2 border-white shadow-lg relative z-10">
                    <Navigation className="h-4 w-4 text-white" />
                  </div>
                )}
                {/* Seta de direção (opcional, apenas decorativa) */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600"></div>
              </div>
            </LazyMarker>
          )}

          {/* Marcadores de eventos */}
          {events
            .filter(event => {
              if (!event.latitude || !event.longitude) return false
              if (filters.city && !event.city?.toLowerCase().includes(filters.city.toLowerCase())) return false
              if (filters.state && !event.state?.toLowerCase().includes(filters.state.toLowerCase())) return false
              return true
            })
            .map((event) => (
              <LazyMarker
                key={event.id}
                latitude={event.latitude}
                longitude={event.longitude}
                onClick={() => setSelectedEvent(event)}
              >
                <div className={`${getEventStatusColor(event)} rounded-full p-2 cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-lg`}>
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </LazyMarker>
            ))
          }

          {/* Marcadores de manifestações */}
          {manifestations
            .filter(manifestation => {
              if (!manifestation.latitude || !manifestation.longitude) return false
              if (filters.city && !manifestation.city?.toLowerCase().includes(filters.city.toLowerCase())) return false
              if (filters.state && !manifestation.state?.toLowerCase().includes(filters.state.toLowerCase())) return false
              return true
            })
            .map((manifestation) => (
              <LazyMarker
                key={`manifestation-${manifestation.id}`}
                latitude={manifestation.latitude}
                longitude={manifestation.longitude}
                onClick={() => setSelectedManifestation(manifestation)}
              >
                <div className="bg-purple-600 rounded-full p-2 cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </LazyMarker>
            ))
          }

          {/* Popup do evento selecionado */}
          {selectedEvent && (
            <LazyPopup
              latitude={selectedEvent.latitude}
              longitude={selectedEvent.longitude}
              onClose={() => setSelectedEvent(null)}
              closeButton={true}
              closeOnClick={false}
              className="max-w-xs sm:max-w-sm"
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">{selectedEvent.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {selectedEvent.city}, {selectedEvent.state}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span>{selectedEvent.current_participants || 0} participantes</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{new Date(selectedEvent.start_time).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className={`font-medium truncate ${
                      checkedInEvents.includes(selectedEvent.id) ? 'text-green-600' :
                      userLocation && calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        selectedEvent.latitude,
                        selectedEvent.longitude
                      ) <= 0.1 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {getEventStatusText(selectedEvent)}
                    </span>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* RSVP Button */}
                <div className="mb-4">
                  <RSVPButton 
                    itemId={selectedEvent.id}
                    type="event"
                    size="sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {!checkedInEvents.includes(selectedEvent.id) && userLocation && (
                    <button
                      onClick={() => handleCheckIn(selectedEvent)}
                      disabled={checkingIn === selectedEvent.id}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      {checkingIn === selectedEvent.id ? (
                        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mx-auto" />
                      ) : (
                        <>🎯 Check-in</>
                      )}
                    </button>
                  )}
                  
                  {checkedInEvents.includes(selectedEvent.id) && (
                    <div className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-green-700 bg-green-100 rounded-md text-center">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                      Check-in realizado
                    </div>
                  )}
                </div>
              </div>
            </LazyPopup>
          )}

          {/* Popup da manifestação selecionada */}
          {selectedManifestation && (
            <LazyPopup
              latitude={selectedManifestation.latitude}
              longitude={selectedManifestation.longitude}
              onClose={() => setSelectedManifestation(null)}
              closeButton={true}
              closeOnClick={false}
              className="max-w-xs sm:max-w-sm"
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">{selectedManifestation.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {selectedManifestation.city}, {selectedManifestation.state}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span>Manifestação</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{new Date(selectedManifestation.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-purple-600">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="font-medium truncate">Manifestação Ativa</span>
                  </div>
                </div>

                {selectedManifestation.description && (
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{selectedManifestation.description}</p>
                  </div>
                )}

                {/* RSVP Button para manifestação */}
                <div className="mb-4">
                  <RSVPButton 
                    itemId={selectedManifestation.id}
                    type="manifestation"
                    size="sm"
                  />
                </div>
              </div>
          </LazyPopup>
        )}
        </LazyMap>

        {/* Alerta de Manifestação Próxima */}
        {nearManifestation && !checkingIn && (
          <div className="absolute bottom-8 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-10 z-50 animate-bounce-in">
            <div className="bg-green-600 text-white p-4 rounded-lg shadow-xl border-2 border-white max-w-sm w-full">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight mb-1">Você está na manifestação!</h3>
                  <p className="text-green-100 text-sm mb-3">{nearManifestation.name}</p>
                  <button
                    onClick={() => handleManifestationCheckIn(nearManifestation)}
                    disabled={checkingIn === nearManifestation.id}
                    className="w-full bg-white text-green-600 font-bold py-2 px-4 rounded shadow hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {checkingIn === nearManifestation.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>Fazer Check-in Agora</span>
                  </button>
                </div>
                <button 
                  onClick={() => setNearManifestation(null)}
                  className="text-green-200 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-white border-t p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
            <span className="truncate">Sua localização</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Check-in realizado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Disponível para check-in</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Próximo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Distante</span>
          </div>
          <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
            <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0"></div>
            <span className="truncate">Manifestações</span>
          </div>
        </div>
      </div>
    </div>
  )
  }

export default EventMap

