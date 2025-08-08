import { create } from 'zustand';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import listinoData from '../../listino_luglio25.json';

// Interfaccia per i dati del listino
export interface ListinoItem {
  Brand: string;
  Sottobrand: string;
  Tipologia: string;
  EAN: number;
  "COD.": number;
  Descrizione: string;
  "PZ / CRT": number;
  "listino unitario  2025": number;
  "Prezzo netto": number;
}

// Interfaccia per le referenze focus
export interface FocusReference {
  id: string;
  brand: string;
  subBrand: string;
  typology: string;
  ean: string;
  code: string;
  description: string;
  piecesPerCarton: number;
  unitPrice: number;
  netPrice: number;
}

interface FocusReferencesState {
  // Dati del listino completo
  allReferences: FocusReference[];
  // Referenze focus attive (globali per tutti gli utenti)
  focusReferences: string[];
  // Prezzi netti personalizzati (globali per tutti gli utenti)
  netPrices: { [key: string]: string };
  isLoading: boolean;
  error: string | null;

  // Azioni
  loadAllReferences: () => void;
  getAllReferences: () => FocusReference[];
  getFocusReferences: () => string[];
  getNetPrices: () => { [key: string]: string };
  setFocusReferences: (references: string[]) => void;
  setNetPrices: (prices: { [key: string]: string }) => void;
  toggleFocusReference: (referenceId: string) => void;
  updateNetPrice: (referenceId: string, price: string) => void;
  clearFocusReferences: () => void;
  clearError: () => void;
  
  // Nuove azioni per persistenza centralizzata
  loadFocusReferencesFromFirestore: () => Promise<void>;
  saveFocusReferencesToFirestore: () => Promise<void>;
  loadNetPricesFromFirestore: () => Promise<void>;
  saveNetPricesToFirestore: () => Promise<void>;
}

