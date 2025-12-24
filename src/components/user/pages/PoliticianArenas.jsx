import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { apiRequest } from '../../../utils/apiClient'
import { Video, Calendar, Clock, AlertTriangle, CheckCircle, Play } from 'lucide-react'
import { format, isAfter, isBefore, addMinutes, subMinutes, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PoliticianArenas = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [arenas, setArenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const resolvePolitician = async () => {
      // Verificar se o usuário é um político e tem um politician_id
      if (userProfile) {
        if (userProfile.role === 'politician') {
          if (userProfile.politician_id) {
            fetchArenas(userProfile.politician_id)
          } else {
             // Tentar resolver pelo email se não tiver ID direto
             try {
                const response = await apiRequest('/politicians?email=' + userProfile.email)
                if (response.success || (Array.isArray(response) && response.length > 0) || (response.data && response.data.length > 0)) {
                   // Normalizar resposta (pode ser array direto ou {data: [...]})
                   const data = Array.isArray(response) ? response : (response.data || [])
                   
                   if (data.length > 0) {
                     const pol = data[0]
                     fetchArenas(pol.id)
                     return
                   }
                }
             } catch (e) {
                console.error('Falha ao tentar resolver politico por email', e)
             }
             
             setLoading(false)
             setError(`Seu perfil de usuário (${userProfile.email}) não está vinculado a um registro de político. Contate o suporte.`)
          }
        } else {
          // Se não for político, talvez redirecionar ou mostrar erro
          setLoading(false)
          setError('Acesso restrito a políticos.')
        }
      }
    }
    
    resolvePolitician()
  }, [userProfile])

  const fetchArenas = async (politicianId) => {
    try {
      setLoading(true)
      const response = await apiRequest(`/arenas?politician_id=${politicianId}`)
      if (response.success || Array.isArray(response)) { 
        // Adaptação para diferentes formatos de resposta
        const data = Array.isArray(response) ? response : (response.data || [])
        setArenas(data)
      } else {
        setError('Erro ao carregar arenas.')
      }
    } catch (err) {
      console.error('Erro ao buscar arenas:', err)
      setError('Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnterArena = (arenaId) => {
    navigate(`/arena/${arenaId}`)
  }

  const getStatusBadge = (arena) => {
    const now = new Date()
    const scheduled = parseISO(arena.scheduled_at)
    const end = addMinutes(scheduled, arena.duration_minutes || 60)

    if (arena.status === 'live') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 animate-pulse">
          <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
          AO VIVO
        </span>
      )
    }

    if (arena.status === 'ended') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          Encerrada
        </span>
      )
    }

    // Scheduled checks
    if (isAfter(now, scheduled) && arena.status === 'scheduled') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Atrasada
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        <Calendar className="w-3 h-3 mr-1" />
        Agendada
      </span>
    )
  }

  const getActionButtons = (arena) => {
    const now = new Date()
    const scheduled = parseISO(arena.scheduled_at)
    // Permitir entrada 30 minutos antes
    const canEnter = isAfter(now, subMinutes(scheduled, 30)) && arena.status !== 'ended'
    
    return (
      <div className="flex space-x-2 mt-4">
        {canEnter ? (
           <button
             onClick={() => handleEnterArena(arena.id)}
             className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
           >
             <Play className="w-4 h-4 mr-2" />
             {arena.status === 'live' ? 'Entrar na Live' : 'Iniciar/Entrar na Sala'}
           </button>
        ) : (
           <button
             disabled
             className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed"
           >
             <Clock className="w-4 h-4 mr-2" />
             Aguardando Horário
           </button>
        )}
      </div>
    )
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  if (error) return (
    <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
      <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
      <p>{error}</p>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-8 h-8 text-blue-600" />
            Minhas Arenas
          </h1>
          <p className="text-gray-600 mt-1">Gerencie suas participações na Arena do Povo</p>
        </div>
      </div>

      {arenas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma Arena Agendada</h3>
          <p className="text-gray-500 mt-2">Você ainda não tem participações agendadas na Arena do Povo.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {arenas.map((arena) => {
            const scheduledDate = parseISO(arena.scheduled_at)
            const isLate = isAfter(new Date(), scheduledDate) && arena.status === 'scheduled'
            const canEnter = isAfter(new Date(), subMinutes(scheduledDate, 30)) && arena.status !== 'ended'

            return (
              <div key={arena.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    {getStatusBadge(arena)}
                    {isLate && (
                      <span className="text-xs font-medium text-red-600 flex items-center bg-red-50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3 mr-1" />
                        Aguardando início
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{arena.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{arena.description}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {format(scheduledDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {format(scheduledDate, "HH:mm", { locale: ptBR })} ({arena.duration_minutes} min)
                    </div>
                  </div>

                  {getActionButtons(arena)}
                  
                  {!canEnter && arena.status === 'scheduled' && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      A sala será aberta 30 minutos antes do início.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PoliticianArenas
