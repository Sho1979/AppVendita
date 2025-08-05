import { FirebaseCalendarRepository } from './firebaseCalendarRepository';
import { CalendarRepository } from './CalendarRepository';
import { CalendarEntry } from '../models/CalendarEntry';
import { User } from '../models/User';
import { SalesPoint } from '../models/SalesPoint';
import { PriceReference } from '../models/PriceReference';
import { ExcelRow } from '../models/ExcelData';
import { MasterDataRow } from '../models/MasterData';

export class FirebaseCalendarRepositoryAdapter implements CalendarRepository {
  private firebaseRepository: FirebaseCalendarRepository;

  constructor() {
    this.firebaseRepository = new FirebaseCalendarRepository();
  }

  // ===== CALENDAR ENTRIES =====

  async getCalendarEntries(
    startDate: Date,
    endDate: Date,
    userId?: string,
    salesPointId?: string
  ): Promise<CalendarEntry[]> {
    try {
      console.log('📥 FirebaseAdapter: getCalendarEntries chiamato con:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId,
        salesPointId,
      });

      const filters: any = {};
      if (userId) filters.userId = userId;
      if (salesPointId) filters.salesPointId = salesPointId;
      
      const entries = await this.firebaseRepository.getEntries(filters);
      
      // Filtra per date range e normalizza il campo tags
      const filteredEntries = entries.filter(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      }).map(entry => ({
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : [], // <-- Normalizza sempre tags come array
      }));

