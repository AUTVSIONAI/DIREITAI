/**
 * Cliente API centralizado para garantir URLs corretas em produção
 */
import { supabase } from '../lib/supabase';

// Configuração base da API (alinhada com src/lib/api.ts)
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const IS_BROWSER = typeof window !== 'undefined';
const IS_NON_LOCAL_SITE = IS_BROWSER && !/localhost|127\.0\.0\.1/i.test(window.location.hostname);
const HAS_ENV_BASE = typeof RAW_API_BASE_URL === 'string' && RAW_API_BASE_URL.length > 0;
// Priorizar sempre VITE_API_URL quando estiver configurado.
// Caso contrário: em produção usar "/api" (proxy no Vercel), e em preview/dev cair para backend público.
const API_BASE_URL = IS_NON_LOCAL_SITE
  ? '/api'
  : (HAS_ENV_BASE ? RAW_API_BASE_URL : 'https://direitai-backend.vercel.app/api');

/**
 * Faz uma requisição para a API com a URL base correta e token de autenticação
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Remove barra inicial se existir para evitar duplicação
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Remove /api/ do início se existir, pois já está na base URL
  const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint.slice(4) : cleanEndpoint;
  
  const url = `${API_BASE_URL}/${finalEndpoint}`;
  
  // Obter token de autenticação do Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const baseHeaders: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  const mergedHeaders = {
    ...baseHeaders,
    ...(options.headers || {}),
  } as Record<string, string>;
  if (!isFormData && !('Content-Type' in mergedHeaders)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
  
  // Parse response as JSON if possible
  try {
    const data = await response.json();
    return {
      success: response.ok,
      data,
      error: response.ok ? null : data.error || 'Request failed'
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: 'Failed to parse response'
    };
  }
};

/**
 * Constrói uma URL completa para a API
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint.slice(4) : cleanEndpoint;
  return `${API_BASE_URL}/${finalEndpoint}`;
};

/**
 * Obtém a URL base da API
 */
export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};