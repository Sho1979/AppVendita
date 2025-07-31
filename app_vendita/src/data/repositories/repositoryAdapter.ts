import { AsyncStorageCalendarRepository } from './AsyncStorageCalendarRepository';
import { FirebaseCalendarRepository } from './firebaseCalendarRepository';
import { CalendarEntry } from '../models/CalendarEntry';
import { User } from '../models/User';
import { SalesPoint } from '../models/SalesPoint';

export interface ICalendarRepository {
  getEntries(filters?: any): Promise<CalendarEntry[]>;
  getEntryById(id: string): Promise<CalendarEntry | null>;
  addEntry(entry: Omit<CalendarEntry, 'id'>): Promise<string>;
  updateEntry(entry: CalendarEntry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  getUsers(): Promise<User[]>;
  addUser(user: Omit<User, 'id'>): Promise<string>;
  getSalesPoints(): Promise<SalesPoint[]>;
  addSalesPoint(salesPoint: Omit<SalesPoint, 'id'>): Promise<string>;
  saveExcelData(data: any[]): Promise<void>;
  getExcelData(): Promise<any[]>;
  subscribeToEntries?(callback: (entries: CalendarEntry[]) => void, filters?: any): () => void;
  batchUpdateEntries?(entries: CalendarEntry[]): Promise<void>;
}

export class RepositoryAdapter implements ICalendarRepository {
  private localRepository: AsyncStorageCalendarRepository;
  private firebaseRepository: FirebaseCalendarRepository;
  private useFirebase: boolean;

  constructor(useFirebase: boolean = false) {
    this.localRepository = new AsyncStorageCalendarRepository();
    this.firebaseRepository = new FirebaseCalendarRepository();
    this.useFirebase = useFirebase;
  }

  // ===== CALENDAR ENTRIES =====