      console.log('✅ FirebaseAdapter: Entries filtrate:', filteredEntries.length);
      return filteredEntries;
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getCalendarEntries:', error);
      return [];
    }
  }

  async getCalendarEntry(id: string): Promise<CalendarEntry | null> {
    try {
      const entry = await this.firebaseRepository.getEntryById(id);
      if (!entry) return null;
      
      // Normalizza il campo tags
      return {
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : [], // <-- Normalizza sempre tags come array
      };
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getCalendarEntry:', error);
      return null;
    }
  }

  async saveCalendarEntry(entry: any): Promise<CalendarEntry> {
    try {
      const { id, ...entryData } = entry;
      const entryId = await this.firebaseRepository.addEntry(entryData);
      return { ...entry, id: entryId };
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore saveCalendarEntry:', error);
      throw error;
    }
  }

  async updateCalendarEntry(id: string, updates: any): Promise<CalendarEntry> {
    try {
      const existingEntry = await this.firebaseRepository.getEntryById(id);
      if (!existingEntry) {
        throw new Error('Entry non trovata');
      }
      
      // Pulisci i dati rimuovendo i campi undefined
      const cleanUpdates = { ...updates };
      Object.keys(cleanUpdates).forEach(key => {
        if (cleanUpdates[key] === undefined) {
          delete cleanUpdates[key];
        }
      });
      
      const updatedEntry = { ...existingEntry, ...cleanUpdates };
      
      // Pulisci anche l'entry finale - rimuovi tutti i campi undefined
      Object.keys(updatedEntry).forEach(key => {
        if (updatedEntry[key] === undefined) {
          delete updatedEntry[key];
        }
      });
      
      // Pulizia specifica per repeatSettings
      if (updatedEntry.repeatSettings && !updatedEntry.repeatSettings.enabled) {
        delete updatedEntry.repeatSettings;
      }
      
      console.log('🧹 FirebaseAdapter: Entry pulita per aggiornamento:', updatedEntry);
      await this.firebaseRepository.updateEntry(updatedEntry);
      return updatedEntry;
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore updateCalendarEntry:', error);
      throw error;
    }
  }

  async deleteCalendarEntry(id: string): Promise<void> {
    try {
      await this.firebaseRepository.deleteEntry(id);
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore deleteCalendarEntry:', error);
      throw error;
    }
  }

  // ===== USERS =====

  async getUsers(): Promise<User[]> {
    try {
      return await this.firebaseRepository.getUsers();
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getUsers:', error);
      return [];
    }
  }

  async getUser(id: string): Promise<User | null> {
    try {
      // FirebaseCalendarRepository non ha getUser, implementiamo un workaround
      const users = await this.firebaseRepository.getUsers();
      return users.find(user => user.id === id) || null;
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getUser:', error);
      return null;
    }
  }

  async saveUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const userId = await this.firebaseRepository.addUser(user);
      return { ...user, id: userId, createdAt: new Date(), updatedAt: new Date() };
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore saveUser:', error);
      throw error;
    }
  }

  async saveUsers(users: User[]): Promise<void> {
    try {
      for (const user of users) {
        const { id, createdAt, updatedAt, ...userData } = user;
        await this.firebaseRepository.addUser(userData);
      }
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore saveUsers:', error);
      throw error;
    }
  }

  async clearUsers(): Promise<void> {
    // Firebase non supporta clear, implementiamo un workaround
    console.warn('⚠️ FirebaseAdapter: clearUsers non supportato in Firebase');
  }

  // ===== SALES POINTS =====

  async getSalesPoints(): Promise<SalesPoint[]> {
    try {
      return await this.firebaseRepository.getSalesPoints();
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getSalesPoints:', error);
      return [];
    }
  }

  async getSalesPoint(id: string): Promise<SalesPoint | null> {
    try {
      const salesPoints = await this.firebaseRepository.getSalesPoints();
      return salesPoints.find(sp => sp.id === id) || null;
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getSalesPoint:', error);
      return null;
    }
  }

  async saveSalesPoint(salesPoint: Omit<SalesPoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesPoint> {
    try {
      const salesPointId = await this.firebaseRepository.addSalesPoint(salesPoint);
      return { ...salesPoint, id: salesPointId, createdAt: new Date(), updatedAt: new Date() };
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore saveSalesPoint:', error);
      throw error;
    }
  }

  async saveSalesPoints(salesPoints: SalesPoint[]): Promise<void> {
    try {
      for (const salesPoint of salesPoints) {
        const { id, createdAt, updatedAt, ...salesPointData } = salesPoint;
        await this.firebaseRepository.addSalesPoint(salesPointData);
      }
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore saveSalesPoints:', error);
      throw error;
    }
  }

  async clearSalesPoints(): Promise<void> {
    console.warn('⚠️ FirebaseAdapter: clearSalesPoints non supportato in Firebase');
  }

  // ===== EXCEL DATA =====

  async getExcelRows(): Promise<ExcelRow[]> {
    try {
      const excelData = await this.firebaseRepository.getExcelData();
      return excelData as ExcelRow[];
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getExcelRows:', error);
      return [];
    }
  }

  async saveExcelRows(rows: ExcelRow[]): Promise<void> {
    try {
      await this.firebaseRepository.saveExcelData(rows);
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore saveExcelRows:', error);
      throw error;
    }
  }

  async clearExcelRows(): Promise<void> {
    console.warn('⚠️ FirebaseAdapter: clearExcelRows non supportato in Firebase');
  }

  // ===== PRICE REFERENCES =====

  async getPriceReferences(): Promise<PriceReference[]> {
    try {
      return await this.firebaseRepository.getActiveReferences();
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getPriceReferences:', error);
      return [];
    }
  }

  async getPriceReference(id: string): Promise<PriceReference | null> {
    try {
      const references = await this.firebaseRepository.getActiveReferences();
      return references.find(ref => ref.id === id) || null;
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore getPriceReference:', error);
      return null;
    }
  }

  async savePriceReference(reference: any): Promise<PriceReference> {
    try {
      const { id, createdAt, updatedAt, ...referenceData } = reference;
      const referenceId = await this.firebaseRepository.saveActiveReference(referenceData);
      return { ...reference, id: referenceId, createdAt: new Date(), updatedAt: new Date() };
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore savePriceReference:', error);
      throw error;
    }
  }

  async updatePriceReference(id: string, updates: any): Promise<PriceReference> {
    try {
      await this.firebaseRepository.updateActiveReference(id, updates);
      const updatedReference = await this.getPriceReference(id);
      if (!updatedReference) {
        throw new Error('Referenza non trovata dopo aggiornamento');
      }
      return updatedReference;
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore updatePriceReference:', error);
      throw error;
    }
  }

  async deletePriceReference(id: string): Promise<void> {
    try {
      await this.firebaseRepository.deleteActiveReference(id);
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore deletePriceReference:', error);
      throw error;
    }
  }

  async savePriceReferences(references: PriceReference[]): Promise<void> {
    try {
      for (const reference of references) {
        const { id, createdAt, updatedAt, ...referenceData } = reference;
        await this.firebaseRepository.saveActiveReference(referenceData);
      }
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore savePriceReferences:', error);
      throw error;
    }
  }

  async clearPriceReferences(): Promise<void> {
    console.warn('⚠️ FirebaseAdapter: clearPriceReferences non supportato in Firebase');
  }

  async getActivePriceReferences(): Promise<PriceReference[]> {
    return this.getPriceReferences();
  }

  async togglePriceReferenceActive(id: string, isActive: boolean): Promise<void> {
    try {
      await this.firebaseRepository.updateActiveReference(id, { isActive });
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore togglePriceReferenceActive:', error);
      throw error;
    }
  }

  // ===== FOCUS REFERENCES =====

  async getFocusReferences(): Promise<string[]> {
    // Firebase non ha focus references specifici, restituiamo array vuoto
    return [];
  }

  async saveFocusReferences(referenceIds: string[]): Promise<void> {
    console.warn('⚠️ FirebaseAdapter: saveFocusReferences non supportato in Firebase');
  }

  async clearFocusReferences(): Promise<void> {
    console.warn('⚠️ FirebaseAdapter: clearFocusReferences non supportato in Firebase');
  }

  async saveFocusNetPrices(netPrices: { [key: string]: string }): Promise<void> {
    console.warn('⚠️ FirebaseAdapter: saveFocusNetPrices non supportato in Firebase');
  }

  async getFocusNetPrices(): Promise<{ [key: string]: string }> {
    return {};
  }

  // ===== IMPORT/EXPORT =====

  async importFromExcel(data: any): Promise<void> {
    try {
      await this.firebaseRepository.saveExcelData(data);
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore importFromExcel:', error);
      throw error;
    }
  }

  async exportToExcel(): Promise<any> {
    try {
      return await this.firebaseRepository.getExcelData();
    } catch (error) {
      console.error('❌ FirebaseAdapter: Errore exportToExcel:', error);
      throw error;
    }
  }

  // ===== MASTER DATA =====

  async getMasterData(): Promise<MasterDataRow[]> {
    // Firebase non ha master data specifico, restituiamo array vuoto
    return [];
  }

  async getMasterDataRow(id: string): Promise<MasterDataRow | null> {
    return null;
  }

  async saveMasterDataRow(row: any): Promise<MasterDataRow> {
    throw new Error('Master data non supportato in Firebase');
  }

  async updateMasterDataRow(id: string, updates: any): Promise<MasterDataRow> {
    throw new Error('Master data non supportato in Firebase');
  }

  async deleteMasterDataRow(id: string): Promise<void> {
    throw new Error('Master data non supportato in Firebase');
  }

  async saveMasterData(rows: MasterDataRow[]): Promise<void> {
    throw new Error('Master data non supportato in Firebase');
  }

  async clearMasterData(): Promise<void> {
    throw new Error('Master data non supportato in Firebase');
  }
} 