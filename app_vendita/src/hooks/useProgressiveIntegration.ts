// Hook per integrare il sistema progressivo con i dati esistenti
import { useState, useCallback } from 'react';
import { CalendarEntry } from '../data/models/CalendarEntry';
import { useProgressiveCalculation } from './useProgressiveCalculation';
import { DataAdapter } from '../services/DataAdapter';
import { ProgressiveCalculationService } from '../services/ProgressiveCalculationService';

export const useProgressiveIntegration = (sharedService?: ProgressiveCalculationService) => {
  const { 
    updateCell, 
    getCellDisplayData, 
    loadFocusReferencesData,
    getTotalSellIn,
    getMonthlySellIn,
    exportState, 
    importState 
  } = useProgressiveCalculation(sharedService);
  
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Inizializza il sistema progressivo con i dati esistenti
   * ATTENZIONE: Questo è un passaggio critico!
   */
  const initializeWithExistingData = useCallback((entries: CalendarEntry[]) => {
    try {
      // Filtra solo gli entry con dati focus references
      const entriesWithData = entries.filter(DataAdapter.hasFocusData);
      
      // Importa ogni entry nel sistema progressivo
      for (const entry of entriesWithData) {
        const dateString = DataAdapter.getDateString(entry);
        const productEntries = DataAdapter.calendarEntryToProductEntries(entry);
        
        if (productEntries.length > 0) {
          updateCell(dateString, productEntries);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      throw error;
    }
  }, [updateCell]);

  /**
   * Ottiene i dati di visualizzazione per una data specifica
   * Gestisce sia i dati originali che quelli progressivi
   */
  const getDisplayDataForDate = useCallback((date: string, originalEntry?: CalendarEntry, contextIsInitialized?: boolean) => {
    // Usa isInitialized dal context se fornito, altrimenti usa quello locale
    const effectiveIsInitialized = contextIsInitialized !== undefined ? contextIsInitialized : isInitialized;
    
    // Se il sistema non è inizializzato, usa i dati originali
    if (!effectiveIsInitialized) {
      return {
        useOriginalData: true,
        originalEntry,
        progressiveData: null
      };
    }

    // Altrimenti usa il sistema progressivo
    const progressiveData = getCellDisplayData(date);
    
    return {
      useOriginalData: false,
      originalEntry,
      progressiveData
    };
  }, [isInitialized, getCellDisplayData]);

  /**
   * Aggiorna un entry e sincronizza con il sistema progressivo
   */
  const updateEntryWithProgressiveSync = useCallback((
    entry: CalendarEntry
  ) => {
    if (!isInitialized) {
      return;
    }

    try {
      const dateString = DataAdapter.getDateString(entry);
      const productEntries = DataAdapter.calendarEntryToProductEntries(entry);
      
      // Salva sempre una entry nel sistema progressivo, anche se vuota
      // Questo mantiene la continuità temporale nel calcolo progressivo
      updateCell(dateString, productEntries);
    } catch (error) {
      // Silently handle error
    }
  }, [isInitialized, updateCell]);

  /**
   * Esporta lo stato del sistema progressivo
   */
  const exportProgressiveState = useCallback(() => {
    return exportState();
  }, [exportState]);

  /**
   * Importa lo stato del sistema progressivo
   */
  const importProgressiveState = useCallback((state: any) => {
    importState(state);
    setIsInitialized(true);
  }, [importState]);

  /**
   * Resetta lo stato di inizializzazione
   */
  const resetInitialization = useCallback(() => {
    setIsInitialized(false);
  }, []);

  return {
    // Stato
    isInitialized,
    
    // Metodi
    initializeWithExistingData,
    getDisplayDataForDate,
    updateEntryWithProgressiveSync,
    loadFocusReferencesData,
    getTotalSellIn,
    getMonthlySellIn,
    exportProgressiveState,
    importProgressiveState,
    resetInitialization,
    
    // Utility
    hasFocusData: DataAdapter.hasFocusData
  };
}; 