import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CalendarEntry,
  CreateCalendarEntryRequest,
  UpdateCalendarEntryRequest,
} from '../models/CalendarEntry';
import { User } from '../models/User';
import { SalesPoint } from '../models/SalesPoint';
import { ExcelRow } from '../models/ExcelData';
import { PriceReference, CreatePriceReferenceRequest, UpdatePriceReferenceRequest } from '../models/PriceReference';
import { MasterDataRow, CreateMasterDataRowRequest, UpdateMasterDataRowRequest } from '../models/MasterData';

export interface CalendarRepository {
  // Metodi per CalendarEntry
  getCalendarEntries(
    startDate: Date,
    endDate: Date,
    userId?: string,
    salesPointId?: string
  ): Promise<CalendarEntry[]>;
  getCalendarEntry(id: string): Promise<CalendarEntry | null>;
  saveCalendarEntry(entry: CreateCalendarEntryRequest): Promise<CalendarEntry>;
  updateCalendarEntry(
    id: string,
    updates: UpdateCalendarEntryRequest
  ): Promise<CalendarEntry>;
  deleteCalendarEntry(id: string): Promise<void>;

  // Metodi per User
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  saveUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  saveUsers(users: User[]): Promise<void>;
  clearUsers(): Promise<void>;

  // Metodi per SalesPoint
  getSalesPoints(): Promise<SalesPoint[]>;
  getSalesPoint(id: string): Promise<SalesPoint | null>;
  saveSalesPoint(
    salesPoint: Omit<SalesPoint, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SalesPoint>;
  saveSalesPoints(salesPoints: SalesPoint[]): Promise<void>;
  clearSalesPoints(): Promise<void>;

  // Metodi per ExcelRow
  getExcelRows(): Promise<ExcelRow[]>;
  saveExcelRows(rows: ExcelRow[]): Promise<void>;
  clearExcelRows(): Promise<void>;

  // Metodi per PriceReference
  getPriceReferences(): Promise<PriceReference[]>;
  getPriceReference(id: string): Promise<PriceReference | null>;
  savePriceReference(reference: CreatePriceReferenceRequest): Promise<PriceReference>;
  updatePriceReference(id: string, updates: UpdatePriceReferenceRequest): Promise<PriceReference>;
  deletePriceReference(id: string): Promise<void>;
  savePriceReferences(references: PriceReference[]): Promise<void>;
  clearPriceReferences(): Promise<void>;
  getActivePriceReferences(): Promise<PriceReference[]>;
  togglePriceReferenceActive(id: string, isActive: boolean): Promise<void>;
  
  // Metodi per Focus References
  getFocusReferences(): Promise<string[]>;
  saveFocusReferences(referenceIds: string[]): Promise<void>;
  clearFocusReferences(): Promise<void>;
  saveFocusNetPrices(netPrices: { [key: string]: string }): Promise<void>;
  getFocusNetPrices(): Promise<{ [key: string]: string }>;

  // Metodi per import/export
  importFromExcel(data: any): Promise<void>;
  exportToExcel(): Promise<any>;

  // Metodi per MasterData
  getMasterData(): Promise<MasterDataRow[]>;
  getMasterDataRow(id: string): Promise<MasterDataRow | null>;
  saveMasterDataRow(row: CreateMasterDataRowRequest): Promise<MasterDataRow>;
  updateMasterDataRow(id: string, updates: UpdateMasterDataRowRequest): Promise<MasterDataRow>;
  deleteMasterDataRow(id: string): Promise<void>;
  saveMasterData(rows: MasterDataRow[]): Promise<void>;
  clearMasterData(): Promise<void>;
}

export class AsyncStorageCalendarRepository implements CalendarRepository {
  private readonly CALENDAR_ENTRIES_KEY = 'calendar_entries';
  private readonly USERS_KEY = 'users';
  private readonly SALES_POINTS_KEY = 'sales_points';
  private readonly EXCEL_ROWS_KEY = 'excel_rows';
  private readonly PRICE_REFERENCES_KEY = 'price_references';
  private readonly FOCUS_REFERENCES_KEY = 'focus_references';
  private readonly FOCUS_NET_PRICES_KEY = 'focus_net_prices';
  private readonly MASTER_DATA_KEY = 'master_data';
  private silentMode = false;

