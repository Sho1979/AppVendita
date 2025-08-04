import { useState, useEffect, useCallback } from 'react';
import { firebaseCalendarService } from '../services/FirebaseCalendarService';
import { useCalendarStore } from '../stores/calendarStore';
import { CalendarEntry } from '../data/models/CalendarEntry';

export interface UseFirebaseCalendarReturn {
  // Stato
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Operazioni CRUD
  addEntry: (entry: Omit<CalendarEntry, 'id'>) => Promise<string>;
  updateEntry: (entry: CalendarEntry) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  entryExists: (entryId: string) => Promise<boolean>;
  
  // Sincronizzazione
  syncData: (userId: string) => Promise<void>;
  checkConnection: () => Promise<boolean>;
  
  // Real-time
  startRealTimeSync: (userId: string) => void;
  stopRealTimeSync: () => void;
  
  // Utility
  clearError: () => void;
}

export const useFirebaseCalendar = (): UseFirebaseCalendarReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const store = useCalendarStore();

  // Controlla la connessione all'inizializzazione
  useEffect(() => {
    checkConnection();
  }, []);

  // ===== GESTIONE STATO =====

  const clearError = useCallback(() => {
    setError(null);
    store.setError(null);
  }, [store]);

  // ===== CONTROLLO CONNESSIONE =====

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 useFirebaseCalendar: Verifica connessione Firebase...');
      const connected = await firebaseCalendarService.checkConnection();
      setIsConnected(connected);
      console.log('✅ useFirebaseCalendar: Connessione Firebase:', connected);
      return connected;
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore controllo connessione:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // ===== SINCRONIZZAZIONE =====

  const syncData = useCallback(async (userId: string): Promise<void> => {
    if (!userId) {
      setError('ID utente richiesto per la sincronizzazione');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 useFirebaseCalendar: Inizio sincronizzazione per utente:', userId);
      
      await firebaseCalendarService.syncCalendarData(userId);
      
      console.log('✅ useFirebaseCalendar: Sincronizzazione completata');
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore sincronizzazione:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore di sincronizzazione';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== OPERAZIONI CRUD =====

  const addEntry = useCallback(async (entry: Omit<CalendarEntry, 'id'>): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('➕ useFirebaseCalendar: Aggiunta entry');
      
      // Verifica connessione prima di procedere
      const connected = await checkConnection();
      if (!connected) {
        throw new Error('Nessuna connessione con Firebase. Verifica la connessione internet.');
      }
      
      const entryId = await firebaseCalendarService.addEntry(entry);
      
      console.log('✅ useFirebaseCalendar: Entry aggiunta con ID:', entryId);
      return entryId;
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore aggiunta entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiunta dell\'entry';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const updateEntry = useCallback(async (entry: CalendarEntry): Promise<void> => {
    if (!isConnected) {
      throw new Error('Nessuna connessione con Firebase');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('✏️ useFirebaseCalendar: Aggiornamento entry:', entry.id);
      
      await firebaseCalendarService.updateEntry(entry);
      
      console.log('✅ useFirebaseCalendar: Entry aggiornata:', entry.id);
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore aggiornamento entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiornamento dell\'entry';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const deleteEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!isConnected) {
      throw new Error('Nessuna connessione con Firebase');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🗑️ useFirebaseCalendar: Eliminazione entry:', entryId);
      
      await firebaseCalendarService.deleteEntry(entryId);
      
      console.log('✅ useFirebaseCalendar: Entry eliminata:', entryId);
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore eliminazione entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'eliminazione dell\'entry';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const entryExists = useCallback(async (entryId: string): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Nessuna connessione con Firebase');
    }

    try {
      return await firebaseCalendarService.entryExists(entryId);
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore verifica esistenza entry:', error);
      return false;
    }
  }, [isConnected]);

  // ===== REAL-TIME SYNC =====

  const startRealTimeSync = useCallback((userId: string): void => {
    if (!userId) {
      console.warn('⚠️ useFirebaseCalendar: ID utente richiesto per real-time sync');
      return;
    }

    try {
      console.log('👂 useFirebaseCalendar: Avvio real-time sync per utente:', userId);
      firebaseCalendarService.subscribeToEntries(userId);
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore avvio real-time sync:', error);
      setError('Errore nell\'attivazione della sincronizzazione real-time');
    }
  }, []);

  const stopRealTimeSync = useCallback((): void => {
    try {
      console.log('🔇 useFirebaseCalendar: Arresto real-time sync');
      firebaseCalendarService.unsubscribeFromEntries();
    } catch (error) {
      console.error('❌ useFirebaseCalendar: Errore arresto real-time sync:', error);
    }
  }, []);

  // ===== EFFETTI =====

  // Controlla la connessione all'avvio
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Pulisce le risorse quando il componente viene smontato
  useEffect(() => {
    return () => {
      firebaseCalendarService.dispose();
    };
  }, []);

  // Sincronizza gli errori dello store
  useEffect(() => {
    // In Zustand, il hook ci dà già lo stato corrente
    // Non c'è bisogno di getState() o subscribe()
    if (store.error && store.error !== error) {
      setError(store.error);
    }
  }, [store.error, error]);

  return {
    // Stato
    isLoading,
    error,
    isConnected,
    
    // Operazioni CRUD
    addEntry,
    updateEntry,
    deleteEntry,
    entryExists,
    
    // Sincronizzazione
    syncData,
    checkConnection,
    
    // Real-time
    startRealTimeSync,
    stopRealTimeSync,
    
    // Utility
    clearError,
  };
}; 