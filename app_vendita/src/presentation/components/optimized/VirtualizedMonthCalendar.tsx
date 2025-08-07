/**
 * Calendario mensile virtualizzato per performance ottimali
 * 
 * Implementa virtualization avanzata per gestire grandi quantità di dati
 * senza impatti sulle performance di rendering.
 */

import React, { memo, useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { CalendarEntry } from '../../../data/models/CalendarEntry';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';
import { logger } from '../../../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 32) / 7; // 7 giorni, meno padding

export interface VirtualizedMonthCalendarProps {
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
  enableVirtualization?: boolean;
  windowSize?: number;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  entries: CalendarEntry[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  dayOfWeek: number;
  weekIndex: number;
}

interface CalendarWeek {
  weekIndex: number;
  days: CalendarDay[];
  startDate: Date;
  endDate: Date;
}

/**
 * Hook per generare i dati del mese in modo ottimizzato
 */
const useMonthData = (currentDate: Date, entries: CalendarEntry[], selectedDate?: string): CalendarWeek[] => {
  return useMemo(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Inizio della prima settimana (potrebbe includere giorni del mese precedente)
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    
    // Fine dell'ultima settimana (potrebbe includere giorni del mese successivo)
    const endOfCalendar = new Date(endOfMonth);
    const daysToAdd = 6 - endOfMonth.getDay();
    endOfCalendar.setDate(endOfMonth.getDate() + daysToAdd);
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const weeks: CalendarWeek[] = [];
    let currentWeekDate = new Date(startOfCalendar);
    let weekIndex = 0;
    
    while (currentWeekDate <= endOfCalendar) {
      const weekDays: CalendarDay[] = [];
      const weekStartDate = new Date(currentWeekDate);
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayDate = new Date(currentWeekDate);
        const dateString = dayDate.toISOString().split('T')[0];
        const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth();
        
        // Filtra entries per questo giorno solo se è del mese corrente (performance)
        const dayEntries = isCurrentMonth ? entries.filter(entry => {
          const entryDateString = entry.date instanceof Date 
            ? entry.date.toISOString().split('T')[0]
            : entry.date.split('T')[0];
          return entryDateString === dateString;
        }) : [];
        
        weekDays.push({
          date: dayDate,
          dateString,
          entries: dayEntries,
          isCurrentMonth,
          isSelected: selectedDate === dateString,
          isToday: dateString === todayString,
          dayOfWeek: dayIndex,
          weekIndex,
        });
        
        currentWeekDate.setDate(currentWeekDate.getDate() + 1);
      }
      
      const weekEndDate = new Date(currentWeekDate);
      weekEndDate.setDate(currentWeekDate.getDate() - 1);
      
      weeks.push({
        weekIndex,
        days: weekDays,
        startDate: weekStartDate,
        endDate: weekEndDate,
      });
      
      weekIndex++;
    }
    
    return weeks;
  }, [currentDate, entries, selectedDate]);
};

/**
 * Componente Day ottimizzato per virtualizzazione
 */
const VirtualizedDay = memo<{
  day: CalendarDay;
  onDayPress: (dateString: string) => void;
  onAddEntry: (dateString: string) => void;
  onEditEntry: (entry: CalendarEntry) => void;
  maxEntriesPerDay: number;
  cellSize: number;
}>(({ day, onDayPress, onAddEntry, onEditEntry, maxEntriesPerDay, cellSize }) => {
  
  const handleDayPress = useCallback(() => {
    if (day.isCurrentMonth) {
      onDayPress(day.dateString);
    }
  }, [onDayPress, day.dateString, day.isCurrentMonth]);
  
  const handleAddEntry = useCallback(() => {
    if (day.isCurrentMonth) {
      onAddEntry(day.dateString);
    }
  }, [onAddEntry, day.dateString, day.isCurrentMonth]);
  
  const handleEntryPress = useCallback((entry: CalendarEntry) => {
    onEditEntry(entry);
  }, [onEditEntry]);
  
  // Stili memoizzati
  const dayStyle = useMemo(() => [
    styles.day,
    { width: cellSize, height: cellSize },
    !day.isCurrentMonth && styles.otherMonthDay,
    day.isSelected && styles.selectedDay,
    day.isToday && styles.todayDay,
  ], [day.isCurrentMonth, day.isSelected, day.isToday, cellSize]);
  
  const textStyle = useMemo(() => [
    styles.dayText,
    !day.isCurrentMonth && styles.otherMonthText,
    day.isSelected && styles.selectedDayText,
    day.isToday && styles.todayText,
  ], [day.isCurrentMonth, day.isSelected, day.isToday]);
  
  // Limita entries per performance
  const visibleEntries = useMemo(() => 
    day.entries.slice(0, maxEntriesPerDay),
    [day.entries, maxEntriesPerDay]
  );
  
  const hiddenEntriesCount = day.entries.length - visibleEntries.length;
  
  return (
    <TouchableOpacity 
      style={dayStyle} 
      onPress={handleDayPress}
      disabled={!day.isCurrentMonth}
    >
      <Text style={textStyle}>
        {day.date.getDate()}
      </Text>
      
      {/* Entries del giorno */}
      {day.isCurrentMonth && (
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
          
          {hiddenEntriesCount > 0 && (
            <Text style={styles.hiddenEntriesText}>
              +{hiddenEntriesCount}
            </Text>
          )}
        </View>
      )}
      
      {/* Pulsante aggiunta veloce */}
      {day.isCurrentMonth && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddEntry}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

/**
 * Componente Week per la FlatList virtualizzata
 */
const VirtualizedWeek = memo<{
  week: CalendarWeek;
  onDayPress: (dateString: string) => void;
  onAddEntry: (dateString: string) => void;
  onEditEntry: (entry: CalendarEntry) => void;
  maxEntriesPerDay: number;
  cellSize: number;
}>(({ week, onDayPress, onAddEntry, onEditEntry, maxEntriesPerDay, cellSize }) => {
  
  return (
    <View style={styles.weekRow}>
      {week.days.map((day) => (
        <VirtualizedDay
          key={day.dateString}
          day={day}
          onDayPress={onDayPress}
          onAddEntry={onAddEntry}
          onEditEntry={onEditEntry}
          maxEntriesPerDay={maxEntriesPerDay}
          cellSize={cellSize}
        />
      ))}
    </View>
  );
});

/**
 * Header del calendario ottimizzato
 */
const MonthHeader = memo<{
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
        <Text style={styles.viewModeText}>Mese</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onNext} style={styles.navButton}>
        <Text style={styles.navButtonText}>›</Text>
      </TouchableOpacity>
    </View>
  );
});

