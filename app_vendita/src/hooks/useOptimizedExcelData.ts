import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirebaseExcelData, ExcelDataRow } from './useFirebaseExcelData';
import { getPlatformFilterConfig, getPlatformExcelConfig, IS_WEB, IS_MOBILE } from '../utils/platformConfig';

/**
 * Hook ottimizzato che si adatta automaticamente alla piattaforma
 * - Su WEB: comportamento identico all'originale (per mantenere stabilità)
 * - Su MOBILE: ottimizzazioni per performance
 */
export function useOptimizedExcelData() {
  const { excelData: originalData, isLoading: originalLoading, reloadData } = useFirebaseExcelData();
  const [optimizedData, setOptimizedData] = useState<ExcelDataRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const config = getPlatformExcelConfig();
  const filterConfig = getPlatformFilterConfig();

  // Su WEB: restituisce i dati originali senza modifiche
  if (IS_WEB) {
    return {
      excelData: originalData,
      isLoading: originalLoading,
      reloadData,
      isProcessing: false,
    };
  }

  // Su MOBILE: applica ottimizzazioni
  const processDataForMobile = useCallback(async (data: ExcelDataRow[]) => {
    if (data.length === 0) {
      setOptimizedData([]);
      return;
    }

    setIsProcessing(true);
    console.log('📱 useOptimizedExcelData: Inizio processing mobile per', data.length, 'elementi');

    try {
      // Processa i dati a chunk per evitare il blocco UI
      const chunks: ExcelDataRow[][] = [];
      for (let i = 0; i < data.length; i += config.CHUNK_SIZE) {
        chunks.push(data.slice(i, i + config.CHUNK_SIZE));
      }

      const processedData: ExcelDataRow[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Processa il chunk
        processedData.push(...chunk);
        
        // Update incrementale dei dati
        setOptimizedData([...processedData]);
        
        // Log del progresso
        console.log(`📱 useOptimizedExcelData: Processato chunk ${i + 1}/${chunks.length} (${processedData.length}/${data.length})`);
        
        // Pausa per non bloccare l'UI
        if (i < chunks.length - 1 && config.PROCESSING_DELAY > 0) {
          await new Promise(resolve => setTimeout(resolve, config.PROCESSING_DELAY));
        }
      }

      console.log('✅ useOptimizedExcelData: Processing mobile completato:', processedData.length, 'elementi');
    } catch (error) {
      console.error('❌ useOptimizedExcelData: Errore durante processing mobile:', error);
      setOptimizedData(data); // Fallback ai dati originali
    } finally {
      setIsProcessing(false);
    }
  }, [config.CHUNK_SIZE, config.PROCESSING_DELAY]);

  // Processa i dati quando cambiano (solo su mobile)
  useEffect(() => {
    if (IS_MOBILE && originalData.length > 0) {
      processDataForMobile(originalData);
    }
  }, [originalData, processDataForMobile]);

  return {
    excelData: optimizedData,
    isLoading: originalLoading || isProcessing,
    reloadData,
    isProcessing,
  };
}

/**
 * Hook per ottenere valori unici ottimizzato per piattaforma
 */
export function useOptimizedUniqueValues(data: ExcelDataRow[], field: keyof ExcelDataRow) {
  const filterConfig = getPlatformFilterConfig();
  
  return useMemo(() => {
    console.log(`🔍 useOptimizedUniqueValues: Calcolo valori unici per ${field} da ${data.length} elementi`);
    
    // Su WEB: calcola tutto normalmente
    if (IS_WEB) {
      const uniqueValues = [...new Set(data.map(row => row[field]).filter(Boolean))];
      console.log(`✅ useOptimizedUniqueValues (WEB): ${uniqueValues.length} valori unici per ${field}`);
      return uniqueValues;
    }
    
    // Su MOBILE: limita il numero di elementi processati se necessario
    const dataToProcess = filterConfig.MAX_VISIBLE_ITEMS > 0 
      ? data.slice(0, filterConfig.MAX_VISIBLE_ITEMS)
      : data;
      
    const uniqueValues = [...new Set(dataToProcess.map(row => row[field]).filter(Boolean))];
    
    console.log(`✅ useOptimizedUniqueValues (MOBILE): ${uniqueValues.length} valori unici per ${field} (da ${dataToProcess.length} elementi)`);
    return uniqueValues;
  }, [data, field, filterConfig.MAX_VISIBLE_ITEMS]);
}