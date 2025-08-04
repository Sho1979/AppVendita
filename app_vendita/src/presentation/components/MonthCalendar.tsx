import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import CustomCalendarCell from './CustomCalendarCell';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';


interface MonthCalendarProps {
  currentDate: Date;
  entries: CalendarEntry[];
  selectedDate: string;
  onDayPress: (date: string) => void;
  onTooltipPress?: ((type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => void) | undefined;
  onSellInChange?: ((date: string, sellIn: number) => void) | undefined;
}

export default function MonthCalendar({
  currentDate,
  entries,
  selectedDate,
  onDayPress,
  onTooltipPress,
  onSellInChange,
}: MonthCalendarProps) {
  // Log rimosso per performance - non necessario in produzione

  // Genera le date del mese corrente con logica dinamica
  const getMonthDates = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Trova il primo giorno della settimana (domenica = 0)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    // Calcola il numero di settimane necessarie
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 = domenica, 1 = lunedì, etc.
    const totalCells = firstDayOfWeek + daysInMonth;
    const weeksNeeded = Math.ceil(totalCells / 7);

    // Usa il numero esatto di settimane necessarie, con un minimo di 4
    const finalWeeks = Math.max(4, weeksNeeded);

    // Log rimosso per performance - non necessario in produzione

    // Genera le settimane necessarie
    for (let week = 0; week < finalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return dates;
  };

  const monthDates = getMonthDates(currentDate);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  // Log rimosso per performance - non necessario in produzione

  const getEntryForDate = (date: Date): CalendarEntry | undefined => {
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
      const entry = entriesForDate[0];
      // Log rimosso per performance - non necessario in produzione
      return entry;
    }

    // Se ci sono multiple entries, combina i dati
    const latestEntry = entriesForDate.reduce((latest, current) => {
      // Estrai il timestamp dall'ID (formato: timestamp + random string)
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

    // Combina i dati: focus references dal più recente, tag da quello con più tag
    const combinedEntry = {
      ...latestEntry,
      tags: entryWithMostTags.tags || latestEntry.tags || []
    };

    // Rimuoviamo questo log che causa re-render continui
    // console.log('📅 MonthCalendar: Multiple entries per', dateStr, '(', entriesForDate.length, 'entries), combinati:', {
    //   latestEntryId: latestEntry.id,
    //   latestEntryFocusData: latestEntry.focusReferencesData?.length || 0,
    //   entryWithMostTagsId: entryWithMostTags.id,
    //   entryWithMostTagsTags: entryWithMostTags.tags?.length || 0,
    //   combinedEntryTags: combinedEntry.tags?.length || 0,
    //   allEntries: entriesForDate.map(e => ({ 
    //     id: e.id, 
    //     focusReferencesData: e.focusReferencesData?.length || 0,
    //     tags: e.tags?.length || 0
    //   }))
    // });

    return combinedEntry;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isCurrentMonth = (date: Date): boolean => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isPreviousMonth = (date: Date): boolean => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return (
      date.getMonth() === prevMonth.getMonth() &&
      date.getFullYear() === prevMonth.getFullYear()
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isNextMonth = (date: Date): boolean => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return (
      date.getMonth() === nextMonth.getMonth() &&
      date.getFullYear() === nextMonth.getFullYear()
    );
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === selectedDate;
  };

  return (
    <View style={styles.container}>
      {/* Header giorni della settimana con indicatori di riassunto */}
      <View style={styles.weekHeader}>
        {dayNames.map((dayName, index) => {
          // Calcola indicatori per questa colonna
          const weekEntries = monthDates
            .filter((_, dayIndex) => dayIndex % 7 === index)
            .map(date => getEntryForDate(date))
            .filter(entry => !!entry);
          
          const hasData = weekEntries.length > 0;
          
          return (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{dayName}</Text>
              {hasData && (
                <View style={styles.dayHeaderIndicator}>
                  <Text style={styles.dayHeaderIndicatorText}>{weekEntries.length}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Griglia del mese */}
      <View style={styles.monthGrid}>
        {Array.from(
          { length: Math.ceil(monthDates.length / 7) },
          (_, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {monthDates
                .slice(weekIndex * 7, (weekIndex + 1) * 7)
                .map((date) => {
                  const entry = getEntryForDate(date);
                  const dateStr = date.toISOString().split('T')[0];

                  return (
                    <CustomCalendarCell
                      key={dateStr}
                      date={dateStr || ''}
                      entry={entry}
                      isSelected={isSelected(date)}
                      isToday={isToday(date)}
                      onPress={() => {
                        console.log(
                          '📅 MonthCalendar: Cliccato giorno:',
                          dateStr
                        );
                        onDayPress(dateStr || '');
                      }}
                      isWeekView={false}
                      onTooltipPress={onTooltipPress}
                      onSellInChange={onSellInChange}
                    />
                  );
                })}
            </View>
          )
        )}
      </View>
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
  monthGrid: {
    flex: 1,
    flexDirection: 'column',
    padding: 0.1,
  },
  weekRow: {
    flexDirection: 'row',
    flex: 1,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.warmBackground,
    borderRadius: 1,
    padding: 0.25,
    margin: 0.1,
    borderWidth: 0.5,
    borderColor: Colors.warmBorder,
    justifyContent: 'space-between',
    minHeight: 12,
    maxWidth: '14.28%', // 100% / 7 giorni = 14.28%
  },
  otherMonthCell: {
    backgroundColor: Colors.warmSurface,
    opacity: 0.6,
  },
  previousMonthCell: {
    backgroundColor: Colors.warmSurface,
    opacity: 0.4,
  },
  nextMonthCell: {
    backgroundColor: Colors.warmSurface,
    opacity: 0.4,
  },
  todayCell: {
    borderColor: Colors.warmPrimary,
    backgroundColor: Colors.warmSecondary,
  },
  selectedCell: {
    borderColor: Colors.warmPrimary,
    backgroundColor: Colors.warmPrimary,
  },
  problemCell: {
    borderColor: Colors.warmError,
    backgroundColor: Colors.warmError + '20',
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.warmText,
    textAlign: 'center',
  },
  otherMonthText: {
    color: Colors.warmTextSecondary,
  },
  todayText: {
    color: Colors.warmPrimary,
    fontWeight: 'bold',
  },
  selectedText: {
    color: Colors.warmBackground,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 1,
    marginTop: 1,
  },
  salesIndicator: {
    backgroundColor: Colors.warmSuccess,
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  salesText: {
    fontSize: 6,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
  actionsIndicator: {
    backgroundColor: Colors.warmAccent,
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  actionsText: {
    fontSize: 6,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
  problemIndicator: {
    backgroundColor: Colors.warmError,
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  problemText: {
    fontSize: 6,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 5,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 1,
  },
  dayHeaderIndicator: {
    backgroundColor: Colors.warmAccent,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 2,
  },
  dayHeaderIndicatorText: {
    fontSize: 8,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
});
