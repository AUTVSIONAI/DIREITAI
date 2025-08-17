import React, { useState, useEffect, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl, ScaleControl, FullscreenControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
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
import { useAuth } from '../../../hooks/useAuth'
import RSVPButton from '../../common/RSVPButton'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

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
  const [userLocation, setUserLocation] = useState(null)
  const [nearbyEvents, setNearbyEvents] = useState([])
  const [nearbyManifestations, setNearbyManifestations] = useState([])
  const [checkedInEvents, setCheckedInEvents] = useState([])

  // Estados de controle
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [checkingIn, setCheckingIn] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Estados de UI
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedManifestation, setSelectedManifestation] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    radius: 50 // km
  })

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
      (error) => {
        console.error('Erro ao obter localização:', error)
        setLocationError('Não foi possível obter sua localização. Verifique as permissões.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
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
      const response = await apiClient.get('/manifestations')
      const manifestationsData = response.data.data || []
      setManifestations(manifestationsData)

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
      const response = await apiClient.get('/checkins/user')
      const checkins = response.data.checkins || []
      const eventIds = checkins.map(checkin => checkin.event_id)
      setCheckedInEvents(eventIds)
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

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData()
      loadUserCheckins()
      setLastRefresh(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [loadAllData, loadUserCheckins])

  const getEventStatusColor = (event) => {
    if (checkedInEvents.includes(event.id)) return 'bg-green-500'
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
    if (checkedInEvents.includes(event.id)) return 'Check-in realizado'
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
    <div className="h-screen flex flex-col bg-gray-50">
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
              {checkedInEvents.length} check-ins realizados
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
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Carregando eventos...</p>
            </div>
          </div>
        )}

        <Map
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-left" />
          <FullscreenControl position="top-right" />

          {/* Marcador da localização do usuário */}
          {userLocation && (
            <Marker
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
            >
              <div className="bg-blue-600 rounded-full p-2 border-2 border-white shadow-lg">
                <Navigation className="h-4 w-4 text-white" />
              </div>
            </Marker>
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
              <Marker
                key={event.id}
                latitude={event.latitude}
                longitude={event.longitude}
                onClick={() => setSelectedEvent(event)}
              >
                <div className={`${getEventStatusColor(event)} rounded-full p-2 cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-lg`}>
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </Marker>
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
              <Marker
                key={`manifestation-${manifestation.id}`}
                latitude={manifestation.latitude}
                longitude={manifestation.longitude}
                onClick={() => setSelectedManifestation(manifestation)}
              >
                <div className="bg-purple-600 rounded-full p-2 cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </Marker>
            ))
          }

          {/* Popup do evento selecionado */}
          {selectedEvent && (
            <Popup
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
            </Popup>
          )}

          {/* Popup da manifestação selecionada */}
          {selectedManifestation && (
            <Popup
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
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">{selectedManifestation.title}</h3>
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
            </Popup>
          )}
        </Map>
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