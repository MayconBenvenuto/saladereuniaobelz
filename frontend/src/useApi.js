import { useState, useCallback, useEffect } from 'react';
import { config, logDebug, logError, logWarn } from './config';
import { connectionMonitor } from './ConnectionMonitor';

// Hook personalizado para requisições com retry e cache
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('online');

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      setError(null);
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      setError('Sem conexão com a internet');
    };

    const handleError = (error) => {
      setConnectionStatus('error');
      setError(error?.message || 'Erro de conexão');
    };

    connectionMonitor.on('online', handleOnline);
    connectionMonitor.on('offline', handleOffline);
    connectionMonitor.on('error', handleError);

    return () => {
      connectionMonitor.off('online', handleOnline);
      connectionMonitor.off('offline', handleOffline);
      connectionMonitor.off('error', handleError);
    };
  }, []);

  // Função para detectar se estamos offline
  const isOnline = () => navigator.onLine;

  // Função para fazer requisição com retry
  const fetchWithRetry = useCallback(async (url, options = {}, maxRetries = config.MAX_RETRIES) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Timeout progressivo
        const timeout = config.API_TIMEOUT + (i * (config.API_RETRY_TIMEOUT - config.API_TIMEOUT));
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        logDebug(`Fazendo requisição para: ${url} (tentativa ${i + 1}/${maxRetries})`);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          logDebug(`Sucesso na requisição para: ${url}`);
          setError(null);
          return response;
        }
        
        // Se for erro 4xx, não retry
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        // Para 5xx, continua tentando
        lastError = new Error(`Erro ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          logWarn(`Tentativa ${i + 1}/${maxRetries} - Timeout após ${config.API_TIMEOUT + (i * (config.API_RETRY_TIMEOUT - config.API_TIMEOUT))}ms`);
        } else {
          logWarn(`Tentativa ${i + 1}/${maxRetries} - ${error.message}`);
        }
        
        // Se não for a última tentativa, aguarda antes de tentar novamente
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }, []);

  // Função para fazer requisição com loading state
  const request = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithRetry(url, options);
      return await response.json();
    } catch (error) {
      logError('Erro na requisição:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchWithRetry]);

  return {
    loading,
    error,
    request,
    fetchWithRetry,
    setError,
    setLoading,
    connectionStatus,
    isOnline: connectionStatus === 'online'
  };
};
