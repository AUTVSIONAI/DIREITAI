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
  IdentificacaoParlamentar: {
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
  };
  Mandato: {
    UfParlamentar: string;
  };
}

// Interfaces para dados de gastos
interface DeputadoExpense {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  codTipoDocumento: number;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
  codLote: number;
  parcela: number;
}

interface SenadorExpense {
  ano: string;
  mes: string;
  senador: string;
  tipo_despesa: string;
  cnpj_cpf: string;
  fornecedor: string;
  documento: string;
  data: string;
  detalhamento: string;
  valor_reembolsado: number;
}

// Interfaces para dados de servidores
interface DeputadoStaff {
  nome: string;
  cargo: string;
  situacao: string;
  remuneracao: number;
  tipo_folha: string;
}

interface SenadorStaff {
  nome: string;
  cargo: string;
  lotacao: string;
  remuneracao_bruta: number;
  situacao: string;
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
  expenses?: {
    monthly_total?: number;
    yearly_total?: number;
    last_updated?: string;
  };
  staff?: {
    total_count?: number;
    parliamentary_secretaries?: number;
    last_updated?: string;
  };
  // Novos campos para políticos locais
  level?: 'federal' | 'estadual' | 'municipal';
  municipality?: string;
  municipality_code?: string;
  electoral_zone?: string;
  mandate_start_date?: string;
  mandate_end_date?: string;
  current_mandate?: boolean;
  state_assembly_id?: string;
  district_number?: number;
  municipal_chamber_id?: string;
  council_seat_number?: number;
  full_name?: string;
  email?: string;
  external_id?: string;
  source?: 'manual' | 'camara' | 'senado' | 'alesp' | 'alerj' | 'almg' | 'assembleia_estadual' | 'tse' | 'camara_municipal' | 'prefeitura';
  legislature_id?: number;
  status?: 'pending' | 'approved' | 'rejected';
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
  // Novos campos para políticos locais
  level?: 'federal' | 'estadual' | 'municipal';
  municipality?: string;
  municipality_code?: string;
  electoral_zone?: string;
  mandate_start_date?: string;
  mandate_end_date?: string;
  current_mandate?: boolean;
  state_assembly_id?: string;
  district_number?: number;
  municipal_chamber_id?: string;
  council_seat_number?: number;
  full_name?: string;
  email?: string;
  external_id?: string;
  source?: 'manual' | 'camara' | 'senado' | 'alesp' | 'alerj' | 'almg' | 'assembleia_estadual' | 'tse' | 'camara_municipal' | 'prefeitura';
  legislature_id?: number;
  status?: 'pending' | 'approved' | 'rejected';
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
    level?: 'federal' | 'estadual' | 'municipal';
    municipality?: string;
    current_mandate?: boolean;
    page?: number;
    limit?: number;
    use_real_data?: boolean;
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
  static async getPolitician(id: number, useRealData?: boolean): Promise<Politician> {
    const params = useRealData ? '?use_real_data=true' : '';
    const response = await apiClient.get(`/politicians/${id}${params}`);
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
    const identificacao = senador.IdentificacaoParlamentar;
    return {
      name: identificacao.NomeParlamentar,
      full_name: identificacao.NomeCompletoParlamentar,
      party: identificacao.SiglaPartidoParlamentar,
      state: identificacao.UfParlamentar,
      position: 'senador',
      photo_url: identificacao.UrlFotoParlamentar,
      email: identificacao.EmailParlamentar,
      external_id: identificacao.CodigoParlamentar,
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

  // ===== MÉTODOS PARA POLÍTICOS LOCAIS =====

  /**
   * Busca deputados estaduais de um estado específico
   */
  static async fetchDeputadosEstaduais(state: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/admin/politicians/fetch/deputados-estaduais/${state}`);
      return response.data.deputados_estaduais || [];
    } catch (error) {
      console.error('Erro ao buscar deputados estaduais:', error);
      throw error;
    }
  }

  /**
   * Busca prefeitos de um estado específico
   */
  static async fetchPrefeitos(state: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/admin/politicians/fetch/prefeitos/${state}`);
      return response.data.prefeitos || [];
    } catch (error) {
      console.error('Erro ao buscar prefeitos:', error);
      throw error;
    }
  }

