import { useState, useCallback } from 'react';
import { firebaseCalendarService } from '../services/FirebaseCalendarService';
import { DefinitiveProgressiveData, ProgressiveFilter } from '../data/models/ProgressiveData';

export const useDefinitiveProgressiveData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Salva i dati progressivi come definitivi
   */
  const saveAsDefinitive = useCallback(async (
    date: string,
    agentId: string,
    salesPointId: string,
    entries: any[],
    progressiveTotals: any
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('💾 useDefinitiveProgressiveData: Salvataggio dati definitivi per:', {
        date,
        agentId,
        salesPointId,
        entriesCount: entries.length
      });

      const definitiveData: DefinitiveProgressiveData = {
        id: `${date}_${agentId}_${salesPointId}`,
        date,
        agentId,
        salesPointId,
        entries,
        progressiveTotals,
        isDefinitive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await firebaseCalendarService.saveDefinitiveProgressiveData(definitiveData);

      console.log('✅ useDefinitiveProgressiveData: Dati definitivi salvati con successo');
    } catch (error) {
      console.error('❌ useDefinitiveProgressiveData: Errore salvataggio dati definitivi:', error);
      setError('Errore nel salvataggio dei dati definitivi');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carica i dati progressivi definitivi per un filtro specifico
   */
  const loadDefinitiveData = useCallback(async (
    filter: ProgressiveFilter,
    date?: string
  ): Promise<DefinitiveProgressiveData[]> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📋 useDefinitiveProgressiveData: Caricamento dati definitivi per filtro:', filter);

      const data = await firebaseCalendarService.getDefinitiveProgressiveData({
        agentId: filter.agentId,
        salesPointId: filter.salesPointId,
        date
      });

      console.log('✅ useDefinitiveProgressiveData: Caricati', data.length, 'record definitivi');
      return data;
    } catch (error) {
      console.error('❌ useDefinitiveProgressiveData: Errore caricamento dati definitivi:', error);
      setError('Errore nel caricamento dei dati definitivi');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Elimina i dati progressivi definitivi per un filtro specifico
   */
  const deleteDefinitiveData = useCallback(async (
    filter: ProgressiveFilter,
    date?: string
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗑️ useDefinitiveProgressiveData: Eliminazione dati definitivi per filtro:', filter);

      await firebaseCalendarService.deleteDefinitiveProgressiveData({
        agentId: filter.agentId,
        salesPointId: filter.salesPointId,
        date
      });

      console.log('✅ useDefinitiveProgressiveData: Dati definitivi eliminati con successo');
    } catch (error) {
      console.error('❌ useDefinitiveProgressiveData: Errore eliminazione dati definitivi:', error);
      setError('Errore nell\'eliminazione dei dati definitivi');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verifica se esistono dati definitivi per un filtro specifico
   */
  const hasDefinitiveData = useCallback(async (
    filter: ProgressiveFilter,
    date?: string
  ): Promise<boolean> => {
    try {
      const data = await loadDefinitiveData(filter, date);
      return data.length > 0;
    } catch (error) {
      console.error('❌ useDefinitiveProgressiveData: Errore verifica dati definitivi:', error);
      return false;
    }
  }, [loadDefinitiveData]);

  return {
    saveAsDefinitive,
    loadDefinitiveData,
    deleteDefinitiveData,
    hasDefinitiveData,
    isLoading,
    error
  };
}; 