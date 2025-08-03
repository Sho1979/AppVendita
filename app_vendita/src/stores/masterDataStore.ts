import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MasterDataRow, MasterDataFilters } from '../data/models/MasterData';

// Utility per logging condizionale
const devLog = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args);
  }
};

// Interfaccia per lo stato dei dati master
interface MasterDataState {
  // Dati principali
  masterData: MasterDataRow[];
  isLoading: boolean;
  error: string | null;
  lastSyncTimestamp: number;
  
  // Filtri aggregati per performance
  filters: MasterDataFilters;
  
  // Azioni per i dati
  setMasterData: (data: MasterDataRow[]) => void;
  addMasterDataRow: (row: MasterDataRow) => void;
  updateMasterDataRow: (id: string, updates: Partial<MasterDataRow>) => void;
  deleteMasterDataRow: (id: string) => void;
  clearMasterData: () => void;
  
  // Azioni per lo stato
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncTimestamp: (timestamp: number) => void;
  
  // Azioni per i filtri
  updateFilters: () => void;
  
  // Selettori ottimizzati per performance
  getMasterDataRowById: (id: string) => MasterDataRow | undefined;
  getMasterDataByAgent: (codiceAgente: string) => MasterDataRow[];
  getMasterDataByClient: (codiceCliente: string) => MasterDataRow[];
  getMasterDataByLine: (linea: string) => MasterDataRow[];
  getMasterDataByAreaManager: (codiceAreaManager: string) => MasterDataRow[];
  getMasterDataByNam: (codiceNam: string) => MasterDataRow[];
  
  // Selettori per filtri
  getLinee: () => string[];
  getAreaManagers: () => { codice: string; nome: string }[];
  getNamCodes: () => { codice: string; nome: string }[];
  getAgents: () => { codice: string; nome: string; mail: string; cell: string }[];
  getSalesPoints: () => { codice: string; nome: string; indirizzo: string; provincia: string }[];
  
  // Utility
  getMasterDataCount: () => number;
  getFiltersCount: () => number;
}

// Stato iniziale
const initialState = {
  masterData: [],
  isLoading: false,
  error: null,
  lastSyncTimestamp: 0,
  filters: {
    linee: [],
    areaManagers: [],
    namCodes: [],
    agents: [],
    salesPoints: []
  }
};

