import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  placeholder = null,
  fallback = null,
  lazy = true,
  quality = 80,
  sizes = '',
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px', // Carregar 50px antes de entrar na viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, isInView]);

  // Otimizar URL da imagem
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return '';
    
    // Se for uma URL do Supabase Storage, adicionar parâmetros de otimização
    if (originalSrc.includes('supabase.co/storage')) {
      const url = new URL(originalSrc);
      url.searchParams.set('quality', quality.toString());
      if (sizes) {
        url.searchParams.set('resize', sizes);
      }
      return url.toString();
    }
    
    return originalSrc;
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError(e);
  };

  // Placeholder padrão
  const DefaultPlaceholder = () => (
    <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
      <ImageIcon className="w-8 h-8 text-gray-400" />
    </div>
  );

  // Fallback padrão
  const DefaultFallback = () => (
    <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
      <ImageIcon className="w-8 h-8 text-gray-400" />
      <span className="ml-2 text-sm text-gray-500">Imagem não encontrada</span>
    </div>
  );

  // Se houve erro, mostrar fallback
  if (hasError) {
    return fallback || <DefaultFallback />;
  }

  // Se não está na viewport ainda (lazy loading), mostrar placeholder
  if (!isInView) {
    return (
      <div ref={imgRef} className={className}>
        {placeholder || <DefaultPlaceholder />}
      </div>
    );
  }

  return (
    <div ref={imgRef} className="relative">
      {/* Placeholder enquanto carrega */}
      {!isLoaded && (placeholder || <DefaultPlaceholder />)}
      
      {/* Imagem otimizada */}
      <img
        src={getOptimizedSrc(src)}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;