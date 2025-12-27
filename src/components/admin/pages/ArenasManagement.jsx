import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Video, Calendar, Clock, User, CheckCircle, XCircle, PlayCircle, StopCircle, MessageSquare, UserPlus, Mail, Users, Check, AlertTriangle } from 'lucide-react'
import { apiRequest } from '../../../utils/apiClient'
import { toast } from 'react-hot-toast'

const ArenasManagement = () => {
  const [arenas, setArenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingArena, setEditingArena] = useState(null)
  const [politicians, setPoliticians] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    politician_id: '',
    scheduled_at: '',
    duration_minutes: 60,
    status: 'scheduled',
    rules: ''
  })

  // Invite State
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteArenaId, setInviteArenaId] = useState(null)
  const [inviteMode, setInviteMode] = useState('search') // 'search' | 'email'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [inviteRole, setInviteRole] = useState('journalist')
  const [newUserCreds, setNewUserCreds] = useState(null)
  const [externalName, setExternalName] = useState('')
  const [externalEmail, setExternalEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchArenas()
    fetchPoliticians()
  }, [])

  const fetchArenas = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/arenas')
      if (response.success) {
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        setArenas(data)
      } else {
        console.error('Erro ao carregar arenas:', response.error)
        toast.error('Erro ao carregar arenas')
      }
    } catch (error) {
      console.error('Erro ao buscar arenas:', error)
      toast.error('Erro ao carregar arenas')
    } finally {
      setLoading(false)
    }
  }

  const fetchPoliticians = async () => {
    try {
      const response = await apiRequest('/politicians?limit=1000')
      if (response.success) {
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        setPoliticians(data)
      }
    } catch (error) {
      console.error('Erro ao buscar políticos:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let response;
      if (editingArena) {
        response = await apiRequest(`/arenas/${editingArena.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        })
      } else {
        response = await apiRequest('/arenas', {
          method: 'POST',
          body: JSON.stringify(formData)
        })
      }

      if (response.success) {
        toast.success(editingArena ? 'Arena atualizada com sucesso' : 'Arena criada com sucesso')
        setShowModal(false)
        setEditingArena(null)
        resetForm()
        fetchArenas()
      } else {
        toast.error('Erro ao salvar arena: ' + (response.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar arena:', error)
      toast.error('Erro ao salvar arena')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta arena?')) return
    try {
      const response = await apiRequest(`/arenas/${id}`, { method: 'DELETE' })
      if (response.success) {
        toast.success('Arena excluída')
        fetchArenas()
      } else {
        toast.error('Erro ao excluir: ' + (response.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir arena')
    }
  }

  const handleEdit = (arena) => {
    setEditingArena(arena)
    setFormData({
      title: arena.title,
      description: arena.description || '',
      politician_id: arena.politician_id,
      scheduled_at: arena.scheduled_at ? new Date(arena.scheduled_at).toISOString().slice(0, 16) : '',
      duration_minutes: arena.duration_minutes,
      status: arena.status,
      rules: arena.rules || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      politician_id: '',
      scheduled_at: '',
      duration_minutes: 60,
      status: 'scheduled',
      rules: ''
    })
  }

  const filteredArenas = arenas.filter(arena => {
    if (filterStatus === 'all') return true
    return arena.status === filterStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'ended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'live': return 'AO VIVO'
      case 'scheduled': return 'Agendada'
      case 'ended': return 'Encerrada'
      default: return status
    }
  }

  const handleOpenInvite = (arenaId) => {
    setInviteArenaId(arenaId)
    setShowInviteModal(true)
    setNewUserCreds(null)
    setSearchQuery('')
    setSearchResults([])
    setExternalName('')
    setExternalEmail('')
    setInviteMode('search')
  }

  const handleSearchUsers = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const response = await apiRequest(`/arenas/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.success) {
        setSearchResults(response.data)
      } else {
        console.error('Error searching users:', response.error)
        toast.error('Erro ao buscar usuários')
      }
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Erro ao buscar usuários')
    } finally {
      setSearching(false)
    }
  }

  const handleInviteUser = async (userId) => {
    if (!inviteArenaId) return
    setInviting(true)
    try {
      const response = await apiRequest(`/arenas/${inviteArenaId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role: inviteRole })
      })
      if (response.success) {
        toast.success('Convite enviado com sucesso!')
      } else {
        toast.error('Erro ao enviar convite: ' + (response.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('Erro ao enviar convite')
    } finally {
      setInviting(false)
    }
  }

  const handleInviteExternal = async (e) => {
    e.preventDefault()
    if (!inviteArenaId || !externalName || !externalEmail) return
    
    setInviting(true)
    try {
      console.log('Enviando convite externo para:', externalEmail)
      const response = await apiRequest(`/arenas/${inviteArenaId}/invite-external`, {
        method: 'POST',
        body: JSON.stringify({ name: externalName, email: externalEmail, role: inviteRole })
      })
      
      console.log('Resposta do convite externo:', response)

      if (response.success) {
        const data = response.data
        if (data.tempPassword) {
            setNewUserCreds({ email: externalEmail, password: data.tempPassword })
            setExternalName('')
            setExternalEmail('')
        } else if (data.participant) {
            toast.success('Usuário convidado com sucesso!')
            setShowInviteModal(false)
        }
      } else {
        toast.error('Erro ao convidar usuário externo: ' + (response.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error inviting external user:', error)
      toast.error('Erro ao convidar usuário externo')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arena do Povo</h1>
          <p className="text-gray-600">Gerencie as sessões de perguntas e respostas ao vivo</p>
        </div>
        <button
          onClick={() => {
            setEditingArena(null)
            resetForm()
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Arena
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Filter className="w-5 h-5" />
          <span className="text-sm font-medium">Filtrar por:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="scheduled">Agendadas</option>
          <option value="live">Ao Vivo</option>
          <option value="ended">Encerradas</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando arenas...</div>
        ) : filteredArenas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma arena encontrada</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredArenas.map((arena) => (
              <div key={arena.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      arena.status === 'live' ? 'bg-red-100' : 'bg-blue-50'
                    }`}>
                      <Video className={`w-6 h-6 ${
                        arena.status === 'live' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{arena.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(arena.status)}`}>
                          {getStatusLabel(arena.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{arena.politicians?.name || 'Político não identificado'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(arena.scheduled_at).toLocaleDateString()} às {new Date(arena.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{arena.duration_minutes} minutos</span>
                        </div>
                        {arena.description && (
                          <div className="col-span-2 mt-1 text-gray-500 line-clamp-2">
                            {arena.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenInvite(arena.id)}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition-colors"
                      title="Convidar"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(arena)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {/* Botão de Controle Rápido de Status */}
                    {arena.status === 'scheduled' && (
                      <button
                        onClick={async () => {
                           try {
                             const response = await apiRequest(`/arenas/${arena.id}`, {
                               method: 'PUT',
                               body: JSON.stringify({ status: 'live' })
                             })
                             if (response.success) {
                               toast.success('Arena iniciada!')
                               fetchArenas()
                             } else {
                               toast.error('Erro ao iniciar')
                             }
                           } catch (e) { toast.error('Erro ao iniciar') }
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        title="Iniciar Live"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </button>
                    )}
                    {arena.status === 'live' && (
                      <button
                        onClick={async () => {
                           if(!window.confirm('Encerrar Arena?')) return
                           try {
                             const response = await apiRequest(`/arenas/${arena.id}`, {
                               method: 'PUT',
                               body: JSON.stringify({ status: 'ended' })
                             })
                             if (response.success) {
                               toast.success('Arena encerrada!')
                               fetchArenas()
                             } else {
                               toast.error('Erro ao encerrar')
                             }
                           } catch (e) { toast.error('Erro ao encerrar') }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Encerrar Live"
                      >
                        <StopCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingArena ? 'Editar Arena' : 'Nova Arena'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ex: Sabatina com Candidato X"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Político</label>
                    <select
                      required
                      value={formData.politician_id}
                      onChange={(e) => setFormData({...formData, politician_id: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Selecione um político...</option>
                      {politicians.map(pol => (
                        <option key={pol.id} value={pol.id}>
                          {pol.name} ({pol.party})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data e Hora</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duração (min)</label>
                      <input
                        type="number"
                        min="15"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="scheduled">Agendada</option>
                        <option value="live">Ao Vivo</option>
                        <option value="ended">Encerrada</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Regras (Markdown)</label>
                    <textarea
                      rows={3}
                      value={formData.rules}
                      onChange={(e) => setFormData({...formData, rules: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Regras da sabatina..."
                    />
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    >
                      {editingArena ? 'Salvar Alterações' : 'Criar Arena'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowInviteModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Convidar Participante</h3>
                    <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {newUserCreds ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                        <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2"><CheckCircle size={18} /> Usuário Criado!</h4>
                        <div className="flex items-start gap-2 mb-3 bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800 text-sm">
                           <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                           <p><strong>Atenção:</strong> O envio automático de email pode falhar. Por favor, copie as credenciais abaixo e envie manualmente para o convidado.</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Credenciais de acesso:</p>
                        <div className="bg-gray-100 p-3 rounded text-sm font-mono select-all border border-gray-300 text-gray-800">
                            <p>Email: <span className="font-bold">{newUserCreds.email}</span></p>
                            <p>Senha: <span className="font-bold">{newUserCreds.password}</span></p>
                        </div>
                        <button 
                            onClick={() => { setNewUserCreds(null); setShowInviteModal(false); }}
                            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold"
                        >
                            Concluído
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
                            <button 
                                onClick={() => setInviteMode('search')}
                                className={`pb-2 text-sm font-bold flex items-center gap-2 ${inviteMode === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            >
                                <Search size={16} /> Buscar Usuário
                            </button>
                            <button 
                                onClick={() => setInviteMode('email')}
                                className={`pb-2 text-sm font-bold flex items-center gap-2 ${inviteMode === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            >
                                <Mail size={16} /> Convidar Externo
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-gray-600 mb-1 font-medium">Função na Arena</label>
                            <select 
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="w-full bg-white rounded px-3 py-2 text-gray-800 border border-gray-300 focus:border-blue-500 outline-none"
                            >
                                <option value="journalist">Jornalista</option>
                                <option value="guest">Convidado</option>
                                <option value="moderator">Moderador</option>
                            </select>
                        </div>

                        {inviteMode === 'search' ? (
                            <>
                                <form onSubmit={handleSearchUsers} className="mb-4">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Nome ou Email..."
                                            className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button type="submit" disabled={searching} className="bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-white disabled:opacity-50">
                                            {searching ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </form>

                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-2 flex items-center justify-center text-gray-500">
                                                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <Users size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{user.full_name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleInviteUser(user.id)}
                                                disabled={inviting}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50"
                                            >
                                                {inviting ? '...' : 'Convidar'}
                                            </button>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && searchQuery && (
                                        <p className="text-center text-gray-500 text-sm mt-4">Nenhum usuário encontrado.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleInviteExternal}>
                                <div className="mb-3">
                                    <label className="block text-sm text-gray-600 mb-1">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        value={externalName}
                                        onChange={(e) => setExternalName(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={externalEmail}
                                        onChange={(e) => setExternalEmail(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 text-xs text-blue-800">
                                    <p>Um usuário temporário será criado e as credenciais serão exibidas na próxima tela.</p>
                                </div>
                                <button type="submit" disabled={inviting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold disabled:opacity-50 flex justify-center items-center gap-2">
                                    {inviting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processando...
                                        </>
                                    ) : 'Criar Convite'}
                                </button>
                            </form>
                        )}
                    </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArenasManagement