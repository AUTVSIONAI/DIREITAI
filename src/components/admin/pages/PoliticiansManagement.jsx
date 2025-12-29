import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, UserCheck, Upload, Image, Eye, EyeOff, Copy, Key, Mic, Play, Square, Settings, Volume2 } from 'lucide-react'
import { apiClient } from '../../../lib/api'
import { politiciansService } from '../../../services'
import { AdminService } from '../../../services/admin'
import { getPoliticianPhotoUrl } from '../../../utils/imageUtils'
import { agentGenerationService } from '../../../services/agentGeneration'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

const PoliticiansManagement = ({ limitToPoliticianId = null, limitToParty = null, isPoliticianView = false }) => {
  const { userProfile } = useAuth()
  const userRole = String(userProfile?.role || '').toLowerCase()
  // Força isPoliticianView se o usuário logado for político, mesmo que a prop venha false
  const effectiveIsPoliticianView = isPoliticianView || userRole === 'politician'
  
  const [politicians, setPoliticians] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterParty, setFilterParty] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPolitician, setEditingPolitician] = useState(null)
  
  // Estado para resolver o ID do político se não for passado via props
  const [resolvedPoliticianId, setResolvedPoliticianId] = useState(limitToPoliticianId)
  const [resolutionAttempted, setResolutionAttempted] = useState(false)

  // Efeito para resolver ID do político se necessário
  useEffect(() => {
    const resolveId = async () => {
      // Se já veio via prop, usa ele
      if (limitToPoliticianId) {
        setResolvedPoliticianId(limitToPoliticianId)
        setResolutionAttempted(true)
        return
      }

      // Se é visão de político mas não veio ID, tenta descobrir
      if (effectiveIsPoliticianView) {
        if (userProfile?.politician_id) {
          setResolvedPoliticianId(userProfile.politician_id)
          setResolutionAttempted(true)
        } else if (userProfile?.id) {
          let foundId = null
          
          // Tentativa 1: Buscar por email
          if (userProfile.email) {
                  try {
                    const { data, error } = await supabase
                      .from('politicians')
                      .select('id')
                      .ilike('email', userProfile.email)
                      .maybeSingle()
                    if (!error && data) foundId = data.id
                  } catch (e) {
                    console.warn('Erro ao resolver ID por email:', e)
                  }
                }

          if (foundId) {
            setResolvedPoliticianId(foundId)
          }
          setResolutionAttempted(true)
        } else {
          setResolutionAttempted(true)
        }
      } else {
        setResolutionAttempted(true)
      }
    }
    resolveId()
  }, [limitToPoliticianId, effectiveIsPoliticianView, userProfile])

  // Se for visão de político e não encontrou vínculo
  if (effectiveIsPoliticianView && !resolvedPoliticianId && !loading && resolutionAttempted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <UserCheck className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Perfil não vinculado</h2>
        <p className="text-gray-500 text-center max-w-md mb-4">
          Não foi possível encontrar o perfil de político associado à sua conta.
          <br />
          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
            Email: {userProfile?.email || 'Não identificado'}
          </span>
        </p>
        <p className="text-gray-500 text-center max-w-md">
          Verifique se o email da sua conta é o mesmo cadastrado no perfil do político.
          Entre em contato com o suporte se o problema persistir.
        </p>
      </div>
    )
  }

  const [formData, setFormData] = useState({
    name: '',
    party: '',
    position: '',
    city: '',
    state: '',
    country: '',
    short_bio: '',
    photo_url: '',
    social_links: {
      twitter: '',
      instagram: '',
      facebook: '',
      website: ''
    },
    voice_config: {
      enabled: false,
      provider: 'local', // 'local' | 'elevenlabs'
      voice_id: '',
      api_url: 'http://localhost:8005',
      settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    }
  })
  const [activeTab, setActiveTab] = useState('general') // 'general', 'social', 'voice'
  const [testVoiceText, setTestVoiceText] = useState('Olá, eu sou o seu representante político. Como posso ajudar?')
  const [isPlayingTest, setIsPlayingTest] = useState(false)
  const [isTrainingVoice, setIsTrainingVoice] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [credentialsModal, setCredentialsModal] = useState({ open: false, email: '', password: '', politicianName: '' })
  const [generatingCredentials, setGeneratingCredentials] = useState(false)

  const handleGenerateCredentials = async (politician) => {
    if (!window.confirm(`Deseja gerar novas credenciais de acesso para ${politician.name}?`)) return

    try {
      setGeneratingCredentials(true)
      const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      
      // Gerar email personalizado baseado no cargo e nome
      const cleanName = politician.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
      
      const pos = (politician.position || '').toLowerCase();
      let prefix = 'pol'; // default
      
      if (pos.includes('deputado')) prefix = 'dep';
      else if (pos.includes('senador')) prefix = 'sen';
      else if (pos.includes('vereador')) prefix = 'ver';
      else if (pos.includes('prefeito')) prefix = 'pref';
      else if (pos.includes('governador')) prefix = 'gov';
      else if (pos.includes('presidente')) prefix = 'pres';
      
      const email = `${prefix}${cleanName}@direitai.com`
      
      const userData = {
        email,
        password,
        full_name: politician.name,
        role: 'politician',
        plan: 'gratuito'
      }

      console.log('Gerando credenciais para:', politician.name)
      const userResult = await AdminService.createAuthUser(userData)
      
      if (userResult && !userResult.error) {
        // Tentar vincular usuário ao político
        const userId = userResult.user?.id || userResult.id
        if (userId) {
             try {
                // Atualizar o usuário com o ID do político (relação inversa)
                await AdminService.updateAdminUser(userId, { politician_id: politician.id })
             } catch (e) {
                console.error('Erro ao vincular usuário ao político', e)
             }
        }
        
        setCredentialsModal({
          open: true,
          email,
          password,
          politicianName: politician.name
        })
      } else {
        alert('Erro ao criar usuário: ' + (userResult?.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao gerar credenciais:', error)
      alert('Erro ao gerar credenciais')
    } finally {
      setGeneratingCredentials(false)
    }
  }

  // Lista de cargos permitidos (alinhado com cadastro público)
  const allowedPositions = [
    'Presidente', 'Vice-Presidente', 'Senador', 'Deputado Federal',
    'Deputado Estadual', 'Governador', 'Vice-Governador', 'Prefeito',
    'Vice-Prefeito', 'Vereador', 'Ministro', 'Secretário Estadual',
    'Secretário Municipal'
  ]

  useEffect(() => {
    // Se for visão de político e ainda não temos o ID resolvido, aguarda (fica em loading)
    if (effectiveIsPoliticianView && !resolvedPoliticianId) {
      setLoading(true)
      return
    }
    fetchPoliticians()
  }, [resolvedPoliticianId, effectiveIsPoliticianView])

  const fetchPoliticians = async () => {
    try {
      setLoading(true)
      // Se for visão de político e tiver ID, tenta buscar só ele se a API suportar, ou busca tudo e filtra
      // Como a API de listagem pode não filtrar por ID, buscamos tudo e filtramos no cliente (como antes)
      const response = await apiClient.get('/politicians?status=approved&limit=1000&page=1')
      setPoliticians(response.data?.data || [])
    } catch (error) {
      console.error('Erro ao carregar políticos:', error)
      setPoliticians([])
    } finally {
      setLoading(false)
    }
  }

  const handleTestVoice = async () => {
    if (!formData.voice_config.api_url && formData.voice_config.provider === 'local') {
        alert('Configure a URL da API de Voz Local primeiro.');
        return;
    }
    setIsPlayingTest(true);
    try {
        if (formData.voice_config.provider === 'local') {
            const formDataBody = new FormData();
            formDataBody.append('text', testVoiceText);
            formDataBody.append('voice_id', formData.voice_config.voice_id);
            formDataBody.append('language', 'pt');

            const response = await fetch(`${formData.voice_config.api_url}/tts`, {
                method: 'POST',
                body: formDataBody
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Falha na API Local');
            }
            
            const blob = await response.blob();
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play();
            audio.onended = () => setIsPlayingTest(false);
        } else {
             alert('Provedor não implementado para teste neste momento.');
             setIsPlayingTest(false);
        }
    } catch (error) {
        console.error('Erro no teste de voz:', error);
        alert(`Erro ao conectar com API de Voz Local: ${error.message}. Verifique se o servidor Python está rodando.`);
        setIsPlayingTest(false);
    }
  }

  const handleVoiceUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!formData.voice_config.api_url && formData.voice_config.provider === 'local') {
          alert('Configure a URL da API de Voz Local primeiro.');
          return;
      }

      setIsTrainingVoice(true);
      try {
          if (formData.voice_config.provider === 'local') {
              const uploadData = new FormData();
              uploadData.append('file', file);
              uploadData.append('name', formData.name || 'Unknown Politician');

              const response = await fetch(`${formData.voice_config.api_url}/voices`, {
                  method: 'POST',
                  body: uploadData
              });

              if (!response.ok) {
                   const err = await response.json();
                   throw new Error(err.detail || 'Falha no upload para API Local');
              }

              const data = await response.json();
              
              setFormData(prev => ({
                  ...prev,
                  voice_config: {
                      ...prev.voice_config,
                      voice_id: data.voice_id,
                      enabled: true
                  }
              }));
              alert('Voz clonada com sucesso! ID: ' + data.voice_id);
          } else {
              alert('Upload apenas para sistema local por enquanto.');
          }
      } catch (error) {
          console.error('Erro no treino:', error);
          const msg = error.message === 'Failed to fetch' 
            ? 'O serviço de voz não está respondendo na porta 8005. Verifique se ele está com status "OPERACIONAL" na página de Infraestrutura de Voz.'
            : error.message;
          alert(`Erro ao treinar voz: ${msg}`);
      } finally {
          setIsTrainingVoice(false);
      }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let photoUrl = formData.photo_url
      
      // Upload da foto se houver um arquivo selecionado
      if (photoFile) {
        const uploadedUrl = await uploadPhoto()
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        }
      }
      
      // Definir nível com base no cargo e mapear município
      const position = (formData.position || '').toLowerCase()
      const level = ['vereador', 'prefeito'].includes(position)
        ? 'municipal'
        : ['deputado estadual', 'deputado_estadual', 'governador'].includes(position)
        ? 'estadual'
        : ['deputado', 'deputado federal', 'senador', 'presidente', 'vice-presidente'].includes(position)
        ? 'federal'
        : undefined

      const submitData = {
        name: formData.name,
        party: formData.party,
        position: formData.position,
        city: formData.city,
        state: formData.state,
        photo_url: photoUrl,
        short_bio: formData.short_bio || '',
        social_links: {
          twitter: formData.social_links?.twitter || '',
          instagram: formData.social_links?.instagram || '',
          facebook: formData.social_links?.facebook || '',
          website: formData.social_links?.website || ''
        },
        voice_config: formData.voice_config,
        source: 'manual',
        status: 'approved',
        ...(level ? { level } : {}),
        ...(level === 'municipal' ? { municipality: formData.city } : {})
      }
      
      let createdPolitician = null
      if (editingPolitician) {
        const resp = await apiClient.put(`/politicians/${editingPolitician.id}`, submitData)
        createdPolitician = resp.data?.data || resp.data || null
      } else {
        const resp = await apiClient.post('/politicians', submitData)
        createdPolitician = resp.data?.data || resp.data || null
        
        // Após criação manual, gerar agente automaticamente
        if (createdPolitician?.id) {
          try {
            console.log('Gerando agente automaticamente para político recém-criado:', {
              id: createdPolitician.id,
              name: createdPolitician.name,
              position: createdPolitician.position,
              party: createdPolitician.party
            })
            const agentResult = await agentGenerationService.createAgentForPolitician({
              id: createdPolitician.id,
              name: createdPolitician.name,
              position: createdPolitician.position,
              party: createdPolitician.party,
              state: createdPolitician.state,
              city: createdPolitician.city
            })
            if (agentResult.success) {
              console.log('Agente criado automaticamente com sucesso:', agentResult)
            } else {
              console.warn('Falha ao criar agente de IA:', agentResult.error, agentResult)
            }
          } catch (agentErr) {
            console.warn('Erro ao gerar agente automaticamente:', agentErr?.response?.data || agentErr)
          }
        }
      }
      fetchPoliticians()
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar político:', error?.response?.data || error)
      alert('Erro ao salvar político. Verifique os campos e tente novamente.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este político?')) {
      try {
        await apiClient.delete(`/politicians/${id}`)
        fetchPoliticians()
      } catch (error) {
        console.error('Erro ao excluir político:', error)
      }
    }
  }

  const toggleExpensesVisibility = async (politician) => {
    try {
      const newVisibility = !politician.expenses_visible
      await apiClient.put(`/admin/politicians/${politician.id}/expenses-visibility`, {
        expenses_visible: newVisibility
      })
      
      // Atualizar o estado local
      setPoliticians(politicians.map(p => 
        p.id === politician.id 
          ? { ...p, expenses_visible: newVisibility }
          : p
      ))
      
      console.log(`Gastos ${newVisibility ? 'habilitados' : 'desabilitados'} para ${politician.name}`)
    } catch (error) {
      console.error('Erro ao alterar visibilidade dos gastos:', error)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      alert('Por favor, selecione um arquivo JPG, JPEG ou PNG')
    }
  }

  const uploadPhoto = async () => {
    if (!photoFile) return null
    
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', photoFile)
      
      const response = await politiciansService.uploadPhoto(formData)
      return response.url
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto')
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      party: '',
      position: '',
      city: '',
      state: '',
      country: '',
      short_bio: '',
      photo_url: '',
      social_links: {
        twitter: '',
        instagram: '',
        facebook: '',
        website: ''
      },
      voice_config: {
        enabled: false,
        provider: 'local',
        voice_id: '',
        api_url: 'http://localhost:8005',
        settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }
    })
    setPhotoFile(null)
    setPhotoPreview('')
    setEditingPolitician(null)
    setShowAddModal(false)
    setActiveTab('general')
  }

  const startEdit = (politician) => {
    setFormData({
      name: politician.name || '',
      party: politician.party || '',
      position: politician.position || '',
      city: politician.city || '',
      state: politician.state || '',
      country: politician.country || '',
      short_bio: politician.short_bio || '',
      photo_url: politician.photo_url || '',
      social_links: {
        twitter: politician.social_links?.twitter || '',
        instagram: politician.social_links?.instagram || '',
        facebook: politician.social_links?.facebook || '',
        website: politician.social_links?.website || ''
      },
      voice_config: {
        enabled: politician.voice_config?.enabled || false,
        provider: politician.voice_config?.provider || 'local',
        voice_id: politician.voice_config?.voice_id || '',
        api_url: (politician.voice_config?.api_url && politician.voice_config.api_url.includes('8000')) 
          ? 'http://localhost:8005' 
          : (politician.voice_config?.api_url || 'http://localhost:8005'),
        settings: {
          stability: politician.voice_config?.settings?.stability || 0.5,
          similarity_boost: politician.voice_config?.settings?.similarity_boost || 0.75
        }
      }
    })
    setPhotoPreview(politician.photo_url || '')
    setEditingPolitician(politician)
    setShowAddModal(true)
    setActiveTab('general')
  }

  const filteredPoliticians = Array.isArray(politicians) ? politicians.filter(politician => {
    const matchesSearch = politician.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         politician.party?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesParty = !filterParty || politician.party === filterParty
    const matchesLimitId = !limitToPoliticianId || String(politician.id) === String(limitToPoliticianId)
    return matchesSearch && matchesParty && matchesLimitId
  }) : []

  const parties = [...new Set(Array.isArray(politicians) ? politicians.map(p => p.party).filter(Boolean) : [])]

  if (loading && !politicians.length && !limitToPoliticianId && isPoliticianView) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Carregando perfil do político...</p>
      </div>
    )
  }

  if (loading && !politicians.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (effectiveIsPoliticianView && !resolvedPoliticianId && !loading && resolutionAttempted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <UserCheck className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Perfil não vinculado</h2>
        <p className="text-gray-500 text-center max-w-md">
          Não foi possível encontrar o perfil de político associado à sua conta.
          Entre em contato com o suporte para verificar seu cadastro.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!limitToPoliticianId && !isPoliticianView && (
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Políticos</h1>
          <p className="text-gray-600">Gerencie o cadastro de políticos da plataforma</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Político
        </button>
      </div>
      )}

      {/* Filters */}
      {!limitToPoliticianId && !isPoliticianView && (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou partido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os partidos</option>
              {parties.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Politicians List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Político
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gastos Visíveis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPoliticians.map((politician) => (
                <tr key={politician.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {politician.photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={getPoliticianPhotoUrl(politician.photo_url)}
                            alt={politician.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ${politician.photo_url ? 'hidden' : ''}`}>
                          <UserCheck className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {politician.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{politician.id ?? '—'}</span>
                      {politician.id && (
                        <button
                          onClick={() => navigator.clipboard.writeText(String(politician.id)).then(() => alert('ID copiado'))}
                          className="text-gray-500 hover:text-gray-700"
                          title="Copiar ID"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {politician.party}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {politician.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleExpensesVisibility(politician)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        politician.expenses_visible
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title={politician.expenses_visible ? 'Clique para ocultar gastos' : 'Clique para mostrar gastos'}
                    >
                      {politician.expenses_visible ? (
                        <><Eye className="h-3 w-3" /> Visível</>
                      ) : (
                        <><EyeOff className="h-3 w-3" /> Oculto</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(politician)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!effectiveIsPoliticianView && (
                        <button
                          onClick={() => handleGenerateCredentials(politician)}
                          className="text-green-600 hover:text-green-900"
                          title="Gerar Acesso"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      )}
                      {!resolvedPoliticianId && !effectiveIsPoliticianView && (
                        <button
                          onClick={() => handleDelete(politician.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPoliticians.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum político encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterParty ? 'Tente ajustar os filtros.' : 'Dados não disponíveis.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPolitician ? 'Editar Político' : 'Adicionar Político'}
              </h3>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  className={`py-2 px-4 ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('general')}
                >
                  Dados Básicos
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 ${activeTab === 'social' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('social')}
                >
                  Redes Sociais
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 flex items-center gap-2 ${activeTab === 'voice' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('voice')}
                >
                  <Mic className="h-4 w-4" />
                  Voz & IA
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* General Tab */}
                <div className={activeTab === 'general' ? 'block space-y-4' : 'hidden'}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Partido</label>
                      <input
                        type="text"
                        required
                        value={formData.party}
                        onChange={(e) => setFormData({...formData, party: e.target.value})}
                        disabled={!!limitToParty}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${limitToParty ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cargo</label>
                      <select
                        required
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione o cargo</option>
                        {allowedPositions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cidade</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">País</label>
                      <input
                        type="text"
                        value={formData.country || ''}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Image className="w-4 h-4 inline mr-1" />
                      Foto do Político
                    </label>
                    
                    {/* Preview da foto */}
                    {photoPreview && (
                      <div className="mb-3">
                        <img
                          src={photoFile ? photoPreview : getPoliticianPhotoUrl(photoPreview)}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-20 h-20 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center text-gray-400 hidden">
                          <Image className="w-8 h-8" />
                        </div>
                      </div>
                    )}
                    
                    {/* Upload de arquivo */}
                    <div className="mb-3">
                      <label className="block text-sm text-gray-600 mb-1">Upload de Arquivo (JPG, JPEG, PNG)</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    
                    {/* URL alternativa */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Ou URL da Imagem</label>
                      <input
                        type="url"
                        value={formData.photo_url}
                        onChange={(e) => {
                          setFormData({...formData, photo_url: e.target.value})
                          setPhotoPreview(e.target.value)
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://exemplo.com/foto.jpg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Biografia</label>
                    <textarea
                      rows={3}
                      value={formData.short_bio}
                      onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Social Tab */}
                <div className={activeTab === 'social' ? 'block space-y-4' : 'hidden'}>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Twitter (X)</label>
                       <input
                         type="text"
                         value={formData.social_links?.twitter || ''}
                         onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, twitter: e.target.value}})}
                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                         placeholder="@usuario"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Instagram</label>
                       <input
                         type="text"
                         value={formData.social_links?.instagram || ''}
                         onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, instagram: e.target.value}})}
                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                         placeholder="@usuario"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Facebook</label>
                       <input
                         type="text"
                         value={formData.social_links?.facebook || ''}
                         onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, facebook: e.target.value}})}
                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                         placeholder="URL do perfil"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Website</label>
                       <input
                         type="text"
                         value={formData.social_links?.website || ''}
                         onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, website: e.target.value}})}
                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                         placeholder="https://..."
                       />
                     </div>
                   </div>
                </div>

                {/* Voice Tab */}
                <div className={activeTab === 'voice' ? 'block space-y-4' : 'hidden'}>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.voice_config?.enabled || false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            voice_config: { ...prev.voice_config, enabled: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        Habilitar Voz Personalizada
                      </label>
                      <div className="text-xs text-gray-500">
                        Status: {formData.voice_config?.voice_id ? <span className="text-green-600 font-bold">Voz Clonada Ativa</span> : <span className="text-gray-400">Sem voz configurada</span>}
                      </div>
                    </div>

                    {formData.voice_config?.enabled && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Provedor de IA</label>
                          <select
                            value={formData.voice_config?.provider || 'local'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              voice_config: { ...prev.voice_config, provider: e.target.value }
                            }))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                          >
                            <option value="local">Sistema Próprio (Local/Docker)</option>
                            <option value="elevenlabs">ElevenLabs (API)</option>
                            <option value="openai">OpenAI (TTS)</option>
                          </select>
                        </div>

                        {formData.voice_config?.provider === 'local' && (
                          <div className="bg-blue-50 p-3 rounded border border-blue-100">
                            <label className="block text-sm font-medium text-blue-900">URL da API Local</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder={import.meta.env.VITE_VOICE_SERVICE_URL || '/api/voice'}
                                  value={formData.voice_config?.api_url || ''}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    voice_config: { ...prev.voice_config, api_url: e.target.value }
                                  }))}
                                  className="flex-1 block w-full px-3 py-2 border border-blue-200 rounded-md shadow-sm sm:text-sm"
                                />
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Endereço do serviço de voz. Use <code>/api/voice</code> para usar o proxy do backend (recomendado) ou a URL completa.
                                <br/>
                                <span className="font-mono bg-blue-100 px-1 rounded">docker run -p 8005:8005 voice-cloning-service</span>
                            </p>
                          </div>
                        )}

                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Treinamento / Clonagem</label>
                          <div className="flex gap-4 items-start bg-white p-3 rounded border border-gray-200 border-dashed">
                             <div className="flex-1">
                               <label className="block text-xs text-gray-500 mb-1 font-medium">Upload de Áudio de Referência (.wav, 1-5min)</label>
                               <input 
                                  type="file" 
                                  accept=".wav,.mp3,.m4a"
                                  onChange={handleVoiceUpload}
                                  disabled={isTrainingVoice}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                               />
                               <p className="text-[10px] text-gray-400 mt-1">O áudio será enviado para o servidor local para treinar o modelo de voz.</p>
                             </div>
                             {isTrainingVoice && (
                                <div className="flex items-center text-blue-600 text-sm animate-pulse bg-blue-50 px-3 py-2 rounded">
                                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                                  Treinando...
                                </div>
                             )}
                          </div>
                        </div>

                        {formData.voice_config?.voice_id && (
                           <div className="border-t border-gray-200 pt-4 mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Testar Voz Gerada</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={testVoiceText}
                                  onChange={(e) => setTestVoiceText(e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={handleTestVoice}
                                  disabled={isPlayingTest}
                                  className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 min-w-[100px] justify-center"
                                >
                                  {isPlayingTest ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                                  {isPlayingTest ? 'Falando...' : 'Ouvir'}
                                </button>
                              </div>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhoto}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadingPhoto && <Upload className="w-4 h-4 animate-spin" />}
                    {uploadingPhoto ? 'Enviando...' : (editingPolitician ? 'Atualizar Político' : 'Adicionar Político')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Credentials Modal */}
      {credentialsModal.open && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Credenciais de Acesso</h3>
              <button onClick={() => setCredentialsModal({ ...credentialsModal, open: false })} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-700 mb-2">
                  As credenciais abaixo foram geradas para <strong>{credentialsModal.politicianName}</strong>.
                  Copie e envie para o político, pois a senha não poderá ser visualizada novamente.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email (Login)</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={credentialsModal.email}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsModal.email)
                      alert('Email copiado!')
                    }}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <Copy className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={credentialsModal.password}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 sm:text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsModal.password)
                      alert('Senha copiada!')
                    }}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <Copy className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  onClick={() => setCredentialsModal({ ...credentialsModal, open: false })}
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PoliticiansManagement