export type RSVPStatus = 'vai' | 'nao_vai' | 'talvez';

export interface EventRSVP {
  id: string;
  user_id: string;
  event_id: string;
  status: RSVPStatus;
  notes?: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManifestationRSVP {
  id: string;
  user_id: string;
  manifestation_id: string;
  status: RSVPStatus;
  notes?: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RSVPStats {
  vai: number;
  nao_vai: number;
  talvez: number;
  total: number;
}

export interface CreateRSVPData {
  status: RSVPStatus;
  notes?: string;
  notification_enabled?: boolean;
}

export interface UpdateRSVPData extends Partial<CreateRSVPData> {}

export interface RSVPParticipant {
  id: string;
  user_id: string;
  event_id?: string;
  manifestation_id?: string;
  status: RSVPStatus;
  notes?: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
}

export interface UserEventRSVP extends EventRSVP {
  events: {
    id: string;
    title: string;
    description?: string;
    date: string;
    time?: string;
    location?: string;
    city?: string;
    state?: string;
    status: string;
  };
}

export interface UserManifestationRSVP extends ManifestationRSVP {
  manifestations: {
    id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    city?: string;
    state?: string;
    status: string;
  };
}

export interface RSVPFilters {
  status?: RSVPStatus;
  page?: number;
  limit?: number;
}

export interface RSVPResponse<T> {
  success: boolean;
  data?: T;
  rsvp?: EventRSVP | ManifestationRSVP;
  stats?: RSVPStats;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

// Constantes para labels e cores
export const RSVP_STATUS_LABELS: Record<RSVPStatus, string> = {
  vai: 'Vou participar',
  nao_vai: 'Não vou participar',
  talvez: 'Talvez participe'
};

export const RSVP_STATUS_COLORS: Record<RSVPStatus, string> = {
  vai: 'text-green-600 bg-green-100',
  nao_vai: 'text-red-600 bg-red-100',
  talvez: 'text-yellow-600 bg-yellow-100'
};

export const RSVP_STATUS_ICONS: Record<RSVPStatus, string> = {
  vai: '✓',
  nao_vai: '✗',
  talvez: '?'
};

// Funções utilitárias
export const getRSVPStatusLabel = (status: RSVPStatus): string => {
  return RSVP_STATUS_LABELS[status] || status;
};

export const getRSVPStatusColor = (status: RSVPStatus): string => {
  return RSVP_STATUS_COLORS[status] || 'text-gray-600 bg-gray-100';
};

export const getRSVPStatusIcon = (status: RSVPStatus): string => {
  return RSVP_STATUS_ICONS[status] || '?';
};

export const calculateRSVPPercentages = (stats: RSVPStats) => {
  if (stats.total === 0) {
    return { vai: 0, nao_vai: 0, talvez: 0 };
  }

  return {
    vai: Math.round((stats.vai / stats.total) * 100),
    nao_vai: Math.round((stats.nao_vai / stats.total) * 100),
    talvez: Math.round((stats.talvez / stats.total) * 100)
  };
};