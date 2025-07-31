import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEntry } from '../data/models/CalendarEntry';
import { User } from '../data/models/User';
import { SalesPoint } from '../data/models/SalesPoint';

// Utility per logging condizionale
const devLog = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args);
  }
};

// Tipi per i filtri attivi
export interface ActiveFilters {
  userId: string;
  salesPointId: string;
  selectedDate: Date | null;
}

// Interfaccia per lo stato del calendario
interface CalendarState {
  // Dati principali
  entries: CalendarEntry[];
  users: User[];
  salesPoints: SalesPoint[];
  
  // Stato dell'applicazione
  isLoading: boolean;
  error: string | null;
  lastSyncTimestamp: number;
  
  // Filtri attivi
  activeFilters: ActiveFilters;
  
  // Azioni per le entries
  setEntries: (entries: CalendarEntry[]) => void;
  addEntry: (entry: CalendarEntry) => void;
  updateEntry: (entry: CalendarEntry) => void;
  deleteEntry: (entryId: string) => void;
  
  // Azioni per utenti e punti vendita
  setUsers: (users: User[]) => void;
  setSalesPoints: (salesPoints: SalesPoint[]) => void;
  
  // Azioni per lo stato
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncTimestamp: (timestamp: number) => void;
  
  // Azioni per i filtri
  updateFilters: (filters: Partial<ActiveFilters>) => void;
  resetFilters: () => void;
  
  // Azioni di utilità
  clearAll: () => void;
  
  // Selettori ottimizzati per performance
  getEntryById: (id: string) => CalendarEntry | undefined;
  getEntriesByDate: (date: string) => CalendarEntry[];
  getFilteredEntries: (filters: Partial<ActiveFilters>) => CalendarEntry[];
  getEntriesCount: () => number;
  getUsersCount: () => number;
  getSalesPointsCount: () => number;
}

// Stato iniziale
const initialState = {
  entries: [],
  users: [],
  salesPoints: [],
  isLoading: false,
  error: null,
  lastSyncTimestamp: 0,
  activeFilters: {
    userId: '',
    salesPointId: '',
    selectedDate: null,
  },
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Azioni per le entries
      setEntries: (entries) => {
        devLog('📅 CalendarStore: Impostando entries:', entries.length);
        set({ entries });
      },
      
      addEntry: (entry) => {
        devLog('➕ CalendarStore: Aggiungendo entry:', entry.id);
        set((state) => ({
          entries: [...state.entries, entry]
        }));
      },
      
      updateEntry: (entry) => {
        devLog('✏️ CalendarStore: Aggiornando entry:', entry.id);
        set((state) => ({
          entries: state.entries.map(e => e.id === entry.id ? entry : e)
        }));
      },
      
      deleteEntry: (entryId) => {
        devLog('🗑️ CalendarStore: Eliminando entry:', entryId);
        set((state) => ({
          entries: state.entries.filter(e => e.id !== entryId)
        }));
      },
      
      // Azioni per utenti e punti vendita
      setUsers: (users) => {
        devLog('👥 CalendarStore: Impostando utenti:', users.length);
        set({ users });
      },
      
      setSalesPoints: (salesPoints) => {
        devLog('🏪 CalendarStore: Impostando punti vendita:', salesPoints.length);
        set({ salesPoints });
      },
      
      // Azioni per lo stato
      setLoading: (isLoading) => {
        devLog('⏳ CalendarStore: Loading impostato a:', isLoading);
        set({ isLoading });
      },
      
      setError: (error) => {
        devLog('❌ CalendarStore: Errore impostato:', error);
        set({ error });
      },
      
      setLastSyncTimestamp: (lastSyncTimestamp) => {
        devLog('🔄 CalendarStore: Timestamp sincronizzazione aggiornato:', lastSyncTimestamp);
        set({ lastSyncTimestamp });
      },
      
      // Azioni per i filtri
      updateFilters: (filters) => {
        devLog('🔍 CalendarStore: Aggiornando filtri:', filters);
        set((state) => ({
          activeFilters: { ...state.activeFilters, ...filters }
        }));
      },
      
      resetFilters: () => {
        devLog('🔄 CalendarStore: Reset filtri');
        set({
          activeFilters: {
            userId: '',
            salesPointId: '',
            selectedDate: null,
          }
        });
      },
      
      // Azioni di utilità
      clearAll: () => {
        devLog('🧹 CalendarStore: Pulizia completa');
        set(initialState);
      },
      
      // Selettori ottimizzati per performance
      getEntryById: (id) => {
        const { entries } = get();
        return entries.find(entry => entry.id === id);
      },
      
      getEntriesByDate: (dateString) => {
        const { entries } = get();
        return entries.filter(entry => 
          entry.date.toISOString().split('T')[0] === dateString
        );
      },
      
      getFilteredEntries: (filters) => {
        const { entries } = get();
        return entries.filter(entry => {
          if (filters.userId && entry.userId !== filters.userId) return false;
          if (filters.salesPointId && entry.salesPointId !== filters.salesPointId) return false;
          if (filters.selectedDate) {
            const entryDateString = entry.date.toISOString().split('T')[0];
            const filterDateString = filters.selectedDate.toISOString().split('T')[0];
            if (entryDateString !== filterDateString) return false;
          }
          return true;
        });
      },
      
      getEntriesCount: () => {
        const { entries } = get();
        return entries.length;
      },
      
      getUsersCount: () => {
        const { users } = get();
        return users.length;
      },
      
      getSalesPointsCount: () => {
        const { salesPoints } = get();
        return salesPoints.length;
      },
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({
        entries: state.entries,
        users: state.users,
        salesPoints: state.salesPoints,
        lastSyncTimestamp: state.lastSyncTimestamp,
        activeFilters: state.activeFilters,
      }),
    }
  )
); 