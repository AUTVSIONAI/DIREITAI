import React, { useState, useEffect } from 'react';
import { RSVPService } from '../../services/rsvp';
import {
  RSVPParticipant,
  getRSVPStatusLabel,
  getRSVPStatusColor,
  getRSVPStatusIcon
} from '../../types/rsvp';
import { useAuth } from '../../hooks/useAuth';

interface RSVPParticipantsListProps {
  type: 'event' | 'manifestation';
  itemId: string;
  itemTitle?: string;
  showOnlyConfirmed?: boolean;
  maxVisible?: number;
  className?: string;
}

const RSVPParticipantsList: React.FC<RSVPParticipantsListProps> = ({
  type,
  itemId,
  itemTitle,
  showOnlyConfirmed = false,
  maxVisible = 10,
  className = ''
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<RSVPParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && itemId) {
      loadParticipants();
    }
  }, [user, itemId, type, showOnlyConfirmed]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = type === 'event'
        ? await RSVPService.getEventParticipants(itemId)
        : await RSVPService.getManifestationParticipants(itemId);

      if (response.success && response.participants) {
        let filteredParticipants = response.participants;
        
        if (showOnlyConfirmed) {
          filteredParticipants = response.participants.filter(p => p.status === 'vai');
        }
        
        setParticipants(filteredParticipants);
      } else {
        setError('Erro ao carregar participantes');
      }
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      setError('Erro ao carregar participantes');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Faça login para ver os participantes
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Carregando participantes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        {error}
        <button
          onClick={loadParticipants}
          className="ml-2 text-blue-600 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        {showOnlyConfirmed 
          ? 'Nenhuma confirmação de presença ainda'
          : 'Nenhum participante ainda'
        }
      </div>
    );
  }

  const visibleParticipants = showAll ? participants : participants.slice(0, maxVisible);
  const hasMore = participants.length > maxVisible;

  const getStatusCounts = () => {
    const counts = {
      vai: participants.filter(p => p.status === 'vai').length,
      nao_vai: participants.filter(p => p.status === 'nao_vai').length,
      talvez: participants.filter(p => p.status === 'talvez').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cabeçalho com estatísticas */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Participantes
          {itemTitle && <span className="text-sm text-gray-600 ml-2">- {itemTitle}</span>}
        </h3>
        
        {!showOnlyConfirmed && (
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <span>✓</span>
              {statusCounts.vai}
            </span>
            <span className="flex items-center gap-1 text-yellow-600">
              <span>?</span>
              {statusCounts.talvez}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span>✗</span>
              {statusCounts.nao_vai}
            </span>
          </div>
        )}
      </div>

      {/* Lista de participantes */}
      <div className="space-y-2">
        {visibleParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {participant.user_name.charAt(0).toUpperCase()}
              </div>
              
              {/* Nome e informações */}
              <div>
                <div className="font-medium text-gray-900">
                  {participant.user_name}
                </div>
                {participant.user_email && (
                  <div className="text-sm text-gray-600">
                    {participant.user_email}
                  </div>
                )}
                {participant.notes && (
                  <div className="text-sm text-gray-700 mt-1 italic">
                    "{participant.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRSVPStatusColor(participant.status)}`}>
                <span className="mr-1">{getRSVPStatusIcon(participant.status)}</span>
                {getRSVPStatusLabel(participant.status)}
              </span>
              
              {/* Data de confirmação */}
              <div className="text-xs text-gray-500">
                {new Date(participant.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botão para mostrar mais */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Mostrar mais {participants.length - maxVisible} participantes
        </button>
      )}

      {/* Botão para mostrar menos */}
      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Mostrar menos
        </button>
      )}

      {/* Resumo no rodapé */}
      <div className="text-sm text-gray-600 text-center pt-2 border-t border-gray-200">
        Total: {participants.length} {participants.length === 1 ? 'participante' : 'participantes'}
        {showOnlyConfirmed && statusCounts.vai > 0 && (
          <span className="text-green-600 ml-2">
            ({statusCounts.vai} confirmado{statusCounts.vai !== 1 ? 's' : ''})
          </span>
        )}
      </div>
    </div>
  );
};

export default RSVPParticipantsList;