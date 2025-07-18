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
  
  // Timeouts otimizados para produção
  API_TIMEOUT: 20000, // 20 segundos inicial
  API_RETRY_TIMEOUT: 25000, // 25 segundos no retry
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  CACHE_DURATION_OFFLINE: 30 * 60 * 1000, // 30 minutos quando offline
  
  // Retry com configuração mais robusta
  MAX_RETRIES: 3,
  RETRY_DELAY: 1500, // 1.5s base delay
  
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
