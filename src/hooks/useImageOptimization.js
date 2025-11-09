import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para otimização de imagens com lazy loading e cache
 */
export const useImageOptimization = () => {
  const [imageCache, setImageCache] = useState(new Map());
  const [loadingImages, setLoadingImages] = useState(new Set());

  // Preload de imagens críticas
  const preloadImage = useCallback((src) => {
    if (!src || imageCache.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Map(prev.set(src, true)));
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [imageCache]);

  // Preload múltiplas imagens
  const preloadImages = useCallback(async (srcArray) => {
    const promises = srcArray.map(src => preloadImage(src));
    return Promise.allSettled(promises);
  }, [preloadImage]);

  // Verificar se imagem está em cache
  const isImageCached = useCallback((src) => {
    return imageCache.has(src);
  }, [imageCache]);

  // Otimizar URL da imagem baseado no dispositivo
  const getOptimizedImageUrl = useCallback((src, options = {}) => {
    if (!src) return '';

    const {
      width,
      height,
      quality = 80,
      format = 'webp',
      devicePixelRatio = window.devicePixelRatio || 1
    } = options;

    // Para URLs do Supabase Storage
    if (src.includes('supabase.co/storage')) {
      const url = new URL(src);
      
      if (width || height) {
        const actualWidth = width ? Math.round(width * devicePixelRatio) : undefined;
        const actualHeight = height ? Math.round(height * devicePixelRatio) : undefined;
        
        if (actualWidth && actualHeight) {
          url.searchParams.set('resize', `${actualWidth}x${actualHeight}`);
        } else if (actualWidth) {
          url.searchParams.set('width', actualWidth.toString());
        } else if (actualHeight) {
          url.searchParams.set('height', actualHeight.toString());
        }
      }
      
      url.searchParams.set('quality', quality.toString());
      
      // Tentar usar WebP se suportado
      if (format === 'webp' && supportsWebP()) {
        url.searchParams.set('format', 'webp');
      }
      
      return url.toString();
    }

    return src;
  }, []);

  // Gerar srcSet para imagens responsivas
  const generateSrcSet = useCallback((src, widths = [320, 640, 768, 1024, 1280, 1920]) => {
    if (!src) return '';

    return widths
      .map(width => {
        const optimizedUrl = getOptimizedImageUrl(src, { width });
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');
  }, [getOptimizedImageUrl]);

  // Detectar suporte a WebP
  const supportsWebP = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }, []);

  // Limpar cache quando necessário
  const clearImageCache = useCallback(() => {
    setImageCache(new Map());
  }, []);

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    return {
      size: imageCache.size,
      loadingCount: loadingImages.size
    };
  }, [imageCache.size, loadingImages.size]);

  return {
    preloadImage,
    preloadImages,
    isImageCached,
    getOptimizedImageUrl,
    generateSrcSet,
    supportsWebP,
    clearImageCache,
    getCacheStats
  };
};

/**
 * Hook para lazy loading de imagens com Intersection Observer
 */
export const useLazyImage = (src, options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { threshold = 0.1, rootMargin = '50px' } = options;

  const observerRef = useCallback((node) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;
  }, [isInView, src]);

  return {
    observerRef,
    isLoaded,
    isInView,
    hasError,
    shouldLoad: isInView
  };
};

/**
 * Hook para otimização automática baseada na conexão
 */
export const useAdaptiveImageQuality = () => {
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('webp');

  useEffect(() => {
    // Detectar tipo de conexão
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateQuality = () => {
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            setQuality(40);
            setFormat('jpeg');
            break;
          case '3g':
            setQuality(60);
            setFormat('webp');
            break;
          case '4g':
          default:
            setQuality(80);
            setFormat('webp');
            break;
        }
      };

      updateQuality();
      connection.addEventListener('change', updateQuality);

      return () => {
        connection.removeEventListener('change', updateQuality);
      };
    }
  }, []);

  return { quality, format };
};

export default {
  useImageOptimization,
  useLazyImage,
  useAdaptiveImageQuality
};