import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Bot, MessageCircle } from 'lucide-react'
import { apiClient } from '../../../lib/api'

const AgentsManagement = () => {
  const [agents, setAgents] = useState([])
  const [politicians, setPoliticians] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)

  const [formData, setFormData] = useState({
    politician_id: '',
    trained_prompt: '',
    voice_id: '',
    personality_config: '{}',
    is_active: true
  })

  useEffect(() => {
    fetchAgents()
    fetchPoliticians()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/agents')
      // A API retorna { success: true, data: [...] }
      setAgents(response.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar agentes:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPoliticians = async () => {
    try {
      const response = await apiClient.get('/politicians')
      // A API retorna { success: true, data: [...], pagination: {...} }
      setPoliticians(response.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar políticos:', error)
      setPoliticians([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAgent) {
        await apiClient.put(`/agents/${editingAgent.id}`, formData)
      } else {
        await apiClient.post('/agents', formData)
      }
      fetchAgents()
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar agente:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este agente?')) {
      try {
        await apiClient.delete(`/agents/${id}`)
        fetchAgents()
      } catch (error) {
        console.error('Erro ao excluir agente:', error)
      }
    }
  }

  const toggleActive = async (id, isActive) => {
    try {
      await apiClient.put(`/agents/${id}`, { is_active: !isActive })
      fetchAgents()
    } catch (error) {
      console.error('Erro ao alterar status do agente:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      politician_id: '',
      trained_prompt: '',
      voice_id: '',
      personality_config: '{}',
      is_active: true
    })
    setEditingAgent(null)
    setShowAddModal(false)
  }

  const startEdit = (agent) => {
    setFormData({
      politician_id: agent.politician_id || '',
      trained_prompt: agent.trained_prompt || '',
      voice_id: agent.voice_id || '',
      personality_config: agent.personality_config || '{}',
      is_active: agent.is_active !== false
    })
    setEditingAgent(agent)
    setShowAddModal(true)
  }

  const filteredAgents = Array.isArray(agents) ? agents.filter(agent => {
    const matchesSearch = agent.politicians?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.trained_prompt?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) : []

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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Agentes IA</h1>
          <p className="text-gray-600">Gerencie os agentes de IA dos políticos</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Agente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome do agente ou político..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Político
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prompt de Treinamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {agent.politicians?.name || 'Não vinculado'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {agent.politicians?.party}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {agent.trained_prompt || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.voice_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(agent.id, agent.is_active)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        agent.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {agent.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(agent)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agente encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar a busca.' : 'Comece adicionando um novo agente.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAgent ? 'Editar Agente' : 'Adicionar Agente'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Político</label>
                  <select
                    required
                    value={formData.politician_id}
                    onChange={(e) => setFormData({...formData, politician_id: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um político</option>
                    {Array.isArray(politicians) && politicians.map(politician => (
                      <option key={politician.id} value={politician.id}>
                        {politician.name} - {politician.party}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prompt de Treinamento</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.trained_prompt}
                    onChange={(e) => setFormData({...formData, trained_prompt: e.target.value})}
                    placeholder="Prompt de treinamento do agente..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Voice ID</label>
                  <input
                    type="text"
                    value={formData.voice_id}
                    onChange={(e) => setFormData({...formData, voice_id: e.target.value})}
                    placeholder="ID da voz (opcional)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Configuração de Personalidade (JSON)</label>
                  <textarea
                    rows={3}
                    value={formData.personality_config}
                    onChange={(e) => setFormData({...formData, personality_config: e.target.value})}
                    placeholder='{"tone": "formal", "style": "professional"}'
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Agente ativo
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingAgent ? 'Atualizar' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentsManagement