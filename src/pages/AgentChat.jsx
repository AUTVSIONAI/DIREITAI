import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import VoiceControls from '../components/user/VoiceControls';
import { 
  Send, 
  Bot, 
  User, 
  ArrowLeft, 
  Star, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown,
  AlertCircle,
  Loader
} from 'lucide-react';

const AgentChat = () => {
  const { politicianId } = useParams();
  const [agent, setAgent] = useState(null);
  const [politician, setPolitician] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ rating: 0, comment: '' });
  const [lastBotMessage, setLastBotMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const voiceControlsRef = useRef(null);

  useEffect(() => {
    if (politicianId) {
      fetchAgent();
    }
  }, [politicianId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar agente do político
      const agentResponse = await apiClient.get(`/agents?politician_id=${politicianId}`);
      
      if (agentResponse.data.success && agentResponse.data.data.length > 0) {
        const agentData = agentResponse.data.data[0];
        setAgent(agentData);
        setPolitician(agentData.politicians);
        
        // Mensagem de boas-vindas
        setMessages([{
          id: 'welcome',
          type: 'agent',
          content: `Olá! Eu sou ${agentData.politicians.name}, ${agentData.politicians.position}. Como posso ajudá-lo hoje? Fique à vontade para me perguntar sobre minhas propostas, posicionamentos políticos ou qualquer questão relacionada ao meu trabalho.`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        setError('Agente IA não encontrado para este político');
      }
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
      setError('Erro ao carregar o agente IA');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || sending || !agent) {
      return;
    }

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);

    try {
      const response = await apiClient.post(`/agents/${agent.id}/chat`, {
        message: userMessage.content,
        session_id: sessionId
      });

      if (response.data.success) {
        const agentMessage = {
          id: `agent_${Date.now()}`,
          type: 'agent',
          content: response.data.data.message,
          timestamp: new Date().toISOString(),
          response_time: response.data.data.response_time_ms,
          fallback: response.data.data.fallback
        };

        setMessages(prev => [...prev, agentMessage]);
        setLastBotMessage(response.data.data.message);
        
        // Auto-falar a resposta da IA
        if (voiceControlsRef.current) {
          voiceControlsRef.current.speakMessage(response.data.data.message);
        }
      } else {
        throw new Error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage = {
        id: `error_${Date.now()}`,
        type: 'agent',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        timestamp: new Date().toISOString(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
      setLastBotMessage(errorMessage.content);
      
      // Auto-falar a mensagem de erro
      if (voiceControlsRef.current) {
        voiceControlsRef.current.speakMessage(errorMessage.content);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleVoiceTranscript = (transcript) => {
    if (transcript.trim()) {
      setInputMessage(transcript);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const submitFeedback = async () => {
    if (feedbackData.rating === 0) {
      alert('Por favor, selecione uma avaliação');
      return;
    }

    try {
      await apiClient.post('/feedback', {
        agent_id: agent.id,
        rating: feedbackData.rating,
        feedback_type: 'conversation',
        comment: feedbackData.comment,
        session_id: sessionId
      });

      alert('Obrigado pelo seu feedback!');
      setShowFeedback(false);
      setFeedbackData({ rating: 0, comment: '' });
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      alert('Erro ao enviar feedback. Tente novamente.');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando agente IA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <Link
            to="/politicos"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Diretório
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/politicos"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </Link>
              
              {politician && (
                <div className="flex items-center gap-3">
                  {politician.photo_url && (
                    <img
                      src={politician.photo_url}
                      alt={politician.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h1 className="font-bold text-gray-900">
                      Conversa com {politician.name}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {politician.position} • {politician.state}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Star className="w-4 h-4" />
              Avaliar
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ height: 'calc(100% - 100px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'agent' && (
                  <div className="flex-shrink-0 mt-1">
                    {politician?.photo_url ? (
                      <img
                        src={politician.photo_url}
                        alt={politician.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.error
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{formatTime(message.timestamp)}</span>
                    {message.fallback && (
                      <span className="text-yellow-600" title="Resposta de fallback">
                        ⚠️
                      </span>
                    )}
                    {message.response_time && (
                      <span title={`Tempo de resposta: ${message.response_time}ms`}>
                        {Math.round(message.response_time / 1000)}s
                      </span>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 mt-1">
                  {politician?.photo_url ? (
                    <img
                      src={politician.photo_url}
                      alt={politician.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            
            {/* Controles de Voz */}
            <div className="mt-2 flex justify-center">
              <VoiceControls
                ref={voiceControlsRef}
                onTranscript={handleVoiceTranscript}
                autoSpeak={true}
                lastMessage={lastBotMessage}
                className="flex items-center gap-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Feedback */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Avalie sua conversa
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Como você avalia esta conversa?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedbackData(prev => ({ ...prev, rating }))}
                    className={`p-2 rounded-lg transition-colors ${
                      feedbackData.rating >= rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentário (opcional)
              </label>
              <textarea
                value={feedbackData.comment}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Deixe seu comentário sobre a conversa..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitFeedback}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enviar Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;