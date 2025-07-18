import React, { useState, useEffect, useRef } from 'react';
import { useImageCache } from './useImageCache';

const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  loading = 'lazy', 
  fallbackSrc,
  onLoad,
  onError,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasFallback, setHasFallback] = useState(false);
  const imgRef = useRef(null);
  const { status, imageSrc } = useImageCache(currentSrc);

  useEffect(() => {
    setCurrentSrc(src);
    setHasFallback(false);
  }, [src]);

  useEffect(() => {
    if (status === 'error' && fallbackSrc && !hasFallback) {
      console.log(`Erro ao carregar ${currentSrc}, tentando fallback: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
      setHasFallback(true);
    }
  }, [status, fallbackSrc, currentSrc, hasFallback]);

  useEffect(() => {
    if (status === 'loaded' && imgRef.current) {
      imgRef.current.classList.add('loaded');
      if (onLoad) {
        onLoad({ target: imgRef.current });
      }
    }
  }, [status, onLoad]);

  useEffect(() => {
    if (status === 'error' && onError) {
      onError({ target: imgRef.current });
    }
  }, [status, onError]);

  // Se há erro e já tentou fallback, mostra placeholder
  if (status === 'error' && (!fallbackSrc || hasFallback)) {
    return (
      <div className={`${className} image-error`} role="img" aria-label={alt}>
        <div className="image-placeholder">
          <span>📷</span>
          <small>Imagem não disponível</small>
        </div>
      </div>
    );
  }

  // Se ainda está carregando, mostra skeleton
  if (status === 'loading') {
    return (
      <div className={`${className} image-skeleton`} role="img" aria-label={`Carregando ${alt}`}>
        <div className="image-placeholder">
          <span>⏳</span>
          <small>Carregando...</small>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${status === 'loaded' ? 'loaded' : ''}`}
      loading={loading}
      decoding="async"
      {...props}
    />
  );
};

export default OptimizedImage;
