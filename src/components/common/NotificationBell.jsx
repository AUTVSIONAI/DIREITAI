import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ExternalLink, Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { NotificationsService } from '../../services/notifications';
import { useAuth } from '../../contexts/AuthContext';
import DetailsModal from './DetailsModal';

const NotificationBell = ({ className = '' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar notificações
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Remover timeout artificial e confiar no cliente API
      const response = await NotificationsService.getUserNotifications({}, 1, 10);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.warn('Erro ao carregar notificações (tratado):', error?.message || error);
      // Em caso de erro, não mostrar notificações
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Carregar notificações ao montar o componente
  useEffect(() => {
    loadNotifications();
  }, [user]);

  // Marcar notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      await NotificationsService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Dispensar notificação
  const dismissNotification = async (notificationId) => {
    try {
      await NotificationsService.dismissNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Atualizar contador se a notificação não estava lida
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao dispensar notificação:', error);
    }
  };

  // Lidar com clique na notificação
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Registrar clique e abrir modal de detalhes
    try {
      if (notification.action_url) {
        await NotificationsService.markNotificationAsClicked(notification.id);
      }
      setSelectedNotification(notification);
      setIsOpen(false); // Fechar o dropdown
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
      setSelectedNotification(notification);
      setIsOpen(false);
    }
  };

  // Ícones por tipo de notificação
  const getNotificationIcon = (type) => {
    const iconProps = { className: 'h-4 w-4' };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info {...iconProps} className="h-4 w-4 text-blue-500" />;
    }
  };

  // Formatar tempo relativo
  const formatTimeAgo = (timestamp) => {
    try {
      const now = new Date();
      const then = new Date(timestamp);
      const diff = Math.floor((now - then) / 1000);
      if (diff < 60) return `${diff}s atrás`;
      const minutes = Math.floor(diff / 60);
      if (minutes < 60) return `${minutes}m atrás`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h atrás`;
      const days = Math.floor(hours / 24);
      return `${days}d atrás`;
    } catch {
      return '';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Abrir notificações"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                <p className="text-xs text-gray-500">Atualizações e alertas importantes</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando notificações...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Ícone da notificação */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Conteúdo da notificação */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {/* Ações */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeAgo(notification.created_at)}</span>
                              {notification.priority === 'high' && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                  Alta prioridade
                                </span>
                              )}
                              {notification.priority === 'urgent' && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  Urgente
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {notification.action_url && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  title="Abrir link"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              )}
                              
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                                  title="Marcar como lida"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="Dispensar"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  // Aqui você pode navegar para uma página de notificações completa
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}

      <DetailsModal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        item={selectedNotification}
        type="notification"
      />
    </div>
  );
};

export default NotificationBell;