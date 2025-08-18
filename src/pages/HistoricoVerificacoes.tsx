import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiRequest } from '../utils/apiClient'
import {
  Shield,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  ArrowLeft
} from 'lucide-react'

interface VerificacaoHistorico {
  id: string
  tipo_input: 'texto' | 'link' | 'imagem'
  conteudo: string
  resultado: 'verdade' | 'tendencioso' | 'fake'
  explicacao: string
  confianca: number
  fontes: Array<{ nome: string; url: string; confiabilidade: string }>
  feedback_positivo: number
  feedback_negativo: number
  denuncias: number
  created_at: string
}

const HistoricoVerificacoes: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [verificacoes, setVerificacoes] = useState<VerificacaoHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterResult, setFilterResult] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedVerificacao, setSelectedVerificacao] = useState<VerificacaoHistorico | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    if (user) {
      fetchHistorico()
    }
  }, [user, currentPage, searchTerm, filterResult, filterType])

  const fetchHistorico = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('Sessão expirada. Faça login novamente.')
        setLoading(false)
        return
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterResult && { resultado: filterResult }),
        ...(filterType && { tipo: filterType })
      })

      const response = await apiRequest(`fake-news/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.success) {
        setVerificacoes(response.data?.verificacoes || [])
        setTotalPages(Math.ceil((response.data?.total || 0) / itemsPerPage))
      } else {
        setError(response.error || 'Erro ao carregar histórico')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const deleteVerificacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta verificação?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await apiRequest(`fake-news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.success) {
        setVerificacoes(prev => prev.filter(v => v.id !== id))
      } else {
        alert(response.error || 'Erro ao excluir verificação')
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor')
    }
  }

  const getResultIcon = (resultado: string) => {
    switch (resultado) {
      case 'verdade':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'tendencioso':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'fake':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Shield className="w-5 h-5 text-gray-600" />
    }
  }

  const getResultLabel = (resultado: string) => {
    switch (resultado) {
      case 'verdade': return 'Verdadeiro'
      case 'tendencioso': return 'Tendencioso'
      case 'fake': return 'Fake News'
      default: return 'Desconhecido'
    }
  }

  const getResultColor = (resultado: string) => {
    switch (resultado) {
      case 'verdade': return 'bg-green-50 border-green-200 text-green-800'
      case 'tendencioso': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'fake': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">Faça login para ver seu histórico de verificações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4 relative">
            <button
              onClick={() => navigate('/dashboard')}
              className="absolute left-0 flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div className="flex items-center mx-auto">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Histórico de Verificações</h1>
            </div>
          </div>
          <p className="text-gray-600 text-center">
            Visualize todas as suas verificações de fake news anteriores.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar no conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por Resultado */}
            <div>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os resultados</option>
                <option value="verdade">Verdadeiro</option>
                <option value="tendencioso">Tendencioso</option>
                <option value="fake">Fake News</option>
              </select>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="texto">Texto</option>
                <option value="link">Link</option>
                <option value="imagem">Imagem</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Verificações */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando histórico...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : verificacoes.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma verificação encontrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {verificacoes.map((verificacao) => (
                <div key={verificacao.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getResultIcon(verificacao.resultado)}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getResultColor(verificacao.resultado)}`}>
                          {getResultLabel(verificacao.resultado)}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">
                          {verificacao.tipo_input.charAt(0).toUpperCase() + verificacao.tipo_input.slice(1)}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">
                          Confiança: {verificacao.confianca}%
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-2">
                        {truncateText(verificacao.conteudo)}
                      </p>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {truncateText(verificacao.explicacao, 150)}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(verificacao.created_at)}</span>
                        
                        {verificacao.fontes && verificacao.fontes.length > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <ExternalLink className="w-4 h-4 mr-1" />
                            <span>{verificacao.fontes.length} fonte(s)</span>
                          </>
                        )}
                        
                        <span className="mx-2">•</span>
                        <span>👍 {verificacao.feedback_positivo}</span>
                        <span className="mx-2">👎 {verificacao.feedback_negativo}</span>
                        
                        {verificacao.denuncias > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-red-600">⚠️ {verificacao.denuncias} denúncia(s)</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedVerificacao(verificacao)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteVerificacao(verificacao.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedVerificacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Verificação</h2>
                <button
                  onClick={() => setSelectedVerificacao(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className={`p-6 rounded-xl border-2 ${getResultColor(selectedVerificacao.resultado)}`}>
                <div className="flex items-center mb-4">
                  {getResultIcon(selectedVerificacao.resultado)}
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold">{getResultLabel(selectedVerificacao.resultado)}</h3>
                    <p className="text-sm opacity-75">Confiança: {selectedVerificacao.confianca}%</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Conteúdo analisado:</h4>
                  <p className="leading-relaxed bg-white bg-opacity-50 p-3 rounded">
                    {selectedVerificacao.tipo_input === 'imagem' ? 'Imagem enviada para análise' : selectedVerificacao.conteudo}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Explicação:</h4>
                  <p className="leading-relaxed">{selectedVerificacao.explicacao}</p>
                </div>
                
                {selectedVerificacao.fontes && selectedVerificacao.fontes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Fontes consultadas:</h4>
                    <ul className="space-y-2">
                      {selectedVerificacao.fontes.map((fonte, index) => (
                        <li key={index} className="flex items-center bg-white bg-opacity-50 p-2 rounded">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          <div>
                            <span className="font-medium">{fonte.nome}</span>
                            <span className="text-sm text-gray-600 ml-2">({fonte.confiabilidade})</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-current border-opacity-20">
                  <div className="text-sm">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(selectedVerificacao.created_at)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>👍 {selectedVerificacao.feedback_positivo}</span>
                    <span>👎 {selectedVerificacao.feedback_negativo}</span>
                    {selectedVerificacao.denuncias > 0 && (
                      <span className="text-red-600">⚠️ {selectedVerificacao.denuncias}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoricoVerificacoes