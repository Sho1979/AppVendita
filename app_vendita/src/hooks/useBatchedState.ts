/**
 * Hook per Batch State Updates
 * 
 * Riduce re-render combinando multiple setState in batch
 * e usando debouncing per aggiornamenti frequenti.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';

type StateUpdater<T> = (prevState: T) => T;
type BatchedUpdates<T> = Partial<T> | StateUpdater<T>;

interface BatchedStateOptions {
  debounceMs?: number;
  maxBatchSize?: number;
  logUpdates?: boolean;
}

/**
 * Hook per gestire state updates in batch
 */
export function useBatchedState<T extends Record<string, any>>(
  initialState: T,
  options: BatchedStateOptions = {}
): [T, (updates: BatchedUpdates<T>) => void, () => void] {
  
  const {
    debounceMs = 16, // ~60fps
    maxBatchSize = 10,
    logUpdates = __DEV__
  } = options;

  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<BatchedUpdates<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateCount = useRef(0);

  // Flush delle pending updates
  const flushUpdates = useCallback(() => {
    if (pendingUpdates.current.length === 0) return;

    const startTime = Date.now();
    const batchSize = pendingUpdates.current.length;

    setState(prevState => {
      let newState = { ...prevState };
      
      // Applica tutti gli aggiornamenti in batch
      for (const update of pendingUpdates.current) {
        if (typeof update === 'function') {
          newState = (update as StateUpdater<T>)(newState);
        } else {
          newState = { ...newState, ...update };
        }
      }

      return newState;
    });

    // Clear pending updates
    pendingUpdates.current = [];
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Log performance per debug
    if (logUpdates) {
      updateCount.current++;
      const duration = Date.now() - startTime;
      
      if (updateCount.current % 20 === 0 || duration > 16) {
        logger.debug('BatchedState', 'Batch update applied', {
          batchSize,
          duration: `${duration}ms`,
          totalUpdates: updateCount.current,
          efficient: duration <= 16
        });
      }
    }
  }, [logUpdates]);

  // Batch update function
  const updateState = useCallback((updates: BatchedUpdates<T>) => {
    // Aggiungi aggiornamento alla coda
    pendingUpdates.current.push(updates);

    // Flush immediato se batch troppo grande
    if (pendingUpdates.current.length >= maxBatchSize) {
      flushUpdates();
      return;
    }

    // Debounce per aggiornamenti frequenti
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(flushUpdates, debounceMs);
  }, [flushUpdates, maxBatchSize, debounceMs]);

  // Force flush function
  const forceFlush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    flushUpdates();
  }, [flushUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, updateState, forceFlush];
}

/**
 * Hook specializzato per loading states
 */
export function useBatchedLoadingState() {
  return useBatchedState({
    isLoading: false,
    loadingMessage: '',
    hasError: false,
    errorMessage: '',
    progress: 0,
    lastUpdate: Date.now()
  });
}

/**
 * Hook specializzato per calendar state
 */
export function useBatchedCalendarState() {
  return useBatchedState({
    selectedDate: new Date(),
    calendarView: 'week' as 'week' | 'month',
    entries: [] as any[],
    filteredEntries: [] as any[],
    isLoading: false,
    lastSync: 0,
    selectedUserId: '',
    selectedSalesPointId: '',
    forceRenderKey: 0
  }, {
    debounceMs: 50, // Più lento per calendar updates
    maxBatchSize: 5,
    logUpdates: true
  });
}

/**
 * Hook per performance monitoring delle state updates
 */
export function useStatePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRender = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRender.current;
    lastRender.current = now;

    // Log se re-render troppo frequenti
    if (timeSinceLastRender < 16 && renderCount.current > 1) {
      logger.warn('StatePerformance', `Frequent re-render detected in ${componentName}`, {
        renderCount: renderCount.current,
        timeSinceLastRender: `${timeSinceLastRender}ms`,
        frequency: `${1000/timeSinceLastRender}fps`
      });
    }

    // Log statistiche ogni 50 render
    if (renderCount.current % 50 === 0) {
      logger.debug('StatePerformance', `${componentName} render stats`, {
        totalRenders: renderCount.current,
        avgFrequency: `${renderCount.current / ((now - lastRender.current) / 1000)}fps`
      });
    }
  });

  return {
    renderCount: renderCount.current,
    resetStats: () => {
      renderCount.current = 0;
      lastRender.current = Date.now();
    }
  };
}
