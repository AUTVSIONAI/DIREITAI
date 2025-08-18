import { apiClient } from '../lib/api';

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  auto_generated: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalRequest {
  goal_type?: string;
  target_value: number;
  period_start?: string;
  period_end?: string;
}

export interface UpdateGoalRequest {
  current_value?: number;
  status?: 'active' | 'completed' | 'failed' | 'paused';
}

export class GoalsService {
  /**
   * Buscar metas do usuário
   */
  static async getUserGoals(
    userId: string,
    type: string = 'monthly_points',
    period: 'current' | 'all' = 'current'
  ): Promise<UserGoal[]> {
    try {
      const params = new URLSearchParams({
        type,
        ...(period === 'current' && { period: 'current' })
      });
      
      const url = `/gamification/users/${userId}/goals?${params}`;
      console.log('🎯 GoalsService - Fazendo requisição para:', url);
      console.log('🎯 GoalsService - userId:', userId);
      console.log('🎯 GoalsService - type:', type);
      console.log('🎯 GoalsService - period:', period);
      
      const response = await apiClient.get(url);
      console.log('🎯 GoalsService - Resposta recebida:', response);
      console.log('🎯 GoalsService - response.data:', response.data);
      
      return response.data || [];
    } catch (error) {
      console.error('❌ GoalsService - Erro ao buscar metas do usuário:', error);
      throw error;
    }
  }

  /**
   * Criar nova meta
   */
  static async createGoal(userId: string, goalData: CreateGoalRequest): Promise<UserGoal> {
    try {
      const response = await apiClient.post(`/gamification/users/${userId}/goals`, goalData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }
  }

  /**
   * Atualizar meta existente
   */
  static async updateGoal(
    userId: string,
    goalId: string,
    updateData: UpdateGoalRequest
  ): Promise<UserGoal> {
    try {
      const response = await apiClient.put(`/gamification/users/${userId}/goals/${goalId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  }

  /**
   * Criar meta mensal automaticamente
   */
  static async createMonthlyGoal(userId: string, userLevel: number = 1): Promise<UserGoal> {
    try {
      const response = await apiClient.post(`/gamification/users/${userId}/goals/auto-create`, {
        user_level: userLevel
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar meta mensal automática:', error);
      throw error;
    }
  }

  /**
   * Buscar meta mensal atual
   */
  static async getCurrentMonthlyGoal(userId: string): Promise<UserGoal | null> {
    try {
      const goals = await this.getUserGoals(userId, 'monthly_points', 'current');
      return goals.length > 0 ? goals[0] : null;
    } catch (error) {
      console.error('Erro ao buscar meta mensal atual:', error);
      return null;
    }
  }

  /**
   * Atualizar progresso da meta mensal com base nos pontos atuais
   */
  static async updateMonthlyProgress(userId: string, currentPoints: number): Promise<UserGoal | null> {
    try {
      const currentGoal = await this.getCurrentMonthlyGoal(userId);
      
      if (!currentGoal) {
        console.log('Nenhuma meta mensal encontrada para atualizar');
        return null;
      }

      // Só atualizar se o valor mudou
      if (currentGoal.current_value !== currentPoints) {
        const updatedGoal = await this.updateGoal(userId, currentGoal.id, {
          current_value: currentPoints
        });
        return updatedGoal;
      }

      return currentGoal;
    } catch (error) {
      console.error('Erro ao atualizar progresso mensal:', error);
      return null;
    }
  }

  /**
   * Calcular porcentagem de progresso
   */
  static calculateProgress(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  /**
   * Verificar se meta foi completada
   */
  static isGoalCompleted(goal: UserGoal): boolean {
    return goal.status === 'completed' || goal.current_value >= goal.target_value;
  }

  /**
   * Obter status da meta com base no progresso
   */
  static getGoalStatus(goal: UserGoal): {
    status: string;
    color: string;
    message: string;
  } {
    const progress = this.calculateProgress(goal.current_value, goal.target_value);
    
    if (goal.status === 'completed' || progress >= 100) {
      return {
        status: 'completed',
        color: 'text-green-600',
        message: 'Meta concluída! 🎉'
      };
    }
    
    if (progress >= 80) {
      return {
        status: 'near_completion',
        color: 'text-blue-600',
        message: 'Quase lá! Continue assim! 💪'
      };
    }
    
    if (progress >= 50) {
      return {
        status: 'on_track',
        color: 'text-yellow-600',
        message: 'No caminho certo! 📈'
      };
    }
    
    return {
      status: 'needs_attention',
      color: 'text-red-600',
      message: 'Precisa de mais atenção 🎯'
    };
  }
}

export default GoalsService;