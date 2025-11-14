import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiClient, ApiResponse, RequestOptions, ApiMetrics, HealthCheck } from '../types/api';
import { supabase } from './supabase';

// Configuração base da API
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const IS_BROWSER = typeof window !== 'undefined';
const IS_NON_LOCAL_SITE = IS_BROWSER && !/localhost|127\.0\.0\.1/i.test(window.location.hostname);
const HAS_ENV_BASE = typeof RAW_API_BASE_URL === 'string' && RAW_API_BASE_URL.length > 0;

// Estratégia de baseURL:
// - Em produção (site não local), sempre usar '/api' para evitar CORS e aproveitar rewrites do Vercel.
// - Em ambiente local, se VITE_API_URL estiver definido, usa exatamente esse valor; caso contrário, usa '/api' (proxy do Vite).
const API_BASE_URL = IS_NON_LOCAL_SITE ? '/api' : (HAS_ENV_BASE ? RAW_API_BASE_URL : '/api');



class ApiClientImpl implements ApiClient {
  private axiosInstance: AxiosInstance;
  private metrics: ApiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastRequestTime: null
  };

  constructor() {
    try {
      // Verificar se axios está disponível
      if (typeof axios === 'undefined') {
        throw new Error('Axios não está disponível');
      }

      // Inicializar com configuração mais defensiva
      this.axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        // Evitar enviar cookies em cross-origin para não disparar CORS com credenciais
        withCredentials: false,
        headers: {
          'Content-Type': 'application/json',
        },
        // Garantir que defaults.headers seja inicializado
        validateStatus: (status) => status < 500,
      });
      
      // Verificação robusta da estrutura do axios
      this.ensureAxiosStructure();
      
    } catch (error) {
      console.error('Erro ao criar instância do Axios:', error);
      // Fallback para configuração mínima
      try {
        this.axiosInstance = axios.create();
        this.ensureAxiosStructure();
      } catch (fallbackError) {
        console.error('Erro crítico na inicialização do Axios:', fallbackError);
        // Criar um mock básico se tudo falhar
        this.axiosInstance = this.createMockAxios();
      }
    }
    
    // Configurar interceptors
    this.setupInterceptors();
  }

  private ensureAxiosStructure() {
    // Garantir que a estrutura do axios existe
    if (!this.axiosInstance) {
      throw new Error('Instância do Axios não foi criada');
    }
    
    if (!this.axiosInstance.defaults) {
      this.axiosInstance.defaults = {};
    }
    
    if (!this.axiosInstance.defaults.headers) {
      this.axiosInstance.defaults.headers = {};
    }
    
    if (!this.axiosInstance.defaults.headers.common) {
      this.axiosInstance.defaults.headers.common = {};
    }
    
    if (!this.axiosInstance.defaults.headers.get) {
      this.axiosInstance.defaults.headers.get = {};
    }
    
    if (!this.axiosInstance.defaults.headers.post) {
      this.axiosInstance.defaults.headers.post = {};
    }
    
    if (!this.axiosInstance.defaults.headers.put) {
      this.axiosInstance.defaults.headers.put = {};
    }
    
    if (!this.axiosInstance.defaults.headers.delete) {
      this.axiosInstance.defaults.headers.delete = {};
    }
  }

  private createMockAxios() {
    // Criar um mock básico do axios em caso de falha crítica
    const mockAxios = {
      defaults: {
        headers: {
          common: {},
          get: {},
          post: {},
          put: {},
          delete: {}
        }
      },
      interceptors: {
        request: {
          use: () => {}
        },
        response: {
          use: () => {}
        }
      },
      request: () => Promise.reject(new Error('Axios não disponível')),
      get: () => Promise.reject(new Error('Axios não disponível')),
      post: () => Promise.reject(new Error('Axios não disponível')),
      put: () => Promise.reject(new Error('Axios não disponível')),
      delete: () => Promise.reject(new Error('Axios não disponível'))
    };
    
    return mockAxios as any;
  }

  private setupInterceptors() {
      // Interceptor para adicionar token de autenticação
      this.axiosInstance.interceptors.request.use(
        async (config) => {
          try {
          if (!config) {
            config = {} as any;
          }
          if (!config.headers) {
            config.headers = {} as any;
          }
          let token: string | null = null;

          // 1) Priorizar token já configurado nos defaults do axios para evitar chamadas supabase desnecessárias
          try {
            const authHeader = this.axiosInstance.defaults.headers?.common?.Authorization as string | undefined;
            if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
              token = authHeader.substring(7);
            }
          } catch {}

          // 2) Se não houver token nos defaults, obter sessão atual do Supabase (sem refresh aqui)
          if (!token) {
            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              if (session?.access_token && !sessionError) {
                token = session.access_token;
              }
            } catch {
              // Em caso de erro, seguir sem token; não bloquear a requisição aqui
            }
          }

          // 3) Aplicar Authorization no request se o token existir
          if (token) {
            (config.headers as any).Authorization = `Bearer ${token}`;
          }

          // Logs defensivos em rotas sensíveis
          try {
            const url = config?.url || '';
            const method = (config?.method || 'get').toLowerCase();
            if (url.includes('/agents') && method === 'post') {
              const hasAuth = !!(config.headers as any).Authorization;
              const contentType = (config.headers as any)['Content-Type'];
              console.log('[API DEBUG] POST /agents headers overview:', { hasAuth, contentType });
              console.log('[API DEBUG] baseURL:', this.axiosInstance.defaults.baseURL);
            }
            if (url.includes('/auth/me')) {
              const hasAuth = !!(config.headers as any).Authorization;
              const authHeader = (config.headers as any).Authorization;
              console.log('[API DEBUG] GET /auth/me headers:', { hasAuth, authHeaderPreview: typeof authHeader === 'string' ? authHeader.slice(0, 20) + '...' : null });
              console.log('[API DEBUG] baseURL:', this.axiosInstance.defaults.baseURL);
            }
            if (url.includes('/manifestations') && method === 'post') {
              const hasAuth = !!(config.headers as any).Authorization;
              const authHeader = (config.headers as any).Authorization;
              const contentType = (config.headers as any)['Content-Type'];
              console.log('[API DEBUG] POST /manifestations headers:', { hasAuth, contentType, authHeaderPreview: typeof authHeader === 'string' ? authHeader.slice(0, 20) + '...' : null });
              console.log('[API DEBUG] baseURL:', this.axiosInstance.defaults.baseURL);
            }
          } catch {}
        } catch {
          if (!config) {
            config = { headers: {} } as any;
          }
        }
        this.metrics.totalRequests++;
        this.metrics.lastRequestTime = new Date();
        return config;
      },
      (error) => {
        this.metrics.failedRequests++;
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar respostas e erros
      this.axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => {
          this.metrics.successfulRequests++;
          return response;
        },
        async (error) => {
          this.metrics.failedRequests++;
          try {
            const cfg = error?.config || {};
            const url = cfg?.url || '';
            const method = (cfg?.method || 'get').toLowerCase();
            if (url.includes('/agents') && method === 'post') {
              console.error('[API DEBUG] POST /agents failed:', {
                status: error?.response?.status,
                data: error?.response?.data,
                headers: error?.response?.headers,
              });
            }
            if (url.includes('/manifestations') && method === 'post') {
              console.error('[API DEBUG] POST /manifestations failed:', {
                status: error?.response?.status,
                data: error?.response?.data,
                headers: error?.response?.headers,
              });
            }
            // Retry defensivo: em 401, tentar atualizar a sessão do Supabase e refazer a requisição uma vez
            const status = error?.response?.status;
            const isAuthCheck = url.includes('/auth/me');
            const isProtectedPost = (method === 'post') && (url.includes('/manifestations') || url.includes('/agents'));
            const shouldRetry = status === 401 && (isAuthCheck || isProtectedPost) && !cfg.__retryOnce;
            if (shouldRetry) {
              try {
                // Somente tentar refresh se houver sessão e refresh_token disponível
                const { data: sessionData } = await supabase.auth.getSession();
                const hasRefresh = !!sessionData?.session?.refresh_token;
                if (hasRefresh) {
                  await supabase.auth.refreshSession();
                }
                // Após tentar refresh (ou se não houver refresh), obter token atual
                const { data: updated } = await supabase.auth.getSession();
                const token = updated?.session?.access_token;
                if (token) {
                  // Atualizar defaults e cabeçalho da requisição original
                  if (!this.axiosInstance.defaults.headers) this.axiosInstance.defaults.headers = {} as any;
                  if (!this.axiosInstance.defaults.headers.common) this.axiosInstance.defaults.headers.common = {} as any;
                  this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                  cfg.headers = { ...(cfg.headers || {}) } as any;
                  (cfg.headers as any).Authorization = `Bearer ${token}`;
                }
              } catch (refreshErr) {
                console.warn('Falha ao atualizar sessão durante retry 401:', refreshErr);
              }
              // Marcar para evitar loop infinito e refazer a requisição
              (cfg as any).__retryOnce = true;
              return this.axiosInstance.request(cfg);
            }
          } catch {}
          // Não fazer signOut automático em 401 para evitar loops durante login
          // Deixar erro propagar e ser tratado por páginas/componentes específicos
          return Promise.reject(error);
        }
      );
  }

  private async makeRequest<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const startTime = Date.now();
      
      const response = await this.axiosInstance.request(config);
      const endTime = Date.now();
      
      // Atualizar métricas de tempo de resposta
      const responseTime = endTime - startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime + responseTime) / 2;
      this.metrics.successfulRequests++;
      
      // Verificação defensiva para response e headers
      const safeResponse = response || {};
      const safeHeaders = safeResponse.headers || {};
      const statusCode = safeResponse.status || 200;

      // Se o backend local retornar erro de rede (status 0), tentar fallback automático para produção
      const isLocalApi = API_BASE_URL.includes('localhost:5120') || API_BASE_URL.includes('127.0.0.1:5120') || API_BASE_URL.startsWith('/api');
      if (isLocalApi && (statusCode === 0)) {
        try {
          const altConfig: AxiosRequestConfig = {
            ...config,
            baseURL: 'https://direitai-backend.vercel.app/api',
          };
          const authHeader = this.axiosInstance.defaults?.headers?.common?.Authorization;
          altConfig.headers = { ...(config?.headers || {}) } as any;
          if (authHeader && !altConfig.headers.Authorization) {
            (altConfig.headers as any).Authorization = authHeader;
          }
          const altResponse = await axios.request(altConfig);
          const altSafeResponse = altResponse || {};
          const altSafeHeaders = altSafeResponse.headers || {};
          return {
            data: altSafeResponse.data,
            status: altSafeResponse.status || 200,
            statusText: altSafeResponse.statusText,
            headers: altSafeHeaders,
            success: true
          };
        } catch (fallbackErr) {
          // Se o fallback também falhar, continuar retornando a resposta original
        }
      }
      
      return {
        data: safeResponse.data,
        status: statusCode,
        statusText: safeResponse.statusText,
        headers: safeHeaders,
        success: statusCode < 400
      };
    } catch (error: any) {
      this.metrics.failedRequests++;

      const isLocalApi = API_BASE_URL.includes('localhost:5120') || API_BASE_URL.includes('127.0.0.1:5120') || API_BASE_URL.startsWith('/api');
      const status = error?.response?.status;
      const urlPath = (error?.config?.url || '').toLowerCase();
      const shouldFallbackNetwork = isLocalApi && (status === 0);

      // Fallback 1: erro de rede local (status 0)
      if (shouldFallbackNetwork) {
        try {
          const altConfig: AxiosRequestConfig = {
            ...config,
            baseURL: 'https://direitai-backend.vercel.app/api',
          };
          // Preservar token de autorização, se existir
          const authHeader = this.axiosInstance.defaults?.headers?.common?.Authorization;
          altConfig.headers = { ...(config?.headers || {}) } as any;
          if (authHeader && !altConfig.headers.Authorization) {
            (altConfig.headers as any).Authorization = authHeader;
          }

          const response = await axios.request(altConfig);
          const safeResponse = response || {};
          const safeHeaders = safeResponse.headers || {};

          return {
            data: safeResponse.data,
            status: safeResponse.status || 200,
            statusText: safeResponse.statusText,
            headers: safeHeaders,
            success: true
          };
        } catch (fallbackErr) {
          // Se o fallback também falhar, lançar o erro original
          throw error;
        }
      }

      // Fallback 2: backend local respondeu 500
      try {
        const method = (error?.config?.method || 'get').toLowerCase();
        const respData = error?.response?.data;
        const code = respData?.code || error?.code;
        const message = String(respData?.message || respData?.error || '');
        const isPermissionDenied = code === '42501' || /permission denied/i.test(message);
        const isSurveysEndpoint = urlPath.includes('/surveys');

        // Fallback 2a: 500 com permissão negada
        const shouldFallbackPermission = isLocalApi && status >= 500 && isPermissionDenied;
        // Fallback 2b: 500 genérico em /surveys para POST/PUT
        const shouldFallbackSurveys500 = isLocalApi && status >= 500 && isSurveysEndpoint && (method === 'post' || method === 'put');
        // Fallback 2c: 500 em /announcements para GET
        const isAnnouncements = urlPath.includes('/announcements');
        const shouldFallbackAnnouncements500 = isLocalApi && status >= 500 && isAnnouncements && method === 'get';

        if (shouldFallbackPermission || shouldFallbackSurveys500 || shouldFallbackAnnouncements500) {
          const altConfig: AxiosRequestConfig = {
            ...config,
            baseURL: 'https://direitai-backend.vercel.app/api',
          };
          const authHeader = this.axiosInstance.defaults?.headers?.common?.Authorization;
          altConfig.headers = { ...(config?.headers || {}) } as any;
          if (authHeader && !altConfig.headers.Authorization) {
            (altConfig.headers as any).Authorization = authHeader;
          }
          const response = await axios.request(altConfig);
          const safeResponse = response || {};
          const safeHeaders = safeResponse.headers || {};
          return {
            data: safeResponse.data,
            status: safeResponse.status || 200,
            statusText: safeResponse.statusText,
            headers: safeHeaders,
            success: true
          };
        }
      } catch {}

      // Fallback 3: 401 em endpoints críticos com API local -> tentar base de produção
      try {
        const method = (error?.config?.method || 'get').toLowerCase();
        const isCritical401 = status === 401 && (
          urlPath.includes('/auth/me') ||
          (method === 'post' && urlPath.includes('/manifestations'))
        );
        const shouldFallback401 = isLocalApi && isCritical401 && !error?.config?.__fallback401Tried;
        if (shouldFallback401) {
          const altConfig: AxiosRequestConfig = {
            ...config,
            baseURL: 'https://direitai-backend.vercel.app/api',
          };
          const authHeader = this.axiosInstance.defaults?.headers?.common?.Authorization;
          altConfig.headers = { ...(config?.headers || {}) } as any;
          if (authHeader && !altConfig.headers.Authorization) {
            (altConfig.headers as any).Authorization = authHeader;
          }
          (altConfig as any).__fallback401Tried = true;
          const response = await axios.request(altConfig);
          const safeResponse = response || {};
          const safeHeaders = safeResponse.headers || {};
          return {
            data: safeResponse.data,
            status: safeResponse.status || 200,
            statusText: safeResponse.statusText,
            headers: safeHeaders,
            success: true
          };
        }
      } catch {}

      // Para erros 400, 401, etc., ou 500 sem condição de fallback, lançamos para tratamento no frontend
      throw error;
    }
  }

  async get<T = any>(url: string, config?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'GET',
      url,
      ...config
    });
  }

  async post<T = any>(url: string, data?: any, config?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  async put<T = any>(url: string, data?: any, config?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  async patch<T = any>(url: string, data?: any, config?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PATCH',
      url,
      data,
      ...config
    });
  }

  async delete<T = any>(url: string, config?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'DELETE',
      url,
      ...config
    });
  }

  async upload<T = any>(url: string, file: File | FormData, config?: RequestOptions): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return this.makeRequest<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config
    });
  }

  async download(url: string, config?: RequestOptions): Promise<Blob> {
    const response = await this.axiosInstance.get(url, {
      responseType: 'blob',
      ...config
    });
    return response.data;
  }

  setAuthToken(token: string): void {
    if (!this.axiosInstance.defaults.headers) {
      this.axiosInstance.defaults.headers = {};
    }
    if (!this.axiosInstance.defaults.headers.common) {
      this.axiosInstance.defaults.headers.common = {};
    }
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    if (this.axiosInstance.defaults.headers?.common) {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  async healthCheck(): Promise<HealthCheck> {
    try {
      const response = await this.get('/health');
      return {
        status: 'healthy',
        timestamp: new Date(),
        services: response.data?.services || {},
        version: response.data?.version || '1.0.0'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        services: {},
        version: '1.0.0',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Função para criar instância do cliente API de forma segura
let _apiClientInstance: ApiClientImpl | null = null;

export const getApiClient = (): ApiClientImpl => {
  if (!_apiClientInstance) {
    try {
      _apiClientInstance = new ApiClientImpl();
    } catch (error) {
      console.error('Erro ao inicializar cliente API:', error);
      // Fallback para uma instância básica
      _apiClientInstance = new ApiClientImpl();
    }
  }
  return _apiClientInstance;
};

// Instância singleton do cliente API
export const apiClient = getApiClient();

// Exportar também a classe para testes
export { ApiClientImpl };

// Configurações adicionais
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};