import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
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
const { width, height } = Dimensions.get('window');
const CELL_WIDTH = width / 7;

interface WeekData {
  weekIndex: number;
  dates: Array<Date | null>;
}

export default function VirtualizedMonthCalendar({
  currentDate,
  entries,
  selectedDate,
  selectedSalesPointId,
  onDayPress,
  onTooltipPress,
}: VirtualizedMonthCalendarProps) {
  // Misura dinamica: altezza contenitore e altezza header per calcolo preciso delle celle
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const onContainerLayout = useCallback((evt: any) => {
    const h = evt?.nativeEvent?.layout?.height || 0;
    if (h && Math.abs(h - containerHeight) > 2) {
      setContainerHeight(h);
    }
  }, [containerHeight]);

  // Memoizza la generazione delle date del mese
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Calcola il numero di settimane effettivamente necessarie per il mese
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 = Dom ... 6 = Sab
    const totalCells = firstDayOfWeek + daysInMonth;
    const weeksNeeded = Math.ceil(totalCells / 7);

    // Genera settimane contenenti SOLO i giorni del mese corrente.
    const weeks: WeekData[] = [];
    let dayCounter = 1;
    for (let w = 0; w < weeksNeeded; w++) {
      const days: Array<Date | null> = [];
      for (let d = 0; d < 7; d++) {
        const isFirstWeekPadding = w === 0 && d < firstDayOfWeek;
        if (isFirstWeekPadding || dayCounter > daysInMonth) {
          days.push(null); // placeholder fuori mese
        } else {
          days.push(new Date(year, month, dayCounter));
          dayCounter += 1;
        }
      }
      weeks.push({ weekIndex: w, dates: days });
    }

    // Flatten solo per eventuali conteggi rapidi
    const dates: Array<Date | null> = weeks.flatMap(w => w.dates);
    return { dates, weeks };
  }, [currentDate]);

  const rowsCount = monthData?.weeks?.length || 6;
  const cellHeight = useMemo(() => {
    // Fallback iniziale se non misurato
    if (!containerHeight) {
      return Math.max(64, Math.floor((height - 320) / rowsCount));
    }
    const available = Math.max(0, containerHeight);
    return Math.max(64, Math.floor(available / rowsCount));
  }, [containerHeight, rowsCount]);

  

  // Memoizza la funzione per trovare entries
  const getEntryForDate = useCallback((date: Date | null): CalendarEntry | undefined => {
    if (!date) return undefined;
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

  // Header rimosso: i giorni della settimana sono mostrati dentro ogni cella

  // Renderizza una settimana
  const renderWeek = useCallback(({ item }: { item: WeekData }) => {
    return (
      <View style={[styles.weekRow, { height: cellHeight }]}>
        {item.dates.map((date, idx) => {
          if (!date) {
            return <View key={`empty-${item.weekIndex}-${idx}`} style={[styles.cellContainer, { height: cellHeight }]} />;
          }
          const entry = getEntryForDate(date);
          const dateStr = date.toISOString().split('T')[0];
          return (
            <View key={dateStr} style={[styles.cellContainer, { height: cellHeight }]}>
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
  }, [getEntryForDate, isSelected, isToday, onDayPress, onTooltipPress, cellHeight, selectedSalesPointId]);

  // Ottimizzazioni FlatList
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: cellHeight,
    offset: cellHeight * index,
    index,
  }), [cellHeight]);

  const keyExtractor = useCallback((item: WeekData) => `week-${item.weekIndex}`, []);

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <FlatList
        data={monthData.weeks}
        renderItem={renderWeek}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
        initialNumToRender={4}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 0 }} />}
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
    display: 'none',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    display: 'none',
  },
  dayHeaderIndicator: {
    display: 'none',
  },
  dayHeaderIndicatorText: {
    display: 'none',
  },
  weekRow: {
    flexDirection: 'row',
    height: undefined,
    minHeight: 64,
  },
  cellContainer: {
    flex: 1,
    width: CELL_WIDTH,
    height: undefined,
    minHeight: 64,
    backgroundColor: Colors.warmBackground,
  },
  otherMonthCell: {
    backgroundColor: '#F2F2F2',
  },
});