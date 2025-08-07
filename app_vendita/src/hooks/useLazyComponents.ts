/**
 * Hook per lazy loading e code splitting avanzato
 * 
 * Implementa strategie di caricamento intelligente per ottimizzare
 * le performance dell'applicazione e ridurre il bundle iniziale.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';

// Tipi per component registry
type ComponentLoader<T = any> = () => Promise<{ default: T }>;
type ComponentCache = Map<string, any>;
type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

interface LazyComponentState<T = any> {
  component: T | null;
  loading: boolean;
  error: Error | null;
  loaded: boolean;
}

interface UseLazyComponentsConfig {
  enableCaching?: boolean;
  preloadDelay?: number;
  enableDebugLogs?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

// Cache globale per i componenti caricati
const componentCache: ComponentCache = new Map();

// Registry dei caricatori di componenti
const componentRegistry = new Map<string, ComponentLoader>();

/**
 * Registra un componente per lazy loading
 */
export const registerLazyComponent = <T = any>(
  name: string, 
  loader: ComponentLoader<T>
): void => {
  componentRegistry.set(name, loader);
  logger.performance('Componente registrato per lazy loading', { name });
};

/**
 * Hook principale per lazy loading dei componenti
 */
export const useLazyComponent = <T = any>(
  componentName: string,
  config: UseLazyComponentsConfig = {}
): LazyComponentState<T> => {
  
  const {
    enableCaching = true,
    enableDebugLogs = false,
    retryAttempts = 3,
    retryDelay = 1000,
  } = config;
  
  const [state, setState] = useState<LazyComponentState<T>>({
    component: null,
    loading: false,
    error: null,
    loaded: false,
  });
  
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [retryCount, setRetryCount] = useState(0);
  
  // Verifica se il componente è già in cache
  const cachedComponent = useMemo(() => {
    if (enableCaching && componentCache.has(componentName)) {
      const cached = componentCache.get(componentName);
      if (enableDebugLogs) {
        logger.performance('Componente caricato da cache', { componentName });
      }
      return cached;
    }
    return null;
  }, [componentName, enableCaching, enableDebugLogs]);
  
  // Funzione per caricare il componente
  const loadComponent = useCallback(async (): Promise<void> => {
    // Se abbiamo il componente in cache, usalo
    if (cachedComponent) {
      setState({
        component: cachedComponent,
        loading: false,
        error: null,
        loaded: true,
      });
      setLoadingState('loaded');
      return;
    }
    
    // Ottieni il loader dal registry
    const loader = componentRegistry.get(componentName);
    if (!loader) {
      const error = new Error(`Componente '${componentName}' non registrato`);
      setState(prev => ({ ...prev, error, loading: false }));
      setLoadingState('error');
      logger.error('LazyComponents', 'Componente non registrato', error);
      return;
    }
    
    setLoadingState('loading');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    if (enableDebugLogs) {
      logger.performance('Inizio caricamento lazy component', { 
        componentName, 
        retryCount 
      });
    }
    
    try {
      const startTime = performance.now();
      
      // Carica il componente
      const module = await loader();
      const component = module.default;
      
      const loadTime = performance.now() - startTime;
      
      // Salva in cache se abilitato
      if (enableCaching) {
        componentCache.set(componentName, component);
      }
      
      setState({
        component,
        loading: false,
        error: null,
        loaded: true,
      });
      setLoadingState('loaded');
      setRetryCount(0);
      
      if (enableDebugLogs) {
        logger.performance('Lazy component caricato con successo', {
          componentName,
          loadTime: `${loadTime.toFixed(2)}ms`,
          fromCache: false,
        });
      }
      
    } catch (error) {
      const shouldRetry = retryCount < retryAttempts;
      
      logger.error('LazyComponents', 'Errore nel caricamento componente', {
        componentName,
        error,
        retryCount,
        willRetry: shouldRetry,
      });
      
      if (shouldRetry) {
        setRetryCount(prev => prev + 1);
        
        // Retry con delay esponenziale
        setTimeout(() => {
          loadComponent();
        }, retryDelay * Math.pow(2, retryCount));
        
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Errore di caricamento'),
        }));
        setLoadingState('error');
      }
    }
  }, [
    cachedComponent,
    componentName,
    enableCaching,
    enableDebugLogs,
    retryAttempts,
    retryDelay,
    retryCount,
  ]);
  
  // Effetto per impostare il componente dalla cache se disponibile
  useEffect(() => {
    if (cachedComponent && !state.loaded) {
      setState({
        component: cachedComponent,
        loading: false,
        error: null,
        loaded: true,
      });
      setLoadingState('loaded');
    }
  }, [cachedComponent, state.loaded]);
  
  return {
    ...state,
    loadComponent,
    loadingState,
    retryCount,
  } as LazyComponentState<T> & {
    loadComponent: () => Promise<void>;
    loadingState: LoadingState;
    retryCount: number;
  };
};

/**
 * Hook per preload intelligente di componenti
 */
