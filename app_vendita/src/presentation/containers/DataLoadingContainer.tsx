/**
 * Container per la gestione del caricamento dati
 * 
 * Estrae tutta la logica di caricamento asincrono dal MainCalendarPage
 * per rispettare il Single Responsibility Principle.
 */

import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { User } from '../../data/models/User';
import { SalesPoint } from '../../data/models/SalesPoint';
import { Agent } from '../../data/models/Agent';
import { ExcelRow } from '../../data/models/ExcelData';
import { useRepository } from '../../hooks/useRepository';
import { useFirebaseExcelData } from '../../hooks/useFirebaseExcelData';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';
import { initializeProductCatalogFromStore } from '../../services/ProductCatalogResolver';
import { NamResolver } from '../../services/NamResolver';
import { OrgGraphResolver } from '../../services/OrgGraphResolver';
import { useFirebaseExcelData } from '../../hooks/useFirebaseExcelData';
import { logger } from '../../utils/logger';
import { Colors } from '../../constants/Colors';

export interface DataLoadingContainerProps {
  // Callbacks per aggiornamento dati
  onDataLoaded: (data: {
    users: User[];
    salesPoints: SalesPoint[];
    agents: Agent[];
    calendarEntries: CalendarEntry[];
    excelRows: ExcelRow[];
  }) => void;
  
  onLoadingStateChange: (isLoading: boolean) => void;
  onError: (error: string) => void;
  
  // Filtri per il caricamento
  selectedSalesPointId?: string;
  selectedUserId?: string;
  
  // Configurazione
  autoLoadOnMount?: boolean;
  enableExcelData?: boolean;
  enableFocusReferences?: boolean;
}

export interface DataLoadingMethods {
  reloadAllData: () => Promise<void>;
  reloadExcelData: () => Promise<void>;
  reloadCalendarEntries: () => Promise<void>;
}

/**
 * Container che gestisce tutto il caricamento asincrono dei dati
 */
const DataLoadingContainer: React.FC<DataLoadingContainerProps> = memo(({
  onDataLoaded,
  onLoadingStateChange,
  onError,
  selectedSalesPointId,
  selectedUserId,
  autoLoadOnMount = true,
  enableExcelData = true,
  enableFocusReferences = true,
}) => {
  
  const repository = useRepository();
  const focusReferencesStore = useFocusReferencesStore();
  const { excelRows } = useFirebaseExcelData();
  const { excelRows, isLoading: excelDataLoading, reloadData: reloadExcelData } = useFirebaseExcelData();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);

  // Notifica cambio stato loading
  useEffect(() => {
    onLoadingStateChange(isLoading || excelDataLoading);
  }, [isLoading, excelDataLoading, onLoadingStateChange]);

  // Funzione per aggiornare il progresso di caricamento
  const updateLoadingProgress = useCallback((step: string, isStarting: boolean = true) => {
    setLoadingSteps(prev => {
      if (isStarting) {
        return [...prev, step];
      } else {
        return prev.filter(s => s !== step);
      }
    });
    
    logger.performance('Aggiornamento progresso caricamento', {
      step,
      action: isStarting ? 'start' : 'complete',
      activeSteps: isStarting ? [...loadingSteps, step] : loadingSteps.filter(s => s !== step)
    });
  }, [loadingSteps]);

  // Caricamento utenti
  const loadUsers = useCallback(async (): Promise<User[]> => {
    updateLoadingProgress('users', true);
    try {
      logger.data('Inizio caricamento utenti');
      const users = await repository.getUsers();
      logger.data('Utenti caricati con successo', { count: users.length });
      return users;
    } catch (error) {
      logger.error('DataLoading', 'Errore nel caricamento utenti', error);
      throw error;
    } finally {
      updateLoadingProgress('users', false);
    }
  }, [repository, updateLoadingProgress]);

  // Caricamento punti vendita
  const loadSalesPoints = useCallback(async (): Promise<SalesPoint[]> => {
    updateLoadingProgress('salesPoints', true);
    try {
      logger.data('Inizio caricamento punti vendita');
      const salesPoints = await repository.getSalesPoints();
      logger.data('Punti vendita caricati con successo', { count: salesPoints.length });
      return salesPoints;
    } catch (error) {
      logger.error('DataLoading', 'Errore nel caricamento punti vendita', error);
      throw error;
    } finally {
      updateLoadingProgress('salesPoints', false);
    }
  }, [repository, updateLoadingProgress]);

  // Estrazione agenti dai dati Excel
  const extractAgents = useCallback((rows: ExcelRow[]): Agent[] => {
    updateLoadingProgress('agents', true);
    try {
      logger.data('Inizio estrazione agenti da dati Excel', { rowsCount: rows.length });
      
      const agentsMap = new Map<string, Agent>();
      
      rows.forEach(row => {
        if (row.agenteCode && row.agenteName && !agentsMap.has(row.agenteCode)) {
          agentsMap.set(row.agenteCode, {
            id: row.agenteCode,
            name: row.agenteName,
            code: row.agenteCode,
            salesPoints: [], // Verrà popolato se necessario
            level1: '',
            level2: '',
            level3: '',
            level4: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
      
      const agents = Array.from(agentsMap.values());
      logger.data('Agenti estratti con successo', { count: agents.length });
      return agents;
    } catch (error) {
      logger.error('DataLoading', 'Errore nell\'estrazione agenti', error);
      throw error;
    } finally {
      updateLoadingProgress('agents', false);
    }
  }, [updateLoadingProgress]);

  // Caricamento entries calendario
  const loadCalendarEntries = useCallback(async (): Promise<CalendarEntry[]> => {
    updateLoadingProgress('calendarEntries', true);
    try {
      logger.data('Inizio caricamento entries calendario', {
        selectedSalesPointId,
        selectedUserId
      });
      
      // Calcola date range (mese corrente + successivo)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      
      let entries: CalendarEntry[];
      
      if (selectedSalesPointId && selectedSalesPointId !== 'default') {
        logger.data('Caricamento entries per punto vendita specifico', { selectedSalesPointId });
        entries = await repository.getCalendarEntries(
          startDate,
          endDate,
          undefined,
          selectedSalesPointId
        );
      } else {
        logger.data('Caricamento entries con filtri normali', { selectedUserId });
        entries = await repository.getCalendarEntries(
          startDate,
          endDate,
          selectedUserId
        );
      }
      
      logger.data('Entries calendario caricate con successo', { 
        count: entries.length,
        dateRange: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`
      });
      
      return entries;
    } catch (error) {
      logger.error('DataLoading', 'Errore nel caricamento entries calendario', error);
      throw error;
    } finally {
      updateLoadingProgress('calendarEntries', false);
    }
  }, [repository, selectedSalesPointId, selectedUserId, updateLoadingProgress]);

  // Caricamento referenze focus
  const loadFocusReferences = useCallback(async (): Promise<void> => {
    if (!enableFocusReferences) return;
    
    updateLoadingProgress('focusReferences', true);
    try {
      logger.data('Inizio caricamento referenze focus');
      focusReferencesStore.loadAllReferences();
      await focusReferencesStore.loadFocusReferencesFromFirestore();
      // Costruisci indice catalogo completo per resolver (solo lettura)
      initializeProductCatalogFromStore();
      // Costruisci mappa Insegna -> NAM
      try { NamResolver.build(excelRows as any); } catch {}
      // Costruisci grafo organizzativo completo (Insegna↔Agenti/NAM↔PDV)
      try { OrgGraphResolver.build(excelRows as any); } catch {}
      logger.data('Referenze focus caricate con successo');
    } catch (error) {
      logger.error('DataLoading', 'Errore nel caricamento referenze focus', error);
      // Non bloccare il caricamento per errori nelle referenze
    } finally {
      updateLoadingProgress('focusReferences', false);
    }
  }, [enableFocusReferences, focusReferencesStore, updateLoadingProgress]);

  // Caricamento completo di tutti i dati
  const loadAllData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    logger.business('Inizio caricamento completo dati');
    
    try {
      // Carica dati in parallelo quando possibile
      const [users, salesPoints] = await Promise.all([
        loadUsers(),
        loadSalesPoints(),
      ]);
      
      // Gli agents dipendono dai dati Excel, quindi carichiamo quelli prima
      const agents = enableExcelData && excelRows.length > 0 
        ? extractAgents(excelRows)
        : [];
      
      // Calendar entries possono essere caricati in parallelo con focus references
      const [calendarEntries] = await Promise.all([
        loadCalendarEntries(),
        loadFocusReferences(),
      ]);
      
      // Notifica i dati caricati
      onDataLoaded({
        users,
        salesPoints,
        agents,
        calendarEntries,
        excelRows: enableExcelData ? excelRows : [],
      });
      
      logger.business('Caricamento completo dati completato con successo', {
        usersCount: users.length,
        salesPointsCount: salesPoints.length,
        agentsCount: agents.length,
        calendarEntriesCount: calendarEntries.length,
        excelRowsCount: enableExcelData ? excelRows.length : 0,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore nel caricamento dati';
      logger.error('DataLoading', 'Errore nel caricamento completo', error);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingSteps([]);
    }
  }, [
    loadUsers,
    loadSalesPoints,
    extractAgents,
    loadCalendarEntries,
    loadFocusReferences,
    excelRows,
    enableExcelData,
    onDataLoaded,
    onError,
  ]);

  // Auto-load al mount
  useEffect(() => {
    if (autoLoadOnMount) {
      loadAllData();
    }
  }, [autoLoadOnMount]); // Solo al mount

  // Ricarica quando cambiano i dati Excel
  useEffect(() => {
    if (enableExcelData && excelRows.length > 0) {
      // Ricarica solo gli agents quando cambiano i dati Excel
      try {
        const agents = extractAgents(excelRows);
        // Notifica solo il cambio degli agents, mantieni gli altri dati
        logger.business('Aggiornamento agents da nuovi dati Excel', { count: agents.length });
      } catch (error) {
        logger.error('DataLoading', 'Errore aggiornamento agents da Excel', error);
      }
    }
  }, [excelRows, enableExcelData, extractAgents]);

  // Esporta metodi per controllo esterno
  const methods: DataLoadingMethods = {
    reloadAllData: loadAllData,
    reloadExcelData: reloadExcelData,
    reloadCalendarEntries: loadCalendarEntries,
  };

  // Passa i metodi al componente padre tramite ref callback
  React.useImperativeHandle(React.useRef(null), () => methods, [methods]);

  // Render indicatore di caricamento se necessario
  if (isLoading && loadingSteps.length > 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Questo container non renderizza UI, gestisce solo la logica
  return null;
});

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

DataLoadingContainer.displayName = 'DataLoadingContainer';

// Esporta anche il tipo per i metodi
export type { DataLoadingMethods };

export default DataLoadingContainer;