  /**
   * Busca vereadores de um município específico
   */
  static async fetchVereadores(state: string, municipality: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/admin/politicians/fetch/vereadores/${state}/${municipality}`);
      return response.data.vereadores || [];
    } catch (error) {
      console.error('Erro ao buscar vereadores:', error);
      throw error;
    }
  }

  /**
   * Sincroniza deputados estaduais com o banco de dados
   */
  static async syncDeputadosEstaduais(state: string): Promise<{ success: number; errors: number; total: number }> {
    try {
      const deputadosEstaduais = await this.fetchDeputadosEstaduais(state);
      
      const response = await apiClient.post('/admin/politicians/sync/deputados-estaduais', {
        state: state,
        politicians: deputadosEstaduais
      });
      
      return {
        success: response.data.created || 0,
        errors: response.data.errors || 0,
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Erro na sincronização de deputados estaduais:', error);
      throw error;
    }
  }

  /**
   * Sincroniza prefeitos com o banco de dados
   */
  static async syncPrefeitos(state: string): Promise<{ success: number; errors: number; total: number }> {
    try {
      const prefeitos = await this.fetchPrefeitos(state);
      
      const response = await apiClient.post('/admin/politicians/sync/prefeitos', {
        state: state,
        politicians: prefeitos
      });
      
      return {
        success: response.data.created || 0,
        errors: response.data.errors || 0,
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Erro na sincronização de prefeitos:', error);
      throw error;
    }
  }

  /**
   * Sincroniza vereadores com o banco de dados
   */
  static async syncVereadores(state: string, municipality: string): Promise<{ success: number; errors: number; total: number }> {
    try {
      const vereadores = await this.fetchVereadores(state, municipality);
      
      const response = await apiClient.post('/admin/politicians/sync/vereadores', {
        state: state,
        municipality: municipality,
        politicians: vereadores
      });
      
      return {
        success: response.data.created || 0,
        errors: response.data.errors || 0,
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Erro na sincronização de vereadores:', error);
      throw error;
    }
  }

  /**
   * Sincroniza todos os políticos locais de um estado
   */
  static async syncAllLocalPoliticians(state: string, municipality?: string): Promise<{
    deputados_estaduais: { success: number; errors: number; total: number };
    prefeitos: { success: number; errors: number; total: number };
    vereadores?: { success: number; errors: number; total: number };
  }> {
    try {
      console.log(`Iniciando sincronização de políticos locais para ${state}...`);
      
      const promises = [
        this.syncDeputadosEstaduais(state),
        this.syncPrefeitos(state)
      ];
      
      if (municipality) {
        promises.push(this.syncVereadores(state, municipality));
      }
      
      const results = await Promise.all(promises);
      
      const response: any = {
        deputados_estaduais: results[0],
        prefeitos: results[1]
      };
      
      if (municipality && results[2]) {
        response.vereadores = results[2];
      }
      
      console.log('Sincronização de políticos locais concluída:', response);
      
      return response;
    } catch (error) {
      console.error('Erro na sincronização de políticos locais:', error);
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

  // ===== MÉTODOS PARA DADOS DE GASTOS E SERVIDORES =====

  /**
   * Busca gastos de um deputado específico
   */
  static async getDeputadoExpenses(deputadoId: string, ano?: number, mes?: number): Promise<DeputadoExpense[]> {
    try {
      const response = await apiClient.get(`/admin/politicians/expenses/${deputadoId}`, {
        params: { ano, mes }
      });
      return response.data.expenses;
    } catch (error) {
      console.error(`Erro ao buscar gastos do deputado ${deputadoId}:`, error);
      throw error;
    }
  }

  /**
   * Busca gastos de um senador específico
   */
  static async getSenadorExpenses(senadorId: string, ano?: number, mes?: number): Promise<SenadorExpense[]> {
    try {
      const response = await apiClient.get(`/admin/politicians/expenses/${senadorId}`, {
        params: { ano, mes }
      });
      return response.data.expenses;
    } catch (error) {
      console.error(`Erro ao buscar gastos do senador ${senadorId}:`, error);
      throw error;
    }
  }

  /**
   * Busca servidores de um político (unificado para todos os tipos)
   */
  static async getPoliticianStaff(politicianId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/admin/politicians/staff/${politicianId}`);
      return response.data.data.staff;
    } catch (error) {
      console.error(`Erro ao buscar servidores do político ${politicianId}:`, error);
      throw error;
    }
  }

  /**
   * Busca servidores de um deputado específico (mantido para compatibilidade)
   */
  static async getDeputadoStaff(deputadoId: string): Promise<DeputadoStaff[]> {
    return this.getPoliticianStaff(deputadoId);
  }

  /**
   * Busca servidores de um senador específico (mantido para compatibilidade)
   */
  static async getSenadorStaff(senadorId: string): Promise<SenadorStaff[]> {
    return this.getPoliticianStaff(senadorId);
  }

  /**
   * Busca dados completos de transparência de um político
   */
  static async getTransparencyData(politicianId: string, year?: number, useRealData?: boolean): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (year) params.append('ano', year.toString());
      if (useRealData || (!isNaN(Number(politicianId)) && politicianId.length >= 5)) {
        params.append('use_real_data', 'true');
      }
      
      const url = `/admin/politicians/transparency/${politicianId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar dados de transparência do político ${politicianId}:`, error);
      throw error;
    }
  }

  /**
   * Busca dados de transparência para deputado estadual
   */
  static async getStateDeputyTransparencyData(politicianId: string, year?: number): Promise<any> {
    try {
      const url = year 
        ? `/admin/politicians/transparency/deputado-estadual/${politicianId}?ano=${year}`
        : `/admin/politicians/transparency/deputado-estadual/${politicianId}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar dados de transparência do deputado estadual ${politicianId}:`, error);
      throw error;
    }
  }

  /**
   * Busca dados de transparência para prefeito
   */
  static async getMayorTransparencyData(politicianId: string, year?: number): Promise<any> {
    try {
      const url = year 
        ? `/admin/politicians/transparency/prefeito/${politicianId}?ano=${year}`
        : `/admin/politicians/transparency/prefeito/${politicianId}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar dados de transparência do prefeito ${politicianId}:`, error);
      throw error;
    }
  }

  /**
   * Busca dados de transparência para vereador
   */
  static async getCouncilorTransparencyData(politicianId: string, year?: number): Promise<any> {
    try {
      const url = year 
        ? `/admin/politicians/transparency/vereador/${politicianId}?ano=${year}`
        : `/admin/politicians/transparency/vereador/${politicianId}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar dados de transparência do vereador ${politicianId}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza dados de gastos e servidores de um político
   */
  static async updatePoliticianExpensesAndStaff(politicianId: number, source: 'camara' | 'senado', externalId: string): Promise<any> {
    try {
      const response = await apiClient.post(`/admin/politicians/${politicianId}/update-expenses-staff`, {
        source,
        externalId
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar gastos e servidores do político ${politicianId}:`, error);
      throw error;
    }
  }



  /**
   * Busca resumo de servidores de um político
   */
  static async getPoliticianStaffSummary(politicianId: number): Promise<{
    total_count: number;
    parliamentary_secretaries: number;
    last_updated: string;
  }> {
    try {
      const response = await apiClient.get(`/politicians/${politicianId}/staff/summary`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar resumo de servidores do político ${politicianId}:`, error);
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
  updatePoliticianFromAPI: PoliticiansService.updatePoliticianFromAPI,
  // Métodos para políticos locais
  fetchDeputadosEstaduais: PoliticiansService.fetchDeputadosEstaduais,
  fetchPrefeitos: PoliticiansService.fetchPrefeitos,
  fetchVereadores: PoliticiansService.fetchVereadores,
  syncDeputadosEstaduais: PoliticiansService.syncDeputadosEstaduais,
  syncPrefeitos: PoliticiansService.syncPrefeitos,
  syncVereadores: PoliticiansService.syncVereadores,
  syncAllLocalPoliticians: PoliticiansService.syncAllLocalPoliticians,
  // Métodos para gastos e servidores
  getDeputadoExpenses: PoliticiansService.getDeputadoExpenses,
  getSenadorExpenses: PoliticiansService.getSenadorExpenses,
  getPoliticianStaff: PoliticiansService.getPoliticianStaff,
  getDeputadoStaff: PoliticiansService.getDeputadoStaff,
  getSenadorStaff: PoliticiansService.getSenadorStaff,
  updatePoliticianExpensesAndStaff: PoliticiansService.updatePoliticianExpensesAndStaff,

  getPoliticianStaffSummary: PoliticiansService.getPoliticianStaffSummary
};

export default PoliticiansService;