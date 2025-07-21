// FORÇAR REBUILD E CACHE BUST
export const BUILD_TIMESTAMP = '${new Date().toISOString()}';
export const FORCE_REBUILD = true;

// Log forçado para debug em produção
console.log('[FORCE REBUILD] Timestamp:', BUILD_TIMESTAMP);
console.log('[FORCE REBUILD] Cache bust ativo');

// Configuração URGENTE para produção
export const URGENT_CONFIG = {
  FORCE_NO_CACHE: true,
  MAX_TIMEOUT: 29000,
  PRODUCTION_DEBUG: true
};
