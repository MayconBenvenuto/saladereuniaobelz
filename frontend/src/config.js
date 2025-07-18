// Configurações da aplicação

// Determinar a URL base da API
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Em produção, usa o mesmo domínio onde o frontend está hospedado
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  } else {
    // Em desenvolvimento
    return 'http://localhost:3001';
  }
};

const API_BASE_URL = getApiBaseUrl();

export const config = {
  // URLs da API
  API_BASE_URL,
  
  // Timeouts otimizados para melhor performance
  API_TIMEOUT: 12000, // 12 segundos inicial (reduzido)
  API_RETRY_TIMEOUT: 18000, // 18 segundos no retry
  
  // Cache melhorado
  CACHE_DURATION: 3 * 60 * 1000, // 3 minutos (reduzido para dados mais frescos)
  CACHE_DURATION_OFFLINE: 30 * 60 * 1000, // 30 minutos quando offline
  
  // Retry otimizado
  MAX_RETRIES: 2, // Reduzido para ser mais rápido
  RETRY_DELAY: 1000, // 1s base delay
  
  // Performance
  DEBOUNCE_DELAY: 300, // Para busca em tempo real
  PREFETCH_NEXT_DAY: true, // Pré-carregar próximo dia
  
  // Logs
  DEBUG: process.env.NODE_ENV === 'development'
};

export const logDebug = (...args) => {
  if (config.DEBUG) {
    console.log('[DEBUG]', ...args);
  }
};

export const logError = (...args) => {
  console.error('[ERROR]', ...args);
};

export const logWarn = (...args) => {
  console.warn('[WARN]', ...args);
};

// Log da configuração atual
if (typeof window !== 'undefined') {
  console.log('[CONFIG] Environment:', process.env.NODE_ENV);
  console.log('[CONFIG] API Base URL:', config.API_BASE_URL);
  console.log('[CONFIG] Current Origin:', window.location.origin);
}
