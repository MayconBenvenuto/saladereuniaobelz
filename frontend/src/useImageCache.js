import { useState, useEffect } from 'react';

// Cache de imagens em memória
const imageCache = new Map();

export const useImageCache = (src) => {
  const [status, setStatus] = useState('loading');
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }

    // Verifica se a imagem já está em cache
    if (imageCache.has(src)) {
      const cachedStatus = imageCache.get(src);
      setStatus(cachedStatus);
      setImageSrc(src);
      return;
    }

    // Se não está em cache, carrega a imagem
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(src, 'loaded');
      setStatus('loaded');
      setImageSrc(src);
    };
    
    img.onerror = () => {
      imageCache.set(src, 'error');
      setStatus('error');
    };
    
    img.src = src;
    setStatus('loading');
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { status, imageSrc };
};

// Hook para preload de imagens
export const useImagePreload = (imageList) => {
  const [preloadedImages, setPreloadedImages] = useState(new Set());

  useEffect(() => {
    const loadImages = async () => {
      const promises = imageList.map(src => {
        return new Promise((resolve) => {
          if (imageCache.has(src)) {
            resolve(src);
            return;
          }

          const img = new Image();
          img.onload = () => {
            imageCache.set(src, 'loaded');
            resolve(src);
          };
          img.onerror = () => {
            imageCache.set(src, 'error');
            resolve(src);
          };
          img.src = src;
        });
      });

      const loaded = await Promise.all(promises);
      setPreloadedImages(new Set(loaded));
    };

    if (imageList.length > 0) {
      loadImages();
    }
  }, [imageList]);

  return preloadedImages;
};

// Função para limpar cache antigo (pode ser chamada periodicamente)
export const clearImageCache = () => {
  imageCache.clear();
};

// Função para verificar o tamanho do cache
export const getCacheSize = () => {
  return imageCache.size;
};
