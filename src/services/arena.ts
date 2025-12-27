import { apiClient } from '../lib/api';

export interface Arena {
  id: string;
  title: string;
  description: string;
  politician_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'live' | 'ended';
  started_at?: string;
  created_at?: string;
  updated_at?: string;
  rules: string;
  superchat_config: any;
  politicians?: {
    name: string;
    photo_url: string;
    party: string;
  };
}

export interface ArenaQuestion {
  id: string;
  arena_id: string;
  user_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'answered' | 'ignored' | 'removed';
  type: 'normal' | 'superchat';
  amount: number;
  priority_score: number;
  is_answered: boolean;
  created_at: string;
  users?: {
    full_name: string;
    avatar_url: string;
    role?: string;
  };
}

export const arenaService = {
  // Arenas
  getArenas: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/arenas', { params });
    return response.data;
  },

  getArenaById: async (id: string) => {
    const response = await apiClient.get(`/arenas/${id}`);
    return response.data;
  },

  createArena: async (data: any) => {
    const response = await apiClient.post('/arenas', data);
    return response.data;
  },

  updateArena: async (id: string, data: any) => {
    const response = await apiClient.put(`/arenas/${id}`, data);
    return response.data;
  },

  // Questions
  getQuestions: async (arenaId: string, sort: 'recent' | 'popular' = 'recent') => {
    const response = await apiClient.get(`/arenas/${arenaId}/questions`, { params: { sort } });
    return response.data;
  },

  sendQuestion: async (arenaId: string, content: string, type: 'normal' | 'superchat' = 'normal', amount: number = 0) => {
    const response = await apiClient.post(`/arenas/${arenaId}/questions`, { content, type, amount });
    return response.data;
  },

  voteQuestion: async (questionId: string) => {
    const response = await apiClient.post(`/arenas/questions/${questionId}/vote`);
    return response.data;
  },

  createSuperChatSession: async (arenaId: string, amount: number, question: string) => {
    const response = await apiClient.post('/payments/superchat-checkout', { arenaId, amount, question });
    return response.data;
  },

  moderateQuestion: async (questionId: string, status?: string, is_answered?: boolean) => {
    const response = await apiClient.put(`/arenas/questions/${questionId}/status`, { status, is_answered });
    return response.data;
  },

  // Chat
  getChatMessages: async (arenaId: string, limit = 50) => {
    const response = await apiClient.get(`/arenas/${arenaId}/chat`, { params: { limit } });
    return response.data;
  },

  sendChatMessage: async (arenaId: string, content: string) => {
    const response = await apiClient.post(`/arenas/${arenaId}/chat`, { content });
    return response.data;
  },

  // Participants
  getMyInvites: async () => {
    const response = await apiClient.get('/arenas/my-invites');
    return response.data;
  },

  getParticipants: async (arenaId: string) => {
    const response = await apiClient.get(`/arenas/${arenaId}/participants`);
    return response.data;
  },

  inviteUser: async (arenaId: string, userId: string, role: string) => {
    const response = await apiClient.post(`/arenas/${arenaId}/invite`, { user_id: userId, role });
    return response.data;
  },

  updateInviteStatus: async (arenaId: string, status: 'accepted' | 'rejected') => {
    const response = await apiClient.put(`/arenas/${arenaId}/invite/status`, { status });
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await apiClient.get(`/arenas/users/search`, { params: { q: query } });
    return response.data;
  },

  inviteExternal: async (arenaId: string, name: string, email: string, role: string) => {
    const response = await apiClient.post(`/arenas/${arenaId}/invite-external`, { name, email, role });
    return response.data;
  },

  toggleHand: async (arenaId: string, hand_raised: boolean) => {
    const response = await apiClient.put(`/arenas/${arenaId}/participants/hand`, { hand_raised });
    return response.data;
  },

  updateParticipantPermissions: async (arenaId: string, userId: string, permissions: { can_speak?: boolean; can_video?: boolean; hand_raised?: boolean }) => {
    const response = await apiClient.post(`/arenas/${arenaId}/participants/${userId}/permissions`, permissions);
    return response.data;
  },

  removeParticipant: async (arenaId: string, userId: string) => {
    const response = await apiClient.delete(`/arenas/${arenaId}/participants/${userId}`);
    return response.data;
  }
};

