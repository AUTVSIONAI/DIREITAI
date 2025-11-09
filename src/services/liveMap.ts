import { apiClient } from '../lib/api';
import { ApiResponse } from '../types/api';

export interface OnlineUser {
  id: number;
  username: string;
  location: {
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
  status: 'online' | 'in_event';
  lastActivity: string;
  plan: string;
}

export interface ActiveEvent {
  id: number;
  title: string;
  location: {
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
  participants: number;
  status: string;
  startTime: string;
  endTime?: string;
}

export interface CityStats {
  city: string;
  state: string;
  users: number;
  events: number;
  checkins: number;
}

export interface RealTimeStats {
  onlineUsers: number;
  activeEvents: number;
  totalCheckins: number;
  lastUpdate: string;
}

export class LiveMapService {
  /**
   * Get online users
   */
  static async getOnlineUsers(): Promise<ApiResponse<{ users: OnlineUser[] }>> {
    return apiClient.get('/admin/live-map/users');
  }

  /**
   * Get active events
   */
  static async getActiveEvents(): Promise<ApiResponse<{ events: ActiveEvent[] }>> {
    return apiClient.get('/admin/live-map/events');
  }

  /**
   * Get city statistics
   */
  static async getCityStats(): Promise<ApiResponse<{ stats: CityStats[] }>> {
    return apiClient.get('/admin/live-map/stats');
  }

  /**
   * Get real-time statistics
   */
  static async getRealTimeStats(): Promise<ApiResponse<RealTimeStats>> {
    return apiClient.get('/admin/live-map/realtime');
  }

  /**
   * Subscribe to real-time updates with adaptive polling
   */
  static subscribeToUpdates(
    callback: (stats: RealTimeStats) => void,
    options: {
      activeInterval?: number; // Interval when page is visible (default: 30s)
      inactiveInterval?: number; // Interval when page is hidden (default: 2min)
      maxInactiveTime?: number; // Max time without update when hidden (default: 5min)
    } = {}
  ): () => void {
    const {
      activeInterval = 30000,
      inactiveInterval = 120000,
      maxInactiveTime = 300000
    } = options;
    
    let intervalId: NodeJS.Timeout;
    let lastUpdate = Date.now();
    
    const startPolling = () => {
      const currentInterval = document.hidden ? inactiveInterval : activeInterval;
      
      intervalId = setInterval(async () => {
        try {
          // Only fetch if page is visible or if too much time has passed
          const shouldUpdate = !document.hidden || 
                              (Date.now() - lastUpdate) > maxInactiveTime;
          
          if (shouldUpdate) {
            const response = await this.getRealTimeStats();
            if (response.success && response.data) {
              callback(response.data);
              lastUpdate = Date.now();
            }
          }
        } catch (error) {
          console.error('Error fetching real-time stats:', error);
        }
      }, currentInterval);
    };
    
    const handleVisibilityChange = () => {
      clearInterval(intervalId);
      startPolling();
    };
    
    // Start initial polling
    startPolling();
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
}

// Create and export singleton instance
export const liveMapService = new LiveMapService();

export default LiveMapService;