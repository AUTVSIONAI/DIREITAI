import { apiClient } from '../lib/api';
import { ApiResponse } from '../types/api';

export interface Manifestation {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'cancelled' | 'completed';
  city: string;
  state: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  start_date: string;
  end_date?: string;
  max_participants?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateManifestationData {
  name: string;
  description?: string;
  status: 'active' | 'cancelled' | 'completed';
  city: string;
  state: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  start_date: string;
  end_date?: string;
  max_participants?: number;
}

export interface UpdateManifestationData extends Partial<CreateManifestationData> {}

export class ManifestationsService {
  /**
   * Obter todas as manifestações
   */
  static async getManifestations(params?: {
    city?: string;
    state?: string;
    status?: string;
    limit?: number;
    page?: number;
    search?: string;
  }): Promise<ApiResponse<{ data: Manifestation[]; total: number }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/manifestations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url);
  }

  /**
   * Obter manifestação por ID
   */
  static async getManifestationById(id: string): Promise<ApiResponse<Manifestation>> {
    return apiClient.get(`/manifestations/${id}`);
  }

  /**
   * Criar nova manifestação
   */
  static async createManifestation(data: CreateManifestationData): Promise<ApiResponse<Manifestation>> {
    return apiClient.post('/manifestations', data);
  }

  /**
   * Atualizar manifestação
   */
  static async updateManifestation(
    id: string,
    data: UpdateManifestationData
  ): Promise<ApiResponse<Manifestation>> {
    return apiClient.put(`/manifestations/${id}`, data);
  }

  /**
   * Excluir manifestação
   */
  static async deleteManifestation(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/manifestations/${id}`);
  }

  /**
   * Fazer check-in em uma manifestação
   */
  static async checkinManifestation(
    id: string,
    data: {
      latitude: number;
      longitude: number;
      device_info?: Record<string, any>;
    }
  ): Promise<ApiResponse<any>> {
    return apiClient.post(`/manifestations/${id}/checkin`, data);
  }

  /**
   * Obter check-ins de uma manifestação
   */
  static async getManifestationCheckins(
    id: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/manifestations/${id}/checkins${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(url);
  }

  /**
   * Obter estatísticas de uma manifestação
   */
  static async getManifestationStats(id: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/manifestations/${id}/stats`);
  }
}

export default ManifestationsService;