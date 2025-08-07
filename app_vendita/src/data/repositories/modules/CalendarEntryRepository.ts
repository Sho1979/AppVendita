/**
 * Repository dedicato alla gestione delle CalendarEntry
 * 
 * Estrae le responsabilità delle CalendarEntry dal repository principale
 * per una migliore separazione delle concerns.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEntry, CreateCalendarEntryRequest, UpdateCalendarEntryRequest } from '../../models/CalendarEntry';
import { logger } from '../../../utils/logger';

export class CalendarEntryRepository {
  private readonly CALENDAR_ENTRIES_KEY = 'calendar_entries';

  /**
   * Recupera le entries del calendario con filtri opzionali
   */
  async getCalendarEntries(
    startDate: Date,
    endDate: Date,
    userId?: string,
    salesPointId?: string
  ): Promise<CalendarEntry[]> {
    try {
      const data = await AsyncStorage.getItem(this.CALENDAR_ENTRIES_KEY);
      const entries: CalendarEntry[] = data ? JSON.parse(data) : [];

      return entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const matchesDateRange = entryDate >= startDate && entryDate <= endDate;
        const matchesUser = !userId || entry.userId === userId;
        const matchesSalesPoint = !salesPointId || entry.salesPointId === salesPointId;

        return matchesDateRange && matchesUser && matchesSalesPoint;
      });
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel recupero entries', error);
      return [];
    }
  }

  /**
   * Recupera una singola entry per ID
   */
  async getCalendarEntry(id: string): Promise<CalendarEntry | null> {
    try {
      const entries = await this.getAllEntries();
      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel recupero entry', error);
      return null;
    }
  }

  /**
   * Crea una nuova entry
   */
  async createCalendarEntry(entryData: CreateCalendarEntryRequest): Promise<string> {
    try {
      const entries = await this.getAllEntries();
      const newEntry: CalendarEntry = {
        ...entryData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      entries.push(newEntry);
      await this.saveAllEntries(entries);
      
      logger.info('CalendarEntryRepository', 'Entry creata', { entryId: newEntry.id });
      return newEntry.id;
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nella creazione entry', error);
      throw error;
    }
  }

  /**
   * Aggiorna una entry esistente
   */
  async updateCalendarEntry(id: string, updates: UpdateCalendarEntryRequest): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const entryIndex = entries.findIndex(entry => entry.id === id);

      if (entryIndex === -1) {
        throw new Error(`Entry con ID ${id} non trovata`);
      }

      entries[entryIndex] = {
        ...entries[entryIndex],
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveAllEntries(entries);
      logger.info('CalendarEntryRepository', 'Entry aggiornata', { entryId: id });
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nell\'aggiornamento entry', error);
      throw error;
    }
  }

  /**
   * Elimina una entry
   */
  async deleteCalendarEntry(id: string): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);

      await this.saveAllEntries(filteredEntries);
      logger.info('CalendarEntryRepository', 'Entry eliminata', { entryId: id });
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nell\'eliminazione entry', error);
      throw error;
    }
  }

  /**
   * Salva tutte le entries in batch
   */
  async saveCalendarEntries(entries: CalendarEntry[]): Promise<void> {
    try {
      await this.saveAllEntries(entries);
      logger.info('CalendarEntryRepository', 'Entries salvate in batch', { count: entries.length });
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel salvataggio batch entries', error);
      throw error;
    }
  }

  /**
   * Pulisce tutte le entries
   */
  async clearCalendarEntries(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CALENDAR_ENTRIES_KEY);
      logger.info('CalendarEntryRepository', 'Entries pulite');
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nella pulizia entries', error);
      throw error;
    }
  }

  /**
   * Metodi privati di supporto
   */
  private async getAllEntries(): Promise<CalendarEntry[]> {
    try {
      const data = await AsyncStorage.getItem(this.CALENDAR_ENTRIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel recupero tutte le entries', error);
      return [];
    }
  }

  private async saveAllEntries(entries: CalendarEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CALENDAR_ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel salvataggio tutte le entries', error);
      throw error;
    }
  }

  /**
   * Statistiche e utility
   */
  async getEntriesCount(): Promise<number> {
    try {
      const entries = await this.getAllEntries();
      return entries.length;
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel conteggio entries', error);
      return 0;
    }
  }

  async getEntriesByUser(userId: string): Promise<CalendarEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries.filter(entry => entry.userId === userId);
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel recupero entries per user', error);
      return [];
    }
  }

  async getEntriesBySalesPoint(salesPointId: string): Promise<CalendarEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries.filter(entry => entry.salesPointId === salesPointId);
    } catch (error) {
      logger.error('CalendarEntryRepository', 'Errore nel recupero entries per sales point', error);
      return [];
    }
  }
}
