import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import CustomCalendarCell from './CustomCalendarCell';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface WeekCalendarProps {
  currentDate: Date;
  entries: CalendarEntry[];
  selectedDate: string;
  selectedSalesPointId?: string;
  onDayPress: (date: string) => void;
  onTooltipPress?: (type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => void;
}

export default function WeekCalendar({
  currentDate,
  entries,
  selectedDate,
  selectedSalesPointId,
  onDayPress,
  onTooltipPress,
}: WeekCalendarProps) {
  const [currentPage, setCurrentPage] = useState(0);

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
  // const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  // Per mobile: mostra solo 3 giorni alla volta
  const isMobile = Platform.OS !== 'web';
  const daysPerPage = isMobile ? 3 : 7;
  // const totalPages = isMobile ? Math.ceil(7 / daysPerPage) : 1;

  // Calcola le date da mostrare per la pagina corrente
  const visibleDates = useMemo(() => {
    // WEB/Desktop: mantieni la settimana intera (7 giorni)
    if (!isMobile) {
      return weekDates;
    }

    // MOBILE: finestra di 3 giorni
    // Regola speciale a inizio mese: se currentDate è il giorno 1, 2 o 3,
    // la finestra parte dall'ultimo giorno del mese precedente per mostrare
    // [ultimo_prev, 1, 2] oppure [1,2,3] coerentemente con il mese in header.
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const dom = start.getDate();
    if (dom <= 3) {
      const prevMonthLast = new Date(start.getFullYear(), start.getMonth(), 0);
      start.setFullYear(prevMonthLast.getFullYear());
      start.setMonth(prevMonthLast.getMonth());
      start.setDate(prevMonthLast.getDate());
    }

    const days: Date[] = [];
    for (let i = 0; i < daysPerPage; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekDates, isMobile, currentDate, daysPerPage]);

  // Allinea pagina visibile quando cambia currentDate (es. tap su "Oggi")
  useEffect(() => {
    if (!isMobile) return;
    const todayStr = currentDate.toDateString();
    const index = weekDates.findIndex(d => d.toDateString() === todayStr);
    if (index >= 0) {
      const pageIndex = Math.floor(index / daysPerPage);
      if (pageIndex !== currentPage) {
        setCurrentPage(pageIndex);
      }
    } else if (currentPage !== 0) {
      // fallback sicuro
      setCurrentPage(0);
    }
  }, [currentDate, weekDates, daysPerPage, isMobile]);

  // const visibleDayNames = useMemo(() => {
  //   if (!isMobile) {
  //     return dayNames;
  //   }
  //   const startIndex = currentPage * daysPerPage;
  //   return dayNames.slice(startIndex, startIndex + daysPerPage);
  // }, [dayNames, currentPage, isMobile]);

  // Chiave data locale (YYYY-MM-DD) per evitare shift timezone con ISO
  const toLocalDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getEntryForDate = (date: Date): CalendarEntry | undefined => {
    const dateKey = toLocalDateKey(date);
    
    const entry = entries.find(entry => {
      const ed = entry.date instanceof Date ? entry.date : new Date(entry.date);
      const entryKey = toLocalDateKey(ed);
      return entryKey === dateKey;
    });

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

  // const handleNextPage = () => {
  //   if (currentPage < totalPages - 1) {
  //     setCurrentPage(currentPage + 1);
  //   }
  // };

  // const handlePrevPage = () => {
  //   if (currentPage > 0) {
  //     setCurrentPage(currentPage - 1);
  //   }
  // };

  // const resetToCurrentWeek = () => {
  //   setCurrentPage(0);
  // };

  return (
    <View style={styles.container}>
      {/* Griglia settimanale orizzontale */}
      <View style={[styles.weekGrid, isMobile && styles.mobileWeekGrid]}>
        {visibleDates.map((date) => {
          const entry = getEntryForDate(date);
          const dateStr = toLocalDateKey(date);
          const disabled = date.getMonth() !== currentDate.getMonth();

          return (
            <CustomCalendarCell
              key={dateStr}
              date={dateStr || ''}
              entry={entry}
              isSelected={isSelected(date)}
              isToday={isToday(date)}
              selectedSalesPointId={selectedSalesPointId || 'default'}
              onPress={() => {
                if (!disabled) {
                  onDayPress(dateStr || '');
                }
              }}
              isWeekView={true}
              disabled={disabled}
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
  mobileWeekGrid: {
    flexDirection: 'row', // Stack cells horizontally on mobile
    gap: Spacing.small,
    paddingHorizontal: Spacing.small,
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navButton: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.warmPrimary,
    borderRadius: 5,
  },
  navButtonDisabled: {
    backgroundColor: Colors.warmBorder,
    opacity: 0.7,
  },
  navButtonText: {
    color: Colors.warmBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageIndicator: {
    backgroundColor: Colors.warmSurface,
    borderRadius: 5,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xs,
  },
  pageIndicatorText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  resetContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.small,
  },
  resetButton: {
    backgroundColor: Colors.warmPrimary,
    borderRadius: 5,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.small,
  },
  resetButtonText: {
    color: Colors.warmBackground,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
