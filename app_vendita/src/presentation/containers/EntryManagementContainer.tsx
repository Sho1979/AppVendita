/**
 * Container per la gestione delle entry del calendario
 * 
 * Estrae tutta la logica di CRUD delle entry dal MainCalendarPage
 * per rispettare il Single Responsibility Principle.
 */

import React, { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import EntryFormModal from '../components/EntryFormModal';
import TooltipModal from '../components/TooltipModal';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { useRepository } from '../../hooks/useRepository';
import { logger } from '../../utils/logger';

export interface EntryManagementContainerProps {
  // Callbacks per aggiornamento dati
  onEntryCreated: (entry: CalendarEntry) => void;
  onEntryUpdated: (entry: CalendarEntry) => void;
  onEntryDeleted: (entryId: string) => void;
  onError: (error: string) => void;
  
  // Dati per le modals
  selectedDate?: string;
  editingEntry?: CalendarEntry;
  
  // Stati UI
  showEntryModal: boolean;
  showTooltipModal: boolean;
  tooltipType: 'stock' | 'notes' | 'info' | 'images';
  tooltipDate: string;
  tooltipEntry?: CalendarEntry;
  
  // Callbacks UI
  onCloseEntryModal: () => void;
  onCloseTooltipModal: () => void;
}

/**
 * Container che gestisce tutte le operazioni CRUD sulle entry
 */
const EntryManagementContainer: React.FC<EntryManagementContainerProps> = memo(({
  onEntryCreated,
  onEntryUpdated,
  onEntryDeleted,
  onError,
  selectedDate,
  editingEntry,
  showEntryModal,
  showTooltipModal,
  tooltipType,
  tooltipDate,
  tooltipEntry,
  onCloseEntryModal,
  onCloseTooltipModal,
}) => {
  
  const repository = useRepository();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Salvataggio entry (create o update)
  const handleSaveEntry = useCallback(async (entryData: CalendarEntry): Promise<void> => {
    if (isSubmitting) {
      logger.warn('EntryManagement', 'Salvataggio già in corso, ignorato');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingEntry?.id) {
        // Update esistente
        logger.business('Inizio aggiornamento entry', { 
          entryId: editingEntry.id,
          date: entryData.date instanceof Date ? entryData.date.toISOString() : entryData.date
        });
        
        const updatedEntry = await repository.updateCalendarEntry(editingEntry.id, entryData);
        
        logger.business('Entry aggiornata con successo', { 
          entryId: updatedEntry.id,
          changes: Object.keys(entryData)
        });
        
        onEntryUpdated(updatedEntry);
        
      } else {
        // Nuova entry
        logger.business('Inizio creazione nuova entry', {
          date: entryData.date instanceof Date ? entryData.date.toISOString() : entryData.date,
          userId: entryData.userId,
          salesPointId: entryData.salesPointId
        });
        
        const newEntry = await repository.saveCalendarEntry(entryData);
        
        logger.business('Nuova entry creata con successo', { 
          entryId: newEntry.id 
        });
        
        onEntryCreated(newEntry);
      }
      
      // Chiudi modal dopo salvataggio riuscito
      onCloseEntryModal();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore nel salvataggio entry';
      logger.error('EntryManagement', 'Errore nel salvataggio entry', error);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    editingEntry,
    repository,
    onEntryCreated,
    onEntryUpdated,
    onCloseEntryModal,
    onError,
  ]);

  // Eliminazione entry
  const handleDeleteEntry = useCallback(async (entryId: string): Promise<void> => {
    if (isSubmitting) {
      logger.warn('EntryManagement', 'Operazione già in corso, eliminazione ignorata');
      return;
    }

    setIsSubmitting(true);
    
    try {
      logger.business('Inizio eliminazione entry', { entryId });
      
      await repository.deleteCalendarEntry(entryId);
      
      logger.business('Entry eliminata con successo', { entryId });
      
      onEntryDeleted(entryId);
      
      // Chiudi modal se era aperta per questa entry
      if (editingEntry?.id === entryId) {
        onCloseEntryModal();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'eliminazione entry';
      logger.error('EntryManagement', 'Errore nell\'eliminazione entry', error);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    repository,
    editingEntry,
    onEntryDeleted,
    onCloseEntryModal,
    onError,
  ]);

  // Callback per cancellazione modal entry
  const handleCancelEntry = useCallback(() => {
    logger.ui('Cancellazione modal entry', { 
      wasEditing: !!editingEntry?.id,
      entryId: editingEntry?.id 
    });
    onCloseEntryModal();
  }, [editingEntry, onCloseEntryModal]);

  // Callback per cancellazione modal tooltip
  const handleCancelTooltip = useCallback(() => {
    logger.ui('Cancellazione modal tooltip', { 
      tooltipType,
      tooltipDate,
      entryId: tooltipEntry?.id 
    });
    onCloseTooltipModal();
  }, [tooltipType, tooltipDate, tooltipEntry, onCloseTooltipModal]);

  // Validazione dati entry prima del salvataggio
  const validateEntryData = useCallback((entryData: CalendarEntry): string | null => {
    if (!entryData.date) {
      return 'Data richiesta';
    }
    
    if (!entryData.userId) {
      return 'Utente richiesto';
    }
    
    if (!entryData.salesPointId) {
      return 'Punto vendita richiesto';
    }

    // Validazioni aggiuntive possono essere aggiunte qui
    
    return null; // Nessun errore
  }, []);

  // Callback wrapper per salvataggio con validazione
  const handleSaveEntryWithValidation = useCallback(async (entryData: CalendarEntry): Promise<void> => {
    const validationError = validateEntryData(entryData);
    
    if (validationError) {
      logger.warn('EntryManagement', 'Validazione fallita', { error: validationError });
      onError(validationError);
      return;
    }
    
    await handleSaveEntry(entryData);
  }, [validateEntryData, handleSaveEntry, onError]);

  return (
    <View>
      {/* Modal per creazione/modifica entry */}
      {showEntryModal && (
        <EntryFormModal
          visible={showEntryModal}
          entry={editingEntry}
          selectedDate={selectedDate}
          onSave={handleSaveEntryWithValidation}
          onCancel={handleCancelEntry}
          onDelete={editingEntry?.id ? () => handleDeleteEntry(editingEntry.id) : undefined}
          isSubmitting={isSubmitting}
        />
      )}
      
      {/* Modal per tooltip/dettagli entry */}
      {showTooltipModal && tooltipEntry && (
        <TooltipModal
          visible={showTooltipModal}
          type={tooltipType}
          date={tooltipDate}
          entry={tooltipEntry}
          onClose={handleCancelTooltip}
          onEdit={() => {
            // Chiudi tooltip e apri modal di modifica
            onCloseTooltipModal();
            // Il parent component dovrebbe gestire l'apertura del modal di edit
          }}
          onDelete={tooltipEntry.id ? () => handleDeleteEntry(tooltipEntry.id) : undefined}
        />
      )}
    </View>
  );
});

EntryManagementContainer.displayName = 'EntryManagementContainer';

export default EntryManagementContainer;
