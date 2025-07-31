import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import CustomCalendarCell from './CustomCalendarCell';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface WeekCalendarProps {
  currentDate: Date;
  entries: CalendarEntry[];
  selectedDate: string;
  onDayPress: (date: string) => void;
  onTooltipPress?: (type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => void;
}

export default function WeekCalendar({
  currentDate,
  entries,
  selectedDate,
  onDayPress,
  onTooltipPress,
}: WeekCalendarProps) {
  console.log('📅 WeekCalendar: Componente inizializzato con:', {
    currentDate: currentDate.toISOString(),
    entriesCount: entries.length,
    selectedDate,
  });

  // Genera le date della settimana corrente
  const getWeekDates = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lunedì = 1
    startOfWeek.setDate(diff);

    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentDate);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  console.log(
    '📅 WeekCalendar: Date settimana generate:',
    weekDates.map(d => d.toISOString().split('T')[0])
  );

  const getEntryForDate = (date: Date): CalendarEntry | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = entries.find(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      return entryDate === dateStr;
    });

    if (entry) {
      console.log('📅 WeekCalendar: Entry trovata per', dateStr, ':', {
        sales: entry.sales.length,
        actions: entry.actions.length,
        hasProblem: entry.hasProblem,
        notes: entry.notes?.substring(0, 20) + '...',
      });
    }

    return entry;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === selectedDate;
  };

  // Log rimosso per performance - non necessario in produzione

  return (
    <View style={styles.container}>
      {/* Header giorni della settimana con indicatori */}
      <View style={styles.weekHeader}>
        {dayNames.map((dayName, index) => {
          const date = weekDates[index];
          const entry = date ? getEntryForDate(date) : undefined;
          const hasData = !!entry;
          
          return (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{dayName}</Text>
              {hasData && (
                <View style={styles.dayHeaderIndicator}>
                  <Text style={styles.dayHeaderIndicatorText}>●</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Griglia settimanale orizzontale */}
      <View style={styles.weekGrid}>
        {weekDates.map((date) => {
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
                onDayPress(dateStr || '');
              }}
              isWeekView={true}
              onTooltipPress={onTooltipPress || undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.small,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  weekGrid: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.small,
    gap: Spacing.xs,
  },
  dayCell: {
    flex: 1,
    backgroundColor: Colors.warmBackground,
    borderRadius: 8,
    padding: Spacing.small,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    elevation: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
    }),
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
  dayCellHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  todayText: {
    color: Colors.warmPrimary,
  },
  selectedText: {
    color: Colors.warmBackground,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  salesContainer: {
    backgroundColor: Colors.warmSuccess,
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  salesLabel: {
    fontSize: 10,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
  actionsContainer: {
    backgroundColor: Colors.warmAccent,
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  actionsLabel: {
    fontSize: 10,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
  notesContainer: {
    backgroundColor: Colors.warmSurface,
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
    maxWidth: '100%',
  },
  notesText: {
    fontSize: 8,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  problemIndicator: {
    backgroundColor: Colors.warmError,
    borderRadius: 4,
    padding: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  problemText: {
    fontSize: 10,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayHeaderIndicator: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.warmPrimary,
    borderRadius: 5,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  dayHeaderIndicatorText: {
    fontSize: 10,
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
});