  setSilentMode(enabled: boolean) {
    this.silentMode = enabled;
  }

  // CalendarEntry methods
  async getCalendarEntries(
    startDate: Date,
    endDate: Date,
    userId?: string,
    salesPointId?: string
  ): Promise<CalendarEntry[]> {
    if (__DEV__) {
      console.log('📥 Repository: getCalendarEntries chiamato con:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId,
        salesPointId,
      });
    }

    try {
      const entriesJson = await AsyncStorage.getItem(this.CALENDAR_ENTRIES_KEY);
      console.log(
        '📥 Repository: Dati AsyncStorage calendar_entries:',
        entriesJson ? 'presenti' : 'assenti'
      );
      if (entriesJson) {
        console.log('📥 Repository: Lunghezza JSON caricato:', entriesJson.length);
        console.log('📥 Repository: Primi 200 caratteri JSON:', entriesJson.substring(0, 200));
      }

      if (!entriesJson) {
        console.log(
          '📥 Repository: Nessun dato trovato, restituendo array vuoto'
        );
        return [];
      }

      const parsedEntries = JSON.parse(entriesJson, (key, value) => {
        if (key === 'focusReferencesData' && Array.isArray(value)) {
          console.log('📥 Repository: Parsing focusReferencesData:', value);
        }
        return value;
      });
      console.log(
        '📥 Repository: Entries parseati:',
        parsedEntries.length,
        'entries'
      );
      
      // Debug: verifica se il parsing JSON ha mantenuto i dati
      if (parsedEntries.length > 0) {
        const firstParsedEntry = parsedEntries[0];
        console.log('📥 Repository: Primo entry dopo parsing (raw):', {
          id: firstParsedEntry.id,
          focusReferencesData: firstParsedEntry.focusReferencesData,
          focusReferencesCount: firstParsedEntry.focusReferencesData?.length || 0,
        });
      }
      
      // Validazione e correzione dei dati dopo parsing
      const entries: CalendarEntry[] = parsedEntries.map((entry: any) => {
        // Debug: log dei dati raw prima della correzione
        console.log('📥 Repository: Entry raw prima correzione:', {
          id: entry.id,
          focusReferencesData: entry.focusReferencesData,
          focusReferencesDataType: typeof entry.focusReferencesData,
          focusReferencesDataLength: entry.focusReferencesData?.length,
        });
        
        // Assicuriamoci che tutti i campi opzionali siano presenti
        const correctedEntry: CalendarEntry = {
          ...entry,
          focusReferencesData: Array.isArray(entry.focusReferencesData) ? entry.focusReferencesData : [],
          tags: Array.isArray(entry.tags) ? entry.tags : [],
          sales: Array.isArray(entry.sales) ? entry.sales : [],
          actions: Array.isArray(entry.actions) ? entry.actions : [],
          repeatSettings: entry.repeatSettings || null,
        };
        
        // Debug: log dei dati dopo la correzione
        console.log('📥 Repository: Entry dopo correzione:', {
          id: correctedEntry.id,
          focusReferencesData: correctedEntry.focusReferencesData,
          focusReferencesDataLength: correctedEntry.focusReferencesData?.length,
        });
        
        return correctedEntry;
      });
      
      // Debug: verifica dopo la correzione
      if (entries.length > 0) {
        const firstEntry = entries[0];
        console.log('📥 Repository: Primo entry dopo correzione:', {
          id: firstEntry.id,
          focusReferencesData: firstEntry.focusReferencesData,
          focusReferencesCount: firstEntry.focusReferencesData?.length || 0,
        });
      }

      const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const matchesDateRange = entryDate >= startDate && entryDate <= endDate;
        const matchesUser = !userId || entry.userId === userId;
        const matchesSalesPoint =
          !salesPointId || entry.salesPointId === salesPointId;

        return matchesDateRange && matchesUser && matchesSalesPoint;
      });

