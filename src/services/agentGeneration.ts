import { apiClient } from '../lib/api';
import { supabase } from '../lib/supabase';

export interface Politician {
  id: string | number;
  name: string;
  position: string;
  party: string;
  state?: string;
  city?: string;
}

export interface AgentCreationResult {
  success: boolean;
  politicianId: number;
  politicianName: string;
  error?: string;
}

export interface BulkAgentCreationResult {
  total: number;
  success: number;
  errors: number;
  results: AgentCreationResult[];
}

/**
 * Serviço para geração automática de agentes de IA para políticos
 */
export class AgentGenerationService {
  /**
   * Cria um prompt padrão para um político
   */
  static generateDefaultPrompt(politician: Politician): string {
    const location = politician.city 
      ? `de ${politician.city}/${politician.state}`
      : politician.state 
      ? `do estado de ${politician.state}`
      : '';

    return `Você é ${politician.name}, ${politician.position} pelo partido ${politician.party}${location ? ` ${location}` : ''}. ` +
      `Responda como se fosse este político, baseando-se em suas propostas e posicionamentos políticos. ` +
      `Seja educado, informativo e mantenha-se no personagem. Fale sobre suas propostas, experiência e ` +
      `visão política de forma clara e acessível. Sempre mantenha um tom respeitoso e democrático, ` +
      `focando em soluções para os problemas da população.`;
  }

  /**
   * Configuração de personalidade padrão
   */
  static generateDefaultPersonalityConfig(): any {
    return {
      tone: 'respectful',
      style: 'informative',
      focus: ['propostas', 'experiência', 'soluções'],
      constraints: ['democrático', 'educado']
    };
  }

