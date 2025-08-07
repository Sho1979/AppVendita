import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { User } from '../../data/models/User';
import { SalesPoint } from '../../data/models/SalesPoint';
import { useProgressiveIntegration } from '../../hooks/useProgressiveIntegration';
import { useProgressiveCalculation } from '../../hooks/useProgressiveCalculation';
import { ProgressiveCalculationService } from '../../services/ProgressiveCalculationService';
import { useCalendarStore } from '../../stores/calendarStore';
import { logger } from '../../utils/logger';
import { useBatchedState, useStatePerformanceMonitor } from '../../hooks/useBatchedState';

// Manteniamo le stesse interfacce per compatibilità
export interface ActiveFilters {
  userId: string;
  salesPointId: string;
  selectedDate: Date | null;
}

export interface CalendarState {
  entries: CalendarEntry[];
  users: User[];
  salesPoints: SalesPoint[];
  activeFilters: ActiveFilters;
  isLoading: boolean;
  error: string | null;
  lastSyncTimestamp: number;
}

// Manteniamo le stesse azioni per compatibilità
export type CalendarAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENTRIES'; payload: CalendarEntry[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_SALES_POINTS'; payload: SalesPoint[] }
  | { type: 'UPDATE_FILTERS'; payload: Partial<ActiveFilters> }
  | { type: 'ADD_ENTRY'; payload: CalendarEntry }
  | { type: 'UPDATE_ENTRY'; payload: CalendarEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'UPDATE_SYNC_TIMESTAMP'; payload: number };

// Context
interface CalendarContextType {
  state: CalendarState;
  dispatch: React.Dispatch<CalendarAction>;
  progressiveSystem: {
    isInitialized: boolean;
    updateEntryWithProgressiveSync: (entry: CalendarEntry) => void;
    getDisplayDataForDate: (date: string, originalEntry?: CalendarEntry, contextIsInitialized?: boolean) => any;
    loadFocusReferencesData: (date: string, focusReferencesData: any[]) => void;
    getTotalSellIn: () => number;
    getMonthlySellIn: (year: number, month: number) => number;
    resetSystem: () => void;
    resetInitialization: () => void;
    getLastUpdated: () => string;
  };
  selectedSalesPointId: string;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

// Provider
interface CalendarProviderProps {
  children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  // Performance monitoring per CalendarProvider
  const { renderCount } = useStatePerformanceMonitor('CalendarProvider');
  
  // Usa il calendar store di Zustand
  const calendarStore = useCalendarStore();
  
  // Crea un'istanza condivisa del servizio progressivo
  const [sharedProgressiveService] = useState(() => new ProgressiveCalculationService());

  // Batch state per ottimizzare re-render
  const [providerState, updateProviderState] = useBatchedState({
    lastInitialization: 0,
    initializationInProgress: false,
    syncInProgress: false,
    lastSyncBatch: 0,
    performanceMetrics: {
      totalSyncs: 0,
      avgSyncTime: 0,
      lastSyncDuration: 0
    }
  }, {
    debounceMs: 100, // Più aggressivo per provider
    maxBatchSize: 3,
    logUpdates: true
  });

  // Inizializza il sistema progressivo con l'istanza condivisa
  const {
    isInitialized,
    initializeWithExistingData,
    updateEntryWithProgressiveSync,
    getDisplayDataForDate,
    loadFocusReferencesData,
    getTotalSellIn,
    getMonthlySellIn,
    resetInitialization
  } = useProgressiveIntegration(sharedProgressiveService);

  // Ottieni il metodo resetSystem dal hook useProgressiveCalculation
  const { resetSystem, getLastUpdated } = useProgressiveCalculation(sharedProgressiveService);

  // Memoizza la condizione di inizializzazione per evitare re-render inutili
  const shouldInitialize = useMemo(() => 
    calendarStore.entries.length > 0 && !isInitialized, 
    [calendarStore.entries.length, isInitialized]
  );

