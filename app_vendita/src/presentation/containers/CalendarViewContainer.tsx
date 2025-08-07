/**
 * Container per la gestione della vista calendario
 * 
 * Estrae la logica di visualizzazione calendario dal MainCalendarPage
 * per rispettare il Single Responsibility Principle.
 */

import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import WeekCalendar from '../components/WeekCalendar';
import VirtualizedMonthCalendar from '../components/VirtualizedMonthCalendar';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { logger } from '../../utils/logger';

export interface CalendarViewContainerProps {
  // Vista corrente
  calendarView: 'week' | 'month';
  currentDate: Date;
  
  // Dati
  calendarEntries: CalendarEntry[];
  selectedDate?: string;
  
  // Callbacks
  onDayPress: (dateString: string) => void;
  onAddEntry: (dateString: string) => void;
  onEditEntry: (entry: CalendarEntry) => void;
  onViewChange: (view: 'week' | 'month') => void;
  onDateChange: (date: Date) => void;
  
  // Stati UI
  isLoading?: boolean;
}

/**
 * Container che gestisce la logica di visualizzazione del calendario
 */
const CalendarViewContainer: React.FC<CalendarViewContainerProps> = memo(({
  calendarView,
  currentDate,
  calendarEntries,
  selectedDate,
  onDayPress,
  onAddEntry,
  onEditEntry,
  onViewChange,
  onDateChange,
  isLoading = false,
}) => {
  
  // Memoizza le entries per la vista corrente
  const visibleEntries = useMemo(() => {
    if (!calendarEntries || calendarEntries.length === 0) {
      return [];
    }

    // Filtra le entries in base alla vista
    const now = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const filtered = calendarEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      
      if (calendarView === 'week') {
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      } else {
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      }
    });

    logger.ui('Entries filtrate per vista calendario', {
      view: calendarView,
      total: calendarEntries.length,
      visible: filtered.length,
      dateRange: calendarView === 'week' 
        ? `${startOfWeek.toISOString().split('T')[0]} - ${endOfWeek.toISOString().split('T')[0]}`
        : `${startOfMonth.toISOString().split('T')[0]} - ${endOfMonth.toISOString().split('T')[0]}`
    });

    return filtered;
  }, [calendarEntries, currentDate, calendarView]);

  // Callback ottimizzato per cambio vista
  const handleViewToggle = useCallback(() => {
    const newView = calendarView === 'week' ? 'month' : 'week';
    logger.ui('Cambio vista calendario', { from: calendarView, to: newView });
    onViewChange(newView);
  }, [calendarView, onViewChange]);

  // Callback per pressione giorno con logging
  const handleDayPress = useCallback((dateString: string) => {
    logger.ui('Giorno selezionato nel calendario', { date: dateString });
    onDayPress(dateString);
  }, [onDayPress]);

  // Callback per aggiunta entry con logging
  const handleAddEntry = useCallback((dateString: string) => {
    logger.ui('Richiesta aggiunta entry da calendario', { date: dateString });
    onAddEntry(dateString);
  }, [onAddEntry]);

  // Callback per modifica entry con logging
  const handleEditEntry = useCallback((entry: CalendarEntry) => {
    logger.ui('Richiesta modifica entry da calendario', { 
      entryId: entry.id, 
      date: entry.date instanceof Date ? entry.date.toISOString() : entry.date 
    });
    onEditEntry(entry);
  }, [onEditEntry]);

  // Navigazione date ottimizzata
  const handlePreviousPeriod = useCallback(() => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
      logger.ui('Navigazione settimana precedente', { 
        from: currentDate.toISOString().split('T')[0],
        to: newDate.toISOString().split('T')[0]
      });
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
      logger.ui('Navigazione mese precedente', { 
        from: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
        to: `${newDate.getFullYear()}-${newDate.getMonth() + 1}`
      });
    }
    
    onDateChange(newDate);
  }, [currentDate, calendarView, onDateChange]);

  const handleNextPeriod = useCallback(() => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
      logger.ui('Navigazione settimana successiva', { 
        from: currentDate.toISOString().split('T')[0],
        to: newDate.toISOString().split('T')[0]
      });
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
      logger.ui('Navigazione mese successivo', { 
        from: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
        to: `${newDate.getFullYear()}-${newDate.getMonth() + 1}`
      });
    }
    
    onDateChange(newDate);
  }, [currentDate, calendarView, onDateChange]);

  // Props per i componenti calendario
  const commonCalendarProps = useMemo(() => ({
    entries: visibleEntries,
    selectedDate,
    currentDate,
    onDayPress: handleDayPress,
    onAddEntry: handleAddEntry,
    onEditEntry: handleEditEntry,
    onPrevious: handlePreviousPeriod,
    onNext: handleNextPeriod,
    isLoading,
  }), [
    visibleEntries,
    selectedDate,
    currentDate,
    handleDayPress,
    handleAddEntry,
    handleEditEntry,
    handlePreviousPeriod,
    handleNextPeriod,
    isLoading,
  ]);

  return (
    <View style={styles.container}>
      {calendarView === 'week' ? (
        <WeekCalendar
          {...commonCalendarProps}
          onToggleView={handleViewToggle}
        />
      ) : (
        <VirtualizedMonthCalendar
          {...commonCalendarProps}
          onToggleView={handleViewToggle}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
});

CalendarViewContainer.displayName = 'CalendarViewContainer';

export default CalendarViewContainer;
