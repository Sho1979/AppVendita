/**
 * Hook per accedere ai repository tramite Dependency Injection
 * 
 * Fornisce accesso type-safe ai repository senza istanze hardcoded.
 * Gestisce anche fallback e configurazione lazy.
 */

import { useMemo } from 'react';
import { FirebaseCalendarRepositoryAdapter } from '../data/repositories/firebaseCalendarRepositoryAdapter';
import { AsyncStorageCalendarRepository } from '../data/repositories/CalendarRepository';
import { logger } from '../utils/logger';

// Type per i repository disponibili
export type RepositoryType = 'firebase' | 'localStorage' | 'auto';

interface RepositoryConfig {
  type: RepositoryType;
  enableFallback: boolean;
}

const defaultConfig: RepositoryConfig = {
  type: 'auto', // Auto-detect basato su disponibilità Firebase
  enableFallback: true,
};

/**
 * Hook principale per ottenere il repository del calendario
 */
export const useCalendarRepository = (config: Partial<RepositoryConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  const repository = useMemo(() => {
    try {
      switch (finalConfig.type) {
        case 'firebase':
          logger.data('Repository: Usando Firebase', { type: 'firebase' });
          return new FirebaseCalendarRepositoryAdapter();
        
        case 'localStorage':
          logger.data('Repository: Usando AsyncStorage', { type: 'localStorage' });
          return new AsyncStorageCalendarRepository();
        
        case 'auto':
        default:
          // Auto-detect: prova Firebase first, fallback ad AsyncStorage
          try {
            logger.data('Repository: Auto-detect, tentativo Firebase', {});
            return new FirebaseCalendarRepositoryAdapter();
          } catch (error) {
            if (finalConfig.enableFallback) {
              logger.warn('Repository', 'Firebase non disponibile, fallback ad AsyncStorage', error);
              return new AsyncStorageCalendarRepository();
            } else {
              throw error;
            }
          }
      }
    } catch (error) {
      logger.error('Repository', 'Errore nella creazione repository', error);
      
      // Last resort fallback
      if (finalConfig.enableFallback) {
        logger.warn('Repository', 'Usando AsyncStorage come ultimo fallback', {});
        return new AsyncStorageCalendarRepository();
      }
      
      throw error;
    }
  }, [finalConfig.type, finalConfig.enableFallback]);

  return repository;
};

/**
 * Hook semplificato per il caso d'uso più comune
 */
export const useRepository = () => {
  return useCalendarRepository({ type: 'auto', enableFallback: true });
};

/**
 * Hook per forzare l'uso di Firebase (per componenti che ne hanno bisogno)
 */
export const useFirebaseRepository = () => {
  return useCalendarRepository({ type: 'firebase', enableFallback: false });
};

/**
 * Hook per forzare l'uso di AsyncStorage (per testing o offline)
 */
export const useLocalRepository = () => {
  return useCalendarRepository({ type: 'localStorage', enableFallback: false });
};

/**
 * Hook con configurazione avanzata per casi speciali
 */
export const useRepositoryWithConfig = (
  type: RepositoryType = 'auto',
  enableFallback: boolean = true
) => {
  return useCalendarRepository({ type, enableFallback });
};

export default useRepository;
