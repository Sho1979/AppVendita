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
    exportState, 
    importState 
  } = useProgressiveCalculation(sharedService);
  
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Inizializza il sistema progressivo con i dati esistenti
   * ATTENZIONE: Questo è un passaggio critico!
   */
  const initializeWithExistingData = useCallback((entries: CalendarEntry[]) => {
    console.log('🔄 useProgressiveIntegration: Inizializzazione con dati esistenti...');
    console.log(`📊 Totale entries ricevute: ${entries.length}`);
    
    try {
      // Filtra solo gli entry con dati focus references
      const entriesWithData = entries.filter(DataAdapter.hasFocusData);
      
      console.log(`📊 Trovati ${entriesWithData.length} entry con dati da processare`);
      console.log('📋 Dettagli entries con dati:', entriesWithData.map(entry => ({
        id: entry.id,
        date: entry.date,
        focusReferencesCount: entry.focusReferencesData?.length || 0,
        focusReferencesData: entry.focusReferencesData?.map(ref => ({
          referenceId: ref.referenceId,
          soldPieces: ref.soldPieces,
          stockPieces: ref.stockPieces,
          orderedPieces: ref.orderedPieces
        }))
      })));
      
      // Importa ogni entry nel sistema progressivo
      for (const entry of entriesWithData) {
        console.log(`🔍 Processando entry:`, {
          id: entry.id,
          date: entry.date,
          dateType: typeof entry.date,
          isDate: entry.date instanceof Date,
          focusReferencesCount: entry.focusReferencesData?.length || 0
        });
        
        const dateString = DataAdapter.getDateString(entry);
        const productEntries = DataAdapter.calendarEntryToProductEntries(entry);
        
        console.log(`📅 Entry ${entry.id}: data=${dateString}, prodotti=${productEntries.length}`);
        console.log('📦 ProductEntries generati:', productEntries.map(prod => ({
          productId: prod.productId,
          vendite: prod.vendite,
          scorte: prod.scorte,
          ordinati: prod.ordinati
        })));
        
        if (productEntries.length > 0) {
          console.log(`📅 Processando entry per ${dateString}: ${productEntries.length} prodotti`);
          const result = updateCell(dateString, productEntries);
          console.log(`✅ Entry ${entry.id} processato con successo:`, result);
        } else {
          console.log(`⚠️ Entry ${entry.id} non ha productEntries validi`);
        }
      }
      
      setIsInitialized(true);
      console.log('✅ Sistema progressivo inizializzato con successo');
      
    } catch (error) {
      console.error('❌ Errore durante l\'inizializzazione del sistema progressivo:', error);
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
    
    console.log(`🔍 getDisplayDataForDate per ${date}:`, {
      localIsInitialized: isInitialized,
      contextIsInitialized,
      effectiveIsInitialized,
      hasOriginalEntry: !!originalEntry,
      originalEntryId: originalEntry?.id
    });
    
    // Se il sistema non è inizializzato, usa i dati originali
    if (!effectiveIsInitialized) {
      console.log(`⚠️ Sistema non inizializzato, uso dati originali per ${date}`);
      return {
        useOriginalData: true,
        originalEntry,
        progressiveData: null
      };
    }

    // Altrimenti usa il sistema progressivo
    const progressiveData = getCellDisplayData(date);
    
    console.log(`📊 Dati progressivi per ${date}:`, {
      hasProgressiveData: !!progressiveData,
      progressiveEntriesCount: progressiveData?.displayData?.progressiveEntries?.length || 0,
      sellInProgressivo: progressiveData?.sellInProgressivo || 0
    });
    
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
      console.log('⚠️ Sistema progressivo non inizializzato, salto sincronizzazione');
      return;
    }

    try {
      const dateString = DataAdapter.getDateString(entry);
      const productEntries = DataAdapter.calendarEntryToProductEntries(entry);
      
      if (productEntries.length > 0) {
        console.log(`🔄 Sincronizzazione entry per ${dateString}`);
        updateCell(dateString, productEntries);
      }
    } catch (error) {
      console.error('❌ Errore durante la sincronizzazione:', error);
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

  return {
    // Stato
    isInitialized,
    
    // Metodi
    initializeWithExistingData,
    getDisplayDataForDate,
    updateEntryWithProgressiveSync,
    exportProgressiveState,
    importProgressiveState,
    
    // Utility
    hasFocusData: DataAdapter.hasFocusData
  };
}; 