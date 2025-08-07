/**
 * Funzioni helper per il calendario
 * 
 * Contiene utility e helper functions per il MainCalendarPage
 * per ridurre la complessità del componente principale.
 */

import React from 'react';
import { CalendarEntry } from '../../../data/models/CalendarEntry';
import { SalesPoint } from '../../../data/models/SalesPoint';
import { ExcelRow } from '../../../data/models/ExcelData';
import { logger } from '../../../utils/logger';

/**
 * Helper per ottenere il nome del punto vendita
 */
export const getSalesPointName = (
  salesPointId: string | undefined,
  salesPoints: SalesPoint[],
  excelRows: ExcelRow[]
): string => {
  if (!salesPointId) return 'Punto Vendita';
  
  const salesPoint = salesPoints.find(sp => sp.id === salesPointId);
  if (salesPoint) return salesPoint.name;
  
  // Cerca nei dati Excel se non trovato nei sales points
  const excelMatch = excelRows.find(row => row.codiceCliente === salesPointId);
  return excelMatch?.cliente || 'Punto Vendita';
};

/**
 * Funzione per copiare i tag da una data esistente
 */
export const copyTagsFromDate = (
  sourceDate: string,
  entries: CalendarEntry[]
): string[] => {
  const sourceEntry = entries.find(entry => {
    const entryDate = new Date(entry.date).toISOString().split('T')[0];
    return entryDate === sourceDate;
  });

  if (sourceEntry && sourceEntry.tags && sourceEntry.tags.length > 0) {
    logger.debug('CalendarHelpers', 'Copiando tag da data', { 
      sourceDate, 
      tags: sourceEntry.tags 
    });
    return sourceEntry.tags;
  }

  return [];
};

/**
 * Helper per gestire i sell-in giornalieri
 */
export const useDailySellIn = () => {
  const [dailySellIn, setDailySellIn] = React.useState<{ [date: string]: number }>({});

  const handleSellInChange = React.useCallback((date: string, sellIn: number) => {
    setDailySellIn(prev => ({
      ...prev,
      [date]: sellIn
    }));
  }, []);

  return {
    dailySellIn,
    setDailySellIn,
    handleSellInChange
  };
};

/**
 * Helper per la navigazione del calendario
 */
export const useCalendarNavigation = () => {
  const navigateWeek = React.useCallback((direction: 'prev' | 'next', currentDate: Date, setCurrentDate: (date: Date) => void) => {
    const newDate = new Date(currentDate);
    const daysToAdd = direction === 'next' ? 7 : -7;
    newDate.setDate(newDate.getDate() + daysToAdd);
    setCurrentDate(newDate);
    
    logger.debug('CalendarNavigation', `Navigazione settimana ${direction}`, { 
      newDate: newDate.toISOString().split('T')[0] 
    });
  }, []);

  const navigateMonth = React.useCallback((direction: 'prev' | 'next', currentDate: Date, setCurrentDate: (date: Date) => void) => {
    const newDate = new Date(currentDate);
    const monthsToAdd = direction === 'next' ? 1 : -1;
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    setCurrentDate(newDate);
    
    logger.debug('CalendarNavigation', `Navigazione mese ${direction}`, { 
      newDate: newDate.toISOString().split('T')[0] 
    });
  }, []);

  return {
    navigateWeek,
    navigateMonth
  };
};

/**
 * Helper per il filtraggio delle entries
 */
export const useEntryFiltering = () => {
  const filterEntriesByDateRange = React.useCallback((
    entries: CalendarEntry[],
    startDate: Date,
    endDate: Date
  ): CalendarEntry[] => {
    return entries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, []);

  const filterEntriesBySalesPoint = React.useCallback((
    entries: CalendarEntry[],
    salesPointId: string
  ): CalendarEntry[] => {
    if (!salesPointId || salesPointId === 'tutti') {
      return entries;
    }
    
    return entries.filter(entry => entry.salesPointId === salesPointId);
  }, []);

  return {
    filterEntriesByDateRange,
    filterEntriesBySalesPoint
  };
};
