import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { FocusReferencesDisplay } from './FocusReferencesDisplay';
import { WeekTooltipButtons } from './WeekTooltipButtons';
import { MonthTooltipButtons } from './MonthTooltipButtons';
import { CalendarCellTags } from './CalendarCellTags';
import { SalesAndActionsDisplay } from './SalesAndActionsDisplay';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';
import { useCalendar } from '../../presentation/providers/CalendarContext';
import { usePhotoManager } from '../../hooks/usePhotoManager';
import { useFiltersStore } from '../../stores/filtersStore';



interface CustomCalendarCellProps {
  date: string;
  entry?: CalendarEntry | undefined;
  isSelected: boolean;
  isToday: boolean;
  selectedSalesPointId?: string;
  onPress: () => void;
  isWeekView: boolean;
  onTooltipPress?: ((type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => void) | undefined;

}

function CustomCalendarCell({
  date,
  entry,
  isSelected,
  isToday,
  selectedSalesPointId,
  onPress,
  isWeekView,
  onTooltipPress,
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
  const { progressiveSystem } = useCalendar();
  
  const isInitialized = progressiveSystem.isInitialized;
  const { getDisplayDataForDate, loadFocusReferencesData, getLastUpdated } = progressiveSystem;

  // Ottieni filtri correnti per photo manager
  const { selectedUserId } = useFiltersStore();

  // Photo manager per conteggio foto - Logica prioritaria per punto vendita
  // Se c'è un punto vendita selezionato, mostra sempre i dati (priorità al punto vendita)
  // Se NON c'è punto vendita, usa la logica entry-based
  const shouldShowPhotos = selectedSalesPointId ? true : (entry !== undefined);
  
  // Ottimizzazione: usa photoManager solo se necessario
  // Nella vista mensile questo evita 42 chiamate simultanee
  const shouldLoadPhotos = shouldShowPhotos && selectedSalesPointId && selectedSalesPointId !== 'default';
  
  const photoManager = usePhotoManager({
    calendarDate: date,
    salesPointId: shouldLoadPhotos ? selectedSalesPointId : 'default',
    salesPointName: 'Punto Vendita',
    userId: selectedUserId || 'default_user', // userId non viene usato per caricare foto (solo per salvare)
  });


  
  // Carica i dati focusReferencesData nel sistema progressivo quando l'entry ha questi dati
  useEffect(() => {
    if (entry?.focusReferencesData && entry.focusReferencesData.length > 0) {
      loadFocusReferencesData(date, entry.focusReferencesData);
    }
  }, [entry?.focusReferencesData, date, loadFocusReferencesData]);
  
  const dayNumber = new Date(date).getDate();
  const hasProblem = entry?.hasProblem || false;

  

  
  // Stabilizza la chiamata a getDisplayDataForDate per evitare re-render continui
  const displayData = useMemo(() => {
    return getDisplayDataForDate(date, entry, isInitialized);
  }, [date, entry, isInitialized, getDisplayDataForDate, selectedSalesPointId, getLastUpdated()]);
  


  // Funzioni per determinare se i tooltip hanno contenuto
  const hasStockContent = () => {

    
    // Non mostrare l'icona stock se non c'è un punto vendita selezionato valido
    if (!selectedSalesPointId || selectedSalesPointId === 'default' || selectedSalesPointId === '') {
      return false;
    }
    
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



  // Tooltip content per settimana (guida principale)
  const getWeekTooltip = () => {
    if (!entry) return 'Clicca per aggiungere dati per questo giorno';
    
    const totalSales = entry.sales?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const totalActions = entry.actions?.reduce((sum, action) => sum + action.count, 0) || 0;
    
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
    
    const totalSales = entry.sales?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const totalActions = entry.actions?.reduce((sum, action) => sum + action.count, 0) || 0;
    
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
          <CalendarCellTags entry={entry} isWeekView={true} />

          {/* PARTE 3: Sezione numeri (vendite e azioni) */}
          <SalesAndActionsDisplay entry={entry} isWeekView={true} />

            {/* Referenze Focus */}
            <FocusReferencesDisplay 
              displayData={displayData}
              entry={entry}
              isWeekView={isWeekView}
              getFocusReferenceById={getFocusReferenceById}
              getNetPrice={getNetPrice}
            />

            {/* Indicatore quando non ci sono dati */}
            {(!entry?.sales?.length || entry.sales.reduce((sum, sale) => sum + sale.value, 0) === 0) && 
             (!entry?.actions?.length || entry.actions.reduce((sum, action) => sum + action.count, 0) === 0) && 
             !entry?.focusReferencesData?.length && entry && (
              <View style={styles.noDataSection}>
                <Text style={styles.noDataText}>Nessun dato</Text>
              </View>
            )}

          {/* PARTE 4: Tooltip in basso */}
          <WeekTooltipButtons
            hoveredTooltip={hoveredTooltip}
            setHoveredTooltip={setHoveredTooltip}
            handleTooltipPress={handleTooltipPress}
            hasStockContent={hasStockContent}
            hasInfoContent={hasInfoContent}
            entry={entry}
            shouldShowPhotos={shouldShowPhotos}
            photoManager={photoManager}
            selectedSalesPointId={selectedSalesPointId}
          />
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
            <MonthTooltipButtons
              handleTooltipPress={handleTooltipPress}
              entry={entry}
              shouldShowPhotos={shouldShowPhotos}
              photoManager={photoManager}
              selectedSalesPointId={selectedSalesPointId}
            />
          </View>

          {/* Tag direttamente sotto il numero del giorno */}
          <CalendarCellTags entry={entry} isWeekView={false} />

          {/* Contenuto per vista mensile (riassunto) */}
          <View style={styles.monthContent}>
            <SalesAndActionsDisplay entry={entry} isWeekView={false} />
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

  weekContent: {
    flex: 1,
    justifyContent: 'space-between',
  },


  monthContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    prevProps.onTooltipPress === nextProps.onTooltipPress
  );
});
