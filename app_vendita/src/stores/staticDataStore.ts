import { create } from 'zustand';
import agentiClientiData from '../../agenti_clienti_luglio25_completo_mail_cell.json';

// Interfaccia per i dati degli agenti clienti
export interface AgenteCliente {
  Linea: string;
  "Codice Area Manager": string;
  "Codice Nam": string;
  "Codige Agente": string;
  "Nome Agente": string;
  "Mail Agente": string;
  "Cell Agente"?: number;
  Insegna: string;
  "Codice Cliente": number;
  Cliente: string;
  Cap: number;
  Indirizzo: string;
  Provincia: string;
  "Codice provincia": string;
  Latitudine: number;
  Longitudine: number;
}

interface StaticDataState {
  // Dati degli agenti clienti
  agentiClienti: AgenteCliente[];
  isLoading: boolean;
  error: string | null;
  
  // Azioni
  loadAgentiClienti: () => void;
  getAgentiClienti: () => AgenteCliente[];
  getAgentiClientiByFilter: (filter: Partial<AgenteCliente>) => AgenteCliente[];
  getUniqueValues: (field: keyof AgenteCliente) => string[];
  clearError: () => void;
}

export const useStaticDataStore = create<StaticDataState>((set, get) => ({
  // Stato iniziale
  agentiClienti: [],
  isLoading: false,
  error: null,

  // Carica i dati degli agenti clienti dal file JSON
  loadAgentiClienti: () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('📊 StaticDataStore: Caricamento dati agenti clienti...');
      
      // I dati sono già importati dal file JSON
      const data = agentiClientiData as AgenteCliente[];
      
      set({ 
        agentiClienti: data,
        isLoading: false 
      });
      
      console.log(`✅ StaticDataStore: Caricati ${data.length} agenti clienti`);
    } catch (error) {
      console.error('❌ StaticDataStore: Errore caricamento agenti clienti:', error);
      set({ 
        error: 'Errore nel caricamento dei dati agenti clienti',
        isLoading: false 
      });
    }
  },

  // Restituisce tutti gli agenti clienti
  getAgentiClienti: () => {
    return get().agentiClienti;
  },

  // Filtra gli agenti clienti per criteri specifici
  getAgentiClientiByFilter: (filter: Partial<AgenteCliente>) => {
    const data = get().agentiClienti;
    
    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        return item[key as keyof AgenteCliente] === value;
      });
    });
  },

  // Restituisce valori unici per un campo specifico
  getUniqueValues: (field: keyof AgenteCliente) => {
    const data = get().agentiClienti;
    const values = data.map(item => item[field]);
    return [...new Set(values)].filter(value => value !== null && value !== undefined) as string[];
  },

  // Pulisce gli errori
  clearError: () => {
    set({ error: null });
  },
})); 