export const usePreloadComponents = (
  componentNames: string[],
  config: UseLazyComponentsConfig & {
    enabled?: boolean;
    priority?: 'high' | 'low';
    intersectionThreshold?: number;
  } = {}
): void => {
  
  const {
    enabled = true,
    preloadDelay = 2000,
    priority = 'low',
    enableDebugLogs = false,
  } = config;
  
  useEffect(() => {
    if (!enabled || componentNames.length === 0) return;
    
    const preloadComponents = async (): Promise<void> => {
      if (enableDebugLogs) {
        logger.performance('Inizio preload componenti', { 
          components: componentNames,
          priority 
        });
      }
      
      // Preload con priorità bassa per non interferire con l'UI
      const preloadPromises = componentNames.map(async (componentName) => {
        // Verifica se già in cache
        if (componentCache.has(componentName)) {
          return;
        }
        
        const loader = componentRegistry.get(componentName);
        if (!loader) {
          if (enableDebugLogs) {
            logger.warn('LazyComponents', 'Componente per preload non registrato', { componentName });
          }
          return;
        }
        
        try {
          const startTime = performance.now();
          const module = await loader();
          const loadTime = performance.now() - startTime;
          
          // Salva in cache
          componentCache.set(componentName, module.default);
          
          if (enableDebugLogs) {
            logger.performance('Componente preloadato', {
              componentName,
              loadTime: `${loadTime.toFixed(2)}ms`,
            });
          }
          
        } catch (error) {
          if (enableDebugLogs) {
            logger.warn('LazyComponents', 'Errore nel preload componente', { 
              componentName, 
              error 
            });
          }
        }
      });
      
      // Esegui preload con scheduler appropriato
      if (priority === 'high') {
        await Promise.all(preloadPromises);
      } else {
        // Priorità bassa: usa requestIdleCallback se disponibile
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            Promise.all(preloadPromises);
          });
        } else {
          setTimeout(() => {
            Promise.all(preloadPromises);
          }, preloadDelay);
        }
      }
    };
    
    // Avvia preload dopo il delay configurato
    const timeoutId = setTimeout(preloadComponents, preloadDelay);
    
    return () => clearTimeout(timeoutId);
  }, [componentNames, enabled, preloadDelay, priority, enableDebugLogs]);
};

/**
 * Hook per bundle analysis e ottimizzazioni
 */
export const useBundleAnalytics = (enabled: boolean = false) => {
  const [analytics, setAnalytics] = useState({
    totalComponents: 0,
    loadedComponents: 0,
    cachedComponents: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
  });
  
  useEffect(() => {
    if (!enabled) return;
    
    const updateAnalytics = () => {
      const totalComponents = componentRegistry.size;
      const cachedComponents = componentCache.size;
      const cacheHitRate = totalComponents > 0 ? (cachedComponents / totalComponents) * 100 : 0;
      
      setAnalytics({
        totalComponents,
        loadedComponents: cachedComponents, // Assumiamo che i cached siano loaded
        cachedComponents,
        averageLoadTime: 0, // Potremmo tracciare questo se necessario
        cacheHitRate,
      });
      
      logger.performance('Bundle analytics aggiornate', {
        totalComponents,
        cachedComponents,
        cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
      });
    };
    
    // Aggiorna analytics periodicamente
    const intervalId = setInterval(updateAnalytics, 5000);
    
    // Aggiornamento iniziale
    updateAnalytics();
    
    return () => clearInterval(intervalId);
  }, [enabled]);
  
  return analytics;
};

/**
 * Utility per pulire la cache dei componenti
 */
export const clearComponentCache = (componentNames?: string[]): void => {
  if (componentNames) {
    componentNames.forEach(name => {
      componentCache.delete(name);
      logger.performance('Componente rimosso dalla cache', { componentName: name });
    });
  } else {
    componentCache.clear();
    logger.performance('Cache componenti completamente pulita', {});
  }
};

/**
 * Utility per ottenere stats della cache
 */
export const getCacheStats = () => {
  return {
    size: componentCache.size,
    keys: Array.from(componentCache.keys()),
    registeredComponents: Array.from(componentRegistry.keys()),
  };
};

// Setup dei componenti lazy comuni
export const setupLazyComponents = (): void => {
  // Registra i componenti ottimizzati
  registerLazyComponent('MemoizedWeekCalendar', () => 
    import('../presentation/components/optimized/MemoizedWeekCalendar')
  );
  
  registerLazyComponent('VirtualizedMonthCalendar', () => 
    import('../presentation/components/optimized/VirtualizedMonthCalendar')
  );
  
  registerLazyComponent('FilterManagementContainer', () => 
    import('../presentation/containers/FilterManagementContainer')
  );
  
  registerLazyComponent('EntryManagementContainer', () => 
    import('../presentation/containers/EntryManagementContainer')
  );
  
  registerLazyComponent('DataLoadingContainer', () => 
    import('../presentation/containers/DataLoadingContainer')
  );
  
  logger.performance('Lazy components setup completato', {
    registeredCount: componentRegistry.size
  });
};

export default {
  useLazyComponent,
  usePreloadComponents,
  useBundleAnalytics,
  registerLazyComponent,
  clearComponentCache,
  getCacheStats,
  setupLazyComponents,
};
