import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api';
import type {
  UserProfile,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  AuthResponse,
  PasswordResetData,
  PasswordUpdateData,
  UserStats,
  UserPreferences
} from '../types';

/**
 * Serviço de autenticação usando Supabase
 */
export class AuthService {
  /**
   * Fazer login com email e senha
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        user: data.user,
        session: data.session,
        success: true
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Registrar novo usuário
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Tentar registro via Backend API para garantir auto-aprovação e login imediato
      try {
        const response = await apiClient.post<any>('/auth/register', {
            email: userData.email,
            password: userData.password,
            username: userData.username,
            fullName: userData.full_name
        });

        if (response.success && response.data) {
             const { session, auth_user, user } = response.data;
             const targetUser = auth_user || user;

             if (targetUser && session) {
                 // Definir sessão localmente
                 const { error: sessionError } = await supabase.auth.setSession(session);
                 if (sessionError) console.warn('Erro ao definir sessão:', sessionError);

                 // O perfil já foi criado pelo backend na tabela 'users', não precisamos criar novamente.
                 // Vamos apenas retornar os dados corretos.

                 return {
                    user: targetUser,
                    session: session,
                    success: true
                 };
             }
        }
      } catch (backendError) {
          console.warn('Registro via backend falhou, tentando método local:', backendError);
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Criar perfil do usuário se o cadastro local funcionar (fallback)
      if (data.user) {
        const now = new Date().toISOString();
        // Mapear para a estrutura da tabela 'users'
        const profileData = {
          auth_id: data.user.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name || userData.username,
          plan: 'gratuito', // Backend usa 'gratuito'
          points: 0,
          created_at: now
        };
        
        // Inserir na tabela 'users'
        const { error: profileError } = await supabase
          .from('users')
          .insert([profileData]);
          
        if (profileError) {
             console.error('Erro ao criar perfil localmente:', profileError);
             // Não lançar erro aqui para não impedir o login, mas logar
        }
      }

      return {
        user: data.user,
        session: data.session,
        success: true
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Fazer logout
   */
  static async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obter usuário atual
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw new Error(error.message);
      }

      return user;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  /**
   * Obter sessão atual
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(error.message);
      }

      return session;
    } catch (error) {
      console.error('Erro ao obter sessão atual:', error);
      return null;
    }
  }

  /**
   * Solicitar redefinição de senha
   */
  static async requestPasswordReset(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    try {
      const siteUrl = (import.meta as any)?.env?.VITE_SITE_URL || window.location.origin;
      const base = typeof siteUrl === 'string' ? siteUrl.replace(/\/$/, '') : window.location.origin;
      const redirectTo = `${base}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim(), {
        redirectTo
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Atualizar senha
   */
  static async updatePassword(data: PasswordUpdateData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verificar email
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Reenviar email de verificação
   */
  static async resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Criar perfil do usuário
   */
  static async createUserProfile(profile: UserProfile): Promise<UserProfile> {
    // Mapear para users
    const userData = {
       auth_id: profile.id,
       email: profile.email,
       username: profile.username,
       full_name: profile.full_name,
       plan: profile.plan === 'free' ? 'gratuito' : profile.plan,
       points: profile.points || 0,
       created_at: profile.created_at
    };

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { ...profile, ...data, id: data.auth_id };
  }

  /**
   * Obter perfil do usuário
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Usuário não encontrado
        }
        throw new Error(error.message);
      }

      // Mapear de users para UserProfile
      return {
         id: data.auth_id,
         email: data.email,
         username: data.username,
         full_name: data.full_name,
         plan: data.plan === 'gratuito' ? 'free' : data.plan,
         role: 'user',
         points: data.points,
         level: 1,
         total_checkins: 0,
         total_ai_conversations: 0,
         total_achievements: 0,
         is_active: true,
         is_verified: false,
         created_at: data.created_at,
         updated_at: data.created_at,
         // Manter compatibilidade com campos extras se existirem no retorno
         ...data
      };
    } catch (error) {
      console.error('Erro ao obter perfil do usuário:', error);
      return null;
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  static async updateUserProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile> {
    // Filtrar campos que existem em users
    const validUpdates: any = {};
    if (updates.username) validUpdates.username = updates.username;
    if (updates.full_name) validUpdates.full_name = updates.full_name;
    
    const { data, error } = await supabase
      .from('users')
      .update(validUpdates)
      .eq('auth_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
         id: data.auth_id,
         email: data.email,
         username: data.username,
         full_name: data.full_name,
         plan: data.plan === 'gratuito' ? 'free' : data.plan,
         role: 'user',
         points: data.points,
         level: 1,
         total_checkins: 0,
         total_ai_conversations: 0,
         total_achievements: 0,
         is_active: true,
         is_verified: false,
         created_at: data.created_at,
         updated_at: data.created_at,
         ...data
    };
  }

  /**
   * Obter estatísticas do usuário
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Aqui você implementaria as queries para obter as estatísticas
      // Por exemplo: total de posts, comentários, likes, etc.
      const { data, error } = await supabase
        .rpc('get_user_stats', { user_id: userId });

      if (error) {
        throw new Error(error.message);
      }

      return data || {
        totalPosts: 0,
        totalComments: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        totalViews: 0,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      return {
        totalPosts: 0,
        totalComments: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        totalViews: 0,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
    }
  }

  /**
   * Obter preferências do usuário
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Criar preferências padrão se não existirem
          return await this.createDefaultUserPreferences(userId);
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter preferências do usuário:', error);
      return await this.createDefaultUserPreferences(userId);
    }
  }

  /**
   * Criar preferências padrão do usuário
   */
  static async createDefaultUserPreferences(_userId: string): Promise<UserPreferences> {
    const defaultPreferences: UserPreferences = {
      theme: 'system',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: {
        email: true,
        push: true,
        events: true,
        ai: true,
        achievements: true,
        marketing: false,
      },
      privacy: {
        profile_visibility: 'public',
        show_location: true,
        show_stats: true,
        show_achievements: true,
      },
    };

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([defaultPreferences])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar preferências padrão:', error);
      return defaultPreferences;
    }
  }

  /**
   * Atualizar preferências do usuário
   */
  static async updateUserPreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Deletar conta do usuário
   */
  static async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Primeiro, marcar o perfil como inativo
      await supabase
        .from('user_profiles')
        .update({ isActive: false })
        .eq('id', userId);

      // Em seguida, deletar o usuário do auth
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Atualizar último login
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_profiles')
        .update({ 
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }

  /**
   * Verificar se username está disponível
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        return true; // Username não encontrado, está disponível
      }

      return false; // Username já existe
    } catch (error) {
      console.error('Erro ao verificar username:', error);
      return false;
    }
  }

  /**
   * Verificar se email está disponível
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (error && error.code === 'PGRST116') {
        return true; // Email não encontrado, está disponível
      }

      return false; // Email já existe
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  }
}

export default AuthService;
