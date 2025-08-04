import { useState, useEffect, useCallback } from 'react';
import { useStaticDataStore, AgenteCliente } from '../stores/staticDataStore';

export interface ExcelDataRow {
  id: string;
  linea?: string;
  codiceAreaManager?: string;
  codiceNam?: string;
  codiceAgente?: string;
  nomeAgente?: string;
  insegna?: string;
  codiceCliente?: string;
  cliente?: string;
  [key: string]: any; // Per altri campi dinamici
}

export const useFirebaseExcelData = () => {
  const [excelData, setExcelData] = useState<ExcelDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const staticDataStore = useStaticDataStore();



  const loadExcelData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 useFirebaseExcelData: Caricamento dati agenti clienti...');
      
      // Carica i dati statici se non sono già caricati
      if (staticDataStore.agentiClienti.length === 0) {
        staticDataStore.loadAgentiClienti();
        
        // Aspetta un momento per permettere il caricamento
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const data = staticDataStore.getAgentiClienti();
      console.log('📊 useFirebaseExcelData: Dati ricevuti da store statico:', data.length, 'righe');
      
      // Normalizza i dati per compatibilità con i filtri esistenti
      const normalizedData = data.map((row: AgenteCliente, index) => {
        const normalized = {
          id: row.id || `excel_${index}`,
          // Linea - usa direttamente il campo dal JSON
          linea: row.Linea || '',
          // Area Manager - usa direttamente il campo dal JSON
          codiceAreaManager: row["Codice Area Manager"] || '',
          // NAM Code - usa direttamente il campo dal JSON
          codiceNam: row["Codice Nam"] || '',
          // Agente - usa direttamente il campo dal JSON
          codiceAgente: row["Codige Agente"] || '',
          // Nome Agente - usa direttamente il campo dal JSON
          nomeAgente: row["Nome Agente"] || '',
          // Insegna - usa direttamente il campo dal JSON
          insegna: row.Insegna || '',
          // Codice Cliente - usa direttamente il campo dal JSON
          codiceCliente: String(row["Codice Cliente"]) || '',
          // Cliente - usa direttamente il campo dal JSON
          cliente: row.Cliente || '',
          ...row // Mantieni tutti gli altri campi originali
        };
        
        return normalized;
      });
      
      console.log('✅ useFirebaseExcelData: Dati normalizzati:', normalizedData.length, 'righe');
      console.log('📋 useFirebaseExcelData: Esempio dati normalizzati:', normalizedData.slice(0, 2));
      console.log('🔍 useFirebaseExcelData: Valori unici per cliente:', [...new Set(normalizedData.map(row => row.cliente))].length);
      setExcelData(normalizedData);
    } catch (err) {
      console.error('❌ useFirebaseExcelData: Errore nel caricamento dati Excel:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dati');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carica i dati all'inizializzazione
  useEffect(() => {
    loadExcelData();
  }, [loadExcelData]);

  // Sincronizza lo stato di caricamento con lo store statico
  useEffect(() => {
    setIsLoading(staticDataStore.isLoading);
    setError(staticDataStore.error);
  }, [staticDataStore.isLoading, staticDataStore.error]);

  // Ricarica i dati quando lo store statico viene aggiornato
  useEffect(() => {
    if (staticDataStore.agentiClienti.length > 0) {
      loadExcelData();
    }
  }, [staticDataStore.agentiClienti.length, loadExcelData]);

  // Funzione per ricaricare i dati
  const reloadData = useCallback(() => {
    loadExcelData();
  }, [loadExcelData]);

  return {
    excelData,
    isLoading,
    error,
    reloadData
  };
}; 