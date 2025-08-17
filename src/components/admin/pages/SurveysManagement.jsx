import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { apiClient } from '../../../lib/api.ts'
import { Plus, Search, Filter, Edit, Trash2, Eye, BarChart3, Users, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

// Função para obter token de autenticação
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
};

const SurveysManagement = () => {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [showStatsModal, setShowStatsModal] = useState(false)

  // Fetch surveys
  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      
      if (token) {
        apiClient.setAuthToken(token)
      }
      
      const response = await apiClient.get('/surveys')
      
      if (response.success && response.data) {
        // A API retorna { success: true, data: [...], pagination: {...} }
        // response.data é o objeto completo da API, então precisamos acessar response.data.data
        setSurveys(response.data.data || [])
      } else {
        throw new Error('Erro ao carregar pesquisas')
      }
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error)
      toast.error('Erro ao carregar pesquisas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSurveys()
  }, [])

  // Filter surveys
  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const expirationDate = survey.data_expiracao || survey.expiracao
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && expirationDate && new Date(expirationDate) > new Date()) ||
      (filterStatus === 'expired' && expirationDate && new Date(expirationDate) <= new Date())
    
    return matchesSearch && matchesFilter
  })

  // Delete survey
  const handleDelete = async (surveyId) => {
    if (!confirm('Tem certeza que deseja excluir esta pesquisa?')) return
    
    try {
      const token = await getAuthToken()
      
      if (token) {
        apiClient.setAuthToken(token)
      }
      
      const response = await apiClient.delete(`/surveys/${surveyId}`)
      
      if (response.success) {
        toast.success('Pesquisa excluída com sucesso')
        fetchSurveys()
      } else {
        throw new Error('Erro ao excluir pesquisa')
      }
    } catch (error) {
      console.error('Erro ao excluir pesquisa:', error)
      toast.error('Erro ao excluir pesquisa')
    }
  }

  // Get survey status
  const getSurveyStatus = (survey) => {
    const now = new Date()
    const expirationDate = survey.data_expiracao || survey.expiracao
    
    if (!expirationDate) {
      return { status: 'Sem expiração', color: 'text-blue-600 bg-blue-100' }
    }
    
    const expiration = new Date(expirationDate)
    
    if (expiration > now) {
      return { status: 'Ativa', color: 'text-green-600 bg-green-100' }
    } else {
      return { status: 'Expirada', color: 'text-red-600 bg-red-100' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pesquisas DireitaJá</h1>
          <p className="text-gray-600">Crie e gerencie pesquisas e votações populares</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Pesquisa</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pesquisas</p>
              <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pesquisas Ativas</p>
              <p className="text-2xl font-bold text-green-600">
                {surveys.filter(s => {
                  const expirationDate = s.data_expiracao || s.expiracao
                  return expirationDate && new Date(expirationDate) > new Date()
                }).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Votos</p>
              <p className="text-2xl font-bold text-blue-600">
                {surveys.reduce((acc, s) => acc + (s.total_votes || 0), 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pesquisas Expiradas</p>
              <p className="text-2xl font-bold text-red-600">
                {surveys.filter(s => {
                  const expirationDate = s.data_expiracao || s.expiracao
                  return expirationDate && new Date(expirationDate) <= new Date()
                }).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar pesquisas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="active">Ativas</option>
              <option value="expired">Expiradas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Surveys Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando pesquisas...</p>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma pesquisa encontrada</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Criar primeira pesquisa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pesquisa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expira em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSurveys.map((survey) => {
                  const statusInfo = getSurveyStatus(survey)
                  return (
                    <tr key={survey.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {survey.titulo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {survey.descricao?.substring(0, 100)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {survey.total_votes || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(() => {
                          const expirationDate = survey.data_expiracao || survey.expiracao
                          if (!expirationDate) return 'Sem expiração'
                          const date = new Date(expirationDate)
                          return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR')
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSurvey(survey)
                              setShowStatsModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver estatísticas"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSurvey(survey)
                              setShowCreateModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(survey.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateSurveyModal
          survey={selectedSurvey}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedSurvey(null)
          }}
          onSuccess={() => {
            fetchSurveys()
            setShowCreateModal(false)
            setSelectedSurvey(null)
          }}
        />
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedSurvey && (
        <SurveyStatsModal
          survey={selectedSurvey}
          onClose={() => {
            setShowStatsModal(false)
            setSelectedSurvey(null)
          }}
        />
      )}
    </div>
  )
}

// Create Survey Modal Component
const CreateSurveyModal = ({ survey, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    titulo: survey?.titulo || '',
    descricao: survey?.descricao || '',
    opcoes: survey?.opcoes ? survey.opcoes.map(op => typeof op === 'string' ? op : op?.texto || '') : ['', ''],
    tipo: survey?.tipo || 'simples',
    publico_alvo: survey?.publico_alvo || 'todos',
    expiracao: (() => {
      const expirationDate = survey?.data_expiracao || survey?.expiracao
      if (!expirationDate) return ''
      const date = new Date(expirationDate)
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
    })()
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const opcoesValidas = formData.opcoes.filter(op => {
      const texto = typeof op === 'string' ? op : op?.texto || ''
      return texto.trim().length > 0
    })
    
    if (opcoesValidas.length < 2) {
      toast.error('É necessário pelo menos 2 opções válidas')
      return
    }
    
    try {
      setLoading(true)
      const token = await getAuthToken()
      
      if (token) {
        apiClient.setAuthToken(token)
      }
      
      const surveyData = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        tipo: formData.tipo,
        publico_alvo: formData.publico_alvo,
        data_expiracao: formData.expiracao || null,
        opcoes: formData.opcoes.filter(op => {
          const texto = typeof op === 'string' ? op : op?.texto || ''
          return texto.trim().length > 0
        }).map(op => typeof op === 'string' ? op : op.texto)
      }
      
      const response = survey 
        ? await apiClient.put(`/surveys/${survey.id}`, surveyData)
        : await apiClient.post('/surveys', surveyData)
      
      if (response.success) {
        toast.success(survey ? 'Pesquisa atualizada com sucesso' : 'Pesquisa criada com sucesso')
        onSuccess()
      } else {
        throw new Error('Erro ao salvar pesquisa')
      }
    } catch (error) {
      console.error('Erro ao salvar pesquisa:', error)
      toast.error('Erro ao salvar pesquisa')
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    if (formData.opcoes.length < 10) {
      setFormData(prev => ({
        ...prev,
        opcoes: [...prev.opcoes, '']
      }))
    }
  }

  const removeOption = (index) => {
    if (formData.opcoes.length > 2) {
      setFormData(prev => ({
        ...prev,
        opcoes: prev.opcoes.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOption = (index, value) => {
    setFormData(prev => ({
      ...prev,
      opcoes: prev.opcoes.map((op, i) => i === index ? value : op)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {survey ? 'Editar Pesquisa' : 'Nova Pesquisa'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da Pesquisa *
              </label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Qual sua opinião sobre...?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Descrição adicional da pesquisa..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opções de Resposta *
              </label>
              {formData.opcoes.map((opcao, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    required
                    value={opcao}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Opção ${index + 1}`}
                  />
                  {formData.opcoes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {formData.opcoes.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Adicionar opção
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Votação
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="simples">Escolha única</option>
                <option value="multipla">Múltipla escolha</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Público-alvo
                </label>
                <select
                  value={formData.publico_alvo}
                  onChange={(e) => setFormData(prev => ({ ...prev, publico_alvo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="todos">Todos os usuários</option>
                  <option value="premium">Usuários premium</option>
                  <option value="patriotas">Membros patriotas</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Expiração *
              </label>
              <input
                type="date"
                required
                value={formData.expiracao}
                onChange={(e) => setFormData(prev => ({ ...prev, expiracao: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : (survey ? 'Atualizar' : 'Criar Pesquisa')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Survey Stats Modal Component
const SurveyStatsModal = ({ survey, onClose }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getAuthToken()
        
        if (token) {
          apiClient.setAuthToken(token)
        }
        
        const response = await apiClient.get(`/surveys/${survey.id}/stats`)
        
        if (response.success) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        toast.error('Erro ao carregar estatísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [survey.id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Estatísticas: {survey.titulo}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando estatísticas...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_votos || 0}</div>
                  <div className="text-sm text-blue-800">Total de Votos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.total_participantes_unicos || 0}</div>
                  <div className="text-sm text-green-800">Votantes Únicos</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-purple-800">Comentários</div>
                </div>
              </div>
              
              {/* Results */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados por Opção</h3>
                <div className="space-y-3">
                  {stats.estatisticas_por_opcao?.map((result, index) => {
                    return (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">{result.opcao_texto}</span>
                          <span className="text-sm text-gray-600">{result.total_votos} votos ({result.percentual}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${result.percentual}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600">
              Erro ao carregar estatísticas
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SurveysManagement