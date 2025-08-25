import { apiClient } from '../lib/api';
import type { Politician, CreatePoliticianData } from './politicians';

// Interfaces para APIs de assembleias estaduais
interface ALESPDeputado {
  id: string;
  nome: string;
  partido: string;
  situacao: string;
  email?: string;
  telefone?: string;
  gabinete?: string;
  foto?: string;
}

interface ALERJDeputado {
  id: string;
  nome: string;
  partido: string;
  situacao: string;
  mandato: string;
}

interface ALMGDeputado {
  id: string;
  nome: string;
  partido: string;
  situacao: string;
  distrito: number;
  email?: string;
}

// Interfaces para dados do TSE (prefeitos e vereadores)
interface TSECandidate {
  ano_eleicao: string;
  turno: string;
  tipo_eleicao: string;
  sigla_uf: string;
  codigo_municipio: string;
  nome_municipio: string;
  numero_candidato: string;
  nome_candidato: string;
  nome_urna_candidato: string;
  cpf_candidato: string;
  sigla_partido: string;
  cargo: string;
  situacao_candidatura: string;
  situacao_turno: string;
}

// Interface para câmaras municipais
interface MunicipalCouncilor {
  id: string;
  nome: string;
  partido: string;
  situacao: string;
  mandato_inicio: string;
  mandato_fim: string;
  email?: string;
  telefone?: string;
}

export class LocalPoliticiansService {
  private static readonly ALESP_BASE_URL = 'https://www.al.sp.gov.br/repositorio/dadosAbertos';
  private static readonly TSE_BASE_URL = 'https://dadosabertos.tse.jus.br/dataset';
  