      console.log(
        '📥 Repository: Entries filtrati:',
        filteredEntries.length,
        'entries'
      );
      
      // Debug: log dei dettagli degli entry per verificare focusReferencesData
      filteredEntries.forEach((entry, index) => {
        console.log(`📥 Repository: Entry ${index + 1}:`, {
          id: entry.id,
          date: entry.date,
          focusReferencesData: entry.focusReferencesData,
          focusReferencesCount: entry.focusReferencesData?.length || 0,
        });
      });
      
      return filteredEntries;
    } catch (error) {
      console.error('❌ Repository: Errore nel getCalendarEntries:', error);
      return [];
    }
  }

  async getCalendarEntry(id: string): Promise<CalendarEntry | null> {
    console.log('📥 Repository: getCalendarEntry chiamato per ID:', id);

    try {
      const entriesJson = await AsyncStorage.getItem(this.CALENDAR_ENTRIES_KEY);
      if (!entriesJson) {
        console.log('📥 Repository: Nessun dato trovato per getCalendarEntry');
        return null;
      }

      const entries: CalendarEntry[] = JSON.parse(entriesJson);
      const entry = entries.find(entry => entry.id === id) || null;

      console.log('📥 Repository: Entry trovata:', entry ? 'sì' : 'no');
      return entry;
    } catch (error) {
      console.error('❌ Repository: Errore nel getCalendarEntry:', error);
      return null;
    }
  }

  async saveCalendarEntry(
    entry: CreateCalendarEntryRequest
  ): Promise<CalendarEntry> {
    console.log('💾 Repository: saveCalendarEntry chiamato con:', entry);

    try {
      const newEntry: CalendarEntry = {
        id: this.generateId(),
        ...entry,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entriesJson = await AsyncStorage.getItem(this.CALENDAR_ENTRIES_KEY);
      const entries: CalendarEntry[] = entriesJson
        ? JSON.parse(entriesJson)
        : [];

      // Log per debug dei chatNotes
      entries.forEach(entry => {
        console.log('📝 Repository: Entry', entry.id, 'chatNotes:', entry.chatNotes ? entry.chatNotes.length : 'undefined');
        if (entry.chatNotes && entry.chatNotes.length > 0) {
          console.log('📝 Repository: Entry con chatNotes trovata:', entry.id, 'chatNotes:', entry.chatNotes.length);
        }
      });

      entries.push(newEntry);
      // Forza la serializzazione corretta
      const entriesToSave = JSON.stringify(entries);
      await AsyncStorage.setItem(
        this.CALENDAR_ENTRIES_KEY,
        entriesToSave
      );
      

      return newEntry;
    } catch (error) {
      console.error('❌ Repository: Errore nel saveCalendarEntry:', error);
      throw error;
    }
  }

  async updateCalendarEntry(
    id: string,
    updates: UpdateCalendarEntryRequest
  ): Promise<CalendarEntry> {
    console.log(
      '✏️ Repository: updateCalendarEntry chiamato per ID:',
      id,
      'con updates:',
      updates
    );
    console.log('✏️ Repository: chatNotes negli updates:', updates.chatNotes);

    try {
      const entriesJson = await AsyncStorage.getItem(this.CALENDAR_ENTRIES_KEY);
      if (!entriesJson) throw new Error('Entry not found');

      const entries: CalendarEntry[] = JSON.parse(entriesJson);
      const entryIndex = entries.findIndex(entry => entry.id === id);

      if (entryIndex === -1) throw new Error('Entry not found');

      const existingEntry = entries[entryIndex];
      if (!existingEntry) throw new Error('Entry not found');

      const updatedEntry: CalendarEntry = {
        ...existingEntry,
        ...updates,
        updatedAt: new Date(),
      };

      console.log('✏️ Repository: Entry aggiornata con chatNotes:', updatedEntry.chatNotes);



      entries[entryIndex] = updatedEntry;

      const entriesToSave = JSON.stringify(entries);
      await AsyncStorage.setItem(
        this.CALENDAR_ENTRIES_KEY,
        entriesToSave
      );
      return updatedEntry;
    } catch (error) {
      console.error('❌ Repository: Errore nel updateCalendarEntry:', error);
      throw error;
    }
  }

  async deleteCalendarEntry(id: string): Promise<void> {
    console.log('🗑️ Repository: deleteCalendarEntry chiamato per ID:', id);

    try {
      const entriesJson = await AsyncStorage.getItem(this.CALENDAR_ENTRIES_KEY);
      if (!entriesJson) return;

      const entries: CalendarEntry[] = JSON.parse(entriesJson);
      const filteredEntries = entries.filter(entry => entry.id !== id);

      await AsyncStorage.setItem(
        this.CALENDAR_ENTRIES_KEY,
        JSON.stringify(filteredEntries)
      );
      console.log('🗑️ Repository: Entry eliminata con successo');
    } catch (error) {
      console.error('❌ Repository: Errore nel deleteCalendarEntry:', error);
      throw error;
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    console.log('👥 Repository: getUsers chiamato');

    try {
      const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
      console.log(
        '👥 Repository: Dati AsyncStorage users:',
        usersJson ? 'presenti' : 'assenti'
      );

      const users = usersJson ? JSON.parse(usersJson) : [];
      console.log('👥 Repository: Utenti caricati:', users.length, 'utenti');
      return users;
    } catch (error) {
      console.error('❌ Repository: Errore nel getUsers:', error);
      return [];
    }
  }

  async getUser(id: string): Promise<User | null> {
    console.log('👥 Repository: getUser chiamato per ID:', id);

    try {
      const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
      if (!usersJson) return null;

      const users: User[] = JSON.parse(usersJson);
      const user = users.find(user => user.id === id) || null;

      console.log('👥 Repository: Utente trovato:', user ? 'sì' : 'no');
      return user;
    } catch (error) {
      console.error('❌ Repository: Errore nel getUser:', error);
      return null;
    }
  }

  async saveUser(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    if (!this.silentMode) {
      console.log('💾 Repository: saveUser chiamato con:', user);
    }

    try {
      const newUser: User = {
        id: this.generateId(),
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];

      users.push(newUser);
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      if (!this.silentMode) {
        console.log('💾 Repository: Utente salvato con ID:', newUser.id);
      }
      return newUser;
    } catch (error) {
      console.error('❌ Repository: Errore nel saveUser:', error);
      throw error;
    }
  }

  async saveUsers(users: User[]): Promise<void> {
    if (__DEV__) {
      console.log('💾 Repository: Salvataggio utenti in massa:', users.length);
    }
    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  async clearUsers(): Promise<void> {
    if (__DEV__) {
      console.log('🗑️ Repository: Pulizia utenti');
    }
    await AsyncStorage.removeItem(this.USERS_KEY);
  }

  // SalesPoint methods
  async getSalesPoints(): Promise<SalesPoint[]> {
    console.log('🏪 Repository: getSalesPoints chiamato');

    try {
      const salesPointsJson = await AsyncStorage.getItem(this.SALES_POINTS_KEY);
      console.log(
        '🏪 Repository: Dati AsyncStorage sales_points:',
        salesPointsJson ? 'presenti' : 'assenti'
      );

      const salesPoints = salesPointsJson ? JSON.parse(salesPointsJson) : [];
      console.log(
        '🏪 Repository: Punti vendita caricati:',
        salesPoints.length,
        'punti vendita'
      );
      return salesPoints;
    } catch (error) {
      console.error('❌ Repository: Errore nel getSalesPoints:', error);
      return [];
    }
  }

  async getSalesPoint(id: string): Promise<SalesPoint | null> {
    console.log('🏪 Repository: getSalesPoint chiamato per ID:', id);

    try {
      const salesPointsJson = await AsyncStorage.getItem(this.SALES_POINTS_KEY);
      if (!salesPointsJson) return null;

      const salesPoints: SalesPoint[] = JSON.parse(salesPointsJson);
      const salesPoint = salesPoints.find(sp => sp.id === id) || null;

      console.log(
        '🏪 Repository: Punto vendita trovato:',
        salesPoint ? 'sì' : 'no'
      );
      return salesPoint;
    } catch (error) {
      console.error('❌ Repository: Errore nel getSalesPoint:', error);
      return null;
    }
  }

  async saveSalesPoint(
    salesPoint: Omit<SalesPoint, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SalesPoint> {
    if (!this.silentMode) {
      console.log('💾 Repository: saveSalesPoint chiamato con:', salesPoint);
    }

    try {
      const newSalesPoint: SalesPoint = {
        id: this.generateId(),
        ...salesPoint,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const salesPointsJson = await AsyncStorage.getItem(this.SALES_POINTS_KEY);
      const salesPoints: SalesPoint[] = salesPointsJson
        ? JSON.parse(salesPointsJson)
        : [];

      salesPoints.push(newSalesPoint);
      await AsyncStorage.setItem(
        this.SALES_POINTS_KEY,
        JSON.stringify(salesPoints)
      );

      if (!this.silentMode) {
        console.log(
          '💾 Repository: Punto vendita salvato con ID:',
          newSalesPoint.id
        );
      }
      return newSalesPoint;
    } catch (error) {
      console.error('❌ Repository: Errore nel saveSalesPoint:', error);
      throw error;
    }
  }

  async saveSalesPoints(salesPoints: SalesPoint[]): Promise<void> {
    if (__DEV__) {
      console.log('💾 Repository: Salvataggio punti vendita in massa:', salesPoints.length);
    }
    await AsyncStorage.setItem(this.SALES_POINTS_KEY, JSON.stringify(salesPoints));
  }

  async clearSalesPoints(): Promise<void> {
    if (__DEV__) {
      console.log('🗑️ Repository: Pulizia punti vendita');
    }
    await AsyncStorage.removeItem(this.SALES_POINTS_KEY);
  }

  // Import/Export methods
  async importFromExcel(data: any): Promise<void> {
    console.log('📥 Repository: importFromExcel chiamato con:', data);
    // TODO: Implement Excel import logic
    console.log('Import from Excel:', data);
  }

  async exportToExcel(): Promise<any> {
    console.log('📤 Repository: exportToExcel chiamato');
    // TODO: Implement Excel export logic
    console.log('Export to Excel');
    return {};
  }

  // ExcelRow methods
  async getExcelRows(): Promise<ExcelRow[]> {
    try {
      const rowsJson = await AsyncStorage.getItem(this.EXCEL_ROWS_KEY);
      if (!rowsJson) {
        return [];
      }
      return JSON.parse(rowsJson);
    } catch (error) {
      console.error('❌ Repository: Errore nel caricamento ExcelRows:', error);
      return [];
    }
  }

  async saveExcelRows(rows: ExcelRow[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.EXCEL_ROWS_KEY, JSON.stringify(rows));
      if (!this.silentMode) {
        console.log('✅ Repository: ExcelRows salvati:', rows.length, 'righe');
      }
    } catch (error) {
      console.error('❌ Repository: Errore nel salvataggio ExcelRows:', error);
      throw error;
    }
  }

  async clearExcelRows(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.EXCEL_ROWS_KEY);
      if (!this.silentMode) {
        console.log('🗑️ Repository: ExcelRows cancellati');
      }
    } catch (error) {
      console.error('❌ Repository: Errore nella cancellazione ExcelRows:', error);
      throw error;
    }
  }

  // PriceReference methods
  async getPriceReferences(): Promise<PriceReference[]> {
    if (__DEV__) {
      console.log('📥 Repository: getPriceReferences chiamato');
    }

    try {
      const referencesJson = await AsyncStorage.getItem(this.PRICE_REFERENCES_KEY);
      
      if (!referencesJson) {
        if (__DEV__) {
          console.log('📥 Repository: Nessun dato referenze trovato');
        }
        return [];
      }

      const references: PriceReference[] = JSON.parse(referencesJson);
      if (__DEV__) {
        console.log('📥 Repository: Referenze caricate:', references.length);
      }
      
      return references;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Repository: Errore nel caricamento referenze:', error);
      }
      return [];
    }
  }

  async getPriceReference(id: string): Promise<PriceReference | null> {
    const references = await this.getPriceReferences();
    return references.find(ref => ref.id === id) || null;
  }

  async savePriceReference(reference: CreatePriceReferenceRequest): Promise<PriceReference> {
    const newReference: PriceReference = {
      id: this.generateId(),
      ...reference,
      isActive: reference.isActive ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const references = await this.getPriceReferences();
    references.push(newReference);
    await AsyncStorage.setItem(this.PRICE_REFERENCES_KEY, JSON.stringify(references));

    if (__DEV__) {
      console.log('💾 Repository: Referenza salvata:', newReference.id);
    }

    return newReference;
  }

  async updatePriceReference(id: string, updates: UpdatePriceReferenceRequest): Promise<PriceReference> {
    const references = await this.getPriceReferences();
    const index = references.findIndex(ref => ref.id === id);
    
    if (index === -1) {
      throw new Error(`Referenza con ID ${id} non trovata`);
    }

    references[index] = {
      ...references[index],
      ...updates,
      updatedAt: new Date(),
    };

    await AsyncStorage.setItem(this.PRICE_REFERENCES_KEY, JSON.stringify(references));

    if (__DEV__) {
      console.log('🔄 Repository: Referenza aggiornata:', id);
    }

    return references[index];
  }

  async deletePriceReference(id: string): Promise<void> {
    const references = await this.getPriceReferences();
    const filteredReferences = references.filter(ref => ref.id !== id);
    
    await AsyncStorage.setItem(this.PRICE_REFERENCES_KEY, JSON.stringify(filteredReferences));

    if (__DEV__) {
      console.log('🗑️ Repository: Referenza eliminata:', id);
    }
  }

  async savePriceReferences(references: PriceReference[]): Promise<void> {
    if (__DEV__) {
      console.log('💾 Repository: Salvataggio referenze in massa:', references.length);
    }
    await AsyncStorage.setItem(this.PRICE_REFERENCES_KEY, JSON.stringify(references));
  }

  async clearPriceReferences(): Promise<void> {
    if (__DEV__) {
      console.log('🗑️ Repository: Pulizia referenze');
    }
    await AsyncStorage.removeItem(this.PRICE_REFERENCES_KEY);
  }

  async getActivePriceReferences(): Promise<PriceReference[]> {
    const references = await this.getPriceReferences();
    return references.filter(ref => ref.isActive);
  }

  async togglePriceReferenceActive(id: string, isActive: boolean): Promise<void> {
    await this.updatePriceReference(id, { isActive });
  }

  // Metodi per Focus References
  async getFocusReferences(): Promise<string[]> {
    try {
      const focusData = await AsyncStorage.getItem(this.FOCUS_REFERENCES_KEY);
      if (focusData) {
        const focusReferences = JSON.parse(focusData);
        if (__DEV__) {
          console.log('📥 Repository: Referenze focus caricate:', focusReferences.length);
        }
        return focusReferences;
      }
      return [];
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Repository: Errore nel caricamento referenze focus:', error);
      }
      return [];
    }
  }

  async saveFocusReferences(referenceIds: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FOCUS_REFERENCES_KEY, JSON.stringify(referenceIds));
      if (__DEV__) {
        console.log('💾 Repository: Referenze focus salvate:', referenceIds.length);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Repository: Errore nel salvataggio referenze focus:', error);
      }
      throw error;
    }
  }

  async clearFocusReferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.FOCUS_REFERENCES_KEY);
      await AsyncStorage.removeItem(this.FOCUS_NET_PRICES_KEY);
      if (__DEV__) {
        console.log('🗑️ Repository: Referenze focus rimosse');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Repository: Errore nella rimozione referenze focus:', error);
      }
      throw error;
    }
  }

  async saveFocusNetPrices(netPrices: { [key: string]: string }): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FOCUS_NET_PRICES_KEY, JSON.stringify(netPrices));
      if (__DEV__) {
        console.log('💾 Repository: Prezzi netti focus salvati:', Object.keys(netPrices).length);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Repository: Errore nel salvataggio prezzi netti focus:', error);
      }
      throw error;
    }
  }

  async getFocusNetPrices(): Promise<{ [key: string]: string }> {
    try {
      const netPricesData = await AsyncStorage.getItem(this.FOCUS_NET_PRICES_KEY);
      if (netPricesData) {
        const netPrices = JSON.parse(netPricesData);
        if (__DEV__) {
          console.log('📥 Repository: Prezzi netti focus caricati:', Object.keys(netPrices).length);
        }
        return netPrices;
      }
      return {};
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Repository: Errore nel caricamento prezzi netti focus:', error);
      }
      return {};
    }
  }

  private generateId(): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    if (!this.silentMode) {
      console.log('🆔 Repository: ID generato:', id);
    }
    return id;
  }

  // MasterData methods
  async getMasterData(): Promise<MasterDataRow[]> {
    if (__DEV__) {
      console.log('📊 Repository: getMasterData chiamato');
    }

    try {
      const masterDataJson = await AsyncStorage.getItem(this.MASTER_DATA_KEY);
      
      if (!masterDataJson) {
        if (__DEV__) {
          console.log('📊 Repository: Nessun dato master trovato');
        }
        return [];
      }

      const masterData: MasterDataRow[] = JSON.parse(masterDataJson);
      if (__DEV__) {
        console.log('📊 Repository: Dati master caricati:', masterData.length);
      }
      
      return masterData;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Repository: Errore nel caricamento dati master:', error);
      }
      return [];
    }
  }

  async getMasterDataRow(id: string): Promise<MasterDataRow | null> {
    const masterData = await this.getMasterData();
    return masterData.find(row => row.id === id) || null;
  }

  async saveMasterDataRow(row: CreateMasterDataRowRequest): Promise<MasterDataRow> {
    const newRow: MasterDataRow = {
      id: this.generateId(),
      ...row,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const masterData = await this.getMasterData();
    masterData.push(newRow);
    await AsyncStorage.setItem(this.MASTER_DATA_KEY, JSON.stringify(masterData));

    if (__DEV__) {
      console.log('💾 Repository: Riga master salvata:', newRow.id);
    }

    return newRow;
  }

  async updateMasterDataRow(id: string, updates: UpdateMasterDataRowRequest): Promise<MasterDataRow> {
    const masterData = await this.getMasterData();
    const index = masterData.findIndex(row => row.id === id);
    
    if (index === -1) {
      throw new Error(`Riga master con ID ${id} non trovata`);
    }

    masterData[index] = {
      ...masterData[index],
      ...updates,
      updatedAt: new Date(),
    };

    await AsyncStorage.setItem(this.MASTER_DATA_KEY, JSON.stringify(masterData));

    if (__DEV__) {
      console.log('🔄 Repository: Riga master aggiornata:', id);
    }

    return masterData[index];
  }

  async deleteMasterDataRow(id: string): Promise<void> {
    const masterData = await this.getMasterData();
    const filteredData = masterData.filter(row => row.id !== id);
    
    await AsyncStorage.setItem(this.MASTER_DATA_KEY, JSON.stringify(filteredData));

    if (__DEV__) {
      console.log('🗑️ Repository: Riga master eliminata:', id);
    }
  }

  async saveMasterData(rows: MasterDataRow[]): Promise<void> {
    if (__DEV__) {
      console.log('💾 Repository: Salvataggio dati master in massa:', rows.length);
    }
    await AsyncStorage.setItem(this.MASTER_DATA_KEY, JSON.stringify(rows));
  }

  async clearMasterData(): Promise<void> {
    if (__DEV__) {
      console.log('🗑️ Repository: Pulizia dati master');
    }
    await AsyncStorage.removeItem(this.MASTER_DATA_KEY);
  }
}
