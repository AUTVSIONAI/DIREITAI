import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Users, Award, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { apiClient } from '../../../lib/api'
import RSVPButton from '../../common/RSVPButton'

const CheckIn = () => {
  const { user } = useAuth()
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [secretCode, setSecretCode] = useState('')
  const [checkInStatus, setCheckInStatus] = useState(null)
  const [nearbyEvents, setNearbyEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [manifestations, setManifestations] = useState([])
  const [loadingManifestations, setLoadingManifestations] = useState(true)
  const [activeTab, setActiveTab] = useState('events')

  useEffect(() => {
    getCurrentLocation()
    fetchEvents()
    fetchManifestations()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true)
      const response = await apiClient.get('/events?status=ativo&limit=20')
      
      const data = response.data
      const formattedEvents = data.events.map(event => ({
        id: event.id,
        title: event.title,
        location: event.location,
        date: event.date,
        time: event.time,
        participants: event.current_participants || 0,
        points: 100, // Pontos padrão por check-in
        status: event.status === 'ativo' ? 'active' : event.status,
        secret_code: event.secret_code
      }))
      setNearbyEvents(formattedEvents)
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const fetchManifestations = async () => {
    try {
      setLoadingManifestations(true)
      const response = await apiClient.get('/manifestations?status=active&limit=20')
      
      console.log('Response manifestations:', response.data) // Debug log
      
      const data = response.data
      // Verificar se data existe e tem a propriedade data
      if (!data || !data.data) {
        console.warn('Dados de manifestações não encontrados na resposta')
        setManifestations([])
        return
      }
      
      // A API retorna os dados em data.data, não data.manifestations
      const manifestationsData = data.data
      
      // Verificar se manifestationsData é um array
      if (!Array.isArray(manifestationsData)) {
        console.warn('Dados de manifestações não são um array:', manifestationsData)
        setManifestations([])
        return
      }
      
      const formattedManifestations = manifestationsData.map(manifestation => ({
        id: manifestation.id,
        title: manifestation.name || manifestation.title,
        location: `${manifestation.city || ''}, ${manifestation.state || ''}`,
        date: manifestation.start_date ? new Date(manifestation.start_date).toLocaleDateString('pt-BR') : 'Data não definida',
        time: manifestation.start_date ? new Date(manifestation.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hora não definida',
        participants: manifestation.current_participants || 0,
        points: 150, // Pontos padrão por check-in em manifestação
        status: manifestation.status,
        description: manifestation.description || ''
      }))
      setManifestations(formattedManifestations)
    } catch (error) {
      console.error('Erro ao buscar manifestações:', error)
      setManifestations([]) // Definir array vazio em caso de erro
    } finally {
      setLoadingManifestations(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocalização não disponível:', error.message)
          // Define uma localização padrão (São Paulo) se não conseguir obter a localização
          setLocation({
            lat: -23.5505,
            lng: -46.6333
          })
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else {
      console.warn('Geolocalização não suportada pelo navegador')
      // Define uma localização padrão (São Paulo)
      setLocation({
        lat: -23.5505,
        lng: -46.6333
      })
    }
  }

  const handleCheckIn = async (eventId) => {
    if (!secretCode.trim()) {
      alert('Por favor, insira o código secreto do evento')
      return
    }

    setLoading(true)
    
    try {
      const response = await apiClient.post('/checkins', {
        event_id: eventId,
        secret_code: secretCode,
        location: location
      })
      
      const data = response.data
      
      if (response.success !== false) {
        setCheckInStatus({
          success: true,
          message: 'Check-in realizado com sucesso!',
          points: data.points || 100
        })
        setSecretCode('')
        // Atualizar a lista de eventos para refletir o check-in
        fetchEvents()
      } else {
        setCheckInStatus({
          success: false,
          message: data.error || 'Código secreto inválido. Verifique com os organizadores.'
        })
      }
    } catch (error) {
      console.error('Erro ao realizar check-in:', error)
      setCheckInStatus({
        success: false,
        message: 'Erro ao realizar check-in. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  const getEventStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'ended':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Ativo Agora'
      case 'upcoming':
        return 'Em Breve'
      case 'ended':
        return 'Finalizado'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check-in</h2>
          <p className="text-gray-600">Registre sua presença em eventos e manifestações</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>{location ? 'Localização detectada' : 'Detectando localização...'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setActiveTab('manifestations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manifestations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manifestações
          </button>
        </nav>
      </div>

      {/* Check-in Status */}
      {checkInStatus && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          checkInStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {checkInStatus.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${
              checkInStatus.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {checkInStatus.message}
            </p>
            {checkInStatus.success && checkInStatus.points && (
              <p className="text-sm text-green-600">
                Você ganhou {checkInStatus.points} pontos!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Check-in */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-in Rápido</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código Secreto do Evento
            </label>
            <input
              type="text"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
              placeholder="Digite o código fornecido no evento"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              O código é fornecido pelos organizadores no local do evento
            </p>
          </div>
          
          <button
            onClick={() => {
              if (nearbyEvents.length > 0) {
                handleCheckIn(nearbyEvents[0].id)
              } else {
                alert('Nenhum evento disponível para check-in')
              }
            }}
            disabled={loading || !secretCode.trim() || nearbyEvents.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Fazer Check-in'}
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'events' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos Próximos</h3>
          <div className="space-y-4">
            {loadingEvents ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando eventos...</p>
              </div>
            ) : nearbyEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum evento ativo encontrado no momento.</p>
              </div>
            ) : (
              nearbyEvents.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getEventStatusBadge(event.status)
                    }`}>
                      {getEventStatusText(event.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.date} às {event.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{event.participants} participantes</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-primary-600 mb-2">
                    <Award className="h-4 w-4" />
                    <span className="font-medium">{event.points} pts</span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* RSVP Button */}
                    <RSVPButton 
                      itemId={event.id}
                      type="event"
                      size="sm"
                    />
                    
                    {event.status === 'active' && (
                      <button className="btn-primary text-sm px-3 py-1 w-full">
                        Check-in
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'manifestations' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manifestações Próximas</h3>
          <div className="space-y-4">
            {loadingManifestations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando manifestações...</p>
              </div>
            ) : manifestations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma manifestação ativa encontrada no momento.</p>
              </div>
            ) : (
              manifestations.map((manifestation) => (
                <div key={manifestation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{manifestation.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getEventStatusBadge(manifestation.status)
                        }`}>
                          {getEventStatusText(manifestation.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{manifestation.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{manifestation.date} às {manifestation.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{manifestation.participants} participantes</span>
                        </div>
                      </div>
                      
                      {manifestation.description && (
                        <p className="text-sm text-gray-600 mt-2">{manifestation.description}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-primary-600 mb-2">
                        <Award className="h-4 w-4" />
                        <span className="font-medium">{manifestation.points} pts</span>
                      </div>
                      
                      <div className="space-y-2">
                        {/* RSVP Button */}
                        <RSVPButton 
                          itemId={manifestation.id}
                          type="manifestation"
                          size="sm"
                        />
                        
                        {manifestation.status === 'active' && (
                          <button className="btn-primary text-sm px-3 py-1 w-full">
                            Confirmar Presença
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Como fazer check-in:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Vá até o local do evento</li>
          <li>Procure pelos organizadores ou voluntários</li>
          <li>Solicite o código secreto do evento</li>
          <li>Digite o código no campo acima e clique em "Fazer Check-in"</li>
          <li>Ganhe pontos e suba no ranking!</li>
        </ol>
      </div>

      {/* Demo Code */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">🎯 Código de Demonstração:</h4>
        <p className="text-sm text-yellow-800">
          Use o código <strong>LIBERDADE2024</strong> para testar o sistema de check-in.
        </p>
      </div>
    </div>
  )
}

export default CheckIn