  async getEntries(filters?: any): Promise<CalendarEntry[]> {
    try {
      if (this.useFirebase) {
        return await this.firebaseRepository.getEntries(filters);
      } else {
        return await this.localRepository.getEntries(filters);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nel recupero entries:', error);
      // Fallback al repository locale
      return await this.localRepository.getEntries(filters);
    }
  }

  async getEntryById(id: string): Promise<CalendarEntry | null> {
    try {
      if (this.useFirebase) {
        return await this.firebaseRepository.getEntryById(id);
      } else {
        return await this.localRepository.getEntryById(id);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nel recupero entry:', error);
      return await this.localRepository.getEntryById(id);
    }
  }

  async addEntry(entry: Omit<CalendarEntry, 'id'>): Promise<string> {
    try {
      if (this.useFirebase) {
        const firebaseId = await this.firebaseRepository.addEntry(entry);
        // Sincronizza anche localmente per backup
        await this.localRepository.addEntry(entry);
        return firebaseId;
      } else {
        return await this.localRepository.addEntry(entry);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nell\'aggiunta entry:', error);
      return await this.localRepository.addEntry(entry);
    }
  }

  async updateEntry(entry: CalendarEntry): Promise<void> {
    try {
      if (this.useFirebase) {
        await this.firebaseRepository.updateEntry(entry);
        // Sincronizza anche localmente
        await this.localRepository.updateEntry(entry);
      } else {
        await this.localRepository.updateEntry(entry);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nell\'aggiornamento entry:', error);
      await this.localRepository.updateEntry(entry);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      if (this.useFirebase) {
        await this.firebaseRepository.deleteEntry(id);
        // Sincronizza anche localmente
        await this.localRepository.deleteEntry(id);
      } else {
        await this.localRepository.deleteEntry(id);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nell\'eliminazione entry:', error);
      await this.localRepository.deleteEntry(id);
    }
  }

  // ===== USERS =====

  async getUsers(): Promise<User[]> {
    try {
      if (this.useFirebase) {
        return await this.firebaseRepository.getUsers();
      } else {
        return await this.localRepository.getUsers();
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nel recupero users:', error);
      return await this.localRepository.getUsers();
    }
  }

  async addUser(user: Omit<User, 'id'>): Promise<string> {
    try {
      if (this.useFirebase) {
        const firebaseId = await this.firebaseRepository.addUser(user);
        await this.localRepository.addUser(user);
        return firebaseId;
      } else {
        return await this.localRepository.addUser(user);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nell\'aggiunta user:', error);
      return await this.localRepository.addUser(user);
    }
  }

  // ===== SALES POINTS =====

  async getSalesPoints(): Promise<SalesPoint[]> {
    try {
      if (this.useFirebase) {
        return await this.firebaseRepository.getSalesPoints();
      } else {
        return await this.localRepository.getSalesPoints();
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nel recupero sales points:', error);
      return await this.localRepository.getSalesPoints();
    }
  }

  async addSalesPoint(salesPoint: Omit<SalesPoint, 'id'>): Promise<string> {
    try {
      if (this.useFirebase) {
        const firebaseId = await this.firebaseRepository.addSalesPoint(salesPoint);
        await this.localRepository.addSalesPoint(salesPoint);
        return firebaseId;
      } else {
        return await this.localRepository.addSalesPoint(salesPoint);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nell\'aggiunta sales point:', error);
      return await this.localRepository.addSalesPoint(salesPoint);
    }
  }

  // ===== EXCEL DATA =====

  async saveExcelData(data: any[]): Promise<void> {
    try {
      if (this.useFirebase) {
        await this.firebaseRepository.saveExcelData(data);
        await this.localRepository.saveExcelData(data);
      } else {
        await this.localRepository.saveExcelData(data);
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nel salvataggio dati Excel:', error);
      await this.localRepository.saveExcelData(data);
    }
  }

  async getExcelData(): Promise<any[]> {
    try {
      if (this.useFirebase) {
        return await this.firebaseRepository.getExcelData();
      } else {
        return await this.localRepository.getExcelData();
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nel recupero dati Excel:', error);
      return await this.localRepository.getExcelData();
    }
  }

  // ===== FIREBASE-SPECIFIC METHODS =====

  subscribeToEntries(callback: (entries: CalendarEntry[]) => void, filters?: any): () => void {
    if (this.useFirebase && this.firebaseRepository.subscribeToEntries) {
      return this.firebaseRepository.subscribeToEntries(callback, filters);
    } else {
      // Fallback per AsyncStorage - esegui callback una volta
      this.getEntries(filters).then(callback);
      return () => {}; // No-op unsubscribe
    }
  }

  async batchUpdateEntries(entries: CalendarEntry[]): Promise<void> {
    try {
      if (this.useFirebase && this.firebaseRepository.batchUpdateEntries) {
        await this.firebaseRepository.batchUpdateEntries(entries);
        // Sincronizza anche localmente
        for (const entry of entries) {
          await this.localRepository.updateEntry(entry);
        }
      } else {
        // Fallback per AsyncStorage
        for (const entry of entries) {
          await this.localRepository.updateEntry(entry);
        }
      }
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nel batch update:', error);
      // Fallback locale
      for (const entry of entries) {
        await this.localRepository.updateEntry(entry);
      }
    }
  }

  // ===== UTILITY =====

  setUseFirebase(useFirebase: boolean): void {
    this.useFirebase = useFirebase;
    console.log(`🔄 RepositoryAdapter: Cambiato a ${useFirebase ? 'Firebase' : 'AsyncStorage'}`);
  }

  isUsingFirebase(): boolean {
    return this.useFirebase;
  }

  // ===== MIGRAZIONE DATI =====

  async migrateToFirebase(): Promise<void> {
    try {
      console.log('🔄 RepositoryAdapter: Inizio migrazione dati a Firebase...');
      
      // Migra entries
      const entries = await this.localRepository.getEntries();
      for (const entry of entries) {
        const { ...entryData } = entry;
        await this.firebaseRepository.addEntry(entryData);
      }
      
      // Migra users
      const users = await this.localRepository.getUsers();
      for (const user of users) {
        const { ...userData } = user;
        await this.firebaseRepository.addUser(userData);
      }
      
      // Migra sales points
      const salesPoints = await this.localRepository.getSalesPoints();
      for (const salesPoint of salesPoints) {
        const { ...salesPointData } = salesPoint;
        await this.firebaseRepository.addSalesPoint(salesPointData);
      }
      
      // Migra Excel data
      const excelData = await this.localRepository.getExcelData();
      await this.firebaseRepository.saveExcelData(excelData);
      
      console.log('✅ RepositoryAdapter: Migrazione completata');
    } catch (error) {
      console.error('❌ RepositoryAdapter: Errore nella migrazione:', error);
      throw error;
    }
  }
} 