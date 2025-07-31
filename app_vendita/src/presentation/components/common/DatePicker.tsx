import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal,
  ScrollView,
} from 'react-native';
import SafeTouchableOpacity from './SafeTouchableOpacity';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';

interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Seleziona una data',
  error,
  helperText,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  variant = 'outlined',
  size = 'medium',
}: DatePickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange?.(date);
    setIsModalVisible(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCurrentMonthDates = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    // Genera 6 settimane (42 giorni) per coprire tutto il mese
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return dates;
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container];

    if (variant === 'outlined') {
      baseStyle.push(styles.outlined);
      if (error) baseStyle.push(styles.error);
    } else if (variant === 'filled') {
      baseStyle.push(styles.filled);
      if (error) baseStyle.push(styles.error);
    }

    if (size === 'small') baseStyle.push(styles.small);
    if (size === 'large') baseStyle.push(styles.large);

    if (disabled) baseStyle.push(styles.disabled);

    return baseStyle;
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    if (size === 'small') baseStyle.push(styles.buttonSmall);
    if (size === 'large') baseStyle.push(styles.buttonLarge);

    return baseStyle;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isCurrentMonth = (
    date: Date,
    currentYear: number,
    currentMonth: number
  ): boolean => {
    return (
      date.getFullYear() === currentYear && date.getMonth() === currentMonth
    );
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <SafeTouchableOpacity
        style={getContainerStyle()}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
      >
        <View style={getButtonStyle()}>
          <Text
            style={[
              styles.buttonText,
              selectedDate
                ? styles.buttonTextSelected
                : styles.buttonTextPlaceholder,
            ]}
          >
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </View>
      </SafeTouchableOpacity>

      {(error || helperText) && (
        <View style={styles.helperContainer}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {helperText && !error && (
            <Text style={styles.helperText}>{helperText}</Text>
          )}
        </View>
      )}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Data</Text>
              <SafeTouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </SafeTouchableOpacity>
            </View>

            <DatePickerCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              minDate={minDate}
              maxDate={maxDate}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Componente interno per il calendario
function DatePickerCalendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}: {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const dates = getCurrentMonthDates(currentYear, currentMonth);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return (
      date.getFullYear() === currentYear && date.getMonth() === currentMonth
    );
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <SafeTouchableOpacity
          style={styles.navigationButton}
          onPress={goToPreviousMonth}
        >
          <Text style={styles.navigationButtonText}>‹</Text>
        </SafeTouchableOpacity>

        <Text style={styles.monthYearText}>
          {monthNames[currentMonth]} {currentYear}
        </Text>

        <SafeTouchableOpacity
          style={styles.navigationButton}
          onPress={goToNextMonth}
        >
          <Text style={styles.navigationButtonText}>›</Text>
        </SafeTouchableOpacity>
      </View>

      <View style={styles.daysHeader}>
        {dayNames.map((day, index) => (
          <Text key={index} style={styles.dayHeaderText}>
            {day}
          </Text>
        ))}
      </View>

      <ScrollView style={styles.datesContainer}>
        <View style={styles.datesGrid}>
          {dates.map((date, index) => {
            const disabled = isDateDisabled(date);
            const selected = isDateSelected(date);
            const today = isToday(date);
            const currentMonth = isCurrentMonth(date);

            return (
              <SafeTouchableOpacity
                key={index}
                style={[
                  styles.dateCell,
                  !currentMonth && styles.otherMonthCell,
                  selected && styles.selectedDateCell,
                  today && styles.todayCell,
                  disabled && styles.disabledDateCell,
                ]}
                onPress={() => !disabled && onDateSelect(date)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.dateText,
                    !currentMonth && styles.otherMonthText,
                    selected && styles.selectedDateText,
                    today && styles.todayText,
                    disabled && styles.disabledDateText,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </SafeTouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.medium,
  },
  labelContainer: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
  },
  required: {
    color: Colors.warmError,
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    backgroundColor: Colors.warmBackground,
    minHeight: 48,
  },
  outlined: {
    backgroundColor: Colors.warmBackground,
  },
  filled: {
    backgroundColor: Colors.warmSurface,
    borderColor: 'transparent',
  },
  error: {
    borderColor: Colors.warmError,
  },
  disabled: {
    opacity: 0.5,
  },
  small: {
    minHeight: 40,
  },
  large: {
    minHeight: 56,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    minHeight: 48,
  },
  buttonSmall: {
    minHeight: 40,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xs,
  },
  buttonLarge: {
    minHeight: 56,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
  },
  buttonText: {
    fontSize: 16,
    color: Colors.warmText,
  },
  buttonTextSelected: {
    color: Colors.warmText,
    fontWeight: '600',
  },
  buttonTextPlaceholder: {
    color: Colors.warmTextSecondary,
  },
  calendarIcon: {
    fontSize: 16,
  },
  helperContainer: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.small,
  },
  helperText: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.warmError,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.warmBackground,
    borderRadius: 12,
    padding: Spacing.medium,
    margin: Spacing.large,
    maxWidth: 350,
    maxHeight: 500,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
    paddingBottom: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warmBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.warmTextSecondary,
  },
  calendarContainer: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  navigationButton: {
    padding: Spacing.small,
    borderRadius: 20,
    backgroundColor: Colors.warmSurface,
  },
  navigationButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.warmPrimary,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warmText,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.small,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warmTextSecondary,
    paddingVertical: Spacing.xs,
  },
  datesContainer: {
    flex: 1,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 1,
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  selectedDateCell: {
    backgroundColor: Colors.warmPrimary,
  },
  todayCell: {
    backgroundColor: Colors.warmSecondary,
    borderWidth: 1,
    borderColor: Colors.warmPrimary,
  },
  disabledDateCell: {
    opacity: 0.3,
  },
  dateText: {
    fontSize: 14,
    color: Colors.warmText,
  },
  otherMonthText: {
    color: Colors.warmTextSecondary,
  },
  selectedDateText: {
    color: Colors.warmBackground,
    fontWeight: 'bold',
  },
  todayText: {
    color: Colors.warmPrimary,
    fontWeight: 'bold',
  },
  disabledDateText: {
    color: Colors.warmTextSecondary,
  },
});
