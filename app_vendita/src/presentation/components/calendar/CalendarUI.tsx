/**
 * Componenti UI del calendario
 * 
 * Contiene i componenti di interfaccia utente riutilizzabili
 * per il calendario (header, navigation, loading screens, ecc.)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';

/**
 * Header del calendario con titolo e navigazione
 */
export interface CalendarHeaderProps {
  currentDate: Date;
  calendarView: 'week' | 'month';
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onToggleView?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  calendarView,
  onNavigatePrev,
  onNavigateNext,
  onToggleView
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Navigazione */}
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navButton} onPress={onNavigatePrev}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        
        <View style={styles.navTitle}>
          <Text style={styles.navTitleText}>
            {currentDate.toLocaleDateString('it-IT', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.navSubtitle}>
            {calendarView === 'week'
              ? `Settimana ${currentDate.getDate()}-${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}`
              : `${currentDate.getFullYear()}`
            }
          </Text>
        </View>
        
        <TouchableOpacity style={styles.navButton} onPress={onNavigateNext}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle view button se fornito */}
      {onToggleView && (
        <TouchableOpacity style={styles.viewToggle} onPress={onToggleView}>
          <Text style={styles.viewToggleText}>
            {calendarView === 'week' ? '📅' : '📊'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Schermata di caricamento per il calendario
 */
export interface CalendarLoadingProps {
  message?: string;
}

export const CalendarLoading: React.FC<CalendarLoadingProps> = ({ 
  message = 'Caricamento dati...' 
}) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

/**
 * Filtri attivi display
 */
export interface ActiveFiltersProps {
  selectedFilterItems: string[];
  onClearFilters?: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  selectedFilterItems,
  onClearFilters
}) => {
  if (!selectedFilterItems || selectedFilterItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.activeFiltersContainer}>
      <Text style={styles.activeFiltersTitle}>Filtri attivi:</Text>
      <View style={styles.activeFiltersRow}>
        {selectedFilterItems.map((item, index) => (
          <View key={index} style={styles.activeFilterTag}>
            <Text style={styles.activeFilterText}>{item}</Text>
          </View>
        ))}
        {onClearFilters && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={onClearFilters}>
            <Text style={styles.clearFiltersText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Pulsante dei filtri
 */
export interface FilterButtonProps {
  onPress: () => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.filterButton}
      onPress={onPress}
      accessibilityLabel="Filtri"
      accessibilityHint="Apri i filtri per personalizzare la vista"
    >
      <Text style={styles.filterButtonText}>🔍</Text>
    </TouchableOpacity>
  );
};

/**
 * Container principale del calendario
 */
export interface CalendarContainerProps {
  children: React.ReactNode;
  style?: any;
}

export const CalendarContainer: React.FC<CalendarContainerProps> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  headerContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  navButton: {
    padding: Spacing.medium,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  
  navButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  navTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.medium,
  },
  
  navTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  
  navSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  viewToggle: {
    position: 'absolute',
    top: Spacing.small,
    right: Spacing.medium,
    padding: Spacing.small,
    backgroundColor: Colors.surface,
    borderRadius: 6,
  },
  
  viewToggleText: {
    fontSize: 16,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  activeFiltersContainer: {
    backgroundColor: Colors.info + '20',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  activeFiltersTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  
  activeFilterTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.small,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: Spacing.small,
    marginBottom: Spacing.small,
  },
  
  activeFilterText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  clearFiltersButton: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: Spacing.small,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: Spacing.small,
  },
  
  clearFiltersText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: 'bold',
  },
  
  filterButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  filterButtonText: {
    fontSize: 16,
    color: Colors.white,
  },
});
