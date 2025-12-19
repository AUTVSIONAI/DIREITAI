import React, { useState, useEffect } from 'react'
import { MessageCircle, Search, Trash2, Calendar, User } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { apiClient } from '../../../lib/api'

const SuggestionsManagement = () => {
  const { userProfile } = useAuth()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [realPoliticianId, setRealPoliticianId] = useState(userProfile?.politician_id || null)

  useEffect(() => {
    const resolveId = async () => {
      if (userProfile?.politician_id) {
        setRealPoliticianId(userProfile.politician_id)
      } else if (userProfile?.email) {
        try {
          const { data } = await supabase
            .from('politicians')
            .select('id')
            .ilike('email', userProfile.email)
            .maybeSingle()
          if (data) setRealPoliticianId(data.id)
        } catch (e) {
          console.error('Erro ao resolver ID do político:', e)
        }
      }
    }
    resolveId()
  }, [userProfile])

  useEffect(() => {
    if (realPoliticianId) {
      fetchSuggestions()
    }
  }, [realPoliticianId])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('politician_suggestions')
        .select(`
          *,
          user:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('politician_id', realPoliticianId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSuggestions(data || [])
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
      // Mock data se a tabela não existir ainda
      if (error.code === '42P01') { // undefined_table
        console.warn('Tabela politician_suggestions não existe. Usando dados fictícios.')
        setSuggestions([
          {
            id: 1,
            content: 'Gostaria de sugerir uma lei para melhoria das escolas municipais.',
            created_at: new Date().toISOString(),
            user: {
              full_name: 'João Cidadão',
              email: 'joao@email.com'
            }
          },
          {
            id: 2,
            content: 'Por favor, olhe com carinho para a saúde do nosso bairro.',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            user: {
              full_name: 'Maria Silva',
              email: 'maria@email.com'
            }
          }
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredSuggestions = suggestions.filter(s => 
    s.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sugestões dos Eleitores</h1>
          <p className="text-gray-600">Acompanhe as sugestões enviadas pelos cidadãos (limitado a 1 por mês por usuário)</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Buscar sugestões..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {suggestion.user?.avatar_url ? (
                      <img src={suggestion.user.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                    ) : (
                      <User className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {suggestion.user?.full_name || 'Usuário Anônimo'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {suggestion.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(suggestion.created_at)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-800 whitespace-pre-wrap">{suggestion.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma sugestão encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              As sugestões enviadas pelos usuários aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SuggestionsManagement
