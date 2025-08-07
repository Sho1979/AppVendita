/**
 * Versione ottimizzata del WeekCalendar con React.memo
 * 
 * Implementa memoization avanzata per eliminare re-render inutili
 * e migliorare le performance del calendario settimanale.
 */

import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarEntry } from '../../../data/models/CalendarEntry';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';
import { logger } from '../../../utils/logger';

export interface MemoizedWeekCalendarProps {
  // Dati del calendario
  entries: CalendarEntry[];
  selectedDate?: string;
  currentDate: Date;
  
  // Callbacks ottimizzati
  onDayPress: (dateString: string) => void;
  onAddEntry: (dateString: string) => void;
  onEditEntry: (entry: CalendarEntry) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleView?: () => void;
  
  // Stati
  isLoading?: boolean;
  
  // Configurazione performance
  enableDebugLogs?: boolean;
  maxEntriesPerDay?: number;
}

interface DayData {
  date: Date;
  dateString: string;
  entries: CalendarEntry[];
  isSelected: boolean;
  isToday: boolean;
  isCurrentWeek: boolean;
}

/**
 * Hook per calcolare i dati della settimana in modo ottimizzato
 */
const useWeekData = (currentDate: Date, entries: CalendarEntry[], selectedDate?: string): DayData[] => {
  return useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const weekDays: DayData[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Filtra entries per questo giorno
      const dayEntries = entries.filter(entry => {
        const entryDateString = entry.date instanceof Date 
          ? entry.date.toISOString().split('T')[0]
          : entry.date.split('T')[0];
        return entryDateString === dateString;
      });
      
      weekDays.push({
        date,
        dateString,
        entries: dayEntries,
        isSelected: selectedDate === dateString,
        isToday: dateString === todayString,
        isCurrentWeek: true,
      });
    }
    
    return weekDays;
  }, [currentDate, entries, selectedDate]);
};

/**
 * Componente Day ottimizzato con memo
 */
const MemoizedDay = memo<{
  dayData: DayData;
  onDayPress: (dateString: string) => void;
  onAddEntry: (dateString: string) => void;
  onEditEntry: (entry: CalendarEntry) => void;
  maxEntriesPerDay: number;
}>(({ dayData, onDayPress, onAddEntry, onEditEntry, maxEntriesPerDay }) => {
  
  const handleDayPress = useCallback(() => {
    onDayPress(dayData.dateString);
  }, [onDayPress, dayData.dateString]);
  
  const handleAddEntry = useCallback(() => {
    onAddEntry(dayData.dateString);
  }, [onAddEntry, dayData.dateString]);
  
  const handleEntryPress = useCallback((entry: CalendarEntry) => {
    onEditEntry(entry);
  }, [onEditEntry]);
  
  // Stili memoizzati per il giorno
  const dayStyle = useMemo(() => [
    styles.day,
    dayData.isSelected && styles.selectedDay,
    dayData.isToday && styles.todayDay,
  ], [dayData.isSelected, dayData.isToday]);
  
  const textStyle = useMemo(() => [
    styles.dayText,
    dayData.isSelected && styles.selectedDayText,
    dayData.isToday && styles.todayText,
  ], [dayData.isSelected, dayData.isToday]);
  
  // Limita entries visualizzate per performance
  const visibleEntries = useMemo(() => 
    dayData.entries.slice(0, maxEntriesPerDay),
    [dayData.entries, maxEntriesPerDay]
  );
  
  const hiddenEntriesCount = dayData.entries.length - visibleEntries.length;
  
  return (
    <TouchableOpacity style={dayStyle} onPress={handleDayPress}>
      <Text style={textStyle}>
        {dayData.date.getDate()}
      </Text>
      
      {/* Entries del giorno */}
      <View style={styles.entriesContainer}>
        {visibleEntries.map((entry, index) => (
          <TouchableOpacity
            key={entry.id || index}
            style={styles.entryIndicator}
            onPress={() => handleEntryPress(entry)}
          >
            <View style={[
              styles.entryDot,
              { backgroundColor: entry.hasProblem ? Colors.accentError : Colors.primary }
            ]} />
          </TouchableOpacity>
        ))}
        
        {/* Indicatore entries nascoste */}
        {hiddenEntriesCount > 0 && (
          <Text style={styles.hiddenEntriesText}>
            +{hiddenEntriesCount}
          </Text>
        )}
      </View>
      
      {/* Pulsante aggiunta veloce */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddEntry}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

/**
 * Header del calendario ottimizzato
 */
const MemoizedWeekHeader = memo<{
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToggleView?: () => void;
}>(({ currentDate, onPrevious, onNext, onToggleView }) => {
  
  const headerText = useMemo(() => {
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onPrevious} style={styles.navButton}>
        <Text style={styles.navButtonText}>‹</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onToggleView} style={styles.headerTitle}>
        <Text style={styles.headerTitleText}>{headerText}</Text>
        <Text style={styles.viewModeText}>Settimana</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onNext} style={styles.navButton}>
        <Text style={styles.navButtonText}>›</Text>
      </TouchableOpacity>
    </View>
  );
});

/**
 * Componente WeekCalendar ottimizzato con memoization avanzata
 */
const MemoizedWeekCalendar: React.FC<MemoizedWeekCalendarProps> = memo(({
  entries,
  selectedDate,
  currentDate,
  onDayPress,
  onAddEntry,
  onEditEntry,
  onPrevious,
  onNext,
  onToggleView,
  isLoading = false,
  enableDebugLogs = false,
  maxEntriesPerDay = 3,
}) => {
  
  // Performance logging
  React.useEffect(() => {
    if (enableDebugLogs) {
      logger.performance('MemoizedWeekCalendar render', {
        entriesCount: entries.length,
        selectedDate,
        currentWeek: currentDate.toISOString().split('T')[0],
      });
    }
  });
  
  // Dati della settimana memoizzati
  const weekData = useWeekData(currentDate, entries, selectedDate);
  
  // Callbacks memoizzati per evitare re-render dei children
  const memoizedOnDayPress = useCallback((dateString: string) => {
    if (enableDebugLogs) {
      logger.ui('Giorno premuto in WeekCalendar', { date: dateString });
    }
    onDayPress(dateString);
  }, [onDayPress, enableDebugLogs]);
  
  const memoizedOnAddEntry = useCallback((dateString: string) => {
    if (enableDebugLogs) {
      logger.ui('Aggiunta entry da WeekCalendar', { date: dateString });
    }
    onAddEntry(dateString);
  }, [onAddEntry, enableDebugLogs]);
  
  const memoizedOnEditEntry = useCallback((entry: CalendarEntry) => {
    if (enableDebugLogs) {
      logger.ui('Modifica entry da WeekCalendar', { entryId: entry.id });
    }
    onEditEntry(entry);
  }, [onEditEntry, enableDebugLogs]);
  
  // Header giorni settimana
  const weekDaysHeader = useMemo(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return (
      <View style={styles.weekDaysHeader}>
        {dayNames.map((dayName, index) => (
          <Text key={index} style={styles.weekDayName}>
            {dayName}
          </Text>
        ))}
      </View>
    );
  }, []);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento calendario...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header con navigazione */}
      <MemoizedWeekHeader
        currentDate={currentDate}
        onPrevious={onPrevious}
        onNext={onNext}
        onToggleView={onToggleView}
      />
      
      {/* Header giorni della settimana */}
      {weekDaysHeader}
      
      {/* Griglia giorni */}
      <View style={styles.weekGrid}>
        {weekData.map((dayData) => (
          <MemoizedDay
            key={dayData.dateString}
            dayData={dayData}
            onDayPress={memoizedOnDayPress}
            onAddEntry={memoizedOnAddEntry}
            onEditEntry={memoizedOnEditEntry}
            maxEntriesPerDay={maxEntriesPerDay}
          />
        ))}
      </View>
    </View>
  );
});

// Stili ottimizzati
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    margin: Spacing.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewModeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: Colors.primary,
  },
  navButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weekDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  weekGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.small,
  },
  day: {
    flex: 1,
    minHeight: 80,
    margin: 2,
    padding: Spacing.small,
    backgroundColor: 'white',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: Colors.accentSuccess,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  selectedDayText: {
    color: 'white',
  },
  todayText: {
    color: Colors.accentSuccess,
    fontWeight: '700',
  },
  entriesContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  entryIndicator: {
    marginBottom: 2,
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 1,
  },
  hiddenEntriesText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: Spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

// Display name per debugging
MemoizedWeekCalendar.displayName = 'MemoizedWeekCalendar';
MemoizedDay.displayName = 'MemoizedDay';
MemoizedWeekHeader.displayName = 'MemoizedWeekHeader';

export default MemoizedWeekCalendar;
