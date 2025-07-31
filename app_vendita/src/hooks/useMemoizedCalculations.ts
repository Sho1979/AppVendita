import { useMemo } from 'react';
import { CalendarEntry } from '../data/models/CalendarEntry';

// Hook per calcoli memoizzati
export const useMemoizedCalculations = () => {
  
  // Calcolo totale vendite memoizzato
  const calculateTotalSales = useMemo(() => {
    return (entries: CalendarEntry[]) => {
      return entries.reduce((total, entry) => {
        const entrySales = entry.sales.reduce((sum, sale) => sum + sale.value, 0);
        return total + entrySales;
      }, 0);
    };
  }, []);

  // Calcolo totale azioni memoizzato
  const calculateTotalActions = useMemo(() => {
    return (entries: CalendarEntry[]) => {
      return entries.reduce((total, entry) => {
        const entryActions = entry.actions.reduce((sum, action) => sum + action.count, 0);
        return total + entryActions;
      }, 0);
    };
  }, []);

  // Calcolo totale sell-in memoizzato
  const calculateTotalSellIn = useMemo(() => {
    return (entries: CalendarEntry[]) => {
      return entries.reduce((total, entry) => {
        if (!entry.focusReferencesData) return total;
        
        const entrySellIn = entry.focusReferencesData.reduce((sum, focusData) => {
          const orderedPieces = parseFloat(focusData.orderedPieces) || 0;
          return sum + orderedPieces;
        }, 0);
        
        return total + entrySellIn;
      }, 0);
    };
  }, []);

  // Filtro entries per data memoizzato
  const filterEntriesByDate = useMemo(() => {
    return (entries: CalendarEntry[], date: string) => {
      return entries.filter(entry => {
        const entryDate = entry.date.toISOString().split('T')[0];
        return entryDate === date;
      });
    };
  }, []);

  // Filtro entries per utente memoizzato
  const filterEntriesByUser = useMemo(() => {
    return (entries: CalendarEntry[], userId: string) => {
      return entries.filter(entry => entry.userId === userId);
    };
  }, []);

  // Filtro entries per punto vendita memoizzato
  const filterEntriesBySalesPoint = useMemo(() => {
    return (entries: CalendarEntry[], salesPointId: string) => {
      return entries.filter(entry => entry.salesPointId === salesPointId);
    };
  }, []);

  // Calcolo statistiche aggregate memoizzato
  const calculateAggregateStats = useMemo(() => {
    return (entries: CalendarEntry[]) => {
      const totalSales = calculateTotalSales(entries);
      const totalActions = calculateTotalActions(entries);
      const totalSellIn = calculateTotalSellIn(entries);
      
      return {
        totalSales,
        totalActions,
        totalSellIn,
        entriesCount: entries.length,
        averageSalesPerEntry: entries.length > 0 ? totalSales / entries.length : 0,
        averageActionsPerEntry: entries.length > 0 ? totalActions / entries.length : 0,
      };
    };
  }, [calculateTotalSales, calculateTotalActions, calculateTotalSellIn]);

  return {
    calculateTotalSales,
    calculateTotalActions,
    calculateTotalSellIn,
    filterEntriesByDate,
    filterEntriesByUser,
    filterEntriesBySalesPoint,
    calculateAggregateStats,
  };
}; 