export const useMasterDataStore = create<MasterDataState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Azioni per i dati
      setMasterData: (masterData) => {
        devLog('📊 MasterDataStore: Impostando dati master:', masterData.length);
        set({ masterData });
        // Aggiorna automaticamente i filtri
        get().updateFilters();
      },
      
      addMasterDataRow: (row) => {
        devLog('➕ MasterDataStore: Aggiungendo riga master:', row.id);
        set((state) => ({
          masterData: [...state.masterData, row]
        }));
        get().updateFilters();
      },
      
      updateMasterDataRow: (id, updates) => {
        devLog('✏️ MasterDataStore: Aggiornando riga master:', id);
        set((state) => ({
          masterData: state.masterData.map(row => 
            row.id === id ? { ...row, ...updates, updatedAt: new Date() } : row
          )
        }));
        get().updateFilters();
      },
      
      deleteMasterDataRow: (id) => {
        devLog('🗑️ MasterDataStore: Eliminando riga master:', id);
        set((state) => ({
          masterData: state.masterData.filter(row => row.id !== id)
        }));
        get().updateFilters();
      },
      
      clearMasterData: () => {
        devLog('🧹 MasterDataStore: Pulizia dati master');
        set({ 
          masterData: [],
          filters: {
            linee: [],
            areaManagers: [],
            namCodes: [],
            agents: [],
            salesPoints: []
          }
        });
      },
      
      // Azioni per lo stato
      setLoading: (isLoading) => {
        devLog('⏳ MasterDataStore: Loading impostato a:', isLoading);
        set({ isLoading });
      },
      
      setError: (error) => {
        devLog('❌ MasterDataStore: Errore impostato:', error);
        set({ error });
      },
      
      setLastSyncTimestamp: (lastSyncTimestamp) => {
        devLog('🔄 MasterDataStore: Timestamp sincronizzazione aggiornato:', lastSyncTimestamp);
        set({ lastSyncTimestamp });
      },
      
      // Azioni per i filtri
      updateFilters: () => {
        const { masterData } = get();
        
        // Estrai valori unici per i filtri
        const linee = [...new Set(masterData.map(row => row.linea).filter(Boolean))];
        const areaManagers = [...new Set(masterData.map(row => row.codiceAreaManager).filter(Boolean))]
          .map(codice => ({ codice, nome: codice }));
        const namCodes = [...new Set(masterData.map(row => row.codiceNam).filter(Boolean))]
          .map(codice => ({ codice, nome: codice }));
        
        // Agenti unici
        const agentsMap = new Map();
        masterData.forEach(row => {
          if (row.codiceAgente && row.nomeAgente) {
            agentsMap.set(row.codiceAgente, {
              codice: row.codiceAgente,
              nome: row.nomeAgente,
              mail: row.mailAgente || '',
              cell: row.cellAgente || ''
            });
          }
        });
        const agents = Array.from(agentsMap.values());
        
        // Punti vendita unici
        const salesPointsMap = new Map();
        masterData.forEach(row => {
          if (row.codiceCliente && row.cliente) {
            salesPointsMap.set(row.codiceCliente, {
              codice: row.codiceCliente,
              nome: row.cliente,
              indirizzo: row.indirizzo || '',
              provincia: row.provincia || ''
            });
          }
        });
        const salesPoints = Array.from(salesPointsMap.values());
        
        const filters: MasterDataFilters = {
          linee,
          areaManagers,
          namCodes,
          agents,
          salesPoints
        };
        
        devLog('🔍 MasterDataStore: Filtri aggiornati:', {
          linee: linee.length,
          areaManagers: areaManagers.length,
          namCodes: namCodes.length,
          agents: agents.length,
          salesPoints: salesPoints.length
        });
        
        set({ filters });
      },
      
      // Selettori ottimizzati per performance
      getMasterDataRowById: (id) => {
        const { masterData } = get();
        return masterData.find(row => row.id === id);
      },
      
      getMasterDataByAgent: (codiceAgente) => {
        const { masterData } = get();
        return masterData.filter(row => row.codiceAgente === codiceAgente);
      },
      
      getMasterDataByClient: (codiceCliente) => {
        const { masterData } = get();
        return masterData.filter(row => row.codiceCliente === codiceCliente);
      },
      
      getMasterDataByLine: (linea) => {
        const { masterData } = get();
        return masterData.filter(row => row.linea === linea);
      },
      
      getMasterDataByAreaManager: (codiceAreaManager) => {
        const { masterData } = get();
        return masterData.filter(row => row.codiceAreaManager === codiceAreaManager);
      },
      
      getMasterDataByNam: (codiceNam) => {
        const { masterData } = get();
        return masterData.filter(row => row.codiceNam === codiceNam);
      },
      
      // Selettori per filtri
      getLinee: () => {
        const { filters } = get();
        return filters.linee;
      },
      
      getAreaManagers: () => {
        const { filters } = get();
        return filters.areaManagers;
      },
      
      getNamCodes: () => {
        const { filters } = get();
        return filters.namCodes;
      },
      
      getAgents: () => {
        const { filters } = get();
        return filters.agents;
      },
      
      getSalesPoints: () => {
        const { filters } = get();
        return filters.salesPoints;
      },
      
      // Utility
      getMasterDataCount: () => {
        const { masterData } = get();
        return masterData.length;
      },
      
      getFiltersCount: () => {
        const { filters } = get();
        return (
          filters.linee.length +
          filters.areaManagers.length +
          filters.namCodes.length +
          filters.agents.length +
          filters.salesPoints.length
        );
      },
    }),
    {
      name: 'master-data-storage',
      partialize: (state) => ({
        masterData: state.masterData,
        lastSyncTimestamp: state.lastSyncTimestamp,
        filters: state.filters,
      }),
    }
  )
); 