  // Compat: tenta criar em /agents e, se falhar (500/404), usa /politician_agents
  static async postAgentCompat(agentData: any): Promise<any> {
    try {
      const resp1 = await apiClient.post('/agents', agentData);
      // Se a resposta não for sucesso (ex.: 4xx com validateStatus), tentar rota alternativa
      if (resp1?.success && (resp1.status as number) < 400) {
        return resp1;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      // 500/404: rota principal indisponível
      if (status !== 500 && status !== 404) {
        // Se for outro erro, propagar
        throw err;
      }
    }
    // Tentar rota alternativa
    try {
      const resp2 = await apiClient.post('/politician_agents', agentData);
      if (resp2?.success && (resp2.status as number) < 400) {
        return resp2;
      }
    } catch (err2: any) {
      const status2 = err2?.response?.status;
      if (status2 !== 500 && status2 !== 404) {
        // Erro diferente: propagar
        throw err2;
      }
    }
    // Fallback final: inserir diretamente via Supabase
    try {
      const { data: inserted, error } = await supabase
        .from('politician_agents')
        .insert([agentData])
        .select('*')
        .single();
      if (error) {
        console.error('[Supabase fallback] Falha ao inserir politician_agents:', error);
        throw error;
      }
      return { data: { success: true, data: inserted }, success: true, status: 200 };
    } catch (e: any) {
      console.error('[Supabase fallback] Exceção ao inserir politician_agents:', e);
      throw e;
    }
  }

  /**
   * Cria um agente para um político específico
   */
  static async createAgentForPolitician(politician: Politician): Promise<AgentCreationResult> {
    try {
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch {}

      const agentData: any = {
        politician_id: String(politician.id),
        trained_prompt: AgentGenerationService.generateDefaultPrompt(politician),
        personality_config: AgentGenerationService.generateDefaultPersonalityConfig(),
        is_active: true,
        voice_id: null,
        ...(userId ? { created_by: userId } : {})
      };

      // Incluir voice_id apenas se existir um valor válido
      // Evita enviar string vazia que pode causar validação 500 no backend
      // agentData.voice_id permanece null por padrão, a não ser que seja definido

      await AgentGenerationService.postAgentCompat(agentData);

      return {
        success: true,
        politicianId: politician.id as number,
        politicianName: politician.name
      };
    } catch (error: any) {
      console.error(`Erro ao criar agente para ${politician.name}:`, error?.response?.data || error);
      return {
        success: false,
        politicianId: politician.id as number,
        politicianName: politician.name,
        error: error?.response?.data?.message || error?.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica se um político já possui agente
   */
  static async politicianHasAgent(politicianId: string | number): Promise<boolean> {
    try {
      const response = await apiClient.get(`/agents?politician_id=${politicianId}`);
      let agents = response.data?.data || response.data || [];
      if (!Array.isArray(agents) || agents.length === 0) {
        try {
          const resp2 = await apiClient.get(`/politician_agents?politician_id=${politicianId}`);
          agents = resp2.data?.data || resp2.data || [];
        } catch {}
      }
      if (Array.isArray(agents) && agents.length > 0) return true;
      // Fallback final: consultar diretamente via Supabase
      try {
        const { data, error } = await supabase
          .from('politician_agents')
          .select('*')
          .eq('politician_id', String(politicianId))
          .limit(1);
        if (error) {
          console.warn('[Supabase fallback] Falha ao consultar politician_agents:', error);
          return false;
        }
        return Array.isArray(data) && data.length > 0;
      } catch (e) {
        console.warn('[Supabase fallback] Exceção ao consultar politician_agents:', e);
        return false;
      }
    } catch (error) {
      try {
        const resp2 = await apiClient.get(`/politician_agents?politician_id=${politicianId}`);
        const agents = resp2.data?.data || resp2.data || [];
        if (Array.isArray(agents) && agents.length > 0) return true;
        // Fallback final: consulta via Supabase
        const { data, error: sbError } = await supabase
          .from('politician_agents')
          .select('*')
          .eq('politician_id', String(politicianId))
          .limit(1);
        if (sbError) {
          console.warn('[Supabase fallback] Falha ao consultar politician_agents:', sbError);
          return false;
        }
        return Array.isArray(data) && data.length > 0;
      } catch (error2) {
        console.error('Erro ao verificar se político tem agente:', error2 || error);
        return false;
      }
    }
  }

  /**
   * Busca políticos aprovados que não possuem agentes
   */
  static async getPoliticiansWithoutAgents(): Promise<Politician[]> {
    try {
      // Buscar todos os políticos aprovados
      const politiciansResponse = await apiClient.get('/politicians?status=approved');
      const allPoliticians = politiciansResponse.data?.data || politiciansResponse.data || [];

      // Buscar todos os agentes existentes
      const agentsResponse = await apiClient.get('/agents');
      let existingAgents = agentsResponse.data?.data || agentsResponse.data || [];
      if (!Array.isArray(existingAgents) || existingAgents.length === 0) {
        try {
          const resp2 = await apiClient.get('/politician_agents');
          existingAgents = resp2.data?.data || resp2.data || [];
        } catch {}
      }
      const existingAgentPoliticianIds = (Array.isArray(existingAgents) ? existingAgents : []).map((agent: any) => String(agent.politician_id));

      // Filtrar políticos sem agentes
      return (Array.isArray(allPoliticians) ? allPoliticians : []).filter(
        (politician: Politician) => !existingAgentPoliticianIds.includes(String(politician.id))
      );
    } catch (error) {
      console.error('Erro ao buscar políticos sem agentes:', error);
      return [];
    }
  }

  /**
   * Cria agentes em lote para políticos sem agentes
   */
  static async createBulkAgents(
    politicians?: Politician[],
    onProgress?: (current: number, total: number, currentPolitician: string) => void
  ): Promise<BulkAgentCreationResult> {
    try {
      // Se não foram fornecidos políticos, buscar automaticamente
      const targetPoliticians = politicians || await AgentGenerationService.getPoliticiansWithoutAgents();
      
      if (targetPoliticians.length === 0) {
        return {
          total: 0,
          success: 0,
          errors: 0,
          results: []
        };
      }

      const results: AgentCreationResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Processar cada político
      for (let i = 0; i < targetPoliticians.length; i++) {
        const politician = targetPoliticians[i];
        
        // Callback de progresso
        if (onProgress) {
          onProgress(i + 1, targetPoliticians.length, politician.name);
        }

        const result = await AgentGenerationService.createAgentForPolitician(politician);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Pequena pausa para evitar sobrecarga da API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        total: targetPoliticians.length,
        success: successCount,
        errors: errorCount,
        results
      };
    } catch (error) {
      console.error('Erro na criação em lote de agentes:', error);
      throw error;
    }
  }

  /**
   * Atualiza o prompt de um agente existente
   */
  static async updateAgentPrompt(agentId: number, politician: Politician): Promise<boolean> {
    try {
      const updatedPrompt = AgentGenerationService.generateDefaultPrompt(politician);
      await apiClient.put(`/agents/${agentId}`, {
        trained_prompt: updatedPrompt
      });
      return true;
    } catch (error: any) {
      const status = error?.response?.status;
      console.warn('Falha ao atualizar via backend, status:', status, '— tentando fallback Supabase');
      try {
        const { error: sbError } = await supabase
          .from('politician_agents')
          .update({ trained_prompt: AgentGenerationService.generateDefaultPrompt(politician) })
          .eq('politician_id', String(politician.id));
        if (sbError) {
          console.error('Erro no fallback Supabase para atualizar prompt:', sbError);
          return false;
        }
        return true;
      } catch (e) {
        console.error('Exceção no fallback Supabase ao atualizar prompt:', e);
        return false;
      }
    }
  }
}

// Instância singleton para uso direto
export const agentGenerationService = {
  generateDefaultPrompt: (p: Politician) => AgentGenerationService.generateDefaultPrompt(p),
  generateDefaultPersonalityConfig: () => AgentGenerationService.generateDefaultPersonalityConfig(),
  createAgentForPolitician: (p: Politician) => AgentGenerationService.createAgentForPolitician(p),
  politicianHasAgent: (id: string | number) => AgentGenerationService.politicianHasAgent(id),
  getPoliticiansWithoutAgents: () => AgentGenerationService.getPoliticiansWithoutAgents(),
  createBulkAgents: (list?: Politician[], onProgress?: (current: number, total: number, currentPolitician: string) => void) => AgentGenerationService.createBulkAgents(list, onProgress),
  updateAgentPrompt: (agentId: number, p: Politician) => AgentGenerationService.updateAgentPrompt(agentId, p)
};

export default AgentGenerationService;