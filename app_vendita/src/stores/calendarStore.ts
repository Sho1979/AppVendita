import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEntry } from '../data/models/CalendarEntry';
import { User } from '../data/models/User';
import { SalesPoint } from '../data/models/SalesPoint';
import { createStorageAdapter } from '../utils/storageAdapter';

// Utility per logging condizionale (placeholder per futuri debug)

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
  getEntriesForFilters: (userId?: string, salesPointId?: string) => CalendarEntry[];
  // Aggregati per cliente/filtri
  getTotalsForFilters: (userId?: string, salesPointId?: string) => { sellIn: number; actions: number };
  getMonthlyTotalsForSalesPoint: (salesPointId: string, year: number, month: number) => { sellIn: number; actions: number };
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
        set({ entries });
      },
      
      addEntry: (entry) => {
        set((state) => ({
          entries: [...state.entries, entry]
        }));
      },
      
      updateEntry: (entry) => {
        set((state) => ({
          entries: state.entries.map(e => e.id === entry.id ? entry : e)
        }));
      },
      
      deleteEntry: (entryId) => {
        set((state) => ({
          entries: state.entries.filter(e => e.id !== entryId)
        }));
      },
      
      // Azioni per utenti e punti vendita
      setUsers: (users) => {
        set({ users });
      },
      
      setSalesPoints: (salesPoints) => {
        set({ salesPoints });
      },
      
      // Azioni per lo stato
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      setLastSyncTimestamp: (lastSyncTimestamp) => {
        set({ lastSyncTimestamp });
      },
      
      // Azioni per i filtri
      updateFilters: (filters) => {
        set((state) => ({
          activeFilters: { ...state.activeFilters, ...filters }
        }));
      },
      
      resetFilters: () => {
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

      // Selettore specializzato per il caso più frequente in UI (priorità salesPointId)
      getEntriesForFilters: (userId, salesPointId) => {
        const { entries } = get();
        if (salesPointId && salesPointId !== 'default') {
          return entries.filter(e => e.salesPointId === salesPointId);
        }
        if (userId) {
          return entries.filter(e => e.userId === userId);
        }
        return entries;
      },

      // Totali su entries filtrate (sell-in, azioni)
      getTotalsForFilters: (userId, salesPointId) => {
        const list = (get() as CalendarState).getEntriesForFilters(userId, salesPointId);
        const computeSellIn = (e: CalendarEntry): number => {
          // 1) Se presenti vendite esplicite, usa quelle
          const explicit = e.sales?.reduce((s, sale) => s + (sale?.value || 0), 0) || 0;
          if (explicit > 0) return explicit;
          // 2) Fallback: calcola da focusReferencesData (soldPieces * netPrice)
          const focus = e.focusReferencesData?.reduce((s, ref) => {
            const ordered = parseFloat(String(ref.orderedPieces || '0')) || 0;
            const price = parseFloat(String(ref.netPrice || '0')) || 0;
            return s + ordered * price;
          }, 0) || 0;
          return focus;
        };
        const sellIn = list.reduce((sum, e) => sum + computeSellIn(e), 0);
        const actions = list.reduce((sum, e) => sum + (e.actions?.reduce((s, a) => s + (a?.count || 0), 0) || 0), 0);
        return { sellIn, actions };
      },

      // Totali mensili per salesPointId nel mese specificato
      getMonthlyTotalsForSalesPoint: (salesPointId, year, month) => {
        const { entries } = get();
        const monthEntries = entries.filter(e => {
          if (!salesPointId || salesPointId === 'default') return false;
          if (e.salesPointId !== salesPointId) return false;
          const d = e.date instanceof Date ? e.date : new Date(e.date);
          return d.getFullYear() === year && (d.getMonth() + 1) === month;
        });
        const computeSellIn = (e: CalendarEntry): number => {
          const explicit = e.sales?.reduce((s, sale) => s + (sale?.value || 0), 0) || 0;
          if (explicit > 0) return explicit;
          const focus = e.focusReferencesData?.reduce((s, ref) => {
            const ordered = parseFloat(String(ref.orderedPieces || '0')) || 0;
            const price = parseFloat(String(ref.netPrice || '0')) || 0;
            return s + ordered * price;
          }, 0) || 0;
          return focus;
        };
        const sellIn = monthEntries.reduce((sum, e) => sum + computeSellIn(e), 0);
        const actions = monthEntries.reduce((sum, e) => sum + (e.actions?.reduce((s, a) => s + (a?.count || 0), 0) || 0), 0);
        return { sellIn, actions };
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
      storage: createStorageAdapter() as any, // Cast temporaneo per compatibilità TypeScript
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