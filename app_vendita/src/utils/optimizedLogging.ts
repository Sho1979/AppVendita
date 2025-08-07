/**
 * Sistema di Logging Ottimizzato
 * 
 * Previene log spam e migliora le performance attraverso:
 * - Throttling intelligente
 * - Cache per prevenire duplicati
 * - Cleanup automatico memoria
 */

import { logger } from './logger';

// Cache globale per throttling
const logThrottleCache = new Map<string, number>();
const LOG_THROTTLE_MS = 5000; // 5 secondi di throttle
const CACHE_CLEANUP_INTERVAL = 300000; // 5 minuti cleanup
const MAX_CACHE_SIZE = 1000; // Massimo 1000 entries

/**
 * Cleanup periodico della cache per prevenire memory leaks
 */
const cleanupThrottleCache = () => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, timestamp] of logThrottleCache.entries()) {
    if (now - timestamp > CACHE_CLEANUP_INTERVAL) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => logThrottleCache.delete(key));
  
  // Se cache troppo grande, rimuovi entries più vecchie
  if (logThrottleCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(logThrottleCache.entries())
      .sort(([,a], [,b]) => a - b)
      .slice(0, logThrottleCache.size - MAX_CACHE_SIZE);
    
    entries.forEach(([key]) => logThrottleCache.delete(key));
  }
};

// Setup cleanup automatico
setInterval(cleanupThrottleCache, CACHE_CLEANUP_INTERVAL);

/**
 * Logger con throttling intelligente
 */
export class OptimizedLogger {
  /**
   * Log con throttling per prevenire spam
   */
  static throttledLog(
    component: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    throttleMs: number = LOG_THROTTLE_MS
  ): boolean {
    const key = `${component}_${level}_${message}`;
    const now = Date.now();
    const lastLogged = logThrottleCache.get(key) || 0;
    
    if (now - lastLogged > throttleMs) {
      logThrottleCache.set(key, now);
      logger[level](component, message, data);
      return true;
    }
    
    return false; // Log skipped
  }

  /**
   * Log solo se dati sono cambiati significativamente
   */
  static conditionalLog(
    component: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data: any,
    condition: (previousData: any, currentData: any) => boolean
  ): boolean {
    const key = `${component}_conditional_${message}`;
    const dataKey = `${key}_data`;
    
    // Recupera dati precedenti
    const previousData = (globalThis as any)[dataKey];
    
    // Controlla se loggare
    if (!previousData || condition(previousData, data)) {
      (globalThis as any)[dataKey] = data;
      logger[level](component, message, data);
      return true;
    }
    
    return false;
  }

  /**
   * Log di performance con metriche automatiche
   */
  static performanceLog(
    component: string,
    operation: string,
    startTime: number,
    additionalData?: any
  ): void {
    const duration = Date.now() - startTime;
    
    // Log solo se operation è lenta (>100ms) o ogni 10 operazioni
    const shouldLog = duration > 100 || Math.random() < 0.1;
    
    if (shouldLog) {
      this.throttledLog(
        component,
        duration > 500 ? 'warn' : 'debug',
        `Performance: ${operation}`,
        {
          duration: `${duration}ms`,
          slow: duration > 100,
          ...additionalData
        },
        2000 // 2 secondi throttle per performance logs
      );
    }
  }

  /**
   * Log aggregato per eventi frequenti
   */
  static aggregatedLog(
    component: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    eventType: string,
    data?: any
  ): void {
    const key = `${component}_aggregated_${eventType}`;
    const now = Date.now();
    
    // Inizializza contatore se non esiste
    if (!(globalThis as any)[key]) {
      (globalThis as any)[key] = {
        count: 0,
        firstEvent: now,
        lastEvent: now,
        samples: []
      };
    }
    
    const aggregated = (globalThis as any)[key];
    aggregated.count++;
    aggregated.lastEvent = now;
    
    // Campiona alcuni eventi per dettagli
    if (aggregated.samples.length < 5) {
      aggregated.samples.push(data);
    }
    
    // Log aggregato ogni 10 eventi o ogni 30 secondi
    const shouldLog = aggregated.count % 10 === 0 || 
                     (now - aggregated.firstEvent) > 30000;
    
    if (shouldLog) {
      logger[level](component, `Aggregated: ${eventType}`, {
        totalEvents: aggregated.count,
        timespan: `${now - aggregated.firstEvent}ms`,
        samplesData: aggregated.samples,
        eventsPerSecond: aggregated.count / ((now - aggregated.firstEvent) / 1000)
      });
      
      // Reset aggregazione
      (globalThis as any)[key] = null;
    }
  }

  /**
   * Cleanup manuale cache
   */
  static clearCache(): void {
    logThrottleCache.clear();
    logger.info('OptimizedLogger', 'Cache cleared manually');
  }

  /**
   * Statistiche cache
   */
  static getCacheStats(): {
    size: number;
    oldestEntry: number;
    newestEntry: number;
    memoryEstimate: string;
  } {
    const entries = Array.from(logThrottleCache.values());
    
    return {
      size: logThrottleCache.size,
      oldestEntry: entries.length > 0 ? Math.min(...entries) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries) : 0,
      memoryEstimate: `~${Math.round(logThrottleCache.size * 50 / 1024)}KB`
    };
  }
}

// Export per backward compatibility
export const throttledLog = OptimizedLogger.throttledLog;
export const conditionalLog = OptimizedLogger.conditionalLog;
export const performanceLog = OptimizedLogger.performanceLog;
export const aggregatedLog = OptimizedLogger.aggregatedLog;
