import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalendarEntry } from '../../data/models/CalendarEntry';

interface FocusReferencesDisplayProps {
  displayData: {
    useOriginalData: boolean;
    progressiveData?: {
      displayData: {
        progressiveEntries: any[];
      };
      sellInProgressivo: number;
    };
  };
  entry?: CalendarEntry | undefined;
  isWeekView: boolean;
  getFocusReferenceById: (id: string) => any;
  getNetPrice: (referenceId: string) => string;
}

export const FocusReferencesDisplay: React.FC<FocusReferencesDisplayProps> = React.memo(({
  displayData,
  entry,
  isWeekView,
  getFocusReferenceById,
  getNetPrice,
}) => {
  // Utility function per creare acronimi (estratta e ottimizzata)
  const createAcronym = (description: string, referenceCode: string): string => {
    // Rimuovi caratteri speciali e dividi in parole
    const words = description
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 0);
    
    if (words.length === 0) {
      // Fallback al codice se la descrizione è vuota
      return referenceCode.substring(0, 4).toUpperCase();
    }
    
    if (words.length === 1) {
      // Se c'è solo una parola, prendi i primi 4 caratteri
      return words[0]?.substring(0, 4).toUpperCase() || referenceCode.substring(0, 4).toUpperCase();
    }
    
    if (words.length === 2) {
      // Se ci sono 2 parole, prendi 2 caratteri da ogni parola
      const first = words[0]?.substring(0, 2) || '';
      const second = words[1]?.substring(0, 2) || '';
      const acronym = (first + second).toUpperCase();
      return acronym.length > 0 ? acronym : referenceCode.substring(0, 4).toUpperCase();
    }
    
    // Se ci sono 3+ parole, prendi le prime lettere di ogni parola
    const acronym = words
      .slice(0, 4) // Massimo 4 parole
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
    
    return acronym.length > 0 ? acronym : referenceCode.substring(0, 4).toUpperCase();
  };

  // Determina il colore del bordo in base alla situazione stock
  const getBorderColor = (soldPieces: number, stockPieces: number): string => {
    if (stockPieces <= 0) return '#FF3B30'; // Rosso - stock esaurito
    if (soldPieces >= stockPieces * 0.8) return '#FF9500'; // Giallo - stock basso (80%+ venduti)
    if (soldPieces >= stockPieces * 0.5) return '#FFCC00'; // Giallo chiaro - stock medio (50%+ venduti)
    return '#34C759'; // Verde - stock alto
  };

  // Se il sistema progressivo non è inizializzato, usa i dati originali
  if (displayData.useOriginalData) {
    if (!entry?.focusReferencesData || entry.focusReferencesData.length === 0) {
      return null;
    }

    // Controlla se tutte le referenze hanno valori uguali a 0
    const allReferencesHaveZeroValues = entry.focusReferencesData.every(focusData => {
      const soldPieces = parseFloat(focusData.soldPieces) || 0;
      const stockPieces = parseFloat(focusData.stockPieces) || 0;
      const orderedPieces = parseFloat(focusData.orderedPieces) || 0;
      return soldPieces === 0 && stockPieces === 0 && orderedPieces === 0;
    });

    // Se tutte le referenze hanno valori 0, non mostrare nulla
    if (allReferencesHaveZeroValues) {
      return null;
    }

    return (
      <View style={styles.focusReferencesContainer}>
        {entry.focusReferencesData.map((focusData) => {
          const reference = getFocusReferenceById(focusData.referenceId);
          if (!reference) return null;

          const soldPieces = parseFloat(focusData.soldPieces) || 0;
          const stockPieces = parseFloat(focusData.stockPieces) || 0;
          
          const acronym = createAcronym(reference.description || '', reference.code);

          return (
            <View key={focusData.referenceId} style={[
              styles.focusReferenceItem,
              isWeekView && styles.focusReferenceItemWeek,
              { borderColor: getBorderColor(soldPieces, stockPieces) }
            ]}>
              <View style={styles.focusReferenceHeader}>
                <Text style={[
                  styles.focusReferenceAcronym,
                  isWeekView && styles.focusReferenceAcronymWeek
                ]}>{acronym}</Text>
              </View>
              <View style={styles.focusReferenceNumbers}>
                <Text style={[
                  styles.focusReferenceSold, 
                  soldPieces > 0 && styles.focusReferenceSoldActive,
                  isWeekView && styles.focusReferenceTextWeek
                ]}>
                  V: {soldPieces}
                </Text>
                <Text style={[
                  styles.focusReferenceStock, 
                  stockPieces > 0 && styles.focusReferenceStockActive,
                  isWeekView && styles.focusReferenceTextWeek
                ]}>
                  S: {stockPieces}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // Altrimenti usa i dati progressivi
  if (!displayData.progressiveData?.displayData.progressiveEntries || 
      displayData.progressiveData.displayData.progressiveEntries.length === 0) {
    return null;
  }

  // Controlla se l'entry originale aveva dati focus
  // Se non aveva dati focus, non mostrare nulla anche se il sistema progressivo ha calcolato i dati
  const originalEntryHasFocusData = entry?.focusReferencesData && entry.focusReferencesData.length > 0;
  if (!originalEntryHasFocusData) {
    return null;
  }

  // Controlla se l'entry ha effettivamente dati focus con valori > 0
  const hasActualFocusData = entry?.focusReferencesData?.some(focusData => {
    const soldPieces = parseFloat(focusData.soldPieces) || 0;
    const stockPieces = parseFloat(focusData.stockPieces) || 0;
    const orderedPieces = parseFloat(focusData.orderedPieces) || 0;
    return soldPieces > 0 || stockPieces > 0 || orderedPieces > 0;
  }) || false;

  // Se l'entry non ha dati focus con valori > 0, non mostrare nulla
  if (!hasActualFocusData) {
    return null;
  }

  return (
    <View style={styles.focusReferencesContainer}>
      {displayData.progressiveData.displayData.progressiveEntries.map((productEntry: any) => {
        const reference = getFocusReferenceById(productEntry.productId);
        if (!reference) return null;

        const soldPieces = productEntry.vendite;
        const stockPieces = productEntry.scorte;
        
        const acronym = createAcronym(reference.description || '', reference.code);

        return (
          <View key={productEntry.productId} style={[
            styles.focusReferenceItem,
            { borderColor: getBorderColor(soldPieces, stockPieces) }
          ]}>
            <View style={styles.focusReferenceHeader}>
              <Text style={styles.focusReferenceAcronym}>{acronym}</Text>
            </View>
            <View style={styles.focusReferenceNumbers}>
              <Text style={[styles.focusReferenceSold, soldPieces > 0 && styles.focusReferenceSoldActive]}>
                V: {soldPieces}
              </Text>
              <Text style={[styles.focusReferenceStock, stockPieces > 0 && styles.focusReferenceStockActive]}>
                S: {stockPieces}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  // Stili per le referenze focus (layout a 2 colonne)
  focusReferencesContainer: {
    marginTop: 4,
    paddingHorizontal: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  focusReferenceItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 4,
    padding: 3,
    marginBottom: 2,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    width: '48%', // Metà larghezza per 2 colonne
    minHeight: 40,
  },
  focusReferenceItemWeek: {
    padding: 2,
    marginBottom: 1,
    minHeight: 30,
  },
  focusReferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  focusReferenceAcronym: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  focusReferenceAcronymWeek: {
    fontSize: 8,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  focusReferenceNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  focusReferenceSold: {
    fontSize: 7,
    color: '#28A745',
    fontWeight: '600',
  },
  focusReferenceStock: {
    fontSize: 7,
    color: '#FF6B35',
    fontWeight: '600',
  },
  focusReferenceSoldActive: {
    color: '#1E7E34',
    fontWeight: 'bold',
  },
  focusReferenceStockActive: {
    color: '#E65100',
    fontWeight: 'bold',
  },
  focusReferenceTextWeek: {
    fontSize: 6,
  },
});

FocusReferencesDisplay.displayName = 'FocusReferencesDisplay';