/**
 * Componente principale del calendario mensile virtualizzato
 */
const VirtualizedMonthCalendar: React.FC<VirtualizedMonthCalendarProps> = memo(({
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
  maxEntriesPerDay = 2,
  enableVirtualization = true,
  windowSize = 10,
}) => {
  
  // Performance logging
  React.useEffect(() => {
    if (enableDebugLogs) {
      logger.performance('VirtualizedMonthCalendar render', {
        entriesCount: entries.length,
        selectedDate,
        currentMonth: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
        virtualizationEnabled: enableVirtualization,
      });
    }
  });
  
  // Dati del mese memoizzati
  const monthData = useMonthData(currentDate, entries, selectedDate);
  
  // Callbacks memoizzati
  const memoizedOnDayPress = useCallback((dateString: string) => {
    if (enableDebugLogs) {
      logger.ui('Giorno premuto in MonthCalendar', { date: dateString });
    }
    onDayPress(dateString);
  }, [onDayPress, enableDebugLogs]);
  
  const memoizedOnAddEntry = useCallback((dateString: string) => {
    if (enableDebugLogs) {
      logger.ui('Aggiunta entry da MonthCalendar', { date: dateString });
    }
    onAddEntry(dateString);
  }, [onAddEntry, enableDebugLogs]);
  
  const memoizedOnEditEntry = useCallback((entry: CalendarEntry) => {
    if (enableDebugLogs) {
      logger.ui('Modifica entry da MonthCalendar', { entryId: entry.id });
    }
    onEditEntry(entry);
  }, [onEditEntry, enableDebugLogs]);
  
  // Header giorni settimana
  const weekDaysHeader = useMemo(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return (
      <View style={styles.weekDaysHeader}>
        {dayNames.map((dayName, index) => (
          <View key={index} style={[styles.weekDayNameContainer, { width: CELL_SIZE }]}>
            <Text style={styles.weekDayName}>{dayName}</Text>
          </View>
        ))}
      </View>
    );
  }, []);
  
  // Render item per FlatList
  const renderWeek = useCallback(({ item }: { item: CalendarWeek }) => (
    <VirtualizedWeek
      week={item}
      onDayPress={memoizedOnDayPress}
      onAddEntry={memoizedOnAddEntry}
      onEditEntry={memoizedOnEditEntry}
      maxEntriesPerDay={maxEntriesPerDay}
      cellSize={CELL_SIZE}
    />
  ), [memoizedOnDayPress, memoizedOnAddEntry, memoizedOnEditEntry, maxEntriesPerDay]);
  
  // Key extractor per FlatList
  const keyExtractor = useCallback((item: CalendarWeek) => 
    `week-${item.weekIndex}-${item.startDate.toISOString()}`,
    []
  );
  
  // getItemLayout per ottimizzazioni FlatList
  const getItemLayout = useCallback((data: CalendarWeek[] | null | undefined, index: number) => ({
    length: CELL_SIZE,
    offset: CELL_SIZE * index,
    index,
  }), []);
  
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
      <MonthHeader
        currentDate={currentDate}
        onPrevious={onPrevious}
        onNext={onNext}
        onToggleView={onToggleView}
      />
      
      {/* Header giorni della settimana */}
      {weekDaysHeader}
      
      {/* Calendario virtualizzato */}
      {enableVirtualization ? (
        <FlatList
          data={monthData}
          renderItem={renderWeek}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          windowSize={windowSize}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.calendarList}
        />
      ) : (
        <View style={styles.calendarGrid}>
          {monthData.map((week) => (
            <VirtualizedWeek
              key={keyExtractor(week)}
              week={week}
              onDayPress={memoizedOnDayPress}
              onAddEntry={memoizedOnAddEntry}
              onEditEntry={memoizedOnEditEntry}
              maxEntriesPerDay={maxEntriesPerDay}
              cellSize={CELL_SIZE}
            />
          ))}
        </View>
      )}
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
    flex: 1,
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
  weekDayNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  calendarList: {
    flex: 1,
  },
  calendarGrid: {
    flex: 1,
    paddingHorizontal: Spacing.small,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.small,
  },
  day: {
    margin: 1,
    padding: 4,
    backgroundColor: 'white',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  otherMonthDay: {
    backgroundColor: '#F8F8F8',
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: Colors.accentSuccess,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  otherMonthText: {
    color: Colors.textSecondary,
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
    marginBottom: 1,
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 1,
  },
  hiddenEntriesText: {
    fontSize: 8,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accentSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addButtonText: {
    fontSize: 10,
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

// Display names per debugging
VirtualizedMonthCalendar.displayName = 'VirtualizedMonthCalendar';
VirtualizedDay.displayName = 'VirtualizedDay';
VirtualizedWeek.displayName = 'VirtualizedWeek';
MonthHeader.displayName = 'MonthHeader';

export default VirtualizedMonthCalendar;
