import { useState, useCallback, useEffect } from 'react';
import { config, logDebug, logError, logWarn } from './config';

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

    // Usar event listeners nativos do browser
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Função para detectar se estamos offline
  const isOnline = () => navigator.onLine;

  // Função para fazer requisição com retry
  const fetchWithRetry = useCallback(async (url, options = {}, maxRetries = config.MAX_RETRIES) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Timeout diferenciado para primeira tentativa e retries
        const timeout = i === 0 ? config.API_TIMEOUT : config.API_RETRY_TIMEOUT;
        
        logDebug(`Fazendo requisição para: ${url} (tentativa ${i + 1}/${maxRetries}) - timeout: ${timeout}ms`);
        
        // Usar Promise.race para implementar timeout de forma mais compatível
        const fetchPromise = fetch(url, {
          ...options,
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          }
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout de ${timeout}ms excedido`)), timeout);
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
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
        
        if (error.message.includes('Timeout')) {
          logWarn(`Tentativa ${i + 1}/${maxRetries} - ${error.message}`);
        } else {
          logWarn(`Tentativa ${i + 1}/${maxRetries} - ${error.message}`);
        }
        
        // Se não for a última tentativa, aguarda antes de tentar novamente
        if (i < maxRetries - 1) {
          const delay = config.RETRY_DELAY * Math.pow(2, i); // Backoff exponencial
          await new Promise(resolve => setTimeout(resolve, delay));
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
