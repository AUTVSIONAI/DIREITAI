import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, Bot, User, Trash2, Download, Copy, Wifi, WifiOff,
  Sparkles, Image, Video, MessageSquare, Quote, Wand2, RefreshCw, 
  Save, Eye, EyeOff, Share2, MessageCircle, Lightbulb
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { apiClient } from '../../../lib/api'
import VoiceControls from '../VoiceControls'

const UnifiedAI = () => {
  const { userProfile } = useAuth()
  
  // Estados do Chat
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentModel, setCurrentModel] = useState('')
  const [isConnected, setIsConnected] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const conversationId = useRef(null)
  const voiceControlsRef = useRef(null)
  const [lastBotMessage, setLastBotMessage] = useState('')
  
  // Estados da IA Criativa
  const [activeMode, setActiveMode] = useState('chat') // 'chat' ou 'creative'
  const [selectedTemplate, setSelectedTemplate] = useState('social_post')
  const [selectedTone, setSelectedTone] = useState('profissional')
  const [selectedLength, setSelectedLength] = useState('medio')
  const [prompt, setPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [usageStats, setUsageStats] = useState(null)
  const [limitError, setLimitError] = useState('')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Templates da IA Criativa
  const templates = [
    {
      id: 'social_post',
      name: 'Post Social',
      icon: MessageSquare,
      description: 'Posts para redes sociais com viés conservador',
      color: 'blue',
      placeholder: 'Ex: Post sobre importância da família brasileira'
    },
    {
      id: 'article',
      name: 'Artigo',
      icon: Image,
      description: 'Artigos informativos e opinativos',
      color: 'green',
      placeholder: 'Ex: Artigo sobre livre mercado no Brasil'
    },
    {
      id: 'video',
      name: 'Roteiro Vídeo',
      icon: Video,
      description: 'Roteiros para vídeos educativos',
      color: 'purple',
      placeholder: 'Ex: Roteiro sobre empreendedorismo'
    },
    {
      id: 'speech',
      name: 'Discurso',
      icon: Quote,
      description: 'Discursos inspiradores e motivacionais',
      color: 'red',
      placeholder: 'Ex: Discurso sobre patriotismo'
    }
  ]

  const tones = [
    { id: 'profissional', name: 'Profissional', description: 'Tom formal e respeitoso' },
    { id: 'inspirador', name: 'Inspirador', description: 'Tom motivacional e positivo' },
    { id: 'educativo', name: 'Educativo', description: 'Tom didático e informativo' },
    { id: 'combativo', name: 'Combativo', description: 'Tom firme e determinado' },
    { id: 'familiar', name: 'Familiar', description: 'Tom caloroso e próximo' }
  ]

  const lengths = [
    { id: 'curto', name: 'Curto', description: '1-2 parágrafos' },
    { id: 'medio', name: 'Médio', description: '3-4 parágrafos' },
    { id: 'longo', name: 'Longo', description: '5+ parágrafos' }
  ]

  // Função para retry com exponential backoff
  const retryWithBackoff = async (fn, maxRetries = 5, baseDelay = 3000) => {
    let lastError
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        const is429Error = 
          error.status === 429 || 
          error.message?.includes('429') ||
          (error.message && error.message.includes('status: 429')) ||
          (typeof error === 'object' && error.response?.status === 429) ||
          (error.toString && error.toString().includes('429'))
        
        if (is429Error && attempt < maxRetries) {
          const exponentialDelay = baseDelay * Math.pow(3, attempt)
          const jitter = Math.random() * 5000
          const totalDelay = exponentialDelay + jitter
          
          console.log(`🚫 Rate limit, aguardando ${Math.round(totalDelay)}ms (tentativa ${attempt + 1}/${maxRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, totalDelay))
        } else {
          throw error
        }
      }
    }
    
    throw lastError
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadInitialData = async () => {
    try {
      // Carregar histórico do chat
      const response = await apiClient.get('/ai/conversations')
      if (response.data?.conversations?.length > 0) {
        const lastConversation = response.data.conversations[0]
        conversationId.current = lastConversation.conversation_id
        
        const messagesResponse = await apiClient.get(`/ai/conversations/${lastConversation.conversation_id}/messages`)
        const messages = messagesResponse.data?.messages || []
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          type: 'user', // Primeira mensagem é do usuário
          content: msg.message,
          timestamp: new Date(msg.created_at),
          model: msg.model_used || 'Patriota IA'
        }))
        
        // Adicionar as respostas da IA
        messages.forEach(msg => {
          if (msg.response) {
            formattedMessages.push({
              id: `${msg.id}_response`,
              type: 'bot',
              content: msg.response,
              timestamp: new Date(msg.created_at),
              model: msg.model_used || 'Patriota IA'
            })
          }
        })
        
        setMessages(formattedMessages)
      }
      
      // Carregar estatísticas de uso da IA Criativa
      try {
        const usageResponse = await apiClient.get('/ai/usage')
        setUsageStats(usageResponse.data)
      } catch (error) {
        console.log('Erro ao carregar estatísticas:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para enviar mensagem no chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return

    const messageToSend = inputMessage.trim()
    setInputMessage('')
    setIsTyping(true)

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
      model: 'User'
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await retryWithBackoff(async () => {
        return await apiClient.post('/ai/chat', {
          message: messageToSend,
          conversation_id: conversationId.current
        })
      })

      const data = response.data
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        timestamp: new Date(),
        model: data.model || 'Patriota IA'
      }
      
      setMessages(prev => [...prev, botMessage])
      conversationId.current = data.conversation_id
      setCurrentModel('Patriota IA')
      setIsConnected(true)
      setLastBotMessage(data.response)
      
      if (voiceControlsRef.current) {
        voiceControlsRef.current.speakMessage(data.response)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
        model: 'Sistema'
      }
      
      setMessages(prev => [...prev, errorMessage])
      setIsConnected(false)
    } finally {
      setIsTyping(false)
    }
  }

  // Função para gerar conteúdo criativo
  const generateContent = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      const response = await apiClient.post('/ai/creative-ai/generate', {
        type: selectedTemplate,
        prompt,
        template: selectedTemplate,
        tone: selectedTone,
        length: selectedLength
      })

      const data = response.data
      setGeneratedContent(data.content)
      setUsageStats(data.usage)
      setLimitError('')
        
      const newItem = {
        id: Date.now(),
        template: selectedTemplate,
        prompt,
        content: data.content,
        createdAt: new Date().toISOString(),
        tone: selectedTone,
        length: selectedLength
      }
      setHistory(prev => [newItem, ...prev])
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error)
      
      if (error.response?.status === 429) {
        setLimitError('Limite de uso atingido. Aguarde ou faça upgrade do seu plano.')
      } else {
        setLimitError('Erro ao gerar conteúdo. Tente novamente.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    conversationId.current = null
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const getTemplateColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      red: 'bg-red-100 text-red-600 border-red-200'
    }
    return colors[color] || colors.blue
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com seletor de modo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DireitaGPT</h2>
          <p className="text-gray-600">Chat inteligente e criação de conteúdo em uma única interface</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeMode === 'chat' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </button>
          <button
            onClick={() => setActiveMode('creative')}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeMode === 'creative' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Criativo
          </button>
        </div>
      </div>

      {/* Modo Chat */}
      {activeMode === 'chat' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header do Chat */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">DireitaIA Chat</h3>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <><Wifi className="h-3 w-3 text-green-500" /><span className="text-xs text-green-600">Online</span></>
                  ) : (
                    <><WifiOff className="h-3 w-3 text-red-500" /><span className="text-xs text-red-600">Offline</span></>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <VoiceControls ref={voiceControlsRef} onTranscript={setInputMessage} />
              <button onClick={clearChat} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Área de mensagens */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Olá! Sou o DireitaIA. Como posso ajudá-lo hoje?</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {message.type === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                    {message.type === 'bot' && (
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="mt-2 text-xs opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-3 w-3 inline mr-1" />
                        Copiar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-3 w-3" />
                    <span className="text-xs opacity-75">DireitaIA está digitando...</span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input do Chat */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !inputMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modo Criativo */}
      {activeMode === 'creative' && (
        <div className="space-y-6">
          {/* Estatísticas de uso */}
          {usageStats && (
            <div className={`card ${limitError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    Plano {usageStats.plan === 'gratuito' ? 'Gratuito' : 'Premium'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {usageStats.limits?.generations === -1 ? 'Uso ilimitado' : `${usageStats.today?.generations || 0}/${usageStats.limits?.generations || 0} gerações utilizadas hoje`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {limitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{limitError}</p>
            </div>
          )}

          {/* Seleção de template */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Escolha o tipo de conteúdo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template) => {
                const IconComponent = template.icon
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? `${getTemplateColor(template.color)} border-current`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className={`h-6 w-6 mb-2 ${
                      selectedTemplate === template.id ? 'text-current' : 'text-gray-400'
                    }`} />
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tom</h3>
              <div className="space-y-2">
                {tones.map((tone) => (
                  <label key={tone.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="tone"
                      value={tone.id}
                      checked={selectedTone === tone.id}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{tone.name}</div>
                      <div className="text-sm text-gray-600">{tone.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tamanho</h3>
              <div className="space-y-2">
                {lengths.map((length) => (
                  <label key={length.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="length"
                      value={length.id}
                      checked={selectedLength === length.id}
                      onChange={(e) => setSelectedLength(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{length.name}</div>
                      <div className="text-sm text-gray-600">{length.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Input do prompt */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Descreva o que você quer criar</h3>
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={templates.find(t => t.id === selectedTemplate)?.placeholder || 'Descreva o conteúdo que deseja gerar...'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              <button
                onClick={generateContent}
                disabled={isGenerating || !prompt.trim()}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Gerar Conteúdo
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultado gerado */}
          {generatedContent && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Conteúdo Gerado</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(generatedContent)}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ text: generatedContent })
                      } else {
                        copyToClipboard(generatedContent)
                      }
                    }}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Compartilhar
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{generatedContent}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UnifiedAI