  // Inizializza il sistema progressivo quando necessario
  useEffect(() => {
    if (shouldInitialize) {
      try {
        // Carica tutti i dati esistenti nel sistema progressivo
        initializeWithExistingData(calendarStore.entries);
        logger.info('CalendarProvider', 'Sistema progressivo inizializzato', { 
          entriesCount: calendarStore.entries.length 
        });
      } catch (error) {
        logger.error('CalendarProvider', 'Errore inizializzazione sistema progressivo', error);
      }
    }
  }, [shouldInitialize, initializeWithExistingData, calendarStore.entries]);

  // Memoizza le entries da sincronizzare per evitare calcoli ripetuti
  const entriesToSync = useMemo(() => {
    if (!isInitialized || calendarStore.entries.length === 0) return [];
    
    return calendarStore.entries.filter(entry => {
      const entryTimestamp = new Date(entry.updatedAt || entry.createdAt).getTime();
      return entryTimestamp > calendarStore.lastSyncTimestamp;
    });
  }, [isInitialized, calendarStore.entries, calendarStore.lastSyncTimestamp]);

  // Sincronizza le nuove entries con il sistema progressivo (ottimizzato)
  useEffect(() => {
    if (entriesToSync.length > 0) {
      logger.debug('CalendarProvider', 'Sincronizzazione entries progressive', { 
        count: entriesToSync.length 
      });
      
      entriesToSync.forEach(entry => {
        try {
          updateEntryWithProgressiveSync(entry);
        } catch (error) {
          logger.warn('CalendarProvider', 'Errore sincronizzazione entry', { 
            entryId: entry.id, 
            error 
          });
        }
      });
    }
  }, [entriesToSync, updateEntryWithProgressiveSync]);

  // Adapter per mantenere la compatibilità con l'interfaccia esistente
  const state: CalendarState = {
    entries: calendarStore.entries,
    users: calendarStore.users,
    salesPoints: calendarStore.salesPoints,
    activeFilters: calendarStore.activeFilters,
    isLoading: calendarStore.isLoading,
    error: calendarStore.error,
    lastSyncTimestamp: calendarStore.lastSyncTimestamp,
  };

  // Adapter per dispatch che mappa le azioni al calendar store
  const dispatch = (action: CalendarAction) => {
    
    switch (action.type) {
      case 'SET_LOADING':
        calendarStore.setLoading(action.payload);
        break;
      case 'SET_ERROR':
        calendarStore.setError(action.payload);
        break;
      case 'SET_ENTRIES':
        calendarStore.setEntries(action.payload);
        break;
      case 'SET_USERS':
        calendarStore.setUsers(action.payload);
        break;
      case 'SET_SALES_POINTS':
        calendarStore.setSalesPoints(action.payload);
        break;
      case 'UPDATE_FILTERS':
        calendarStore.updateFilters(action.payload);
        break;
      case 'ADD_ENTRY':
        calendarStore.addEntry(action.payload);
        break;
      case 'UPDATE_ENTRY':
        calendarStore.updateEntry(action.payload);
        break;
      case 'DELETE_ENTRY':
        calendarStore.deleteEntry(action.payload);
        break;
      case 'UPDATE_SYNC_TIMESTAMP':
        calendarStore.setLastSyncTimestamp(action.payload);
        break;
      default: {
        const neverAction = action as never;
      }
    }
  };

  return (
    <CalendarContext.Provider value={{ 
      state, 
      dispatch,
      // Esponi il sistema progressivo
      progressiveSystem: {
        isInitialized,
        updateEntryWithProgressiveSync,
        getDisplayDataForDate,
        loadFocusReferencesData,
        getTotalSellIn,
        getMonthlySellIn,
        resetSystem,
        resetInitialization,
        getLastUpdated
      },
      selectedSalesPointId: state.activeFilters.salesPointId
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

// Hook personalizzato
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    console.error('❌ useCalendar: Hook usato fuori dal CalendarProvider');
    throw new Error('useCalendar must be used within a CalendarProvider');
  }

  return context;
}

