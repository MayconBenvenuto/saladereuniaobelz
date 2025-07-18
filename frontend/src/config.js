// Configurações da aplicação
export const config = {
  // URLs da API
  API_BASE_URL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001',
  
  // Timeouts mais generosos
  API_TIMEOUT: 15000, // 15 segundos
  API_RETRY_TIMEOUT: 20000, // 20 segundos no retry
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  CACHE_DURATION_OFFLINE: 30 * 60 * 1000, // 30 minutos quando offline
  
  // Retry com menos tentativas mas delay maior
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1s base delay
  
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
