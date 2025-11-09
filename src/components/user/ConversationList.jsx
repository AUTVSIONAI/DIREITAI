import React, { useState, useEffect } from 'react'
import { MessageCircle, Plus, Trash2, Edit3, Archive, Clock, Bot } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext';
import { AIService } from '../../services/ai'

const ConversationList = ({ 
  conversations,
  currentConversation,
  onConversationSelect,
  onConversationDelete,
  onConversationUpdate,
  onNewConversation,
  onClose,
  className = '' 
}) => {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation()
    
    if (!confirm('Tem certeza que deseja deletar esta conversa?')) {
      return
    }

    onConversationDelete(conversationId)
  }

  const handleEditTitle = async (conversationId, newTitle) => {
    if (!newTitle.trim()) return

    onConversationUpdate(conversationId, { title: newTitle.trim() })
    setEditingId(null)
    setEditTitle('')
  }

  const handleArchiveConversation = async (conversationId, e) => {
    e.stopPropagation()
    
    if (!confirm('Tem certeza que deseja arquivar esta conversa?')) {
      return
    }

    onConversationUpdate(conversationId, { archived: true })
  }

  const startEditing = (conversation, e) => {
    e.stopPropagation()
    setEditingId(conversation.id)
    setEditTitle(conversation.title || '')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    return date.toLocaleDateString('pt-BR')
  }



  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Conversas</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewConversation}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nova</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Lista de Conversas */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma conversa ainda</p>
            <p className="text-sm">Inicie uma nova conversa!</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect(conversation)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversation?.id === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <Bot className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                      {editingId === conversation.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleEditTitle(conversation.id, editTitle)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTitle(conversation.id, editTitle)
                            } else if (e.key === 'Escape') {
                              cancelEditing()
                            }
                          }}
                          className="flex-1 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title || 'Conversa sem título'}
                        </h4>
                      )}
                    </div>
                    
                    {conversation.last_message_preview && (
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {conversation.last_message_preview}
                      </p>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTimeAgo(conversation.created_at)}</span>
                      <span className="mx-2">•</span>
                      <span>{conversation.message_count || 0} mensagens</span>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEditing(conversation, e)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar título"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleArchiveConversation(conversation.id, e)}
                      className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                      title="Arquivar conversa"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Deletar conversa"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationList