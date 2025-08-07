/**
 * Container per la gestione dei filtri
 * 
 * Estrae tutta la logica di filtrazione dal MainCalendarPage
 * per rispettare il Single Responsibility Principle.
 */

import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import FilterComponents from '../components/FilterComponents';
import SmartFilterComponents from '../components/SmartFilterComponents';
import { useFiltersStore } from '../../stores/filtersStore';
import { Agent } from '../../data/models/Agent';
import { SalesPoint } from '../../data/models/SalesPoint';
import { ExcelRow } from '../../data/models/ExcelData';
import { logger } from '../../utils/logger';

export interface FilterManagementContainerProps {
  // Dati per i filtri
  agents: Agent[];
  salesPoints: SalesPoint[];
  excelRows: ExcelRow[];
  
  // Stati UI
  showFilters: boolean;
  
  // Callbacks
  onToggleFilters: () => void;
  onResetFilters: () => void;
  onResetAllData: () => void;
  
  // Configurazione
  enableProgressiveFilters?: boolean;
}

/**
 * Container che gestisce tutta la logica di filtrazione
 */
const FilterManagementContainer: React.FC<FilterManagementContainerProps> = memo(({
  agents,
  salesPoints,
  excelRows,
  showFilters,
  onToggleFilters,
  onResetFilters,
  onResetAllData,
  enableProgressiveFilters = true,
}) => {
  
  const {
    selectedUserId,
    selectedSalesPointId,
    selectedAMCode,
    selectedNAMCode,
    selectedLine,
    selectedFilterItems,
    setSelectedUserId,
    setSelectedSalesPointId,
    setSelectedAMCode,
    setSelectedNAMCode,
    setSelectedLine,
    setSelectedItems,
  } = useFiltersStore();

  // Gestione cambio utente
  const handleUserChange = useCallback((userId: string) => {
    logger.business('Cambio filtro utente', { userId, previousUserId: selectedUserId });
    setSelectedUserId(userId);
  }, [selectedUserId, setSelectedUserId]);

  // Gestione cambio punto vendita
  const handleSalesPointChange = useCallback((salesPointId: string) => {
    logger.business('Cambio filtro punto vendita', { 
      salesPointId, 
      previousSalesPointId: selectedSalesPointId 
    });
    setSelectedSalesPointId(salesPointId);
  }, [selectedSalesPointId, setSelectedSalesPointId]);

  // Gestione cambio AM Code
  const handleAMCodeChange = useCallback((amCode: string) => {
    logger.business('Cambio filtro AM Code', { amCode, previousAMCode: selectedAMCode });
    setSelectedAMCode(amCode);
  }, [selectedAMCode, setSelectedAMCode]);

  // Gestione cambio NAM Code
  const handleNAMCodeChange = useCallback((namCode: string) => {
    logger.business('Cambio filtro NAM Code', { namCode, previousNAMCode: selectedNAMCode });
    setSelectedNAMCode(namCode);
  }, [selectedNAMCode, setSelectedNAMCode]);

  // Gestione cambio linea
  const handleLineChange = useCallback((line: string) => {
    logger.business('Cambio filtro linea', { line, previousLine: selectedLine });
    setSelectedLine(line);
  }, [selectedLine, setSelectedLine]);

  // Gestione selezione multipla (per filtri progressivi)
  const handleMultipleSelectionChange = useCallback((items: string[]) => {
    logger.business('Cambio filtri multipli', { 
      items, 
      count: items.length,
      previousCount: selectedFilterItems.length 
    });
    setSelectedItems(items);
  }, [selectedFilterItems.length, setSelectedItems]);

  // Reset filtri con logging
  const handleResetFilters = useCallback(() => {
    logger.business('Reset filtri richiesto', {
      filtersBeforeReset: {
        selectedUserId,
        selectedSalesPointId,
        selectedAMCode,
        selectedNAMCode,
        selectedLine,
        selectedFilterItemsCount: selectedFilterItems.length,
      }
    });
    onResetFilters();
  }, [
    selectedUserId,
    selectedSalesPointId,
    selectedAMCode,
    selectedNAMCode,
    selectedLine,
    selectedFilterItems.length,
    onResetFilters,
  ]);

  // Reset dati completo con logging
  const handleResetAllData = useCallback(() => {
    logger.business('Reset completo dati richiesto', {
      selectedSalesPointId,
      hasDataToReset: !!selectedSalesPointId && selectedSalesPointId !== 'default'
    });
    onResetAllData();
  }, [selectedSalesPointId, onResetAllData]);

  // Dati per filtri progressivi memoizzati
  const progressiveFilterData = useMemo(() => {
    if (!enableProgressiveFilters || !excelRows || excelRows.length === 0) {
      return {
        linee: [],
        areaManagers: [],
        namCodes: [],
        agenti: [],
      };
    }

    // Estrai dati unici dalle righe Excel
    const linee = [...new Set(excelRows.map(row => row.linea))].filter(Boolean);
    const areaManagers = [...new Set(excelRows.map(row => row.amCode))].filter(Boolean);
    const namCodes = [...new Set(excelRows.map(row => row.namCode))].filter(Boolean);
    const agenti = [...new Set(excelRows.map(row => row.agenteCode))].filter(Boolean);

    logger.data('Dati filtri progressivi estratti', {
      lineeCount: linee.length,
      areaManagersCount: areaManagers.length,
      namCodesCount: namCodes.length,
      agentiCount: agenti.length,
    });

    return {
      linee,
      areaManagers,
      namCodes,
      agenti,
    };
  }, [excelRows, enableProgressiveFilters]);

  // Props per i componenti filtro
  const filterComponentsProps = useMemo(() => ({
    agents,
    salesPoints,
    selectedUserId,
    selectedSalesPointId,
    selectedAMCode,
    selectedNAMCode,
    selectedLine,
    onUserChange: handleUserChange,
    onSalesPointChange: handleSalesPointChange,
    onAMCodeChange: handleAMCodeChange,
    onNAMCodeChange: handleNAMCodeChange,
    onLineChange: handleLineChange,
    onResetFilters: handleResetFilters,
    onResetAllData: handleResetAllData,
  }), [
    agents,
    salesPoints,
    selectedUserId,
    selectedSalesPointId,
    selectedAMCode,
    selectedNAMCode,
    selectedLine,
    handleUserChange,
    handleSalesPointChange,
    handleAMCodeChange,
    handleNAMCodeChange,
    handleLineChange,
    handleResetFilters,
    handleResetAllData,
  ]);

  const smartFilterProps = useMemo(() => ({
    filterData: progressiveFilterData,
    selectedItems: selectedFilterItems,
    onSelectionChange: handleMultipleSelectionChange,
    onResetFilters: handleResetFilters,
  }), [
    progressiveFilterData,
    selectedFilterItems,
    handleMultipleSelectionChange,
    handleResetFilters,
  ]);

  // Se i filtri non sono visibili, non renderizzare nulla
  if (!showFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Filtri base */}
      <FilterComponents {...filterComponentsProps} />
      
      {/* Filtri progressivi (se abilitati) */}
      {enableProgressiveFilters && excelRows.length > 0 && (
        <SmartFilterComponents {...smartFilterProps} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

FilterManagementContainer.displayName = 'FilterManagementContainer';

export default FilterManagementContainer;
