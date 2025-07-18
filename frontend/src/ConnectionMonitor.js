// Script de monitoramento e diagnóstico de conexão
import { config, logDebug, logError, logWarn } from './config';

class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000;
    this.callbacks = {
      online: [],
      offline: [],
      error: []
    };
    
    this.init();
  }

  init() {
    // Monitorar eventos de conexão
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Verificação periódica de conectividade
    this.startHealthCheck();
  }

  handleOnline() {
    this.isOnline = true;
    this.retryCount = 0;
    logDebug('Conexão reestabelecida');
    this.notify('online');
  }

  handleOffline() {
    this.isOnline = false;
    logWarn('Conexão perdida');
    this.notify('offline');
  }

  async healthCheck() {
    try {
      // Usar Promise.race para timeout mais compatível
      const fetchPromise = fetch(`${config.API_BASE_URL}/api/health`, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 10000);
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        if (!this.isOnline) {
          this.handleOnline();
        }
        return true;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      logError('Health check error:', error);
      if (this.isOnline) {
        this.handleOffline();
      }
      return false;
    }
  }

  startHealthCheck() {
    setInterval(() => {
      if (this.isOnline) {
        this.healthCheck();
      }
    }, 30000); // Check a cada 30 segundos
  }

  async retryOperation(operation, maxRetries = this.maxRetries) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        this.retryCount = 0;
        return result;
      } catch (error) {
        this.retryCount++;
        logWarn(`Tentativa ${i + 1}/${maxRetries} falhou:`, error.message);
        
        if (i === maxRetries - 1) {
          this.notify('error', error);
          throw error;
        }
        
        // Backoff exponencial
        const delay = this.retryDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  notify(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

// Instância global do monitor
export const connectionMonitor = new ConnectionMonitor();

export default ConnectionMonitor;
