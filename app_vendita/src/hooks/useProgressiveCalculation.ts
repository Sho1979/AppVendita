import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProgressiveCalculationService } from '../services/ProgressiveCalculationService';
import {
  ProductEntry,
  ProgressiveEntry,
  DailyTotals,
  CalculationConfig,
  CellVisualizationResult
} from '../data/models/ProgressiveData';

export const useProgressiveCalculation = (sharedService?: ProgressiveCalculationService) => {
  const [calculationService] = useState(() => sharedService || new ProgressiveCalculationService());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);

  // Configurazione di calcolo
  const [config, setConfig] = useState<CalculationConfig>({
    prezzoUnitario: 1.0,
    tassaVendita: 0.22,
    scontoPercentuale: 0.0
  });

  /**
   * Aggiorna una cella con nuovi dati e ricalcola progressivamente
   */
  const updateCell = useCallback(async (
    date: string,
    entries: ProductEntry[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 useProgressiveCalculation: updateCell per ${date} con ${entries.length} entries`);
      const result = calculationService.updateCellAndRecalculate(date, entries);
      setLastCalculation(new Date());
      
      console.log(`✅ useProgressiveCalculation: updateCell completato per ${date}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore di calcolo';
      setError(errorMessage);
      console.error(`❌ useProgressiveCalculation: Errore updateCell per ${date}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [calculationService]);

  /**
   * Ottiene i dati progressivi per una data specifica
   */
  const getProgressiveData = useCallback((date: string): ProgressiveEntry | null => {
    return calculationService.getProgressiveData(date);
  }, [calculationService]);

  /**
   * Ottiene la storia progressiva in un range di date
   */
  const getProgressiveHistory = useCallback((
    startDate: string,
    endDate: string
  ): ProgressiveEntry[] => {
    return calculationService.getProgressiveHistory(startDate, endDate);
  }, [calculationService]);

  /**
   * Aggiorna la configurazione di calcolo
   */
  const updateConfig = useCallback((newConfig: Partial<CalculationConfig>) => {
    calculationService.updateCalculationConfig(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, [calculationService]);

  /**
   * Ottiene i totali progressivi per una data
   */
  const getProgressiveTotals = useCallback((date: string): DailyTotals | null => {
    const data = calculationService.getProgressiveData(date);
    return data?.progressiveTotals || null;
  }, [calculationService]);

  /**
   * Calcola il sell-in progressivo per una data
   */
  const getProgressiveSellIn = useCallback((date: string): number => {
    const totals = getProgressiveTotals(date);
    return totals?.sellIn || 0;
  }, [getProgressiveTotals]);

  /**
   * Ottiene le metriche di performance
   */
  const getPerformanceMetrics = useCallback(() => {
    return calculationService.getPerformanceMetrics();
  }, [calculationService]);

  /**
   * Resetta le metriche di performance
   */
  const resetPerformanceMetrics = useCallback(() => {
    calculationService.resetPerformanceMetrics();
  }, [calculationService]);

  /**
   * Esporta lo stato corrente
   */
  const exportState = useCallback(() => {
    return calculationService.exportState();
  }, [calculationService]);

  /**
   * Importa uno stato
   */
  const importState = useCallback((state: any) => {
    calculationService.importState(state);
  }, [calculationService]);

  /**
   * Valida i dati prima dell'inserimento
   */
  const validateEntries = useCallback((entries: ProductEntry[]): boolean => {
    try {
      // Usa il metodo di validazione del servizio
      calculationService.updateCellAndRecalculate('temp', entries);
      return true;
    } catch {
      return false;
    }
  }, [calculationService]);

  /**
   * Calcola i totali giornalieri per un set di entries
   */
  const calculateDailyTotals = useCallback((entries: ProductEntry[]): DailyTotals => {
    return entries.reduce(
      (acc, entry) => ({
        venditeTotali: acc.venditeTotali + entry.vendite,
        scorteTotali: acc.scorteTotali + entry.scorte,
        ordinatiTotali: acc.ordinatiTotali + entry.ordinati,
        sellIn: acc.sellIn + (entry.ordinati * config.prezzoUnitario)
      }),
      {
        venditeTotali: 0,
        scorteTotali: 0,
        ordinatiTotali: 0,
        sellIn: 0
      }
    );
  }, [config.prezzoUnitario]);

  /**
   * Carica i dati focusReferencesData nel sistema progressivo
   */
  const loadFocusReferencesData = useCallback((date: string, focusReferencesData: any[]) => {
    try {
      console.log(`📊 useProgressiveCalculation: loadFocusReferencesData per ${date} con ${focusReferencesData.length} entries`);
      calculationService.loadFocusReferencesData(date, focusReferencesData);
      console.log(`✅ useProgressiveCalculation: loadFocusReferencesData completato per ${date}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore caricamento focus references';
      setError(errorMessage);
      console.error(`❌ useProgressiveCalculation: Errore loadFocusReferencesData per ${date}:`, err);
      throw err;
    }
  }, [calculationService]);

  /**
   * Ottiene i dati di visualizzazione per una cella
   */
  const getCellDisplayData = useCallback((date: string): CellVisualizationResult => {
    return calculationService.getCellDisplayData(date);
  }, [calculationService]);

  /**
   * Calcola il sell-in totale del sistema progressivo
   */
  const getTotalSellIn = useCallback((): number => {
    return calculationService.getTotalSellIn();
  }, [calculationService]);

  /**
   * Calcola il sell-in mensile per un mese specifico
   */
  const getMonthlySellIn = useCallback((year: number, month: number): number => {
    return calculationService.getMonthlySellIn(year, month);
  }, [calculationService]);

  // Memoizza i metodi per evitare re-render non necessari
  const methods = useMemo(() => ({
    updateCell,
    getProgressiveData,
    getProgressiveHistory,
    updateConfig,
    getProgressiveTotals,
    getProgressiveSellIn,
    getPerformanceMetrics,
    resetPerformanceMetrics,
    exportState,
    importState,
    validateEntries,
    calculateDailyTotals,
    loadFocusReferencesData,
    getCellDisplayData,
    getTotalSellIn,
    getMonthlySellIn
  }), [
    updateCell,
    getProgressiveData,
    getProgressiveHistory,
    updateConfig,
    getProgressiveTotals,
    getProgressiveSellIn,
    getPerformanceMetrics,
    resetPerformanceMetrics,
    exportState,
    importState,
    validateEntries,
    calculateDailyTotals,
    loadFocusReferencesData,
    getCellDisplayData,
    getTotalSellIn,
    getMonthlySellIn
  ]);

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      // Cleanup se necessario
    };
  }, []);

  return {
    // Stato
    isLoading,
    error,
    lastCalculation,
    config,
    
    // Metodi
    ...methods,
    
    // Utility
    clearError: () => setError(null)
  };
}; 