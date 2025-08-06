import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalendarEntry } from '../../data/models/CalendarEntry';

interface SalesAndActionsDisplayProps {
  entry: CalendarEntry | undefined;
  isWeekView: boolean;
}

/**
 * Componente che gestisce la visualizzazione di vendite e azioni
 * - Week view: Visualizzazione dettagliata con numeri e conteggi
 * - Month view: Visualizzazione compatta con indicatori
 */
export const SalesAndActionsDisplay: React.FC<SalesAndActionsDisplayProps> = React.memo(({ 
  entry, 
  isWeekView 
}) => {
  // Calcola totali
  const totalSales = entry?.sales?.reduce((sum, sale) => sum + sale.value, 0) || 0;
  const totalActions = entry?.actions?.reduce((sum, action) => sum + action.count, 0) || 0;

  // Se non ci sono dati, non renderizzare nulla
  if (totalSales === 0 && totalActions === 0) {
    return null;
  }

  // Vista settimanale - dettagliata
  if (isWeekView) {
    return (
      <View style={styles.numbersSection}>
        {totalSales > 0 && (
          <View style={styles.salesSection}>
            <View style={styles.salesTag}>
              <Text style={styles.salesTagText}>€{totalSales}</Text>
            </View>
            <Text style={styles.salesCount}>{entry?.sales.length || 0} vendite</Text>
          </View>
        )}

        {totalActions > 0 && (
          <View style={styles.actionsSection}>
            <View style={styles.actionsTag}>
              <Text style={styles.actionsTagText}>{totalActions}</Text>
            </View>
            <Text style={styles.actionsCount}>{entry?.actions.length || 0} tipi</Text>
          </View>
        )}
      </View>
    );
  }

  // Vista mensile - compatta
  return (
    <View style={styles.monthIndicator}>
      {totalSales > 0 && (
        <View style={styles.monthSalesDot}>
          <Text style={styles.monthSalesText}>€</Text>
        </View>
      )}
      {totalActions > 0 && (
        <View style={styles.monthActionsDot}>
          <Text style={styles.monthActionsText}>⚡</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  // Week view styles
  numbersSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  salesSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  salesTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 2,
  },
  salesTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  salesCount: {
    fontSize: 10,
    color: '#666',
  },
  actionsSection: {
    alignItems: 'center',
  },
  actionsTag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 2,
  },
  actionsTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsCount: {
    fontSize: 10,
    color: '#666',
  },

  // Month view styles
  monthIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  monthSalesDot: {
    width: 16,
    height: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthSalesText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  monthActionsDot: {
    width: 16,
    height: 16,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthActionsText: {
    color: 'white',
    fontSize: 10,
  },
});

SalesAndActionsDisplay.displayName = 'SalesAndActionsDisplay';