import { apiClient } from '../lib/api';

// Interfaces para os dados das APIs externas
interface DeputadoCamara {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  email?: string;
}

interface SenadorSenado {
  CodigoParlamentar: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar: string;
  SexoParlamentar: string;
  FormaTratamento: string;
  UrlFotoParlamentar: string;
  UrlPaginaParlamentar: string;
  EmailParlamentar: string;
  SiglaPartidoParlamentar: string;
  UfParlamentar: string;
}

interface PoliticianSyncData {
  name: string;
  full_name?: string;
  party: string;
  state: string;
  position: 'deputado' | 'senador';
  photo_url?: string;
  email?: string;
  external_id: string;
  source: 'camara' | 'senado';
  legislature_id?: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Politician {
  id: number;
  name: string;
  party: string;
  position: string;
  city: string;
  state: string;
  photo_url?: string;
  bio?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreatePoliticianData {
  name: string;
  party: string;
  position: string;
  city: string;
  state: string;
  photo_url?: string;
  bio?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface UpdatePoliticianData extends Partial<CreatePoliticianData> {}

export class PoliticiansService {
  private static readonly CAMARA_BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2';
  private static readonly SENADO_BASE_URL = 'https://legis.senado.leg.br/dadosabertos';
  /**
   * Obter todos os políticos
   */
  static async getPoliticians(filters?: {
    search?: string;
    party?: string;
    position?: string;
    city?: string;
    state?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    politicians: Politician[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/politicians?${params.toString()}`);
    return response.data;
  }

  /**
   * Obter político específico
   */
  static async getPolitician(id: number): Promise<Politician> {
    const response = await apiClient.get(`/politicians/${id}`);
    return response.data;
  }

  /**
   * Criar novo político
   */
  static async createPolitician(data: CreatePoliticianData): Promise<Politician> {
    const response = await apiClient.post('/politicians', data);
    return response.data;
  }

  /**
   * Atualizar político
   */
  static async updatePolitician(id: number, data: UpdatePoliticianData): Promise<Politician> {
    const response = await apiClient.put(`/politicians/${id}`, data);
    return response.data;
  }

  /**
   * Deletar político
   */
  static async deletePolitician(id: number): Promise<void> {
    await apiClient.delete(`/politicians/${id}`);
  }

  /**
   * Upload de foto do político
   */
  static async uploadPhoto(formData: FormData): Promise<{ url: string }> {
    const response = await apiClient.post('/upload/politician-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return {
      url: response.data.data.url
    };
  }

  /**
   * Obter partidos disponíveis
   */
  static async getParties(): Promise<string[]> {
    const response = await apiClient.get('/politicians/parties');
    return response.data;
  }

  /**
   * Obter posições disponíveis
   */
  static async getPositions(): Promise<string[]> {
    const response = await apiClient.get('/politicians/positions');
    return response.data;
  }

  /**
   * Obter cidades disponíveis
   */
  static async getCities(): Promise<string[]> {
    const response = await apiClient.get('/politicians/cities');
    return response.data;
  }

  /**
   * Obter estados disponíveis
   */
  static async getStates(): Promise<string[]> {
    const response = await apiClient.get('/politicians/states');
    return response.data;
  }

  // ===== MÉTODOS DE INTEGRAÇÃO COM APIs EXTERNAS =====

  /**
   * Busca todos os deputados da Câmara dos Deputados através do backend
   */
  static async fetchDeputados(): Promise<DeputadoCamara[]> {
    try {
      const response = await apiClient.get('/admin/politicians/fetch/deputados');
      return response.data.deputados;
    } catch (error) {
      console.error('Erro ao buscar deputados:', error);
      throw error;
    }
  }

  /**
   * Busca todos os senadores do Senado Federal através do backend
   */
  static async fetchSenadores(): Promise<SenadorSenado[]> {
    try {
      const response = await apiClient.get('/admin/politicians/fetch/senadores');
      return response.data.senadores;
    } catch (error) {
      console.error('Erro ao buscar senadores:', error);
      throw error;
    }
  }

  /**
   * Converte dados de deputado para formato padrão
   */
  private static convertDeputadoData(deputado: DeputadoCamara): PoliticianSyncData {
    return {
      name: deputado.nome,
      full_name: deputado.nome,
      party: deputado.siglaPartido,
      state: deputado.siglaUf,
      position: 'deputado',
      photo_url: deputado.urlFoto,
      email: deputado.email,
      external_id: deputado.id.toString(),
      source: 'camara',
      legislature_id: deputado.idLegislatura,
      status: 'pending'
    };
  }

  /**
   * Converte dados de senador para formato padrão
   */
  private static convertSenadorData(senador: SenadorSenado): PoliticianSyncData {
    return {
      name: senador.NomeParlamentar,
      full_name: senador.NomeCompletoParlamentar,
      party: senador.SiglaPartidoParlamentar,
      state: senador.UfParlamentar,
      position: 'senador',
      photo_url: senador.UrlFotoParlamentar,
      email: senador.EmailParlamentar,
      external_id: senador.CodigoParlamentar,
      source: 'senado',
      status: 'pending'
    };
  }

  /**
   * Sincroniza dados de deputados com o banco de dados
   */
  static async syncDeputados(): Promise<{ success: number; errors: number; total: number }> {
    try {
      const deputados = await this.fetchDeputados();
      const deputadosData = deputados.map(deputado => PoliticiansService.convertDeputadoData(deputado));
      
      // Envia todos os deputados em uma única requisição
      const response = await apiClient.post('/admin/politicians/sync/deputados', {
        deputados: deputadosData
      });
      
      return {
        success: response.data.summary.success,
        errors: response.data.summary.errors,
        total: response.data.summary.total
      };
    } catch (error) {
      console.error('Erro na sincronização de deputados:', error);
      throw error;
    }
  }

  /**
   * Sincroniza dados de senadores com o banco de dados
   */
  static async syncSenadores(): Promise<{ success: number; errors: number; total: number }> {
    try {
      const senadores = await this.fetchSenadores();
      const senadoresData = senadores.map(senador => PoliticiansService.convertSenadorData(senador));
      
      // Envia todos os senadores em uma única requisição
      const response = await apiClient.post('/admin/politicians/sync/senadores', {
        senadores: senadoresData
      });
      
      return {
        success: response.data.summary.success,
        errors: response.data.summary.errors,
        total: response.data.summary.total
      };
    } catch (error) {
      console.error('Erro na sincronização de senadores:', error);
      throw error;
    }
  }

  /**
   * Sincroniza todos os políticos (deputados e senadores)
   */
  static async syncAllPoliticians(): Promise<{
    deputados: { success: number; errors: number; total: number };
    senadores: { success: number; errors: number; total: number };
  }> {
    try {
      console.log('Iniciando sincronização de políticos...');
      
      const [deputadosResult, senadoresResult] = await Promise.all([
        this.syncDeputados(),
        this.syncSenadores()
      ]);
      
      console.log('Sincronização concluída:', {
        deputados: deputadosResult,
        senadores: senadoresResult
      });
      
      return {
        deputados: deputadosResult,
        senadores: senadoresResult
      };
    } catch (error) {
      console.error('Erro na sincronização geral:', error);
      throw error;
    }
  }

  /**
   * Busca detalhes de um deputado específico
   */
  static async getDeputadoDetails(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.CAMARA_BASE_URL}/deputados/${id}`);
      const data = await response.json();
      return data.dados;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do deputado ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca detalhes de um senador específico
   */
  static async getSenadorDetails(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.SENADO_BASE_URL}/senador/${id}.json`);
      const data = await response.json();
      return data.DetalheParlamentar?.Parlamentar;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do senador ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza dados de um político específico a partir da API externa
   */
  static async updatePoliticianFromAPI(politicianId: string, source: 'camara' | 'senado', externalId: string): Promise<any> {
    try {
      let updatedData;
      
      if (source === 'camara') {
        const deputadoData = await this.getDeputadoDetails(externalId);
        updatedData = this.convertDeputadoData(deputadoData);
      } else {
        const senadorData = await this.getSenadorDetails(externalId);
        updatedData = this.convertSenadorData(senadorData);
      }
      
      // Atualiza no banco de dados
      const response = await apiClient.put(`/admin/politicians/${politicianId}/sync`, updatedData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar político ${politicianId}:`, error);
      throw error;
    }
  }
}

// Exportar a instância para uso direto
export const politiciansService = {
  getPoliticians: PoliticiansService.getPoliticians,
  getPolitician: PoliticiansService.getPolitician,
  createPolitician: PoliticiansService.createPolitician,
  updatePolitician: PoliticiansService.updatePolitician,
  deletePolitician: PoliticiansService.deletePolitician,
  uploadPhoto: PoliticiansService.uploadPhoto,
  getParties: PoliticiansService.getParties,
  getPositions: PoliticiansService.getPositions,
  getCities: PoliticiansService.getCities,
  getStates: PoliticiansService.getStates,
  // Métodos de sincronização com APIs externas
  fetchDeputados: PoliticiansService.fetchDeputados,
  fetchSenadores: PoliticiansService.fetchSenadores,
  syncDeputados: PoliticiansService.syncDeputados,
  syncSenadores: PoliticiansService.syncSenadores,
  syncAllPoliticians: PoliticiansService.syncAllPoliticians,
  getDeputadoDetails: PoliticiansService.getDeputadoDetails,
  getSenadorDetails: PoliticiansService.getSenadorDetails,
  updatePoliticianFromAPI: PoliticiansService.updatePoliticianFromAPI
};

export default PoliticiansService;