import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { NotificationsService } from '../../services/notifications';
import { useAuth } from '../../hooks/useAuth';

const AnnouncementBanner = ({ className = '' }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar anúncios ativos
  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await NotificationsService.getAnnouncementBanners();
        // Garantir que response seja sempre um array
        const announcementsData = Array.isArray(response) ? response : [];
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, [user]);

  // Dispensar anúncio
  const dismissAnnouncement = async (announcementId) => {
    try {
      await NotificationsService.dismissAnnouncementBanner(announcementId);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    } catch (error) {
      console.error('Erro ao dispensar anúncio:', error);
    }
  };

  // Lidar com clique no anúncio
  const handleAnnouncementClick = async (announcement) => {
    try {
      await NotificationsService.clickAnnouncementBanner(announcement.id);
      
      if (announcement.action?.url) {
        window.open(announcement.action.url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao registrar clique no anúncio:', error);
    }
  };

  // Ícones por tipo de anúncio
  const getAnnouncementIcon = (type) => {
    const iconProps = { className: 'h-5 w-5' };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle {...iconProps} className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <Info {...iconProps} className="h-5 w-5 text-blue-600" />;
    }
  };

  // Classes CSS por tipo de anúncio
  const getAnnouncementClasses = (type) => {
    const baseClasses = 'border-l-4 p-4 rounded-r-lg shadow-sm';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-400 text-green-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  // Verificar se o anúncio deve ser exibido
  const shouldShowAnnouncement = (announcement) => {
    if (!announcement.is_active) return false;
    
    const now = new Date();
    
    // Verificar data de início
    if (announcement.start_date) {
      const startDate = new Date(announcement.start_date);
      if (now < startDate) return false;
    }
    
    // Verificar data de fim
    if (announcement.end_date) {
      const endDate = new Date(announcement.end_date);
      if (now > endDate) return false;
    }
    
    return true;
  };

  if (loading || !user) return null;

  // Filtrar anúncios que devem ser exibidos
  const visibleAnnouncements = announcements
    .filter(shouldShowAnnouncement)
    .sort((a, b) => b.priority - a.priority); // Ordenar por prioridade (maior primeiro)

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={getAnnouncementClasses(announcement.type)}
          style={{
            backgroundColor: announcement.styling?.background_color,
            color: announcement.styling?.text_color,
            borderColor: announcement.styling?.border_color,
          }}
        >
          <div className="flex items-start space-x-3">
            {/* Ícone */}
            <div className="flex-shrink-0">
              {getAnnouncementIcon(announcement.type)}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-1">
                    {announcement.title}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {announcement.message}
                  </p>
                  
                  {/* Botão de ação */}
                  {announcement.action && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleAnnouncementClick(announcement)}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm font-medium transition-colors"
                      >
                        <span>{announcement.action.text || 'Saiba mais'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Botão de fechar */}
                {announcement.is_dismissible && (
                  <button
                    onClick={() => dismissAnnouncement(announcement.id)}
                    className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                    aria-label="Dispensar anúncio"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Indicador de prioridade */}
          {announcement.priority >= 8 && (
            <div className="mt-2 flex items-center space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              <span className="text-xs font-medium opacity-75">Alta prioridade</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;