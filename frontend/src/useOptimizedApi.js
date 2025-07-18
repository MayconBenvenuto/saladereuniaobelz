// Hook otimizado para agendamentos com cache inteligente e prefetch
import { useState, useCallback, useEffect, useRef } from 'react';
import { config, logDebug, logError } from './config';

// Cache global para compartilhar entre componentes
const globalCache = new Map();
const pendingRequests = new Map();

// Função para debounce
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

// Hook otimizado para agendamentos
export const useOptimizedApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  // Função para gerar chave de cache
  const getCacheKey = useCallback((endpoint, params = {}) => {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}${paramString ? '?' + paramString : ''}`;
  }, []);
  
  // Função para verificar se cache é válido
  const isCacheValid = useCallback((cacheKey) => {
    const cached = globalCache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    const maxAge = navigator.onLine ? config.CACHE_DURATION : config.CACHE_DURATION_OFFLINE;
    
    return age < maxAge;
  }, []);
  
  // Função para fazer requisição otimizada
  const fetchOptimized = useCallback(async (endpoint, options = {}) => {
    const { params = {}, method = 'GET', body = null, useCache = true } = options;
    const cacheKey = getCacheKey(endpoint, params);
    
    // Verificar cache primeiro (apenas para GET)
    if (method === 'GET' && useCache && isCacheValid(cacheKey)) {
      const cached = globalCache.get(cacheKey);
      logDebug('Cache hit:', cacheKey);
      return cached.data;
    }
    
    // Evitar requisições duplicadas
    if (pendingRequests.has(cacheKey)) {
      logDebug('Aguardando requisição pendente:', cacheKey);
      return await pendingRequests.get(cacheKey);
    }
    
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const url = params && Object.keys(params).length > 0 
      ? `${config.API_BASE_URL}${endpoint}?${new URLSearchParams(params)}`
      : `${config.API_BASE_URL}${endpoint}`;
    
    const requestOptions = {
      method,
      signal: abortControllerRef.current.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    const requestPromise = fetch(url, requestOptions)
      .then(async response => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }
        return response.json();
      });
    
    // Armazenar promise para evitar duplicatas
    pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const data = await requestPromise;
      
      // Armazenar no cache apenas para GET com sucesso
      if (method === 'GET' && useCache) {
        globalCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        // Limpar cache antigo
        if (globalCache.size > 50) {
          const now = Date.now();
          for (const [key, value] of globalCache.entries()) {
            if (now - value.timestamp > config.CACHE_DURATION * 2) {
              globalCache.delete(key);
            }
          }
        }
      }
      
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }, [getCacheKey, isCacheValid]);
  
  // Função com retry otimizado
  const fetchWithRetry = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    let lastError;
    
    for (let attempt = 0; attempt < config.MAX_RETRIES; attempt++) {
      try {
        const result = await fetchOptimized(endpoint, options);
        setLoading(false);
        return result;
      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          setLoading(false);
          throw error;
        }
        
        if (attempt < config.MAX_RETRIES - 1) {
          const delay = config.RETRY_DELAY * Math.pow(2, attempt);
          logDebug(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setLoading(false);
    setError(lastError);
    throw lastError;
  }, [fetchOptimized]);
  
  // Função para prefetch (carregar dados antecipadamente)
  const prefetch = useCallback((endpoint, options = {}) => {
    // Executar em background sem alterar loading state
    fetchOptimized(endpoint, { ...options, useCache: true })
      .catch(error => logDebug('Prefetch failed:', error.message));
  }, [fetchOptimized]);
  
  // Função para invalidar cache
  const invalidateCache = useCallback((pattern) => {
    for (const key of globalCache.keys()) {
      if (key.includes(pattern)) {
        globalCache.delete(key);
      }
    }
  }, []);
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    fetchWithRetry,
    prefetch,
    invalidateCache,
    loading,
    error,
    cacheSize: globalCache.size
  };
};
