import { apiClient } from "../lib/api";
import {
  EventRSVP,
  ManifestationRSVP,
  RSVPStats,
  CreateRSVPData,
  UpdateRSVPData,
  RSVPParticipant,
  UserEventRSVP,
  UserManifestationRSVP,
  RSVPFilters,
  RSVPResponse
} from '../types/rsvp';

export class RSVPService {
  // ===== RSVP para Eventos =====

  /**
   * Criar ou atualizar RSVP para um evento
   */
  static async createOrUpdateEventRSVP(
    eventId: string,
    data: CreateRSVPData
  ): Promise<RSVPResponse<EventRSVP>> {
    const response = await apiClient.post(`/rsvp/events/${eventId}`, data);
    return response.data;
  }

  /**
   * Obter RSVP do usuário para um evento específico
   */
  static async getUserEventRSVP(
    eventId: string
  ): Promise<RSVPResponse<EventRSVP>> {
    const response = await apiClient.get(`/rsvp/events/${eventId}`);
    return response.data;
  }

  /**
   * Obter estatísticas de RSVP para um evento
   */
  static async getEventRSVPStats(
    eventId: string
  ): Promise<RSVPResponse<RSVPStats>> {
    const response = await apiClient.get(`/rsvp/events/${eventId}/stats`);
    return response.data;
  }

  /**
   * Remover RSVP do usuário para um evento
   */
  static async removeEventRSVP(eventId: string): Promise<RSVPResponse<null>> {
    const response = await apiClient.delete(`/rsvp/events/${eventId}`);
    return response.data;
  }

  /**
   * Listar participantes de um evento (admin)
   */
  static async getEventParticipants(
    eventId: string,
    filters?: RSVPFilters
  ): Promise<RSVPResponse<RSVPParticipant[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(
      `/rsvp/events/${eventId}/participants?${params.toString()}`
    );
    return response.data;
  }

  // ===== RSVP para Manifestações =====

  /**
   * Criar ou atualizar RSVP para uma manifestação
   */
  static async createOrUpdateManifestationRSVP(
    manifestationId: string,
    data: CreateRSVPData
  ): Promise<RSVPResponse<ManifestationRSVP>> {
    const response = await apiClient.post(`/rsvp/manifestations/${manifestationId}`, data);
    return response.data;
  }

  /**
   * Obter RSVP do usuário para uma manifestação específica
   */
  static async getUserManifestationRSVP(
    manifestationId: string
  ): Promise<RSVPResponse<ManifestationRSVP>> {
    const response = await apiClient.get(`/rsvp/manifestations/${manifestationId}`);
    return response.data;
  }

  /**
   * Obter estatísticas de RSVP para uma manifestação
   */
  static async getManifestationRSVPStats(
    manifestationId: string
  ): Promise<RSVPResponse<RSVPStats>> {
    const response = await apiClient.get(`/rsvp/manifestations/${manifestationId}/stats`);
    return response.data;
  }

  /**
   * Remover RSVP do usuário para uma manifestação
   */
  static async removeManifestationRSVP(manifestationId: string): Promise<RSVPResponse<null>> {
    const response = await apiClient.delete(`/rsvp/manifestations/${manifestationId}`);
    return response.data;
  }

  /**
   * Listar participantes de uma manifestação (admin)
   */
  static async getManifestationParticipants(
    manifestationId: string,
    filters?: RSVPFilters
  ): Promise<RSVPResponse<RSVPParticipant[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(
      `/rsvp/manifestations/${manifestationId}/participants?${params.toString()}`
    );
    return response.data;
  }

  // ===== RSVPs do Usuário =====

  /**
   * Obter todos os RSVPs de eventos do usuário logado
   */
  static async getUserEventRSVPs(
    filters?: RSVPFilters
  ): Promise<RSVPResponse<UserEventRSVP[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/rsvp/user/events?${params.toString()}`);
    return response.data;
  }

  /**
   * Obter todos os RSVPs de manifestações do usuário logado
   */
  static async getUserManifestationRSVPs(
    filters?: RSVPFilters
  ): Promise<RSVPResponse<UserManifestationRSVP[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/rsvp/user/manifestations?${params.toString()}`);
    return response.data;
  }

  // ===== Métodos de Conveniência =====

  /**
   * Confirmar presença em um evento
   */
  static async confirmEventAttendance(
    eventId: string,
    notes?: string
  ): Promise<RSVPResponse<EventRSVP>> {
    return this.createOrUpdateEventRSVP(eventId, {
      status: 'vai',
      notes,
      notification_enabled: true
    });
  }

  /**
   * Declinar participação em um evento
   */
  static async declineEventAttendance(
    eventId: string,
    notes?: string
  ): Promise<RSVPResponse<EventRSVP>> {
    return this.createOrUpdateEventRSVP(eventId, {
      status: 'nao_vai',
      notes,
      notification_enabled: false
    });
  }

  /**
   * Marcar como "talvez" para um evento
   */
  static async maybeEventAttendance(
    eventId: string,
    notes?: string
  ): Promise<RSVPResponse<EventRSVP>> {
    return this.createOrUpdateEventRSVP(eventId, {
      status: 'talvez',
      notes,
      notification_enabled: true
    });
  }

  /**
   * Confirmar presença em uma manifestação
   */
  static async confirmManifestationAttendance(
    manifestationId: string,
    notes?: string
  ): Promise<RSVPResponse<ManifestationRSVP>> {
    return this.createOrUpdateManifestationRSVP(manifestationId, {
      status: 'vai',
      notes,
      notification_enabled: true
    });
  }

  /**
   * Declinar participação em uma manifestação
   */
  static async declineManifestationAttendance(
    manifestationId: string,
    notes?: string
  ): Promise<RSVPResponse<ManifestationRSVP>> {
    return this.createOrUpdateManifestationRSVP(manifestationId, {
      status: 'nao_vai',
      notes,
      notification_enabled: false
    });
  }

  /**
   * Marcar como "talvez" para uma manifestação
   */
  static async maybeManifestationAttendance(
    manifestationId: string,
    notes?: string
  ): Promise<RSVPResponse<ManifestationRSVP>> {
    return this.createOrUpdateManifestationRSVP(manifestationId, {
      status: 'talvez',
      notes,
      notification_enabled: true
    });
  }

  /**
   * Verificar se o usuário tem RSVP para um evento
   */
  static async hasEventRSVP(eventId: string): Promise<boolean> {
    try {
      const response = await this.getUserEventRSVP(eventId);
      return response.success && response.rsvp !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar se o usuário tem RSVP para uma manifestação
   */
  static async hasManifestationRSVP(manifestationId: string): Promise<boolean> {
    try {
      const response = await this.getUserManifestationRSVP(manifestationId);
      return response.success && response.rsvp !== null;
    } catch (error) {
      return false;
    }
  }
}

export default RSVPService;