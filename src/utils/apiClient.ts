/**
 * Cliente API centralizado para garantir URLs corretas em produção
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://direitai-backend.vercel.app/api';

/**
 * Faz uma requisição para a API com a URL base correta
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Remove barra inicial se existir para evitar duplicação
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Remove /api/ do início se existir, pois já está na base URL
  const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint.slice(4) : cleanEndpoint;
  
  const url = `${API_BASE_URL}/${finalEndpoint}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
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