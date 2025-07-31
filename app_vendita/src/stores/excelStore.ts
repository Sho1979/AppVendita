import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interfacce per i dati Excel
interface ExcelRow {
  id: string;
  linea: string;
  amCode: string;
  namCode: string;
  agenteCode: string;
  agenteName: string;
  insegnaCliente: string;
  codiceCliente: string;
  cliente: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Agent {
  code: string;
  name: string;
  amCode: string;
  namCode: string;
  line: string;
}

interface ExcelState {
  // Dati Excel (compatibile con esistente)
  excelRows: ExcelRow[];
  agents: Agent[];
  salesPoints: any[];
  
  // Stato importazione
  isLoading: boolean;
  error: string | null;
  lastImportDate: Date | null;
  
  // Actions (compatibili con esistente)
  setExcelRows: (rows: ExcelRow[]) => void;
  setAgents: (agents: Agent[]) => void;
  setSalesPoints: (salesPoints: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastImportDate: (date: Date) => void;
  
  // Utility actions
  addExcelRow: (row: ExcelRow) => void;
  updateExcelRow: (id: string, updates: Partial<ExcelRow>) => void;
  removeExcelRow: (id: string) => void;
  clearExcelData: () => void;
  
  // Computed values
  getFilteredRows: () => ExcelRow[];
  getUniqueValues: (field: keyof ExcelRow) => string[];
}

export const useExcelStore = create<ExcelState>()(
  persist(
    (set, get) => ({
      // Stato iniziale
      excelRows: [],
      agents: [],
      salesPoints: [],
      isLoading: false,
      error: null,
      lastImportDate: null,
      
      // Actions
      setExcelRows: (excelRows) => set({ excelRows }),
      setAgents: (agents) => set({ agents }),
      setSalesPoints: (salesPoints) => set({ salesPoints }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLastImportDate: (lastImportDate) => set({ lastImportDate }),
      
      addExcelRow: (row) => set((state) => ({
        excelRows: [...state.excelRows, row]
      })),
      
      updateExcelRow: (id, updates) => set((state) => ({
        excelRows: state.excelRows.map(row => 
          row.id === id ? { ...row, ...updates } : row
        )
      })),
      
      removeExcelRow: (id) => set((state) => ({
        excelRows: state.excelRows.filter(row => row.id !== id)
      })),
      
      clearExcelData: () => set({
        excelRows: [],
        agents: [],
        salesPoints: [],
        lastImportDate: null,
        error: null,
      }),
      
      // Computed values
      getFilteredRows: () => {
        const { excelRows } = get();
        // Implementazione filtro (semplificata per ora)
        return excelRows;
      },
      
      getUniqueValues: (field) => {
        const { excelRows } = get();
        const values = excelRows.map(row => row[field] as string);
        return [...new Set(values)];
      },
    }),
    {
      name: 'excel-storage', // Nome per AsyncStorage
      partialize: (state) => ({ 
        excelRows: state.excelRows,
        agents: state.agents,
        salesPoints: state.salesPoints,
        lastImportDate: state.lastImportDate,
      }), // Solo dati da persistere
    }
  )
); 