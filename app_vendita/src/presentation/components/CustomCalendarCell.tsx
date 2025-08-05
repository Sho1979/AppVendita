import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { CellTags } from './common/CellTags';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';
import { useCalendar } from '../../presentation/providers/CalendarContext';



interface CustomCalendarCellProps {
  date: string;
  entry?: CalendarEntry | undefined;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  isWeekView: boolean;
  onTooltipPress?: ((type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => void) | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSellInChange?: ((date: string, sellIn: number) => void) | undefined;
}

function CustomCalendarCell({
  date,
  entry,
  isSelected,
  isToday,
  onPress,
  isWeekView,
  onTooltipPress,
  onSellInChange,
}: CustomCalendarCellProps) {
  
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const focusReferencesStore = useFocusReferencesStore();
  
  const getFocusReferenceById = (id: string) => {
    return focusReferencesStore.getAllReferences().find(ref => ref.id === id);
  };
  
  const getNetPrice = (referenceId: string): string => {
    const netPrices = focusReferencesStore.getNetPrices();
    const netPrice = netPrices[referenceId];
    return netPrice || '0';
  };
  const { progressiveSystem, selectedSalesPointId } = useCalendar();
  
  const isInitialized = progressiveSystem.isInitialized;
  const { getDisplayDataForDate, loadFocusReferencesData } = progressiveSystem;
  
  // Carica i dati focusReferencesData nel sistema progressivo quando l'entry ha questi dati
  useEffect(() => {
    if (entry?.focusReferencesData && entry.focusReferencesData.length > 0) {
      loadFocusReferencesData(date, entry.focusReferencesData);
    }
  }, [entry?.focusReferencesData, date, loadFocusReferencesData]);
  
  const dayNumber = new Date(date).getDate();
  const hasProblem = entry?.hasProblem || false;
  const totalSales = entry?.sales.reduce((sum, sale) => sum + sale.value, 0) || 0;
  const totalActions = entry?.actions.reduce((sum, action) => sum + action.count, 0) || 0;
  

  
  // Stabilizza la chiamata a getDisplayDataForDate per evitare re-render continui
  const displayData = useMemo(() => {
    return getDisplayDataForDate(date, entry, isInitialized);
  }, [date, entry, isInitialized, getDisplayDataForDate, selectedSalesPointId]);
  
  // Calcola il sell-in totale dalle referenze focus
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalSellIn = useMemo(() => {
    // Se il sistema progressivo non è inizializzato, usa i dati originali
    if (displayData.useOriginalData) {
      if (!entry?.focusReferencesData || entry.focusReferencesData.length === 0) {
        return 0;
      }
      
      return entry.focusReferencesData.reduce((total, focusData) => {
        const reference = getFocusReferenceById(focusData.referenceId);
        if (!reference) {
          return total;
        }

        const orderedPieces = parseFloat(focusData.orderedPieces) || 0;
        
        // Usa il prezzo netto salvato invece del prezzo originale
        const savedNetPrice = getNetPrice(focusData.referenceId);
        
        // Correggi il parsing del netPrice per gestire formato "02,40" → 2.40
        let netPrice = 0;
        if (savedNetPrice) {
          const priceStr = savedNetPrice.toString();
          // Rimuovi zero iniziale e sostituisci virgola con punto
          const cleanPrice = priceStr.replace(/^0+/, '').replace(',', '.');
          netPrice = parseFloat(cleanPrice) || 0;
        }
        
        const sellIn = orderedPieces * netPrice;
        return total + sellIn;
      }, 0);
    }

    // Altrimenti usa il sell-in progressivo
    return displayData.progressiveData?.sellInProgressivo || 0;
  }, [displayData, entry?.focusReferencesData, getFocusReferenceById, getNetPrice]);

  // Rimuovo il useEffect problematico che causa loop infinito
  // useEffect(() => {
  //   if (onSellInChange) {
  //     onSellInChange(date, totalSellIn);
  //   }
  // }, [date, totalSellIn, onSellInChange]);

  // Funzioni per determinare se i tooltip hanno contenuto
  const hasStockContent = () => {
    if (displayData.useOriginalData) {
      return entry?.focusReferencesData && entry.focusReferencesData.length > 0;
    }
    
    return displayData.progressiveData?.displayData.progressiveEntries && 
           displayData.progressiveData.displayData.progressiveEntries.length > 0;
  };

  const hasInfoContent = () => {
    // Il tooltip info ha contenuto solo se ci sono filtri attivi
    // Per ora restituiamo false perché non ci sono filtri selezionati
    return false;
  };

  // Componente per visualizzare le referenze focus
  const FocusReferencesDisplay = () => {
    // Se il sistema progressivo non è inizializzato, usa i dati originali
    if (displayData.useOriginalData) {
      if (!entry?.focusReferencesData || entry.focusReferencesData.length === 0) {
        return null;
      }

      // Controlla se tutte le referenze hanno valori uguali a 0
      const allReferencesHaveZeroValues = entry.focusReferencesData.every(focusData => {
        const soldPieces = parseFloat(focusData.soldPieces) || 0;
        const stockPieces = parseFloat(focusData.stockPieces) || 0;
        return soldPieces === 0 && stockPieces === 0;
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
            
            // Determina il colore del bordo in base alla situazione stock
            const getBorderColor = () => {
              if (stockPieces <= 0) return '#FF3B30'; // Rosso - stock esaurito
              if (soldPieces >= stockPieces * 0.8) return '#FF9500'; // Giallo - stock basso (80%+ venduti)
              if (soldPieces >= stockPieces * 0.5) return '#FFCC00'; // Giallo chiaro - stock medio (50%+ venduti)
              return '#34C759'; // Verde - stock alto
            };

            // Crea acronimo dalla descrizione (4 caratteri per maggiore chiarezza)
            const createAcronym = (description: string): string => {
              // Rimuovi caratteri speciali e dividi in parole
              const words = description
                .replace(/[^\w\s]/g, ' ')
                .split(' ')
                .filter(word => word.length > 0);
              
              if (words.length === 0) {
                // Fallback al codice se la descrizione è vuota
                return reference.code.substring(0, 4).toUpperCase();
              }
              
              if (words.length === 1) {
                // Se c'è solo una parola, prendi i primi 4 caratteri
                return words[0]?.substring(0, 4).toUpperCase() || reference.code.substring(0, 4).toUpperCase();
              }
              
              if (words.length === 2) {
                // Se ci sono 2 parole, prendi 2 caratteri da ogni parola
                const first = words[0]?.substring(0, 2) || '';
                const second = words[1]?.substring(0, 2) || '';
                const acronym = (first + second).toUpperCase();
                return acronym.length > 0 ? acronym : reference.code.substring(0, 4).toUpperCase();
              }
              
              // Se ci sono 3+ parole, prendi le prime lettere di ogni parola
              const acronym = words
                .slice(0, 4) // Massimo 4 parole
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();
              
              return acronym.length > 0 ? acronym : reference.code.substring(0, 4).toUpperCase();
            };
            
            const acronym = createAcronym(reference.description || '');

            return (
              <View key={focusData.referenceId} style={[
                styles.focusReferenceItem,
                isWeekView && styles.focusReferenceItemWeek,
                { borderColor: getBorderColor() }
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

    // Controlla se tutte le referenze progressive hanno valori uguali a 0
    const allProgressiveReferencesHaveZeroValues = displayData.progressiveData.displayData.progressiveEntries.every((productEntry: any) => {
      const soldPieces = productEntry.vendite || 0;
      const stockPieces = productEntry.scorte || 0;
      return soldPieces === 0 && stockPieces === 0;
    });

    // Se tutte le referenze progressive hanno valori 0, non mostrare nulla
    if (allProgressiveReferencesHaveZeroValues) {
      return null;
    }

    return (
      <View style={styles.focusReferencesContainer}>
        {displayData.progressiveData.displayData.progressiveEntries.map((productEntry: any) => {
          const reference = getFocusReferenceById(productEntry.productId);
          if (!reference) return null;

          const soldPieces = productEntry.vendite;
          const stockPieces = productEntry.scorte;
          
          // Determina il colore del bordo in base alla situazione stock
          const getBorderColor = () => {
            if (stockPieces <= 0) return '#FF3B30'; // Rosso - stock esaurito
            if (soldPieces >= stockPieces * 0.8) return '#FF9500'; // Giallo - stock basso (80%+ venduti)
            if (soldPieces >= stockPieces * 0.5) return '#FFCC00'; // Giallo chiaro - stock medio (50%+ venduti)
            return '#34C759'; // Verde - stock alto
          };

          // Crea acronimo dalla descrizione (4 caratteri per maggiore chiarezza)
          const createAcronym = (description: string): string => {
            // Rimuovi caratteri speciali e dividi in parole
            const words = description
              .replace(/[^\w\s]/g, ' ')
              .split(' ')
              .filter(word => word.length > 0);
            
            if (words.length === 0) {
              // Fallback al codice se la descrizione è vuota
              return reference.code.substring(0, 4).toUpperCase();
            }
            
            if (words.length === 1) {
              // Se c'è solo una parola, prendi i primi 4 caratteri
              return words[0]?.substring(0, 4).toUpperCase() || reference.code.substring(0, 4).toUpperCase();
            }
            
            if (words.length === 2) {
              // Se ci sono 2 parole, prendi 2 caratteri da ogni parola
              const first = words[0]?.substring(0, 2) || '';
              const second = words[1]?.substring(0, 2) || '';
              const acronym = (first + second).toUpperCase();
              return acronym.length > 0 ? acronym : reference.code.substring(0, 4).toUpperCase();
            }
            
            // Se ci sono 3+ parole, prendi le prime lettere di ogni parola
            const acronym = words
              .slice(0, 4) // Massimo 4 parole
              .map(word => word.charAt(0))
              .join('')
              .toUpperCase();
            
            return acronym.length > 0 ? acronym : reference.code.substring(0, 4).toUpperCase();
          };
          
          const acronym = createAcronym(reference.description || '');

          return (
            <View key={productEntry.productId} style={[
              styles.focusReferenceItem,
              { borderColor: getBorderColor() }
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
  };

  // Tooltip content per settimana (guida principale)
  const getWeekTooltip = () => {
    if (!entry) return 'Clicca per aggiungere dati per questo giorno';
    
    const salesInfo = entry.sales.length > 0 
      ? `💰 Vendite: ${entry.sales.length} articoli (€${totalSales})` 
      : '💰 Nessuna vendita';
    
    const actionsInfo = entry.actions.length > 0 
      ? `⚡ Azioni: ${entry.actions.length} tipi (${totalActions} totali)` 
      : '⚡ Nessuna azione';
    
    const problemInfo = hasProblem ? '\n⚠️ Problemi segnalati' : '';
    const notesInfo = entry.notes ? `\n📝 Note: ${entry.notes.substring(0, 50)}...` : '';
    
    return `${salesInfo}\n${actionsInfo}${problemInfo}${notesInfo}`;
  };

  // Contenuto compatto per mese (riassunto)
  const getMonthTooltip = () => {
    if (!entry) return 'Nessun dato per questo giorno';
    
    const salesInfo = totalSales > 0 ? `💰 €${totalSales}` : '';
    const actionsInfo = totalActions > 0 ? `⚡ ${totalActions}` : '';
    const problemInfo = hasProblem ? '⚠️' : '';
    
    return `${salesInfo} ${actionsInfo} ${problemInfo}`.trim();
  };

  // Gestione tooltip per settimana
  const handleTooltipPress = (type: 'stock' | 'notes' | 'info' | 'images') => {
    if (onTooltipPress) {
      onTooltipPress(type, date, entry);
    }
  };

  const handleCellPress = () => {
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        isToday && styles.today,
        hasProblem && styles.problem,
        isWeekView ? styles.weekCell : styles.monthCell,
      ]}
      onPress={handleCellPress}
      activeOpacity={0.7}
      accessibilityLabel={isWeekView ? getWeekTooltip() : getMonthTooltip()}
    >
      {/* Vista Settimanale - Struttura a 4 parti */}
      {isWeekView ? (
        <View style={styles.weekStructure}>
          {/* PARTE 1: Numero del giorno + Pulsante + */}
          <View style={styles.dayNumberSection}>
            <Text
              style={[
                styles.dayNumber,
                isSelected && styles.selectedText,
                isToday && styles.todayText,
              ]}
            >
              {dayNumber}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                onPress();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* PARTE 2: Tag su 2 righe */}
          {/* Mostra i tag se ci sono tag espliciti O se la cella ha altri contenuti */}
          {(() => {
            const hasTags = entry?.tags && entry.tags.length > 0;
            const hasFocusData = entry?.focusReferencesData && entry.focusReferencesData.length > 0;
            const hasSales = entry?.sales && entry.sales.length > 0;
            const hasActions = entry?.actions && entry.actions.length > 0;
            const hasContent = hasTags || hasFocusData || hasSales || hasActions;
            
            
            
            // Se non ci sono tag espliciti ma c'è contenuto, genera tag di default
            let tagIds = entry?.tags || [];
            
            // Se l'entry ha tag espliciti (anche vuoti), rispetta la scelta dell'utente
            // Non aggiungere tag automatici se l'utente ha rimosso tutti i tag
            if (entry && 'tags' in entry) {
              // Se l'entry ha un campo tags definito (anche vuoto), rispetta la scelta dell'utente
              tagIds = entry.tags || [];
            } else if (!hasTags && hasContent) {
              // Genera tag di default basati sul contenuto solo se il campo tags è completamente mancante
              const defaultTags = [];
              if (hasFocusData) defaultTags.push('merchandiser'); // M per focus references
              if (hasSales) defaultTags.push('sell_in'); // SI per vendite
              if (hasActions) defaultTags.push('check'); // ✓ per azioni
              tagIds = defaultTags;
            }
            

            
            // Forza la visualizzazione se c'è contenuto, indipendentemente dai tag
            const shouldShowTags = hasContent && tagIds.length > 0;
            

            
            return shouldShowTags ? (
              <View style={styles.tagsSection}>
                <CellTags 
                  tagIds={tagIds} 
                  size="tiny" 
                  maxVisible={tagIds.length}
                />
              </View>
            ) : null;
          })()}

          {/* PARTE 3: Sezione numeri (vendite e azioni) */}
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

            {/* Referenze Focus */}
            <FocusReferencesDisplay />

            {/* Indicatore quando non ci sono dati */}
            {totalSales === 0 && totalActions === 0 && !entry?.focusReferencesData?.length && entry && (
              <View style={styles.noDataSection}>
                <Text style={styles.noDataText}>Nessun dato</Text>
              </View>
            )}
          </View>

          {/* PARTE 4: Tooltip in basso */}
          <View style={styles.tooltipSection}>
            <View style={styles.tooltipContainer}>
              <SafeTouchableOpacity
                style={[
                  styles.tooltipButton,
                  styles.tooltipStock,
                  hoveredTooltip === 'stock' && styles.tooltipButtonHovered,
                ]}
                onPress={() => handleTooltipPress('stock')}
                onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('stock')}
                onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
                activeOpacity={0.8}
                accessibilityLabel="Gestione Stock"
                accessibilityHint="Apri la gestione dello stock per questo giorno"
              >
                <View style={styles.tooltipButtonContent}>
                  <Text style={styles.tooltipText}>📦</Text>
                  {hasStockContent() && (
                    <View style={styles.contentIndicatorBadge}>
                      <Text style={styles.contentIndicatorText}>•</Text>
                    </View>
                  )}
                </View>
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity
                style={[
                  styles.tooltipButton,
                  styles.tooltipNotes,
                  hoveredTooltip === 'notes' && styles.tooltipButtonHovered,
                ]}
                onPress={() => handleTooltipPress('notes')}
                onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('notes')}
                onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
                activeOpacity={0.8}
                accessibilityLabel="Note"
                accessibilityHint="Aggiungi o visualizza note per questo giorno"
              >
                <View style={styles.tooltipButtonContent}>
                  <Text style={styles.tooltipText}>📝</Text>
                  {entry?.chatNotes && entry.chatNotes.length > 0 && (
                    <View style={styles.messageCountBadge}>
                      <Text style={styles.messageCountText}>
                        {entry.chatNotes.length > 99 ? '99+' : entry.chatNotes.length}
                      </Text>
                    </View>
                  )}
                </View>
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity
                style={[
                  styles.tooltipButton,
                  styles.tooltipInfo,
                  hoveredTooltip === 'info' && styles.tooltipButtonHovered,
                ]}
                onPress={() => handleTooltipPress('info')}
                onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('info')}
                onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
                activeOpacity={0.8}
                accessibilityLabel="Informazioni"
                accessibilityHint="Visualizza informazioni dettagliate per questo giorno"
              >
                <View style={styles.tooltipButtonContent}>
                  <Text style={styles.tooltipText}>👤</Text>
                  {hasInfoContent() && (
                    <View style={styles.contentIndicatorBadge}>
                      <Text style={styles.contentIndicatorText}>•</Text>
                    </View>
                  )}
                </View>
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity
                style={[
                  styles.tooltipButton,
                  styles.tooltipImages,
                  hoveredTooltip === 'images' && styles.tooltipButtonHovered,
                ]}
                onPress={() => handleTooltipPress('images')}
                onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('images')}
                onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
                activeOpacity={0.8}
                accessibilityLabel="Immagini"
                accessibilityHint="Carica o visualizza immagini per questo giorno"
              >
                <Text style={styles.tooltipText}>📷</Text>
              </SafeTouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Vista Mensile - Struttura originale */
        <>
          {/* Header con numero del giorno e tooltip in alto a destra */}
          <View style={styles.dayHeader}>
            <Text
              style={[
                styles.dayNumber,
                isSelected && styles.selectedText,
                isToday && styles.todayText,
              ]}
            >
              {dayNumber}
            </Text>
            
            {/* Tooltip in alto a destra per vista mensile */}
            <View style={styles.monthTooltipContainer}>
              <SafeTouchableOpacity
                style={styles.monthTooltipButton}
                onPress={() => handleTooltipPress('notes')}
                activeOpacity={0.8}
                accessibilityLabel="Note"
                accessibilityHint="Aggiungi o visualizza note per questo giorno"
              >
                <View style={styles.monthTooltipButtonContent}>
                  <Text style={styles.monthTooltipText}>📝</Text>
                  {entry?.chatNotes && entry.chatNotes.length > 0 && (
                    <View style={styles.monthMessageCountBadge}>
                      <Text style={styles.monthMessageCountText}>
                        {entry.chatNotes.length > 9 ? '9+' : entry.chatNotes.length}
                      </Text>
                    </View>
                  )}
                </View>
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity
                style={styles.monthTooltipButton}
                onPress={() => handleTooltipPress('images')}
                activeOpacity={0.8}
                accessibilityLabel="Immagini"
                accessibilityHint="Carica o visualizza immagini per questo giorno"
              >
                <Text style={styles.monthTooltipText}>📷</Text>
              </SafeTouchableOpacity>
            </View>
          </View>

          {/* Tag direttamente sotto il numero del giorno */}
          {/* Mostra i tag se ci sono tag espliciti O se la cella ha altri contenuti */}
          {(() => {
            const hasTags = entry?.tags && entry.tags.length > 0;
            const hasFocusData = entry?.focusReferencesData && entry.focusReferencesData.length > 0;
            const hasSales = entry?.sales && entry.sales.length > 0;
            const hasActions = entry?.actions && entry.actions.length > 0;
            const hasContent = hasTags || hasFocusData || hasSales || hasActions;
            
            // Se non ci sono tag espliciti ma c'è contenuto, genera tag di default
            let tagIds = entry?.tags || [];
            
            // Se l'entry ha tag espliciti (anche vuoti), rispetta la scelta dell'utente
            // Non aggiungere tag automatici se l'utente ha rimosso tutti i tag
            if (entry && 'tags' in entry) {
              // Se l'entry ha un campo tags definito (anche vuoto), rispetta la scelta dell'utente
              tagIds = entry.tags || [];
            } else if (!hasTags && hasContent) {
              // Genera tag di default basati sul contenuto solo se non ci sono tag espliciti
              const defaultTags = [];
              if (hasFocusData) defaultTags.push('merchandiser'); // M per focus references
              if (hasSales) defaultTags.push('sell_in'); // SI per vendite
              if (hasActions) defaultTags.push('check'); // ✓ per azioni
              tagIds = defaultTags;
            }
            
            return hasContent ? (
              <View style={[styles.tagsContainer, !isWeekView && styles.monthTagsContainer]}>
                <CellTags 
                  tagIds={tagIds} 
                  size="tiny" 
                  maxVisible={isWeekView ? tagIds.length : Math.min(tagIds.length, 5)}
                  layout={isWeekView ? 'vertical' : 'horizontal'}
                />
              </View>
            ) : null;
          })()}

          {/* Contenuto per vista mensile (riassunto) */}
          <View style={styles.monthContent}>
            {/* Indicatore compatto - solo azioni e vendite */}
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
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    margin: 1,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  weekCell: {
    minHeight: Platform.OS === 'web' ? 120 : 100, // Più compatto su mobile
    padding: Platform.OS === 'web' ? 6 : 4,
    ...Platform.select({
      web: {},
      default: {
        flex: 1, // Ogni cella occupa 1/3 dello spazio disponibile
        minWidth: 100, // Larghezza minima per leggibilità
      },
    }),
  },
  monthCell: {
    minHeight: 50, // Compatto per il riassunto
    padding: 2,
  },
  selected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  today: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  problem: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  // Stili per la struttura settimanale a 4 parti
  weekStructure: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  dayNumberSection: {
    alignItems: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  tagsSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  numbersSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  tooltipSection: {
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontWeight: 'bold',
    color: '#2d4150',
    textAlign: 'center',
  },
  selectedText: {
    color: '#ffffff',
  },
  todayText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 2,
  },
  problemIndicator: {
    backgroundColor: '#f44336',
    borderRadius: Platform.OS === 'web' ? 10 : 8,
    width: Platform.OS === 'web' ? 20 : 16,
    height: Platform.OS === 'web' ? 20 : 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  problemText: {
    color: '#ffffff',
    fontSize: Platform.OS === 'web' ? 12 : 10,
    fontWeight: 'bold',
  },
  notesIndicator: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagsContainer: {
    marginTop: 1,
    marginBottom: 2,
    paddingHorizontal: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  monthTagsContainer: {
    maxHeight: 20,
    justifyContent: 'center',
  },
  weekContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  salesSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  salesTag: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
  },
  salesTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  salesCount: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  actionsSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  actionsTag: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
  },
  actionsTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsCount: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  tooltipContainer: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    maxWidth: '100%',
    flexWrap: 'nowrap',
  },
  tooltipButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    minWidth: 20,
    maxWidth: 26,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
    } : {
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 1,
    }),
  },
  tooltipButtonHovered: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 6px rgba(33, 150, 243, 0.3)',
    } : {}),
  },
  tooltipStock: {
    backgroundColor: '#A5D6A7', // Verde pastello
    borderColor: '#66BB6A',
    borderWidth: 1,
  },
  tooltipNotes: {
    backgroundColor: '#CE93D8', // Viola pastello
    borderColor: '#AB47BC',
    borderWidth: 1,
  },
  tooltipInfo: {
    backgroundColor: '#FFCC80', // Arancione pastello
    borderColor: '#FF8A65',
    borderWidth: 1,
  },
  tooltipImages: {
    backgroundColor: '#90CAF9', // Blu pastello
    borderColor: '#42A5F5',
    borderWidth: 1,
  },
  tooltipText: {
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
  },
  monthContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthIndicator: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  monthSalesDot: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthSalesText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  monthActionsDot: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthActionsText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  monthProblemDot: {
    backgroundColor: '#f44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthProblemText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  emptyText: {
    fontSize: 24,
    color: '#cccccc',
    fontWeight: 'bold',
  },
  noDataSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  noDataText: {
    fontSize: 10,
    color: '#999999',
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1976D2',
    zIndex: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(33, 150, 243, 0.4)',
    } : {
      elevation: 3,
      shadowColor: '#2196F3',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
    }),
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
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

  focusReferenceDesc: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
    lineHeight: 10,
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
  // Stili per l'indicatore dei messaggi
  tooltipButtonContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  messageCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Stili per l'indicatore di contenuto (senza numero)
  contentIndicatorBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  contentIndicatorText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Stili per l'indicatore dei messaggi nella vista mensile
  notesContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCountBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  messageCountTextSmall: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Stili per i tooltip della vista mensile
  monthTooltipContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'row',
    gap: 2,
  },
  monthTooltipButton: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  monthTooltipButtonContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTooltipText: {
    fontSize: 10,
    color: '#666666',
  },
  monthMessageCountBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    minWidth: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  monthMessageCountText: {
    color: '#ffffff',
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Ottimizzazione delle performance con React.memo
export default React.memo(CustomCalendarCell, (prevProps, nextProps) => {
  // Confronto personalizzato per evitare re-render non necessari
  return (
    prevProps.date === nextProps.date &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isToday === nextProps.isToday &&
    prevProps.isWeekView === nextProps.isWeekView &&
    prevProps.entry?.id === nextProps.entry?.id &&
    prevProps.entry?.updatedAt === nextProps.entry?.updatedAt &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.onTooltipPress === nextProps.onTooltipPress &&
    prevProps.onSellInChange === nextProps.onSellInChange
  );
});
