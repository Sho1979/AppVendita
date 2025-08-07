/**
 * Gestione completa dei tooltip del calendario
 * 
 * Gestisce apertura, chiusura e aggiornamento dei tooltip
 * per stock, notes e images.
 */

import React from 'react';
import { Alert } from 'react-native';
import { CalendarEntry } from '../../../data/models/CalendarEntry';
import { logger } from '../../../utils/logger';

export type TooltipType = 'stock' | 'notes' | 'images';

export interface TooltipManagementProps {
  // State
  showTooltipModal: boolean;
  tooltipType: TooltipType;
  tooltipDate: string;
  tooltipEntry?: CalendarEntry;
  
  // Callbacks
  onOpenTooltip: (type: TooltipType, date: string, entry?: CalendarEntry) => void;
  onCloseTooltip: () => void;
  onUpdateEntry: (updatedEntry: CalendarEntry) => Promise<void>;
}

export interface TooltipManagementHook {
  // State
  showTooltipModal: boolean;
  tooltipType: TooltipType;
  tooltipDate: string;
  tooltipEntry?: CalendarEntry;
  
  // Actions
  openTooltip: (type: TooltipType, date: string, entry?: CalendarEntry) => void;
  closeTooltip: () => void;
  updateEntry: (updatedEntry: CalendarEntry) => Promise<void>;
}

/**
 * Hook per gestire la logica dei tooltip
 */
export const useTooltipManagement = (
  repository: any,
  dispatch: any,
  state: any,
  selectedSalesPointId: string
): TooltipManagementHook => {
  const [showTooltipModal, setShowTooltipModal] = React.useState(false);
  const [tooltipType, setTooltipType] = React.useState<TooltipType>('stock');
  const [tooltipDate, setTooltipDate] = React.useState('');
  const [tooltipEntry, setTooltipEntry] = React.useState<CalendarEntry | undefined>();

  const openTooltip = React.useCallback((
    type: TooltipType, 
    date: string, 
    entry?: CalendarEntry
  ) => {
    logger.debug('TooltipManager', `Apertura tooltip: ${type} per data: ${date}`);
    
    // Logica per trovare l'entry corretta (dal codice originale)
    const filteredCalendarEntries = state.entries.filter((e: CalendarEntry) => {
      return !selectedSalesPointId || 
             selectedSalesPointId === 'tutti' || 
             e.salesPointId === selectedSalesPointId;
    });
    
    // Recupera l'entry corretta dalle entries filtrate usando la data
    const correctEntry = filteredCalendarEntries.find((e: CalendarEntry) => {
      const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
      return entryDate.toISOString().split('T')[0] === date;
    });
    
    logger.debug('TooltipManager', 'Entry filtrata', { 
      entryId: correctEntry?.id, 
      chatNotesCount: correctEntry?.chatNotes?.length || 0 
    });
    
    // Prova anche con tutte le entries non filtrate dal calendario context
    const allEntries = state.entries;
    const entryFromContext = allEntries.find((e: CalendarEntry) => {
      const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
      return entryDate.toISOString().split('T')[0] === date && 
             e.salesPointId === selectedSalesPointId;
    });
    
    logger.debug('TooltipManager', 'Entry dal context', { 
      entryId: entryFromContext?.id, 
      chatNotesCount: entryFromContext?.chatNotes?.length || 0 
    });
    
    // Usa l'entry che ha più dati (priorità: context > filtrata > originale)
    const finalEntry = entryFromContext || correctEntry || entry;
    logger.debug('TooltipManager', 'Entry finale scelta', { 
      entryId: finalEntry?.id, 
      chatNotesCount: finalEntry?.chatNotes?.length || 0 
    });
    
    setTooltipType(type);
    setTooltipDate(date);
    setTooltipEntry(finalEntry);
    setShowTooltipModal(true);
  }, [state.entries, selectedSalesPointId]);

  const closeTooltip = React.useCallback(() => {
    logger.debug('TooltipManager', 'Chiusura tooltip');
    setShowTooltipModal(false);
    setTooltipType('stock');
    setTooltipDate('');
    setTooltipEntry(undefined);
  }, []);

  const updateEntry = React.useCallback(async (updatedEntry: CalendarEntry) => {
    try {
      logger.info('TooltipManager', 'Aggiornamento entry dal tooltip', { entryId: updatedEntry.id });
      
      // Prepara i dati per l'aggiornamento
      const updateData = {
        chatNotes: updatedEntry.chatNotes || [],
        updatedAt: new Date(),
      };
      
      await repository.updateCalendarEntry(updatedEntry.id, updateData);
      dispatch({ type: 'UPDATE_ENTRY', payload: updatedEntry });
      
      // Aggiorna anche l'entry nel tooltip se è lo stesso
      if (tooltipEntry?.id === updatedEntry.id) {
        setTooltipEntry(updatedEntry);
      }
    } catch (error) {
      logger.error('TooltipManager', 'Errore aggiornamento entry dal tooltip', error);
      Alert.alert('Errore', 'Impossibile aggiornare l\'entry. Riprova.');
    }
  }, [repository, dispatch, tooltipEntry]);

  return {
    // State
    showTooltipModal,
    tooltipType,
    tooltipDate,
    tooltipEntry,
    
    // Actions
    openTooltip,
    closeTooltip,
    updateEntry
  };
};
