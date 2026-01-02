import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Bot, MessageCircle } from 'lucide-react'
import { apiClient } from '../../../lib/api'
import { agentGenerationService } from '../../../services/agentGeneration'
import { supabase } from '../../../lib/supabase'

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
  const [creatingBulkAgents, setCreatingBulkAgents] = useState(false)
  // Estados para verificação por ID do político
  const [verifyPoliticianId, setVerifyPoliticianId] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  
  // Toast e destaque de linha
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message: string }
  const [highlightedPoliticianId, setHighlightedPoliticianId] = useState(null)
  const showToast = (type, message, duration = 4000) => {
    setToast({ type, message })
    if (duration > 0) {
      setTimeout(() => setToast(null), duration)
    }
  }

  // Utilitário: limitar tamanho de textos enviados ao backend
  function clampText(text, maxLen) {
    if (!text) return ''
    const s = String(text)
    return s.length > maxLen ? s.slice(0, maxLen) : s
  }

  // Função de verificação de agente por ID do político (dentro do componente)
  const handleVerifyAgent = async () => {
    const id = String(verifyPoliticianId || '').trim()
    if (!id) {
      alert('Informe o ID do político para verificar o agente.')
      return
    }
    try {
      setVerifyLoading(true)
      setVerifyResult(null)
      const response = await apiClient.get(`/agents?politician_id=${encodeURIComponent(id)}`)
      const data = response.data?.data || response.data || []
      const list = Array.isArray(data) ? data : []
      setVerifyResult(list)
      console.log('[Verificação] Resultado para politician_id=', id, list)
      if (list.length > 0) {
        const a = list[0]
        alert(`Agente encontrado: ${a?.name || 'sem nome'} (id ${a?.id}).`)
      } else {
        alert('Nenhum agente encontrado para este político.')
      }
    } catch (err) {
      const status = err?.response?.status
      const body = err?.response?.data
      console.error('[Verificação] Falha GET /agents?politician_id=', verifyPoliticianId, status, body)
      const msg = typeof body === 'string' ? body : (body?.message || 'Verifique o console para detalhes.')
      alert(`Erro na verificação (${status || 'desconhecido'}): ${msg}`)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleCreateAgentById = async () => {
    const id = String(verifyPoliticianId || '').trim()
    if (!id) {
      alert('Informe o ID do político para criar o agente.')
      return
    }
    try {
      setVerifyLoading(true)
      // Verificar duplicidade usando helper compat
      const existing = await getAgentsByPoliticianId(id)
      if (Array.isArray(existing) && existing.length > 0) {
        setVerifyResult(existing)
        alert('Já existe agente para este político.')
        setVerifyLoading(false)
        return
      }
      // Tentar buscar dados do político
      let politician = null
      try {
        const resp = await apiClient.get(`/politicians/${encodeURIComponent(id)}`)
        politician = resp.data?.data || resp.data || resp
        if (politician?.data) politician = politician.data
        if (!politician || !politician.id) {
          alert('Político não encontrado. Verifique o ID e tente novamente.')
          setVerifyLoading(false)
          return
        }
      } catch (e) {
        console.warn('Falha ao carregar político pelo ID:', e)
        alert('Político não encontrado. Verifique o ID e tente novamente.')
        setVerifyLoading(false)
        return
      }
      // Criação alinhada ao fluxo das demais telas (service)
      try {
        const result = await agentGenerationService.createAgentForPolitician({
          id: politician.id,
          name: politician.name,
          position: politician.position,
          party: politician.party,
          state: politician.state,
          city: politician.city
        })
        if (result.success) {
          console.log('[Criação por ID] Agente criado via serviço:', result)
          showToast('success', `Agente criado para ${politician.name}`)
          setHighlightedPoliticianId(String(politician.id))
          setTimeout(() => setHighlightedPoliticianId(null), 5000)
        } else {
          console.warn('[Criação por ID] Falha ao criar agente via serviço:', result.error)
          showToast('error', 'Falha ao criar agente: ' + (result.error || 'Erro desconhecido'))
          alert('Falha ao criar agente: ' + (result.error || 'Erro desconhecido'))
        }
      } catch (svcErr) {
        console.error('[Criação por ID] Erro no serviço:', svcErr)
        showToast('error', 'Erro ao criar agente: ' + (svcErr.message || 'Erro desconhecido'))
        alert('Erro ao criar agente: ' + (svcErr.message || 'Erro desconhecido'))
      }
      setVerifyResult(null)
      setVerifyLoading(false)
      fetchAgents()
    } catch (error) {
      console.error('[Criação por ID] Falha POST /agents', error?.response?.status, error?.response?.data || error)
      alert(`Erro ao criar agente por ID (${error?.response?.status || 'desconhecido'}): ${error?.response?.data?.error || error.message || 'Erro desconhecido'}`)
      setVerifyLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    fetchPoliticians()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      // Tenta com paginação alta; se falhar, faz fallback para rota simples
      let list = []
      try {
        const response = await apiClient.get('/agents?limit=1000&page=1')
        list = response.data?.data || []
        console.log('Agentes carregados (admin) via paginação:', list.length)
      } catch (err) {
        const status = err?.response?.status
        console.warn('Falha ao buscar com paginação, tentando fallback /agents. Status:', status)
        const response = await apiClient.get('/agents')
        list = response.data?.data || response.data || []
        console.log('Agentes carregados (admin) via fallback:', Array.isArray(list) ? list.length : 0)
      }
      setAgents(list)
    } catch (error) {
      console.error('Erro ao carregar agentes:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPoliticians = async () => {
    try {
      const response = await apiClient.get('/politicians?status=approved&limit=1000&page=1')
      // A API retorna { success: true, data: [...], pagination: {...} }
      setPoliticians(response.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar políticos:', error)
      setPoliticians([])
    }
  }

  // Helpers de compatibilidade de rota: tentar /agents e fallback para /politician_agents, depois Supabase direto
  const getAgentsByPoliticianId = async (pid) => {
    try {
      const resp = await apiClient.get(`/agents?politician_id=${encodeURIComponent(pid)}`)
      let rows = resp.data?.data || resp.data || []
      if (!Array.isArray(rows)) rows = []
      if (rows.length === 0) {
        try {
          const resp2 = await apiClient.get(`/politician_agents?politician_id=${encodeURIComponent(pid)}`)
          rows = resp2.data?.data || resp2.data || []
        } catch {}
      }
      return rows
    } catch (err) {
      try {
        const resp2 = await apiClient.get(`/politician_agents?politician_id=${encodeURIComponent(pid)}`)
        return resp2.data?.data || resp2.data || []
      } catch {
        return []
      }
    }
  }

  const postAgentCompat = async (data) => {
    try {
      return await apiClient.post('/agents', data)
    } catch (err) {
      const status = err?.response?.status
      if (status === 500 || status === 404) {
        return await apiClient.post('/politician_agents', data)
      }
      throw err
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const selectedPoliticianId = formData.politician_id
      if (!selectedPoliticianId) {
        alert('Selecione um político.')
        return
      }

      // Obter político selecionado para preencher campos obrigatórios do agente
      const selectedPolitician = Array.isArray(politicians)
        ? politicians.find(p => String(p.id) === String(selectedPoliticianId))
        : null

      // Construir prompt: usar o informado ou gerar padrão
      let trainedPrompt = (formData.trained_prompt || '').trim()
      if (!trainedPrompt) {
        if (selectedPolitician) {
          trainedPrompt = agentGenerationService.generateDefaultPrompt({
            id: selectedPolitician.id,
            name: selectedPolitician.name,
            position: selectedPolitician.position,
            party: selectedPolitician.party,
            state: selectedPolitician.state,
            city: selectedPolitician.city
          })
        } else {
          alert('Preencha o prompt de treinamento do agente.')
          return
        }
      }

      // Validar personality_config como JSON, ou usar padrão
      let personalityConfigObj
      try {
        if (!formData.personality_config || !formData.personality_config.trim()) {
          personalityConfigObj = agentGenerationService.generateDefaultPersonalityConfig()
        } else {
          personalityConfigObj = JSON.parse(formData.personality_config)
        }
      } catch (jsonErr) {
        console.warn('Configuração de personalidade inválida, usando padrão. Detalhe:', jsonErr)
        personalityConfigObj = agentGenerationService.generateDefaultPersonalityConfig()
      }

      const normalizedPoliticianId = String(selectedPoliticianId)
      // Sanitizar campos (limites conservadores)
      const safePrompt = clampText(trainedPrompt, 4000)

      let userId = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
      } catch {}

      const payload = {
        politician_id: normalizedPoliticianId,
        trained_prompt: safePrompt,
        personality_config: personalityConfigObj,
        is_active: formData.is_active,
        ...(formData.voice_id ? { voice_id: formData.voice_id } : {}),
        ...(userId ? { created_by: userId } : {})
      }

      console.log('Enviando payload de agente:', { ...payload, prompt_len: safePrompt.length })

      // Flag para saber se usamos fallback e devemos atualizar UI localmente
      let updatedViaFallback = false

      if (editingAgent) {
        try {
          const updatePayload = {
            trained_prompt: safePrompt,
            personality_config: personalityConfigObj,
            ...(formData.voice_id ? { voice_id: formData.voice_id } : {})
          }
          const resp = await apiClient.put(`/agents/${editingAgent.id}`, updatePayload)
          const st = resp?.status ?? 0
          const ok = resp?.data?.success !== false
          if (st === 401 || st === 403 || st >= 400 || !ok) {
            // Forçar fallback quando a API rejeita (ex.: usuário não autenticado)
            throw { response: resp }
          }
        } catch (err) {
          const status = err?.response?.status
          console.warn('Falha ao atualizar via /agents, tentando compat e Supabase. Status:', status, err?.response?.data)
          // Tentar rota compatível do backend, se existir
          try {
            const updatePayload = {
              trained_prompt: safePrompt,
              personality_config: personalityConfigObj,
              ...(formData.voice_id ? { voice_id: formData.voice_id } : {})
            }
            const resp2 = await apiClient.put(`/politician_agents/${editingAgent.id}`, updatePayload)
            const st2 = resp2?.status ?? 0
            const ok2 = resp2?.data?.success !== false
            if (st2 === 401 || st2 === 403 || st2 >= 400 || !ok2) {
              throw { response: resp2 }
            }
            updatedViaFallback = true
          } catch (compatErr) {
            console.warn('Falha na rota compatível /politician_agents, tentando Supabase direto:', compatErr?.response?.status, compatErr?.response?.data)
            // Fallback final: atualizar diretamente no Supabase
            try {
              const updateData = {
                trained_prompt: safePrompt,
                personality_config: personalityConfigObj,
                ...(formData.voice_id ? { voice_id: formData.voice_id } : { voice_id: null })
              }
              let { data: sbData, error: sbErr } = await supabase
                .from('politician_agents')
                .update(updateData)
                .eq('id', editingAgent.id)
                .select('id')
              if (sbErr || (Array.isArray(sbData) && sbData.length === 0)) {
                // Fallback por politician_id
                const res2 = await supabase
                  .from('politician_agents')
                  .update(updateData)
                  .eq('politician_id', normalizedPoliticianId)
                  .select('id')
                if (res2.error || (Array.isArray(res2.data) && res2.data.length === 0)) {
                  throw res2.error || new Error('Nenhuma linha atualizada no Supabase')
                }
              }
              updatedViaFallback = true
            } catch (sbErr2) {
              console.error('Falha no fallback Supabase ao atualizar agente:', sbErr2)
              throw err
            }
          }
        }
      } else {
        // Verificar duplicidade com helper compat
        try {
          const existing = await getAgentsByPoliticianId(normalizedPoliticianId)
          if (Array.isArray(existing) && existing.length > 0) {
            alert('Este político já possui um agente. Edite o agente existente em vez de criar outro.')
            return
          }
        } catch (checkErr) {
          console.warn('Falha ao verificar agentes existentes (compat):', checkErr)
        }
        // Enviar payload mínimo na criação para evitar erro 500
        const createPayload = { ...payload }
        console.log('[Criação] Payload mínimo para criação (compat):', { ...createPayload, prompt_len: createPayload.trained_prompt.length })
        await postAgentCompat(createPayload)
      }
      // === Atualização condicional da lista após salvar ===
      if (editingAgent) {
        if (updatedViaFallback) {
          const updatedAgentPartial = {
            trained_prompt: safePrompt,
            personality_config: JSON.stringify(personalityConfigObj),
            is_active: formData.is_active,
            voice_id: formData.voice_id || null
          }
          setAgents(prev => prev.map(a => a.id === editingAgent.id ? { ...a, ...updatedAgentPartial } : a))
          showToast('success', 'Agente atualizado (fallback).')
        } else {
          fetchAgents()
        }
      } else {
        fetchAgents()
      }

      resetForm()
    } catch (error) {
      const status = error?.response?.status
      const backendData = error?.response?.data
      const backendErrors = backendData?.errors
      const errorsDetail = backendErrors && typeof backendErrors === 'object'
        ? Object.entries(backendErrors).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`).join('; ')
        : ''
      const backendMsg = typeof backendData === 'string'
        ? backendData
        : (backendData?.message || backendData?.error || errorsDetail || JSON.stringify(backendData || {}))
      const fullErr = JSON.stringify({ status, data: backendData })
      console.error('Erro ao salvar agente:', status, typeof backendData === 'object' ? JSON.stringify(backendData) : backendData || error)
      alert(`Erro ao salvar agente (${status || 'desconhecido'}): ${backendMsg || error.message || 'Erro desconhecido'}\nDetalhes: ${fullErr}`)
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

  // Função para criar agentes em lote para políticos sem agentes
  const createBulkAgents = async () => {
    if (!window.confirm('Deseja criar agentes automaticamente para todos os políticos aprovados que ainda não possuem agentes?')) {
      return
    }

    try {
      setCreatingBulkAgents(true)
      
      // Usar o serviço de geração de agentes
      const result = await agentGenerationService.createBulkAgents(
        undefined, // Buscar automaticamente políticos sem agentes
        (current, total, currentPolitician) => {
          console.log(`Criando agente ${current}/${total}: ${currentPolitician}`)
        }
      )

      if (result.total === 0) {
        alert('Todos os políticos aprovados já possuem agentes!')
        return
      }

      // Mostrar resultados detalhados
      const errorDetails = result.results
        .filter(r => !r.success)
        .map(r => `${r.politicianName}: ${r.error}`)
        .join('\n')

      const message = `Criação em lote concluída!\n` +
        `Total processados: ${result.total}\n` +
        `Sucessos: ${result.success}\n` +
        `Erros: ${result.errors}` +
        (errorDetails ? `\n\nDetalhes dos erros:\n${errorDetails}` : '')

      alert(message)
      fetchAgents() // Recarregar lista de agentes
    } catch (error) {
      console.error('Erro na criação em lote:', error)
      alert('Erro ao criar agentes em lote: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setCreatingBulkAgents(false)
    }
  }

  // Subcomponente para verificação por ID do político
  const VerifyAgentById = ({ value, onChange, onVerify, onCreate, loading, result }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-700">Verificar agente por ID do político</span>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="ID do político (número ou UUID)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 w-64 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={onVerify}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
        <button
          onClick={onCreate}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando...' : 'Criar agente por ID'}
        </button>
      </div>
      {Array.isArray(result) && (
        <div className="mt-3 text-sm text-gray-700">
          {result.length > 0 ? (
            <div>
              <div>
                Resultado: {result.length} agente(s) encontrado(s).
              </div>
              <div className="mt-1 text-gray-600">
                Primeiro: {result[0]?.name || 'sem nome'} (id {result[0]?.id})
              </div>
            </div>
          ) : (
            <div>Nenhum agente encontrado para este político.</div>
          )}
        </div>
      )}
    </div>
  )

  const filteredAgents = Array.isArray(agents) ? agents.filter(agent => {
    const searchLower = (searchTerm || '').toLowerCase()
    const name = (agent.politicians?.name || agent.politician?.name || agent.name || '').toLowerCase()
    const prompt = (agent.trained_prompt || '').toLowerCase()
    const state = (agent.politicians?.state || agent.politician?.state || '').toLowerCase()
    const party = (agent.politicians?.party || agent.politician?.party || '').toLowerCase()
    if (!searchLower) return true
    return (
      name.includes(searchLower) ||
      prompt.includes(searchLower) ||
      state.includes(searchLower) ||
      party.includes(searchLower)
    )
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
        <div className="flex gap-3">
          <button
            onClick={createBulkAgents}
            disabled={creatingBulkAgents}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            {creatingBulkAgents ? 'Criando...' : 'Criar em Lote'}
          </button>
          <button
            onClick={() => { fetchPoliticians(); setShowAddModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Agente
          </button>
        </div>
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

      {/* Verify Agent by Politician ID */}
      <VerifyAgentById
        value={verifyPoliticianId}
        onChange={setVerifyPoliticianId}
        onVerify={handleVerifyAgent}
        onCreate={handleCreateAgentById}
        loading={verifyLoading}
        result={verifyResult}
      />

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
                <tr key={agent.id} className={`hover:bg-gray-50 ${String(agent.politician_id) === String(highlightedPoliticianId) ? 'bg-yellow-50' : ''}`}>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">
                       {agent.politicians?.name || agent.politician?.name || 'Não vinculado'}
                     </div>
                    <div className="text-sm text-gray-500">
                      {(agent.politicians?.party || agent.politician?.party) ?? ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID Político: {agent.politician_id ?? 'N/A'}
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
                    onChange={(e) => {
                      const pid = e.target.value
                      const selected = Array.isArray(politicians)
                        ? politicians.find(p => String(p.id) === String(pid))
                        : null
                      
                      // Gerar prompt padrão
                      const defaultPrompt = (!formData.trained_prompt && selected)
                        ? agentGenerationService.generateDefaultPrompt({
                            id: selected.id,
                            name: selected.name,
                            position: selected.position,
                            party: selected.party,
                            state: selected.state,
                            city: selected.city
                          })
                        : formData.trained_prompt

                      // Auto-selecionar voz clonada se existir
                      let voiceIdToSet = formData.voice_id;
                      if (selected && selected.voice_config && selected.voice_config.voice_id) {
                        voiceIdToSet = selected.voice_config.voice_id;
                        console.log('Voz clonada encontrada e aplicada:', voiceIdToSet);
                      }

                      setFormData({ 
                        ...formData, 
                        politician_id: pid, 
                        trained_prompt: defaultPrompt,
                        voice_id: voiceIdToSet 
                      })
                    }}
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
                    value={formData.trained_prompt}
                    onChange={(e) => setFormData({...formData, trained_prompt: e.target.value})}
                    placeholder="Prompt de treinamento do agente... (se vazio, geraremos um padrão)"
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
                  <p className="mt-1 text-xs text-gray-500">
                    Se o político tiver voz clonada, este campo será preenchido automaticamente.
                  </p>
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}
     </div>
   )
 }
 
 export default AgentsManagement