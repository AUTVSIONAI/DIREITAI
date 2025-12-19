export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  birth_date?: string;
  phone?: string;
  plan: 'free' | 'premium' | 'vip';
  role: 'user' | 'admin' | 'moderator' | 'super_admin' | 'politician' | 'journalist' | 'party';
  points: number;
  level: number;
  total_checkins: number;
  total_ai_conversations: number;
  total_achievements: number;
  is_active: boolean;
  is_verified: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  full_name: string;
  birth_date?: string;
  location?: string;
  phone?: string;
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  birth_date?: string;
  phone?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  user: UserProfile | null;
  session: any;
  success?: boolean;
  error?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  password: string;
  confirmPassword: string;
}

export interface UserStats {
  total_checkins?: number;
  total_ai_conversations?: number;
  total_achievements?: number;
  points?: number;
  level?: number;
  rank?: number;
  // Compatibilidade com implementação atual de AuthService
  totalPosts?: number;
  totalComments?: number;
  totalLikes?: number;
  totalFollowers?: number;
  totalFollowing?: number;
  totalViews?: number;
  joinedAt?: string;
  lastActiveAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    events: boolean;
    ai: boolean;
    achievements: boolean;
    marketing: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private';
    show_location: boolean;
    show_stats: boolean;
    show_achievements: boolean;
  };
  language: string;
  timezone: string;
  // Campos adicionais opcionais para compatibilidade com AuthService
  userId?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  weeklyDigest?: boolean;
  instantNotifications?: boolean;
  soundEnabled?: boolean;
  autoPlayVideos?: boolean;
  showOnlineStatus?: boolean;
  allowDirectMessages?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  twoFactorEnabled?: boolean;
  loginAlerts?: boolean;
  dataExportFormat?: 'json' | 'csv';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'login' | 'logout' | 'checkin' | 'ai_chat' | 'achievement' | 'purchase' | 'event_join';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  resetPassword: (data: PasswordResetData) => Promise<void>;
  updatePassword: (data: PasswordUpdateData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}
