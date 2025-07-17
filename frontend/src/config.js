// Configurações da aplicação
export const config = {
  // URLs da API
  API_BASE_URL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001',
  
  // Timeouts
  API_TIMEOUT: 8000, // 8 segundos
  API_RETRY_TIMEOUT: 12000, // 12 segundos no retry
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  CACHE_DURATION_OFFLINE: 30 * 60 * 1000, // 30 minutos quando offline
  
  // Retry
  MAX_RETRIES: 2,
  RETRY_DELAY: 500, // 500ms base delay
  
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