  /**
   * Buscar deputados estaduais da ALESP
   */
  static async fetchALESPDeputados(): Promise<ALESPDeputado[]> {
    try {
      // Simulação - a ALESP tem API mas precisa de configuração específica
      const response = await fetch(`${this.ALESP_BASE_URL}/deputados.json`);
      if (!response.ok) {
        throw new Error('Erro ao buscar deputados da ALESP');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar deputados da ALESP:', error);
      return [];
    }
  }

  /**
   * Buscar deputados estaduais de outras assembleias
   */
  static async fetchStateDeputies(state: string): Promise<any[]> {
    try {
      // Implementação genérica para outras assembleias estaduais
      const response = await apiClient.get(`/local-politicians/state-deputies/${state}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar deputados estaduais de ${state}:`, error);
      return [];
    }
  }

  /**
   * Buscar prefeitos e vereadores do TSE
   */
  static async fetchTSECandidates(year: string, state: string, municipality?: string): Promise<TSECandidate[]> {
    try {
      const params = new URLSearchParams({
        ano: year,
        uf: state,
        ...(municipality && { municipio: municipality })
      });
      
      const response = await apiClient.get(`/local-politicians/tse-candidates?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar candidatos do TSE:', error);
      return [];
    }
  }

  /**
   * Buscar vereadores de câmaras municipais
   */
  static async fetchMunicipalCouncilors(municipalityCode: string): Promise<MunicipalCouncilor[]> {
    try {
      const response = await apiClient.get(`/local-politicians/municipal-councilors/${municipalityCode}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar vereadores:', error);
      return [];
    }
  }

  /**
   * Sincronizar deputados estaduais
   */
  static async syncStateDeputies(state: string): Promise<{
    success: number;
    errors: number;
    results: any[];
  }> {
    try {
      const response = await apiClient.post(`/admin/politicians/sync/state-deputies`, { state });
      return response.data;
    } catch (error) {
      console.error('Erro na sincronização de deputados estaduais:', error);
      throw error;
    }
  }

  /**
   * Sincronizar prefeitos
   */
  static async syncMayors(state: string, year: string = '2020'): Promise<{
    success: number;
    errors: number;
    results: any[];
  }> {
    try {
      const response = await apiClient.post(`/admin/politicians/sync/mayors`, { state, year });
      return response.data;
    } catch (error) {
      console.error('Erro na sincronização de prefeitos:', error);
      throw error;
    }
  }

  /**
   * Sincronizar vereadores
   */
  static async syncCouncilors(municipalityCode: string, year: string = '2020'): Promise<{
    success: number;
    errors: number;
    results: any[];
  }> {
    try {
      const response = await apiClient.post(`/admin/politicians/sync/councilors`, { 
        municipalityCode, 
        year 
      });
      return response.data;
    } catch (error) {
      console.error('Erro na sincronização de vereadores:', error);
      throw error;
    }
  }

  /**
   * Obter políticos por nível (federal, estadual, municipal)
   */
  static async getPoliticiansByLevel(level: 'federal' | 'estadual' | 'municipal', filters?: {
    state?: string;
    municipality?: string;
    party?: string;
    current_mandate?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    politicians: Politician[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const params = new URLSearchParams({ level });
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/politicians/by-level?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar políticos por nível:', error);
      throw error;
    }
  }

  /**
   * Obter políticos por município
   */
  static async getPoliticiansByMunicipality(municipalityCode: string, filters?: {
    position?: string;
    party?: string;
    current_mandate?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    politicians: Politician[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const params = new URLSearchParams({ municipality_code: municipalityCode });
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/politicians/by-municipality?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar políticos por município:', error);
      throw error;
    }
  }

  /**
   * Obter lista de municípios por estado
   */
  static async getMunicipalities(state: string): Promise<{
    code: string;
    name: string;
    population?: number;
  }[]> {
    try {
      const response = await apiClient.get(`/local-politicians/municipalities/${state}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      return [];
    }
  }

  /**
   * Obter assembleias estaduais disponíveis
   */
  static async getStateAssemblies(): Promise<{
    state: string;
    name: string;
    acronym: string;
    has_open_data: boolean;
    total_seats: number;
  }[]> {
    try {
      const response = await apiClient.get('/local-politicians/state-assemblies');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar assembleias estaduais:', error);
      return [];
    }
  }

  /**
   * Obter câmaras municipais disponíveis
   */
  static async getMunicipalChambers(state?: string): Promise<{
    municipality_code: string;
    municipality_name: string;
    state: string;
    name: string;
    has_open_data: boolean;
    total_seats: number;
  }[]> {
    try {
      const params = state ? `?state=${state}` : '';
      const response = await apiClient.get(`/local-politicians/municipal-chambers${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar câmaras municipais:', error);
      return [];
    }
  }

  /**
   * Converter dados da ALESP para formato padrão
   */
  private static convertALESPData(deputado: ALESPDeputado): CreatePoliticianData {
    return {
      name: deputado.nome,
      full_name: deputado.nome,
      party: deputado.partido,
      state: 'SP',
      position: 'Deputado Estadual',
      level: 'estadual',
      photo_url: deputado.foto,
      email: deputado.email,
      external_id: deputado.id,
      source: 'alesp',
      status: 'pending',
      current_mandate: deputado.situacao === 'Ativo'
    };
  }

  /**
   * Converter dados do TSE para formato padrão
   */
  private static convertTSEData(candidate: TSECandidate): CreatePoliticianData {
    return {
      name: candidate.nome_urna_candidato,
      full_name: candidate.nome_candidato,
      party: candidate.sigla_partido,
      state: candidate.sigla_uf,
      municipality: candidate.nome_municipio,
      municipality_code: candidate.codigo_municipio,
      position: candidate.cargo === 'PREFEITO' ? 'Prefeito' : 'Vereador',
      level: 'municipal',
      external_id: candidate.numero_candidato,
      source: 'tse',
      status: 'pending',
      current_mandate: candidate.situacao_turno === 'ELEITO'
    };
  }
}

// Exportar instância para uso direto
export const localPoliticiansService = {
  fetchALESPDeputados: LocalPoliticiansService.fetchALESPDeputados,
  fetchStateDeputies: LocalPoliticiansService.fetchStateDeputies,
  fetchTSECandidates: LocalPoliticiansService.fetchTSECandidates,
  fetchMunicipalCouncilors: LocalPoliticiansService.fetchMunicipalCouncilors,
  syncStateDeputies: LocalPoliticiansService.syncStateDeputies,
  syncMayors: LocalPoliticiansService.syncMayors,
  syncCouncilors: LocalPoliticiansService.syncCouncilors,
  getPoliticiansByLevel: LocalPoliticiansService.getPoliticiansByLevel,
  getPoliticiansByMunicipality: LocalPoliticiansService.getPoliticiansByMunicipality,
  getMunicipalities: LocalPoliticiansService.getMunicipalities,
  getStateAssemblies: LocalPoliticiansService.getStateAssemblies,
  getMunicipalChambers: LocalPoliticiansService.getMunicipalChambers
};

export default LocalPoliticiansService;