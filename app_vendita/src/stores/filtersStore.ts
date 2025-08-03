import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMasterDataStore } from './masterDataStore';



interface FiltersState {
  // Stato filtri (manteniamo compatibilità con esistente)
  selectedDate: string;
  selectedUserId: string;
  selectedSalesPointId: string;
  selectedAMCode: string;
  selectedNAMCode: string;
  selectedLine: string;
  selectedFilterItems: string[];
  showFilters: boolean;
  
  // Dati per filtri
  agents: any[];
  salesPoints: any[];
  
  // Actions (manteniamo compatibilità)
  setSelectedDate: (date: string) => void;
  setSelectedUserId: (userId: string) => void;
  setSelectedSalesPointId: (salesPointId: string) => void;
  setSelectedAMCode: (amCode: string) => void;
  setSelectedNAMCode: (namCode: string) => void;
  setSelectedLine: (line: string) => void;
  setSelectedItems: (items: string[]) => void;
  setShowFilters: (show: boolean) => void;
  setAgents: (agents: any[]) => void;
  setSalesPoints: (salesPoints: any[]) => void;
  resetFilters: () => void;
  
  // Utility actions
  addFilterItem: (item: string) => void;
  removeFilterItem: (item: string) => void;
  clearAllFilters: () => void;
  
  // Selettori per dati master
  getAgentsFromMaster: () => any[];
  getSalesPointsFromMaster: () => any[];
  getLineeFromMaster: () => string[];
  getAreaManagersFromMaster: () => any[];
  getNamCodesFromMaster: () => any[];
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      // Stato iniziale (compatibile con esistente)
      selectedDate: '',
      selectedUserId: '',
      selectedSalesPointId: '',
      selectedAMCode: '',
      selectedNAMCode: '',
      selectedLine: '',
      selectedFilterItems: [],
      showFilters: false,
      agents: [],
      salesPoints: [],
      
      // Actions (compatibili con esistente)
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setSelectedUserId: (selectedUserId) => set({ selectedUserId }),
      setSelectedSalesPointId: (selectedSalesPointId) => set({ selectedSalesPointId }),
      setSelectedAMCode: (selectedAMCode) => set({ selectedAMCode }),
      setSelectedNAMCode: (selectedNAMCode) => set({ selectedNAMCode }),
      setSelectedLine: (selectedLine) => set({ selectedLine }),
      setSelectedItems: (selectedFilterItems) => set({ selectedFilterItems }),
      setShowFilters: (showFilters) => set({ showFilters }),
      setAgents: (agents) => set({ agents }),
      setSalesPoints: (salesPoints) => set({ salesPoints }),
      
      // Selettori che leggono da masterDataStore
      getAgentsFromMaster: () => {
        const masterDataStore = useMasterDataStore.getState();
        return masterDataStore.getAgents();
      },
      
      getSalesPointsFromMaster: () => {
        const masterDataStore = useMasterDataStore.getState();
        return masterDataStore.getSalesPoints();
      },
      
      getLineeFromMaster: () => {
        const masterDataStore = useMasterDataStore.getState();
        return masterDataStore.getLinee();
      },
      
      getAreaManagersFromMaster: () => {
        const masterDataStore = useMasterDataStore.getState();
        return masterDataStore.getAreaManagers();
      },
      
      getNamCodesFromMaster: () => {
        const masterDataStore = useMasterDataStore.getState();
        return masterDataStore.getNamCodes();
      },
      
      resetFilters: () => set({
        selectedDate: '',
        selectedUserId: '',
        selectedSalesPointId: '',
        selectedAMCode: '',
        selectedNAMCode: '',
        selectedLine: '',
        selectedFilterItems: [],
        showFilters: false,
      }),
      
      addFilterItem: (item) => set((state) => ({
        selectedFilterItems: [...state.selectedFilterItems, item]
      })),
      
      removeFilterItem: (item) => set((state) => ({
        selectedFilterItems: state.selectedFilterItems.filter(i => i !== item)
      })),
      
      clearAllFilters: () => set({
        selectedDate: '',
        selectedUserId: '',
        selectedSalesPointId: '',
        selectedAMCode: '',
        selectedNAMCode: '',
        selectedLine: '',
        selectedFilterItems: [],
        showFilters: false,
      }),
    }),
    {
      name: 'filters-storage', // Nome per AsyncStorage
      partialize: (state) => ({ 
        selectedDate: state.selectedDate,
        selectedUserId: state.selectedUserId,
        selectedSalesPointId: state.selectedSalesPointId,
        selectedAMCode: state.selectedAMCode,
        selectedNAMCode: state.selectedNAMCode,
        selectedLine: state.selectedLine,
        selectedFilterItems: state.selectedFilterItems,
        showFilters: state.showFilters,
      }), // Solo dati da persistere
    }
  )
); 