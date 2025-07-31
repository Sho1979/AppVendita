import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { User } from '../../data/models/User';
import { SalesPoint } from '../../data/models/SalesPoint';
import { useProgressiveIntegration } from '../../hooks/useProgressiveIntegration';
import { ProgressiveCalculationService } from '../../services/ProgressiveCalculationService';
import { useCalendarStore } from '../../stores/calendarStore';
import { logger } from '../../utils/logger';

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
  };
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

// Provider
interface CalendarProviderProps {
  children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  logger.init('CalendarProvider: Provider inizializzato');

  // Usa il calendar store di Zustand
  const calendarStore = useCalendarStore();
  
  // Crea un'istanza condivisa del servizio progressivo
  const [sharedProgressiveService] = useState(() => new ProgressiveCalculationService());

  // Inizializza il sistema progressivo con l'istanza condivisa
  const {
    isInitialized,
    initializeWithExistingData,
    updateEntryWithProgressiveSync,
    getDisplayDataForDate
  } = useProgressiveIntegration(sharedProgressiveService);

  // Force re-render when isInitialized changes
  const [forceUpdate, setForceUpdate] = useState(0);

  logger.init('CalendarProvider: Stato iniziale del provider', {
    entriesCount: calendarStore.entries.length,
    usersCount: calendarStore.users.length,
    salesPointsCount: calendarStore.salesPoints.length,
    isLoading: calendarStore.isLoading,
    error: calendarStore.error,
    isInitialized,
    forceUpdate,
  });

  // Inizializza il sistema progressivo quando i dati cambiano
  useEffect(() => {
    logger.sync('CalendarProvider: useEffect triggered', {
      entriesCount: calendarStore.entries.length,
      isInitialized,
      hasEntries: calendarStore.entries.length > 0,
      shouldInitialize: calendarStore.entries.length > 0 && !isInitialized
    });
    
    if (calendarStore.entries.length > 0 && !isInitialized) {
      logger.init('CalendarProvider: Inizializzazione sistema progressivo...');
      logger.data('CalendarProvider: Entries da processare', calendarStore.entries.map(entry => ({
        id: entry.id,
        date: entry.date,
        focusReferencesCount: entry.focusReferencesData?.length || 0
      })));
      
      try {
        initializeWithExistingData(calendarStore.entries);
        logger.init('CalendarProvider: Sistema progressivo inizializzato');
        // Force re-render after initialization
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        logger.error('init', 'CalendarProvider: Errore inizializzazione progressivo', error);
      }
    } else if (calendarStore.entries.length === 0) {
      logger.warn('init', 'CalendarProvider: Nessuna entry disponibile per l\'inizializzazione');
    } else if (isInitialized) {
      logger.init('CalendarProvider: Sistema progressivo già inizializzato');
    }
  }, [calendarStore.entries, isInitialized, initializeWithExistingData]);

  // Force re-render when isInitialized changes
  useEffect(() => {
    if (isInitialized) {
      logger.sync('CalendarProvider: isInitialized changed to true, forcing re-render');
      setForceUpdate(prev => prev + 1);
    }
  }, [isInitialized]);

  // Sincronizza le nuove entries con il sistema progressivo
  useEffect(() => {
    if (isInitialized && calendarStore.entries.length > 0) {
      logger.sync('CalendarProvider: Sincronizzazione entries con sistema progressivo...');
      
      // Trova le entries che sono state modificate dopo l'ultima sincronizzazione
      const currentTimestamp = Date.now();
      const entriesToSync = calendarStore.entries.filter(entry => {
        // Sincronizza se l'entry è stata creata o modificata dopo l'ultima sincronizzazione
        const entryTimestamp = new Date(entry.updatedAt || entry.createdAt).getTime();
        return entryTimestamp > calendarStore.lastSyncTimestamp;
      });

      logger.sync(`CalendarProvider: Entries da sincronizzare: ${entriesToSync.length}`);
      
      if (entriesToSync.length > 0) {
        entriesToSync.forEach(entry => {
          try {
            updateEntryWithProgressiveSync(entry);
            logger.sync(`CalendarProvider: Entry ${entry.id} sincronizzata`);
          } catch (error) {
            logger.error('sync', `CalendarProvider: Errore sincronizzazione entry ${entry.id}`, error);
          }
        });
        
        // Aggiorna il timestamp di sincronizzazione
        calendarStore.setLastSyncTimestamp(currentTimestamp);
      }
    }
  }, [calendarStore.entries, calendarStore.lastSyncTimestamp, isInitialized, updateEntryWithProgressiveSync]);

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
    console.log('🔄 CalendarProvider: Dispatch action:', action.type, action.payload);
    
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
        console.warn('⚠️ CalendarProvider: Azione sconosciuta:', neverAction);
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
        getDisplayDataForDate
      }
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
