/**
 * Utilitários para manipulação de URLs de imagens
 */

// Obter a base URL da API do ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://direitai-backend.vercel.app/api';

/**
 * Converte uma URL relativa de imagem em URL absoluta
 * @param {string} imageUrl - URL da imagem (pode ser relativa ou absoluta)
 * @returns {string} URL absoluta da imagem
 */
export const getAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return null;
  }

  // Se já é uma URL absoluta (http/https), retorna como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Se é uma URL relativa que começa com /api/upload/files/
  if (imageUrl.startsWith('/api/upload/files/')) {
    // Remove o /api da URL relativa e adiciona a base URL completa
    const relativePath = imageUrl.replace('/api', '');
    return `${API_BASE_URL}${relativePath}`;
  }

  // Se é uma URL relativa que começa com /upload/files/
  if (imageUrl.startsWith('/upload/files/')) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  // Se é apenas o nome do arquivo
  if (!imageUrl.startsWith('/')) {
    return `${API_BASE_URL}/upload/files/${imageUrl}`;
  }

  // Para outros casos, assume que é uma URL relativa e adiciona a base URL
  return `${API_BASE_URL}${imageUrl}`;
};

/**
 * Verifica se uma URL de imagem é válida
 * @param {string} imageUrl - URL da imagem
 * @returns {boolean} true se a URL é válida
 */
export const isValidImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  // Verifica se é uma URL válida
  try {
    new URL(getAbsoluteImageUrl(imageUrl));
    return true;
  } catch {
    return false;
  }
};

/**
 * Obtém uma URL de placeholder para quando a imagem não está disponível
 * @param {number} width - Largura do placeholder
 * @param {number} height - Altura do placeholder
 * @returns {string} URL do placeholder
 */
export const getPlaceholderImageUrl = (width = 300, height = 300) => {
  return `https://via.placeholder.com/${width}x${height}/e5e7eb/6b7280?text=Sem+Imagem`;
};

/**
 * Processa uma URL de imagem de político, garantindo que seja absoluta
 * @param {string} photoUrl - URL da foto do político
 * @returns {string|null} URL absoluta da foto ou null se inválida
 */
export const getPoliticianPhotoUrl = (photoUrl) => {
  if (!photoUrl) {
    return null;
  }

  return getAbsoluteImageUrl(photoUrl);
};