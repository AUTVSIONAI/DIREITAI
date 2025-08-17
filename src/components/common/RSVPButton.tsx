import React, { useState, useEffect } from 'react';
import { RSVPService } from '../../services/rsvp';
import {
  RSVPStatus,
  EventRSVP,
  ManifestationRSVP,
  RSVPStats,
  getRSVPStatusLabel,
  getRSVPStatusColor,
  getRSVPStatusIcon
} from '../../types/rsvp';
import { useAuth } from '../../hooks/useAuth';

interface RSVPButtonProps {
  type: 'event' | 'manifestation';
  itemId: string;
  itemTitle?: string;
  showStats?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onRSVPChange?: (rsvp: EventRSVP | ManifestationRSVP | null) => void;
}

const RSVPButton: React.FC<RSVPButtonProps> = ({
  type,
  itemId,
  itemTitle,
  showStats = true,
  size = 'md',
  className = '',
  onRSVPChange
}) => {
  const { user } = useAuth();
  const [currentRSVP, setCurrentRSVP] = useState<EventRSVP | ManifestationRSVP | null>(null);
  const [stats, setStats] = useState<RSVPStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [pendingStatus, setPendingStatus] = useState<RSVPStatus | null>(null);

  // Carregar RSVP atual e estatísticas
  useEffect(() => {
    if (user && itemId) {
      loadRSVPData();
    }
  }, [user, itemId, type]);

  const loadRSVPData = async () => {
    try {
      setLoading(true);

      // Carregar RSVP do usuário
      const rsvpResponse = type === 'event'
        ? await RSVPService.getUserEventRSVP(itemId)
        : await RSVPService.getUserManifestationRSVP(itemId);

      if (rsvpResponse.success) {
        setCurrentRSVP(rsvpResponse.rsvp || null);
        setNotes(rsvpResponse.rsvp?.notes || '');
      }

      // Carregar estatísticas se solicitado
      if (showStats) {
        const statsResponse = type === 'event'
          ? await RSVPService.getEventRSVPStats(itemId)
          : await RSVPService.getManifestationRSVPStats(itemId);

        if (statsResponse.success) {
          setStats(statsResponse.stats || null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de RSVP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVPClick = (status: RSVPStatus) => {
    setPendingStatus(status);
    setShowNotesModal(true);
  };

  const confirmRSVP = async () => {
    if (!pendingStatus) return;

    try {
      setLoading(true);
      
      const rsvpData = {
        status: pendingStatus,
        notes: notes.trim() || undefined,
        notification_enabled: pendingStatus !== 'nao_vai'
      };

      const response = type === 'event'
        ? await RSVPService.createOrUpdateEventRSVP(itemId, rsvpData)
        : await RSVPService.createOrUpdateManifestationRSVP(itemId, rsvpData);

      if (response.success && response.rsvp) {
        setCurrentRSVP(response.rsvp);
        onRSVPChange?.(response.rsvp);
        
        // Recarregar estatísticas
        if (showStats) {
          const statsResponse = type === 'event'
            ? await RSVPService.getEventRSVPStats(itemId)
            : await RSVPService.getManifestationRSVPStats(itemId);

          if (statsResponse.success) {
            setStats(statsResponse.stats || null);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao salvar RSVP:', error);
      alert('Erro ao salvar confirmação de presença. Tente novamente.');
    } finally {
      setLoading(false);
      setShowNotesModal(false);
      setPendingStatus(null);
      setShowDropdown(false);
    }
  };

  const removeRSVP = async () => {
    try {
      setLoading(true);
      
      const response = type === 'event'
        ? await RSVPService.removeEventRSVP(itemId)
        : await RSVPService.removeManifestationRSVP(itemId);

      if (response.success) {
        setCurrentRSVP(null);
        setNotes('');
        onRSVPChange?.(null);
        
        // Recarregar estatísticas
        if (showStats) {
          const statsResponse = type === 'event'
            ? await RSVPService.getEventRSVPStats(itemId)
            : await RSVPService.getManifestationRSVPStats(itemId);

          if (statsResponse.success) {
            setStats(statsResponse.stats || null);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao remover RSVP:', error);
      alert('Erro ao remover confirmação de presença. Tente novamente.');
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  if (!user) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Faça login para confirmar presença
      </div>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const buttonClass = `${sizeClasses[size]} rounded-lg font-medium transition-colors duration-200 ${className}`;

  return (
    <div className="relative">
      {/* Botão Principal */}
      <div className="flex items-center gap-2">
        {currentRSVP ? (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
            className={`${buttonClass} ${getRSVPStatusColor(currentRSVP.status)} border border-current hover:opacity-80 disabled:opacity-50`}
          >
            <span className="mr-1">{getRSVPStatusIcon(currentRSVP.status)}</span>
            {getRSVPStatusLabel(currentRSVP.status)}
            <span className="ml-1">▼</span>
          </button>
        ) : (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
            className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
          >
            {loading ? 'Carregando...' : 'Confirmar Presença'}
            <span className="ml-1">▼</span>
          </button>
        )}

        {/* Estatísticas */}
        {showStats && stats && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-green-600">✓ {stats.vai}</span>
            <span className="text-red-600">✗ {stats.nao_vai}</span>
            <span className="text-yellow-600">? {stats.talvez}</span>
          </div>
        )}
      </div>

      {/* Dropdown de Opções */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
          <div className="py-1">
            <button
              onClick={() => handleRSVPClick('vai')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-green-600">✓</span>
              Vou participar
            </button>
            <button
              onClick={() => handleRSVPClick('talvez')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-yellow-600">?</span>
              Talvez participe
            </button>
            <button
              onClick={() => handleRSVPClick('nao_vai')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-red-600">✗</span>
              Não vou participar
            </button>
            
            {currentRSVP && (
              <>
                <hr className="my-1" />
                <button
                  onClick={removeRSVP}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600"
                >
                  Remover confirmação
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Notas */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirmar Presença
              {itemTitle && <span className="block text-sm text-gray-600 mt-1">{itemTitle}</span>}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Você está confirmando: <strong>{getRSVPStatusLabel(pendingStatus!)}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentários (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione um comentário sobre sua participação..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setPendingStatus(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRSVP}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default RSVPButton;