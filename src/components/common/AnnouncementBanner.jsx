import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { NotificationsService } from '../../services/notifications';
import { useAuth } from '../../contexts/AuthContext';
import DetailsModal from './DetailsModal';

const AnnouncementBanner = ({ className = '' }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const viewedIdsRef = useRef(new Set());

  const [locallyDismissed, setLocallyDismissed] = useState(() => {
    try {
      const raw = localStorage.getItem('dismissedAnnouncements');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Carregar anúncios ativos
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await NotificationsService.getAnnouncementBanners();
        const announcementsData = Array.isArray(response) ? response : [];
        setAnnouncements(announcementsData);

        // Registrar visualizações
        announcementsData.forEach(announcement => {
          if (!viewedIdsRef.current.has(announcement.id)) {
            NotificationsService.viewAnnouncementBanner(announcement.id).catch(console.error);
            viewedIdsRef.current.add(announcement.id);
          }
        });

      } catch (error) {
        // Tratar 401/403 graciosamente para usuários não autenticados
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          console.info('Anúncios requerem autenticação; ocultando para visitante.');
          setAnnouncements([]);
        } else {
          console.warn('Erro ao carregar anúncios (tratado):', error?.message || error);
          setAnnouncements([]);
        }
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
      const next = Array.from(new Set([...(locallyDismissed || []), announcementId]));
      setLocallyDismissed(next);
      try { localStorage.setItem('dismissedAnnouncements', JSON.stringify(next)); } catch {}
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    }
  };

  // Lidar com clique no anúncio
  const handleAnnouncementClick = async (announcement) => {
    try {
      await NotificationsService.clickAnnouncementBanner(announcement.id);
      setSelectedAnnouncement(announcement);
    } catch (error) {
      console.error('Erro ao registrar clique no anúncio:', error);
      // Ainda abrir o modal mesmo se falhar o registro do clique
      setSelectedAnnouncement(announcement);
    }
  };

  // Ícone por tipo de anúncio
  const getAnnouncementIcon = (type) => {
    const iconProps = { className: 'h-5 w-5' };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-yellow-600" />;
      case 'error':
        return <AlertCircle {...iconProps} className="text-red-600" />;
      case 'info':
      default:
        return <Info {...iconProps} className="text-blue-600" />;
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
    const isActive = announcement.is_active ?? announcement.active ?? true;
    if (!isActive) return false;

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

  if (loading) return null;

  // Filtrar anúncios que devem ser exibidos
  const visibleAnnouncements = announcements
    .filter(a => !locallyDismissed?.includes?.(a.id))
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
                  <button
                    onClick={() => handleAnnouncementClick(announcement)}
                    className="mt-2 inline-flex items-center text-xs font-medium underline opacity-80 hover:opacity-100 focus:outline-none"
                  >
                    {announcement.action?.label || 'Ver detalhes'}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissAnnouncement(announcement.id);
                  }}
                  className="p-1 ml-2 text-gray-400 hover:text-gray-600 rounded focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <DetailsModal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        item={selectedAnnouncement}
        type="announcement"
      />
    </div>
  );
};

export default AnnouncementBanner;