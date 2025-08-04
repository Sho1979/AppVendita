import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../core/services/firebase';
import { CalendarEntry } from '../models/CalendarEntry';
import { User } from '../models/User';
import { SalesPoint } from '../models/SalesPoint';
import { PriceReference } from '../models/PriceReference';

export class FirebaseCalendarRepository {
  private readonly COLLECTIONS = {
    CALENDAR_ENTRIES: 'calendarEntries',
    USERS: 'users',
    SALES_POINTS: 'salesPoints',
    EXCEL_DATA: 'excelData',
    FOCUS_REFERENCES: 'focusReferences',
    ACTIVE_REFERENCES: 'activeReferences'
  };

  // ===== CALENDAR ENTRIES =====
  
  async getEntries(filters?: any): Promise<CalendarEntry[]> {
    try {
      let q = collection(db, this.COLLECTIONS.CALENDAR_ENTRIES);
      
      // Applica filtri se forniti
      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters?.salesPointId) {
        q = query(q, where('salesPointId', '==', filters.salesPointId));
      }
      if (filters?.date) {
        q = query(q, where('date', '==', filters.date));
      }
      
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        date: doc.data().date?.toDate()
      })) as CalendarEntry[];

      // Aggiungi tag di default per le entry che non hanno tag ma hanno contenuto
      return entries.map(entry => {
        const hasTags = entry.tags && entry.tags.length > 0;
        const hasFocusData = entry.focusReferencesData && entry.focusReferencesData.length > 0;
        const hasSales = entry.sales && entry.sales.length > 0;
        const hasActions = entry.actions && entry.actions.length > 0;
        
        // Se non ci sono tag espliciti ma c'è contenuto, genera tag di default
        if (!hasTags && (hasFocusData || hasSales || hasActions)) {
          const defaultTags = [];
          if (hasFocusData) defaultTags.push('merchandiser'); // M per focus references
          if (hasSales) defaultTags.push('sell_in'); // SI per vendite
          if (hasActions) defaultTags.push('check'); // ✓ per azioni
          
          return {
            ...entry,
            tags: defaultTags
          };
        }
        
        return entry;
      });
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel recupero entries:', error);
      throw error;
    }
  }

  async getEntryById(id: string): Promise<CalendarEntry | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.CALENDAR_ENTRIES, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const entry = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
          date: docSnap.data().date?.toDate()
        } as CalendarEntry;

        // Aggiungi tag di default se necessario
        const hasTags = entry.tags && entry.tags.length > 0;
        const hasFocusData = entry.focusReferencesData && entry.focusReferencesData.length > 0;
        const hasSales = entry.sales && entry.sales.length > 0;
        const hasActions = entry.actions && entry.actions.length > 0;
        
        // Se non ci sono tag espliciti ma c'è contenuto, genera tag di default
        if (!hasTags && (hasFocusData || hasSales || hasActions)) {
          const defaultTags = [];
          if (hasFocusData) defaultTags.push('merchandiser'); // M per focus references
          if (hasSales) defaultTags.push('sell_in'); // SI per vendite
          if (hasActions) defaultTags.push('check'); // ✓ per azioni
          
          return {
            ...entry,
            tags: defaultTags
          };
        }
        
        return entry;
      }
      return null;
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel recupero entry:', error);
      throw error;
    }
  }

  async addEntry(entry: Omit<CalendarEntry, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.CALENDAR_ENTRIES), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ FirebaseCalendarRepository: Entry aggiunta con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nell\'aggiunta entry:', error);
      throw error;
    }
  }

  async updateEntry(entry: CalendarEntry): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.CALENDAR_ENTRIES, entry.id);
      await updateDoc(docRef, {
        ...entry,
        updatedAt: serverTimestamp()
      });
      console.log('✅ FirebaseCalendarRepository: Entry aggiornata:', entry.id);
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nell\'aggiornamento entry:', error);
      throw error;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTIONS.CALENDAR_ENTRIES, id));
      console.log('✅ FirebaseCalendarRepository: Entry eliminata:', id);
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nell\'eliminazione entry:', error);
      throw error;
    }
  }

  // ===== USERS =====
  
  async getUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTIONS.USERS));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as User[];
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel recupero users:', error);
      throw error;
    }
  }

  async addUser(user: Omit<User, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.USERS), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nell\'aggiunta user:', error);
      throw error;
    }
  }

  // ===== SALES POINTS =====
  
  async getSalesPoints(): Promise<SalesPoint[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTIONS.SALES_POINTS));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as SalesPoint[];
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel recupero sales points:', error);
      throw error;
    }
  }

  async addSalesPoint(salesPoint: Omit<SalesPoint, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.SALES_POINTS), {
        ...salesPoint,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nell\'aggiunta sales point:', error);
      throw error;
    }
  }

  // ===== EXCEL DATA =====
  
  async saveExcelData(data: any[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Elimina dati esistenti
      const existingDocs = await getDocs(collection(db, this.COLLECTIONS.EXCEL_DATA));
      existingDocs.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Aggiungi nuovi dati
      data.forEach(item => {
        const docRef = doc(collection(db, this.COLLECTIONS.EXCEL_DATA));
        batch.set(docRef, {
          ...item,
          createdAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log('✅ FirebaseCalendarRepository: Dati Excel salvati:', data.length, 'righe');
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel salvataggio dati Excel:', error);
      throw error;
    }
  }

  // DEPRECATO: Ora usiamo i dati statici invece di Firebase
  // async getExcelData(): Promise<any[]> {
  //   try {
  //     const querySnapshot = await getDocs(collection(db, this.COLLECTIONS.EXCEL_DATA));
  //     return querySnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data(),
  //       createdAt: doc.data().createdAt?.toDate()
  //     }));
  //   } catch (error) {
  //     console.error('❌ FirebaseCalendarRepository: Errore nel recupero dati Excel:', error);
  //     throw error;
  //   }
  // }

  // ===== REAL-TIME LISTENERS =====
  
  subscribeToEntries(callback: (entries: CalendarEntry[]) => void, filters?: any) {
    let q = collection(db, this.COLLECTIONS.CALENDAR_ENTRIES);
    
    if (filters?.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        date: doc.data().date?.toDate()
      })) as CalendarEntry[];
      
      callback(entries);
    });
  }

  // ===== BATCH OPERATIONS =====
  
  async batchUpdateEntries(entries: CalendarEntry[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      entries.forEach(entry => {
        const docRef = doc(db, this.COLLECTIONS.CALENDAR_ENTRIES, entry.id);
        batch.update(docRef, {
          ...entry,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log('✅ FirebaseCalendarRepository: Batch update completato per', entries.length, 'entries');
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel batch update:', error);
      throw error;
    }
  }

  // ===== ACTIVE REFERENCES =====
  
  async getActiveReferences(): Promise<PriceReference[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTIONS.ACTIVE_REFERENCES));
      
      const activeReferences: PriceReference[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          brand: data.brand || '',
          subBrand: data.subBrand || '',
          description: data.description || '',
          ean: data.ean || '',
          code: data.code || '',
          unitPrice: data.unitPrice || 0,
          netPrice: data.netPrice || 0,
          piecesPerCarton: data.piecesPerCarton || 0,
          typology: data.typology || '',
          isActive: data.isActive !== false, // Default true se non specificato
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PriceReference;
      });
      
      return activeReferences;
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel caricamento referenze attive:', error);
      throw error;
    }
  }

  async saveActiveReference(reference: Omit<PriceReference, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.ACTIVE_REFERENCES), {
        ...reference,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nel salvataggio referenza attiva:', error);
      throw error;
    }
  }

  async updateActiveReference(id: string, updates: Partial<PriceReference>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.ACTIVE_REFERENCES, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nell\'aggiornamento referenza attiva:', error);
      throw error;
    }
  }

  async deleteActiveReference(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTIONS.ACTIVE_REFERENCES, id));
    } catch (error) {
      console.error('❌ FirebaseCalendarRepository: Errore nell\'eliminazione referenza attiva:', error);
      throw error;
    }
  }
} 