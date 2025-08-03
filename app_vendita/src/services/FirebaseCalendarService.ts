import { FirebaseCalendarRepository } from '../data/repositories/firebaseCalendarRepository';
import { CalendarEntry } from '../data/models/CalendarEntry';
import { User } from '../data/models/User';
import { SalesPoint } from '../data/models/SalesPoint';
import { PriceReference } from '../data/models/PriceReference';
import { useCalendarStore } from '../stores/calendarStore';

export class FirebaseCalendarService {
  private repository: FirebaseCalendarRepository;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.repository = new FirebaseCalendarRepository();
  }

  // ===== SINCRONIZZAZIONE =====

  /**
   * Sincronizza i dati del calendario con Firebase
   */
  async syncCalendarData(userId: string): Promise<void> {
    try {
      console.log('🔄 FirebaseCalendarService: Inizio sincronizzazione per utente:', userId);
      
      // Recupera entries dal repository Firebase
      const entries = await this.repository.getEntries({ userId });
      const users = await this.repository.getUsers();
      const salesPoints = await this.repository.getSalesPoints();

      // Aggiorna lo store
      const store = useCalendarStore.getState();
      store.setEntries(entries);
      store.setUsers(users);
      store.setSalesPoints(salesPoints);
      store.setLastSyncTimestamp(Date.now());
      store.setError(null);

      console.log('✅ FirebaseCalendarService: Sincronizzazione completata:', {
        entries: entries.length,
        users: users.length,
        salesPoints: salesPoints.length
      });
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore sincronizzazione:', error);
      useCalendarStore.getState().setError('Errore di sincronizzazione con Firebase');
      throw error;
    }
  }

  // ===== OPERAZIONI CRUD =====

  /**
   * Aggiunge una nuova entry al calendario
   */
  async addEntry(entry: Omit<CalendarEntry, 'id'>): Promise<string> {
    try {
      console.log('➕ FirebaseCalendarService: Aggiunta entry:', entry);
      
      const entryId = await this.repository.addEntry(entry);
      
      // Aggiorna lo store locale
      const newEntry: CalendarEntry = {
        ...entry,
        id: entryId
      };
      useCalendarStore.getState().addEntry(newEntry);
      
      console.log('✅ FirebaseCalendarService: Entry aggiunta con ID:', entryId);
      return entryId;
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore aggiunta entry:', error);
      useCalendarStore.getState().setError('Errore nell\'aggiunta dell\'entry');
      throw error;
    }
  }

  /**
   * Verifica se un entry esiste in Firebase
   */
  async entryExists(entryId: string): Promise<boolean> {
    try {
      await this.repository.getEntry(entryId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Aggiorna una entry esistente
   */
  async updateEntry(entry: CalendarEntry): Promise<void> {
    try {
      console.log('✏️ FirebaseCalendarService: Aggiornamento entry:', entry.id);
      
      await this.repository.updateEntry(entry);
      
      // Aggiorna lo store locale
      useCalendarStore.getState().updateEntry(entry);
      
      console.log('✅ FirebaseCalendarService: Entry aggiornata:', entry.id);
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore aggiornamento entry:', error);
      useCalendarStore.getState().setError('Errore nell\'aggiornamento dell\'entry');
      throw error;
    }
  }

  /**
   * Elimina una entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      console.log('🗑️ FirebaseCalendarService: Eliminazione entry:', entryId);
      
      await this.repository.deleteEntry(entryId);
      
      // Aggiorna lo store locale
      useCalendarStore.getState().deleteEntry(entryId);
      
      console.log('✅ FirebaseCalendarService: Entry eliminata:', entryId);
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore eliminazione entry:', error);
      useCalendarStore.getState().setError('Errore nell\'eliminazione dell\'entry');
      throw error;
    }
  }

  // ===== REAL-TIME LISTENERS =====

  /**
   * Attiva il listener real-time per le entries
   */
  subscribeToEntries(userId: string): void {
    try {
      console.log('👂 FirebaseCalendarService: Attivazione listener real-time per utente:', userId);
      
      // Disattiva listener precedente se presente
      if (this.unsubscribe) {
        this.unsubscribe();
      }

      // Attiva nuovo listener
      this.unsubscribe = this.repository.subscribeToEntries((entries) => {
        console.log('📡 FirebaseCalendarService: Ricevuti aggiornamenti real-time:', entries.length);
        useCalendarStore.getState().setEntries(entries);
      }, { userId });

      console.log('✅ FirebaseCalendarService: Listener real-time attivato');
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore attivazione listener:', error);
      useCalendarStore.getState().setError('Errore nell\'attivazione del listener real-time');
    }
  }

  /**
   * Disattiva il listener real-time
   */
  unsubscribeFromEntries(): void {
    if (this.unsubscribe) {
      console.log('🔇 FirebaseCalendarService: Disattivazione listener real-time');
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Aggiorna multiple entries in batch
   */
  async batchUpdateEntries(entries: CalendarEntry[]): Promise<void> {
    try {
      console.log('📦 FirebaseCalendarService: Batch update per', entries.length, 'entries');
      
      await this.repository.batchUpdateEntries(entries);
      
      // Aggiorna lo store locale
      entries.forEach(entry => {
        useCalendarStore.getState().updateEntry(entry);
      });
      
      console.log('✅ FirebaseCalendarService: Batch update completato');
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore batch update:', error);
      useCalendarStore.getState().setError('Errore nell\'aggiornamento batch');
      throw error;
    }
  }

  // ===== ACTIVE REFERENCES =====

  /**
   * Carica le referenze attive da Firebase
   */
  async getActiveReferences(): Promise<PriceReference[]> {
    try {
      const activeReferences = await this.repository.getActiveReferences();
      return activeReferences;
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore nel caricamento referenze attive:', error);
      useCalendarStore.getState().setError('Errore nel caricamento delle referenze attive');
      throw error;
    }
  }

  /**
   * Salva una nuova referenza attiva
   */
  async saveActiveReference(reference: Omit<PriceReference, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const referenceId = await this.repository.saveActiveReference(reference);
      return referenceId;
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore nel salvataggio referenza attiva:', error);
      useCalendarStore.getState().setError('Errore nel salvataggio della referenza attiva');
      throw error;
    }
  }

  /**
   * Aggiorna una referenza attiva esistente
   */
  async updateActiveReference(id: string, updates: Partial<PriceReference>): Promise<void> {
    try {
      await this.repository.updateActiveReference(id, updates);
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore nell\'aggiornamento referenza attiva:', error);
      useCalendarStore.getState().setError('Errore nell\'aggiornamento della referenza attiva');
      throw error;
    }
  }

  /**
   * Elimina una referenza attiva
   */
  async deleteActiveReference(id: string): Promise<void> {
    try {
      await this.repository.deleteActiveReference(id);
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore nell\'eliminazione referenza attiva:', error);
      useCalendarStore.getState().setError('Errore nell\'eliminazione della referenza attiva');
      throw error;
    }
  }

  // ===== GESTIONE ERRORI =====

  /**
   * Gestisce gli errori Firebase e li converte in messaggi utente-friendly
   */
  private handleFirebaseError(error: any): string {
    if (error.code === 'permission-denied') {
      return 'Accesso negato. Verifica le tue autorizzazioni.';
    } else if (error.code === 'unavailable') {
      return 'Servizio non disponibile. Verifica la connessione.';
    } else if (error.code === 'not-found') {
      return 'Dati non trovati.';
    } else {
      return 'Errore di connessione con Firebase.';
    }
  }

  // ===== UTILITY =====

  /**
   * Verifica la connessione con Firebase
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.repository.getEntries();
      return true;
    } catch (error) {
      console.error('❌ FirebaseCalendarService: Errore connessione Firebase:', error);
      return false;
    }
  }

  /**
   * Pulisce le risorse del servizio
   */
  dispose(): void {
    this.unsubscribeFromEntries();
  }
}

// Istanza singleton del servizio
export const firebaseCalendarService = new FirebaseCalendarService(); 