export const useFocusReferencesStore = create<FocusReferencesState>((set, get) => ({
  // Stato iniziale
  allReferences: [],
  focusReferences: [],
  netPrices: {},
  isLoading: false,
  error: null,

  // Carica tutte le referenze dal file JSON
  loadAllReferences: () => {
    set({ isLoading: true, error: null });

    try {
      // I dati sono già importati dal file JSON
      const data = listinoData as ListinoItem[];
      
      // Verifica che i dati siano validi
      if (!data || !Array.isArray(data)) {
        throw new Error('Dati del listino non validi o non caricati');
      }

      // Converti i dati nel formato FocusReference con controlli di sicurezza
      const references: FocusReference[] = data
        .filter(item => item && item["COD."] != null) // Filtra elementi null/undefined
        .map((item, index) => ({
          id: (item["COD."] || '').toString(),
          brand: item.Brand || '',
          subBrand: item.Sottobrand || '',
          typology: item.Tipologia || '',
          ean: (item.EAN || '').toString(),
          code: (item["COD."] || '').toString(),
          description: item.Descrizione || '',
          piecesPerCarton: item["PZ / CRT"] || 0,
          unitPrice: item["listino unitario  2025"] || 0,
          netPrice: item["Prezzo netto"] || 0
        }));

      set({
        allReferences: references,
        isLoading: false
      });
    } catch (error) {

      set({
        error: 'Errore nel caricamento dei dati del listino',
        isLoading: false
      });
    }
  },

  // Restituisce tutte le referenze
  getAllReferences: () => {
    return get().allReferences;
  },

  // Restituisce le referenze focus attive
  getFocusReferences: () => {
    return get().focusReferences;
  },

  // Restituisce i prezzi netti
  getNetPrices: () => {
    return get().netPrices;
  },

  // Imposta le referenze focus
  setFocusReferences: (references: string[]) => {
    set({ focusReferences: references });
  },

  // Imposta i prezzi netti
  setNetPrices: (prices: { [key: string]: string }) => {
    set({ netPrices: prices });
  },

  // Toggle di una referenza focus
  toggleFocusReference: (referenceId: string) => {
    set(state => {
      const newSelection = state.focusReferences.includes(referenceId)
        ? state.focusReferences.filter(id => id !== referenceId)
        : [...state.focusReferences, referenceId];
      
      return { focusReferences: newSelection };
    });
  },

  // Aggiorna il prezzo netto di una referenza
  updateNetPrice: (referenceId: string, price: string) => {
    set(state => ({
      netPrices: {
        ...state.netPrices,
        [referenceId]: price
      }
    }));

  },

  // Pulisce tutte le referenze focus
  clearFocusReferences: () => {
    set({ focusReferences: [], netPrices: {} });
  },

  // Pulisce gli errori
  clearError: () => {
    set({ error: null });
  },

  // Carica le referenze focus da Firestore (globale per tutti gli utenti)
  loadFocusReferencesFromFirestore: async () => {
    try {
      set({ isLoading: true, error: null });
      if (__DEV__) { console.log('📥 FocusReferencesStore: Caricamento referenze focus da Firestore...'); }

      const db = getFirestore();
      const focusRef = doc(db, 'app_settings', 'focus_references');
      const focusDoc = await getDoc(focusRef);

      if (focusDoc.exists()) {
        const data = focusDoc.data();
        const references = data.focusReferences || [];
        const netPrices = data.netPrices || {};

        set({ 
          focusReferences: references,
          netPrices: netPrices,
          isLoading: false 
        });

        if (__DEV__) { console.log(`✅ FocusReferencesStore: Caricate ${references.length} referenze focus da Firestore`); }
        if (__DEV__) { console.log(`💰 FocusReferencesStore: Caricati ${Object.keys(netPrices).length} prezzi netti da Firestore`); }
      } else {
        if (__DEV__) { console.log('📝 FocusReferencesStore: Nessuna configurazione focus trovata su Firestore, usando valori di default'); }
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('❌ FocusReferencesStore: Errore caricamento da Firestore:', error);
      set({ 
        error: 'Errore nel caricamento delle referenze focus da Firestore',
        isLoading: false 
      });
    }
  },

  // Salva le referenze focus su Firestore (globale per tutti gli utenti)
  saveFocusReferencesToFirestore: async () => {
    try {
      const state = get();
      if (__DEV__) { console.log('💾 FocusReferencesStore: Salvataggio referenze focus su Firestore...', {
        focusReferences: state.focusReferences.length,
        netPrices: Object.keys(state.netPrices).length
      }); }

      const db = getFirestore();
      const focusRef = doc(db, 'app_settings', 'focus_references');
      
      await setDoc(focusRef, {
        focusReferences: state.focusReferences,
        netPrices: state.netPrices,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin' // In futuro potrebbe essere l'ID dell'utente titolare
      });

      if (__DEV__) { console.log('✅ FocusReferencesStore: Referenze focus salvate su Firestore con successo'); }
    } catch (error) {
      console.error('❌ FocusReferencesStore: Errore salvataggio su Firestore:', error);
      set({ 
        error: 'Errore nel salvataggio delle referenze focus su Firestore'
      });
      throw error;
    }
  },

  // Carica i prezzi netti da Firestore (globale per tutti gli utenti)
  loadNetPricesFromFirestore: async () => {
    try {
      if (__DEV__) { console.log('📥 FocusReferencesStore: Caricamento prezzi netti da Firestore...'); }

      const db = getFirestore();
      const focusRef = doc(db, 'app_settings', 'focus_references');
      const focusDoc = await getDoc(focusRef);

      if (focusDoc.exists()) {
        const data = focusDoc.data();
        const netPrices = data.netPrices || {};

        set({ netPrices });

        if (__DEV__) { console.log(`💰 FocusReferencesStore: Caricati ${Object.keys(netPrices).length} prezzi netti da Firestore`); }
      } else {
        if (__DEV__) { console.log('📝 FocusReferencesStore: Nessun prezzo netto trovato su Firestore, usando valori di default'); }
      }
    } catch (error) {
      console.error('❌ FocusReferencesStore: Errore caricamento prezzi netti da Firestore:', error);
      set({ 
        error: 'Errore nel caricamento dei prezzi netti da Firestore'
      });
    }
  },

  // Salva i prezzi netti su Firestore (globale per tutti gli utenti)
  saveNetPricesToFirestore: async () => {
    try {
      const state = get();
      if (__DEV__) { console.log('💾 FocusReferencesStore: Salvataggio prezzi netti su Firestore...', {
        netPrices: Object.keys(state.netPrices).length
      }); }

      const db = getFirestore();
      const focusRef = doc(db, 'app_settings', 'focus_references');
      
      await setDoc(focusRef, {
        focusReferences: state.focusReferences,
        netPrices: state.netPrices,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin' // In futuro potrebbe essere l'ID dell'utente titolare
      });

      if (__DEV__) { console.log('✅ FocusReferencesStore: Prezzi netti salvati su Firestore con successo'); }
    } catch (error) {
      console.error('❌ FocusReferencesStore: Errore salvataggio prezzi netti su Firestore:', error);
      set({ 
        error: 'Errore nel salvataggio dei prezzi netti su Firestore'
      });
      throw error;
    }
  },
})); 