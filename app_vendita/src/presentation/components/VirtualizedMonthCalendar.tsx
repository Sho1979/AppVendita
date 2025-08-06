import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import CustomCalendarCell from './CustomCalendarCell';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';

interface VirtualizedMonthCalendarProps {
  currentDate: Date;
  entries: CalendarEntry[];
  selectedDate: string;
  selectedSalesPointId?: string;
  onDayPress: (date: string) => void;
  onTooltipPress?: ((type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => void) | undefined;

}

// Ottieni dimensioni schermo per calcolare altezza celle
const { width } = Dimensions.get('window');
const CELL_WIDTH = width / 7;
const CELL_HEIGHT = 80; // Altezza fissa per uniformità

interface WeekData {
  weekIndex: number;
  dates: Date[];
}

export default function VirtualizedMonthCalendar({
  currentDate,
  entries,
  selectedDate,
  selectedSalesPointId,
  onDayPress,
  onTooltipPress,
}: VirtualizedMonthCalendarProps) {
  
  // Memoizza la generazione delle date del mese
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Trova il primo giorno della settimana (domenica = 0)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const dates: Date[] = [];
    const currentDateTemp = new Date(startDate);

    // Calcola il numero di settimane necessarie
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    const totalCells = firstDayOfWeek + daysInMonth;
    const weeksNeeded = Math.ceil(totalCells / 7);
    const finalWeeks = Math.max(4, weeksNeeded);

    // Genera le settimane necessarie
    for (let week = 0; week < finalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        dates.push(new Date(currentDateTemp));
        currentDateTemp.setDate(currentDateTemp.getDate() + 1);
      }
    }

    // Organizza per settimane
    const weeks: WeekData[] = [];
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push({
        weekIndex: Math.floor(i / 7),
        dates: dates.slice(i, i + 7)
      });
    }

    return { dates, weeks };
  }, [currentDate]);

  // Memoizza la funzione per trovare entries
  const getEntryForDate = useCallback((date: Date): CalendarEntry | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Trova tutti gli entries per questa data
    const entriesForDate = entries.filter(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      return entryDate === dateStr;
    });

    if (entriesForDate.length === 0) {
      return undefined;
    }

    // Se c'è solo un entry, usalo
    if (entriesForDate.length === 1) {
      return entriesForDate[0];
    }

    // Se ci sono multiple entries, combina i dati
    const latestEntry = entriesForDate.reduce((latest, current) => {
      const latestTimestamp = parseInt(latest.id?.split(/[a-z]/)[0] || '0');
      const currentTimestamp = parseInt(current.id?.split(/[a-z]/)[0] || '0');
      return currentTimestamp > latestTimestamp ? current : latest;
    });

    // Trova l'entry con più tag
    const entryWithMostTags = entriesForDate.reduce((mostTags, current) => {
      const currentTagsCount = current.tags?.length || 0;
      const mostTagsCount = mostTags.tags?.length || 0;
      return currentTagsCount > mostTagsCount ? current : mostTags;
    });

    // Combina i dati
    return {
      ...latestEntry,
      tags: entryWithMostTags.tags || latestEntry.tags || []
    };
  }, [entries]);

  const isToday = useCallback((date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const isSelected = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === selectedDate;
  }, [selectedDate]);

  // Header giorni settimana con indicatori
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  const renderHeader = useMemo(() => {
    // Calcola indicatori per ogni colonna
    const columnIndicators = dayNames.map((dayName, index) => {
      const weekEntries = monthData.dates
        .filter((_, dayIndex) => dayIndex % 7 === index)
        .map(date => getEntryForDate(date))
        .filter(entry => !!entry);
      
      return {
        dayName,
        hasData: weekEntries.length > 0,
        count: weekEntries.length
      };
    });

    return (
      <View style={styles.weekHeader}>
        {columnIndicators.map((col, index) => (
          <View key={index} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{col.dayName}</Text>
            {col.hasData && (
              <View style={styles.dayHeaderIndicator}>
                <Text style={styles.dayHeaderIndicatorText}>{col.count}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  }, [monthData.dates, getEntryForDate]);

  // Renderizza una settimana
  const renderWeek = useCallback(({ item }: { item: WeekData }) => {
    return (
      <View style={styles.weekRow}>
        {item.dates.map((date) => {
          const entry = getEntryForDate(date);
          const dateStr = date.toISOString().split('T')[0];

          return (
            <View key={dateStr} style={styles.cellContainer}>
              <CustomCalendarCell
                date={dateStr}
                entry={entry}
                isSelected={isSelected(date)}
                isToday={isToday(date)}
                selectedSalesPointId={selectedSalesPointId}
                onPress={() => onDayPress(dateStr)}
                isWeekView={false}
                onTooltipPress={onTooltipPress}

              />
            </View>
          );
        })}
      </View>
    );
  }, [getEntryForDate, isSelected, isToday, onDayPress, onTooltipPress]);

  // Ottimizzazioni FlatList
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: CELL_HEIGHT,
    offset: CELL_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: WeekData) => `week-${item.weekIndex}`, []);

  return (
    <View style={styles.container}>
      {renderHeader}
      <FlatList
        data={monthData.weeks}
        renderItem={renderWeek}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={4}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmBackground,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.warmSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warmBorder,
    paddingVertical: 2,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  dayHeaderIndicator: {
    backgroundColor: Colors.primaryColor,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  dayHeaderIndicatorText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  weekRow: {
    flexDirection: 'row',
    height: CELL_HEIGHT,
  },
  cellContainer: {
    flex: 1,
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
  },
});