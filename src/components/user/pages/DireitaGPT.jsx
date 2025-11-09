import React, { useState, useEffect, useRef } from 'react'
import { Bot, User, Send, Copy, Download, Trash2, Wifi, WifiOff, MessageSquare, Plus } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { AIService } from '../../../services/ai'
import { apiClient } from '../../../utils/apiClient'
import VoiceControls from '../common/VoiceControls'
import ConversationList from '../ConversationList'

const DireitaGPT = () => {
  const { userProfile } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [currentModel, setCurrentModel] = useState('Patriota IA')
  const [lastBotMessage, setLastBotMessage] = useState('')
  const [showConversationList, setShowConversationList] = useState(false)
  const [currentConversation, setCurrentConversation] = useState(null)
  const [conversations, setConversations] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const voiceControlsRef = useRef(null)
  const conversationId = useRef(null)

  // Função para retry com exponential backoff (versão robusta para produção)
  const retryWithBackoff = async (fn, maxRetries = 5, baseDelay = 3000) => {
    let lastError
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        // Verifica se é erro 429 (rate limit) - detecção mais robusta
        const is429Error = 
          error.status === 429 || 
          error.message?.includes('429') ||
          (error.message && error.message.includes('status: 429')) ||
          (typeof error === 'object' && error.response?.status === 429) ||
          (error.toString && error.toString().includes('429'))
        
        if (is429Error && attempt < maxRetries) {
          // Delay mais agressivo para produção com jitter maior
          const exponentialDelay = baseDelay * Math.pow(3, attempt)
          const jitter = Math.random() * 5000
          const totalDelay = exponentialDelay + jitter
          
          console.log(`🚫 Rate limit em produção (429), aguardando ${Math.round(totalDelay)}ms (tentativa ${attempt + 1}/${maxRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, totalDelay))
        } else {
          throw error
        }
      }
    }
    
    throw lastError
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar lista de conversas ao montar o componente
  useEffect(() => {
    loadConversations()
  }, [])

  // Carregar mensagens quando a conversa atual mudar
  useEffect(() => {
    if (currentConversation) {
      loadConversationMessages(currentConversation.id)
    } else {
      // Se não há conversa selecionada, mostrar mensagem de boas-vindas
      setMessages([{
        id: 'welcome',
        type: 'bot',
        content: 'Olá! Sou a Patriota IA, sua IA conservadora. Como posso ajudá-lo hoje? Posso discutir política, economia, valores tradicionais e muito mais!',
        timestamp: new Date(),
        model: 'Patriota IA'
      }])
    }
  }, [currentConversation])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const history = await AIService.getConversations(userProfile?.id || 'anonymous')
      
      if (Array.isArray(history) && history.length > 0) {
        setConversations(history)
        // Selecionar a conversa mais recente por padrão
        setCurrentConversation(history[0])
      } else {
        setConversations([])
        setCurrentConversation(null)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      setConversations([])
      setCurrentConversation(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadConversationMessages = async (conversationId) => {
    try {
      // Por enquanto, vamos simular o carregamento de mensagens
      // Isso será implementado quando o backend suportar mensagens por conversa
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        const formattedMessages = [
          {
            id: `user-${conversation.id}`,
            type: 'user',
            content: conversation.userMessage || conversation.last_message_preview,
            timestamp: new Date(conversation.created_at),
            model: 'User'
          },
          {
            id: `bot-${conversation.id}`,
            type: 'bot',
            content: conversation.aiResponse || 'Resposta da IA para esta conversa.',
            timestamp: new Date(conversation.created_at),
            model: conversation.model || 'Patriota IA'
          }
        ]
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens da conversa:', error)
    }
  }

  const createNewConversation = () => {
    setCurrentConversation(null)
    conversationId.current = null
    setMessages([{
      id: 'welcome',
      type: 'bot',
      content: 'Olá! Sou a Patriota IA, sua IA conservadora. Como posso ajudá-lo hoje?',
      timestamp: new Date(),
      model: 'Patriota IA'
    }])
    setShowConversationList(false)
  }

  const handleConversationSelect = (conversation) => {
    setCurrentConversation(conversation)
    conversationId.current = conversation.conversation_id
    setShowConversationList(false)
  }

  const handleConversationDelete = async (conversationId) => {
    try {
      await AIService.deleteConversation(conversationId)
      await loadConversations()
      if (currentConversation?.id === conversationId) {
        createNewConversation()
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error)
    }
  }

  const handleConversationUpdate = async (conversationId, updates) => {
    try {
      await AIService.updateConversation(conversationId, updates)
      await loadConversations()
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return

    const messageToSend = inputMessage.trim()
    setInputMessage('')
    setIsTyping(true)

    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
      model: 'User'
    }

    setMessages(prev => [...prev, userMessage])

    try {
      let botMessage;
      
      // Tentar usar o backend real primeiro
      try {
        const response = await retryWithBackoff(async () => {
          const res = await apiClient.post('/ai/chat', {
            message: messageToSend,
            conversation_id: conversationId.current
          })
          
          return res
        })

        const data = response.data
        
        botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          timestamp: new Date(),
          model: data.model || 'Patriota IA'
        }
        
        conversationId.current = data.conversation_id
        setCurrentModel('Patriota IA')
        setIsConnected(true)
        setLastBotMessage(data.response)
        
        // Recarregar lista de conversas após nova mensagem
        loadConversations()
        
        // Auto-falar a resposta da IA
        if (voiceControlsRef.current) {
          voiceControlsRef.current.speakMessage(data.response)
        }
      } catch (backendError) {
        console.warn('Backend não disponível, usando respostas locais:', backendError)
        
        // Fallback para respostas locais conservadoras
        const conservativeResponses = {
          economia: 'A economia brasileira precisa de mais liberdade econômica e menos intervenção estatal. O livre mercado é fundamental para o crescimento sustentável.',
          família: 'A família é a base da sociedade e deve ser protegida. Os valores tradicionais são fundamentais para uma sociedade próspera.',
          educação: 'A educação deve focar nos valores cívicos e no patriotismo, ensinando às crianças o amor pela pátria e pelos valores cristãos.',
          segurança: 'A segurança pública é prioridade. Precisamos apoiar nossas forças policiais e o combate efetivo à criminalidade.',
          valores: 'Os valores cristãos e conservadores são fundamentais para a construção de uma sociedade justa e próspera.',
          default: 'Como conservador, acredito na importância de preservarmos nossos valores tradicionais, a família brasileira e a soberania nacional.'
        }
        
        const lowerMessage = messageToSend.toLowerCase()
        let responseContent = conservativeResponses.default
        
        for (const [key, response] of Object.entries(conservativeResponses)) {
          if (key !== 'default' && lowerMessage.includes(key)) {
            responseContent = response
            break
          }
        }
        
        botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: responseContent,
          timestamp: new Date(),
          model: 'Patriota IA (Local)'
        }
        
        setCurrentModel('Patriota IA (Local)')
        setIsConnected(false)
        setLastBotMessage(responseContent)
        
        // Auto-falar a resposta da IA
        if (voiceControlsRef.current) {
          voiceControlsRef.current.speakMessage(responseContent)
        }
      }

      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
        model: 'Patriota IA'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearConversation = () => {
    setMessages([{
      id: 'welcome',
      type: 'bot',
      content: 'Conversa limpa! Como posso ajudá-lo agora?',
      timestamp: new Date(),
      model: 'Patriota IA'
    }])
    conversationId.current = null
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
  }

  const exportConversation = () => {
    const conversation = messages.map(msg => 
      `${msg.type === 'user' ? 'Você' : msg.model}: ${msg.content}`
    ).join('\n\n')
    
    const blob = new Blob([conversation], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversa-patriotaia-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)] relative">
      {/* Conversation List Sidebar */}
      {showConversationList && (
        <div className="absolute top-0 left-0 w-80 h-full bg-white border-r border-gray-200 z-10 shadow-lg">
          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onConversationSelect={handleConversationSelect}
            onConversationDelete={handleConversationDelete}
            onConversationUpdate={handleConversationUpdate}
            onNewConversation={createNewConversation}
            onClose={() => setShowConversationList(false)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentConversation?.title || 'Patriota IA'}
            </h2>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-gray-500">
                {currentModel || 'Patriota IA'} • {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        

      </div>

      {/* Conversation List Sidebar */}
      {showConversationList && (
        <div className="absolute top-0 left-0 w-80 h-full bg-white border-r border-gray-200 z-10 shadow-lg">
          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onConversationSelect={handleConversationSelect}
            onConversationDelete={handleConversationDelete}
            onConversationUpdate={handleConversationUpdate}
            onNewConversation={createNewConversation}
            onClose={() => setShowConversationList(false)}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-8rem)]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`flex-1 max-w-3xl ${
              message.type === 'user' ? 'text-right' : ''
            }`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              
              <div className={`flex items-center mt-1 space-x-2 text-xs text-gray-500 ${
                message.type === 'user' ? 'justify-end' : ''
              }`}>
                <span>{message.timestamp.toLocaleTimeString()}</span>
                <span>•</span>
                <span>{message.model}</span>
                <button
                  onClick={() => copyMessage(message.content)}
                  className="hover:text-gray-700 transition-colors"
                  title="Copiar mensagem"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bot className="h-5 w-5 text-red-600" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                height: 'auto'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </div>
      </div>
    </div>
  )
}

export default DireitaGPT