import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  StatusBar,
  SafeAreaView,
  Platform,
  PanResponder,
} from 'react-native';
import { useCalendar } from '../providers/CalendarContext';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Agent } from '../../data/models/Agent';
import WeekCalendar from '../components/WeekCalendar';
import VirtualizedMonthCalendar from '../components/VirtualizedMonthCalendar';
import FilterComponents from '../components/FilterComponents';
import EntryFormModal from '../components/EntryFormModal';
import TooltipModal from '../components/TooltipModal';
import { useFiltersStore } from '../../stores/filtersStore';
import { useFirebaseExcelData } from '../../hooks/useFirebaseExcelData';

import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
// import { getTagById } from '../../constants/Tags';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { logger } from '../../utils/logger';
import { useRepository } from '../../hooks/useRepository';
import LoadingOverlay from '../components/LoadingOverlay';

interface MainCalendarPageProps {
  navigation?: any;
}

export default function MainCalendarPage({
  navigation,
}: MainCalendarPageProps) {
  if (__DEV__) {
    // Rimuoviamo questo log che causa re-render continui
  // console.log('🚀 MainCalendarPage: Componente inizializzato');
  }

  const { state, dispatch, progressiveSystem } = useCalendar();
  const focusReferencesStore = useFocusReferencesStore();
  
  // Helpers focus references (manteniamo per compatibilità futura, disabilitati per linter)
  /* const getFocusReferenceById = (id: string) => {
    return focusReferencesStore.getAllReferences().find(ref => ref.id === id);
  };
  
  const getNetPrice = (referenceId: string): string => {
    const netPrices = focusReferencesStore.getNetPrices();
    const netPrice = netPrices[referenceId];
    return netPrice || '0';
  }; */
  if (__DEV__) {
    // Rimuoviamo questo log che causa re-render continui
    // console.log('✅ MainCalendarPage: useCalendar hook eseguito con successo');
  }
  
  // Stati locali (non filtri)
  const [isLoading, setIsLoading] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterReloading, setFilterReloading] = useState(false);
  
  // Filtri con Zustand
  // Selettori atomici dal negozio (evita oggetto aggregato senza equality → re-render a cascata)
  const selectedDate = useFiltersStore(state => state.selectedDate);
  const selectedUserId = useFiltersStore(state => state.selectedUserId);
  const selectedSalesPointId = useFiltersStore(state => state.selectedSalesPointId);
  const selectedAMCode = useFiltersStore(state => state.selectedAMCode);
  const selectedNAMCode = useFiltersStore(state => state.selectedNAMCode);
  const selectedLine = useFiltersStore(state => state.selectedLine);
  const selectedFilterItems = useFiltersStore(state => state.selectedFilterItems);
  const showFilters = useFiltersStore(state => state.showFilters);
  const agents = useFiltersStore(state => state.agents);
  const setSelectedDate = useFiltersStore(state => state.setSelectedDate);
  const setSelectedUserId = useFiltersStore(state => state.setSelectedUserId);
  const setSelectedSalesPointId = useFiltersStore(state => state.setSelectedSalesPointId);
  const setSelectedAMCode = useFiltersStore(state => state.setSelectedAMCode);
  const setSelectedNAMCode = useFiltersStore(state => state.setSelectedNAMCode);
  const setSelectedLine = useFiltersStore(state => state.setSelectedLine);
  const setSelectedFilterItems = useFiltersStore(state => state.setSelectedItems);
  const setShowFilters = useFiltersStore(state => state.setShowFilters);
  const setAgents = useFiltersStore(state => state.setAgents);

  // Dati Excel da Firebase
  const { excelData: excelRows, isLoading: excelDataLoading, reloadData: reloadExcelData } = useFirebaseExcelData();
  
  // Debug: log dei dati caricati
  useEffect(() => {
    if (__DEV__) {
      console.log('📊 MainCalendarPage: Excel data caricati:', excelRows.length);
      console.log('📊 MainCalendarPage: Calendar entries:', state.entries.length);
      console.log('📊 MainCalendarPage: Excel loading:', excelDataLoading);
    }
  }, [excelRows.length, state.entries.length, excelDataLoading]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | undefined>();
  const [showTooltipModal, setShowTooltipModal] = useState(false);
  const [tooltipType, setTooltipType] = useState<'stock' | 'notes' | 'info' | 'images'>('stock');
  const [tooltipDate, setTooltipDate] = useState<string>('');
  const [tooltipEntry, setTooltipEntry] = useState<CalendarEntry | undefined>();
  const [dailySellIn, setDailySellIn] = useState<{ [date: string]: number }>({});

  // Repository tramite DI (elimina istanza hardcoded)
  const repository = useRepository();
  
  // Debug: verifica il tipo di repository


  // Funzione per filtrare le entries in base ai filtri attivi
  /* const getFilteredEntries = useCallback(() => {
    const filtersState = useFiltersStore.getState();
    return state.entries.filter(entry => {
      if (filtersState.selectedSalesPointId && entry.salesPointId !== filtersState.selectedSalesPointId) return false;
      if (filtersState.selectedUserId && entry.userId !== filtersState.selectedUserId) return false;
      if (filtersState.selectedDate) {
        let entryDate: Date;
        if (entry.date instanceof Date) entryDate = entry.date; else if (typeof entry.date === 'string') entryDate = new Date(entry.date); else return false;
        const entryDateString = entryDate.toISOString().split('T')[0];
        if (entryDateString !== filtersState.selectedDate) return false;
      }
      return true;
    });
  }, [state.entries]); */

  // Memoizzo le entries filtrate per evitare ricalcoli inutili
  const getEntriesForFilters = useCalendarStore(state => state.getEntriesForFilters);
  const getTotalsForFilters = useCalendarStore(state => state.getTotalsForFilters);
  const getMonthlyTotalsForSalesPoint = useCalendarStore(state => state.getMonthlyTotalsForSalesPoint);
  // Necessario per triggerare i ricalcoli live quando cambiano le entries
  const storeEntries = useCalendarStore(state => state.entries);

  // Range visibile per allineare KPI/Entries con la UI corrente (settimana/mese)
  const visibleRange = useMemo(() => {
    const base = new Date(currentDate);
    if (calendarView === 'week') {
      const day = base.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day; // lunedì
      const start = new Date(base);
      start.setDate(base.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    // vista mese
    const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }, [calendarView, currentDate]);

  // Swipe gesture: definita più in basso dopo le funzioni di navigazione

  // Utilità locale: chiave data in timezone locale (YYYY-MM-DD) per confronti robusti
  const getLocalDateKey = (value: Date | string) => {
    const d = value instanceof Date ? value : new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const filteredCalendarEntries = useMemo(() => {
    // Business rule: senza cliente selezionato non si mostrano dati
    if (!selectedSalesPointId || selectedSalesPointId === 'default') {
      return [] as CalendarEntry[];
    }
    const all = getEntriesForFilters(undefined, selectedSalesPointId);
    const { start, end } = visibleRange;
    return all.filter(e => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      return d >= start && d <= end;
    });
  }, [getEntriesForFilters, selectedSalesPointId, storeEntries, visibleRange]);

  // Calcoli memoizzati: totali per filtri correnti e totali mensili (mese corrente)
  const calendarTotals = useMemo(() => {
    if (!selectedSalesPointId || selectedSalesPointId === 'default') {
      return { filtered: { sellInTotal: 0, sellInMonth: 0, actionsTotal: 0, actionsMonth: 0 } };
    }
    const { sellIn, actions } = getTotalsForFilters(undefined, selectedSalesPointId);
    const sellInMonth = getMonthlyTotalsForSalesPoint(
      selectedSalesPointId,
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    ).sellIn;
    return {
      filtered: {
        sellInTotal: sellIn,
        sellInMonth,
        actionsTotal: actions,
        actionsMonth: 0
      }
    };
  }, [getTotalsForFilters, getMonthlyTotalsForSalesPoint, selectedSalesPointId, currentDate, storeEntries]);

  // Deduplicazione conservativa: unifica entries duplicate stesso giorno/punto vendita mantenendo la più ricca/recente
  useEffect(() => {
    if (!selectedSalesPointId || selectedSalesPointId === 'default') return;
    if (!storeEntries || storeEntries.length === 0) return;

    const entriesForSP = storeEntries.filter(e => e.salesPointId === selectedSalesPointId);
    if (entriesForSP.length === 0) return;

    const groups = new Map<string, typeof entriesForSP>();
    for (const e of entriesForSP) {
      const key = getLocalDateKey(e.date as any);
      const list = groups.get(key) || [];
      list.push(e);
      groups.set(key, list);
    }

    const duplicates = Array.from(groups.entries()).filter(([, list]) => list.length > 1);
    if (duplicates.length === 0) return;

    duplicates.forEach(async ([, list]) => {
      const richness = (e: any) =>
        (e?.focusReferencesData?.length || 0) * 10 +
        (e?.sales?.length || 0) * 5 +
        (e?.actions?.length || 0);

      const sorted = [...list].sort((a, b) => {
        const rb = richness(b) - richness(a);
        if (rb !== 0) return rb; // più contenuto prima
        const ta = new Date((a.updatedAt || a.createdAt) as any).getTime();
        const tb = new Date((b.updatedAt || b.createdAt) as any).getTime();
        return tb - ta; // più recente prima
      });
      // Mantieni il primo (più ricco/recente) ed elimina gli altri
      const toDelete = sorted.slice(1);

      for (const dup of toDelete) {
        try {
          await repository.deleteCalendarEntry(dup.id);
          dispatch({ type: 'DELETE_ENTRY', payload: dup.id });
        } catch (err) {
          console.warn('Dedup fallita per entry', dup.id, err);
        }
      }
    });
  }, [selectedSalesPointId, storeEntries, repository, dispatch]);

  // Funzione per ottenere tutte le entries per le viste calendario (senza filtro data)
  /* const getCalendarEntries = useCallback(() => filteredCalendarEntries, [filteredCalendarEntries]); */
  


    // Rimuoviamo questo log che causa re-render continui
    // if (__DEV__) {
    //   console.log('📊 MainCalendarPage: Stato iniziale:', {
    //     selectedDate,
    //     isLoading,
    //     calendarView,
    //     currentDate: currentDate.toISOString(),
    //     showFilters,
    //     selectedUserId,
    //     selectedSalesPointId,
    //     entriesCount: state.entries.length,
    //     usersCount: state.users.length,
    //     salesPointsCount: state.salesPoints.length,
    //   });
    // }

    // Carica dati iniziali
    useEffect(() => {
      logger.ui('useEffect triggered - caricamento dati iniziali');
      loadInitialData();
    }, []);

    // Ricarica i dati Excel quando l'utente torna alla pagina
    // Ricarica i dati Excel quando il componente diventa attivo
    useEffect(() => {
      const lastExcelReloadRef = { current: 0 } as { current: number };
      if (navigation?.addListener) {
        const unsubscribe = navigation.addListener('focus', () => {
          const now = Date.now();
          // Evita reload troppo ravvicinati (< 30s)
          if (now - lastExcelReloadRef.current > 30000) {
            logger.ui('Pagina attiva, ricaricamento dati Excel (throttled)');
            reloadExcelData();
            lastExcelReloadRef.current = now;
          } else if (__DEV__) {
            console.log('⏭️ Skip reload Excel: troppo ravvicinato');
          }
        });

        return unsubscribe;
      }
    }, [navigation, reloadExcelData]);

    const loadInitialData = async (options?: { showOverlayOnly?: boolean }) => {
      logger.business('Inizio caricamento dati iniziali');
      try {
        if (options?.showOverlayOnly) {
          setFilterReloading(true);
        } else {
          setIsLoading(true);
        }
        dispatch({ type: 'SET_LOADING', payload: true });

        logger.data('Caricamento utenti...');
        const users = await repository.getUsers();
        logger.data('Utenti caricati', { count: users.length });

        logger.data('Caricamento punti vendita...');
        const salesPoints = await repository.getSalesPoints();
        if (__DEV__) {
          console.log('✅ MainCalendarPage: Punti vendita caricati:', salesPoints.length);
        }

        dispatch({ type: 'SET_USERS', payload: users });
        dispatch({ type: 'SET_SALES_POINTS', payload: salesPoints });

        // Estrai i dati degli agents dai users
        const agentsData = users
          .filter(user => user.role === 'agent')
          .map(user => {
            // **VALIDAZIONE JSON ROBUSTA** - Gestisci i dati dell'agente in modo sicuro
            let userData: any = {};
            
            // Funzione helper per parsing JSON sicuro
            const safeJsonParse = (data: string, fallback: any = {}) => {
              try {
                // Verifica se sembra JSON valido
                if (typeof data === 'string' && 
                    data.trim().startsWith('{') && 
                    data.trim().endsWith('}')) {
                  return JSON.parse(data);
                }
                return fallback;
              } catch (error) {
                if (__DEV__) {
                  console.warn('⚠️ MainCalendarPage: JSON parsing fallito per:', data, error);
                }
                return fallback;
              }
            };
            
            // Prova a parsare l'email come JSON solo se sembra essere JSON
            if (user.email) {
              userData = safeJsonParse(user.email, {});
            }
            
            return {
              id: user.id,
              name: user.name,
              code: userData.code || user.name.split(' ')[0] || '',
              salesPointId: '',
              salesPointName: userData.salesPointName || '',
              salesPointCode: userData.salesPointCode || '',
              region: userData.region || '',
              province: userData.province || '',
              address: userData.address || '',
              phone: userData.phone || '',
              email: user.email || '',
              amCode: userData.amCode || '',
              namCode: userData.namCode || '',
              line: userData.line || '',
              level4: userData.level4 || '',
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            } as Agent;
          });

        setAgents(agentsData);
        if (__DEV__) {
          console.log('✅ MainCalendarPage: Agents estratti:', agentsData.length);
        }

        // Dati Excel ora caricati automaticamente dal hook useFirebaseExcelData
        if (__DEV__) {
          console.log('📊 MainCalendarPage: Dati Excel disponibili:', excelRows.length, 'righe');
        }
        
        // Carica le referenze focus (statiche + configurazioni globali)
        if (__DEV__) {
          console.log('🔍 MainCalendarPage: Caricamento referenze focus...');
        }
        focusReferencesStore.loadAllReferences();
        await focusReferencesStore.loadFocusReferencesFromFirestore();
        if (__DEV__) {
          console.log('✅ MainCalendarPage: Referenze focus caricate');
        }

        // Carica entries del periodo corrente (esteso per includere più giorni)
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Dal mese precedente
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Al mese successivo

        if (__DEV__) {
          console.log(
            '📅 MainCalendarPage: Caricamento entries dal',
            startDate.toISOString(),
            'al',
            endDate.toISOString(),
            'con filtri:',
            {
              userId: selectedUserId || 'tutti',
              salesPointId: selectedSalesPointId || 'tutti'
            }
          );
        }
        
        // LOGICA PRIORITARIA: Se c'è punto vendita, ignora userId (come nella vista calendario)
        let entries;
        if (selectedSalesPointId && selectedSalesPointId !== 'default') {
          if (__DEV__) {
            console.log('🎯 MainCalendarPage: Caricamento SOLO per punto vendita:', selectedSalesPointId);
          }
          entries = await repository.getCalendarEntries(
            startDate, 
            endDate, 
            undefined,  // Ignora userId quando c'è salesPointId
            selectedSalesPointId
          );
        } else {
          if (__DEV__) {
            console.log('🔍 MainCalendarPage: Caricamento con filtri normali');
          }
          entries = await repository.getCalendarEntries(
            startDate, 
            endDate, 
            selectedUserId || undefined,
            undefined  // No salesPointId se non selezionato
          );
        }
        if (__DEV__) {
          console.log('✅ MainCalendarPage: Entries caricati:', entries.length);
          console.log('✅ MainCalendarPage: Dettagli entries:', entries.map(entry => ({
          id: entry.id,
          date: entry.date,
          focusReferencesData: entry.focusReferencesData,
          focusReferencesCount: entry.focusReferencesData?.length || 0,
          focusReferencesDataRaw: JSON.stringify(entry.focusReferencesData),
          })));
        }

        dispatch({ type: 'SET_ENTRIES', payload: entries });

        if (__DEV__) {
          console.log('🎉 MainCalendarPage: Caricamento dati completato con successo');
        }
      } catch (error) {
        console.error(
          '❌ MainCalendarPage: Errore nel caricamento dei dati:',
          error
        );
        dispatch({
          type: 'SET_ERROR',
          payload: 'Errore nel caricamento dei dati',
        });
      } finally {
        if (options?.showOverlayOnly) {
          setFilterReloading(false);
        } else {
          setIsLoading(false);
        }
        dispatch({ type: 'SET_LOADING', payload: false });
        if (__DEV__) {
          console.log('🏁 MainCalendarPage: Caricamento dati terminato');
        }
      }
    };

    const showAddEntryModal = useCallback((dateString: string) => {
      logger.ui('📝 MainCalendarPage: Apertura modal nuovo entry per:', dateString);
      setSelectedDate(dateString);
      setEditingEntry(undefined);
      setShowEntryModal(true);
    }, [setSelectedDate]);

    const showEditEntryModal = useCallback((entry: CalendarEntry) => {
      logger.ui('📝 MainCalendarPage: Apertura modal modifica entry:', entry.id);
      setEditingEntry(entry);
      setShowEntryModal(true);
    }, []);

    // Gestisce la selezione di una data
    const onDayPress = useCallback((dateString: string) => {
      logger.ui('📅 MainCalendarPage: Giorno selezionato:', dateString);
      setSelectedDate(dateString);
      dispatch({
        type: 'UPDATE_FILTERS',
        payload: { selectedDate: new Date(dateString) },
      });

      // Apri il form solo nel calendario settimanale (guida principale)
      if (calendarView === 'week') {
        logger.ui('📅 MainCalendarPage: Apertura diretta modal per calendario settimanale');
        
        // Controlla se esistono già entry per questa data
        const existingEntries = state.entries.filter((entry: CalendarEntry) => {
          const entryDate = new Date(entry.date);
          const selectedDate = new Date(dateString);
          return entryDate.toDateString() === selectedDate.toDateString();
        });
        
        logger.ui(`📅 MainCalendarPage: Entry esistenti per ${dateString}: ${existingEntries.length}`);
        
        if (existingEntries.length > 0) {
          // Se esistono entry, apri in modalità modifica con il primo entry
          logger.ui('📝 MainCalendarPage: Apertura modal modifica per entry esistente');
          showEditEntryModal(existingEntries[0]!);
        } else {
          // Se non esistono entry, apri in modalità nuovo
          logger.ui('📝 MainCalendarPage: Apertura modal nuovo entry');
          showAddEntryModal(dateString);
        }
      } else {
        // Nel calendario mensile (riassunto) - solo log, nessuna azione
        logger.ui('📅 MainCalendarPage: Clic nel calendario mensile (riassunto) - nessuna azione');
      }
    }, [calendarView, state.entries, setSelectedDate, dispatch, showEditEntryModal, showAddEntryModal]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    /* const showDayDetails = (entries: CalendarEntry[]) => {
      if (__DEV__) {
        console.log('📋 MainCalendarPage: Mostrando dettagli per', entries.length, 'entries');
      }
      Alert.alert(
        `Dettagli ${selectedDate}`,
        `Trovati ${entries.length} record per questa data`,
        [
          {
            text: 'Aggiungi Nuovo',
            onPress: () => showAddEntryModal(selectedDate),
          },
          { text: 'Modifica', onPress: () => entries[0] && showEditEntryModal(entries[0]) },
          { text: 'Chiudi', style: 'cancel' },
        ]
      );
    }; */

    // Le funzioni sono già definite sopra con useCallback

    const handleSaveEntry = useCallback(async (entry: CalendarEntry) => {
      try {
        if (editingEntry) {
          // Aggiorna l'entry esistente mantenendo lo stesso ID
          const updateData: any = {
            date: entry.date,
            userId: selectedUserId || 'default_user',
            salesPointId: selectedSalesPointId || 'default_salespoint',
            notes: entry.notes,
            chatNotes: entry.chatNotes,
            sales: entry.sales,
            actions: entry.actions,
            hasProblem: entry.hasProblem,
            tags: entry.tags,
            focusReferencesData: entry.focusReferencesData,
          };
          
          // Aggiungi repeatSettings solo se è abilitato
          if (entry.repeatSettings && entry.repeatSettings.enabled) {
            updateData.repeatSettings = entry.repeatSettings;
          }
          if (entry.problemDescription) {
            updateData.problemDescription = entry.problemDescription;
          }
          
          const updatedEntry = await repository.updateCalendarEntry(editingEntry.id, updateData);
          dispatch({ type: 'UPDATE_ENTRY', payload: updatedEntry });
          dispatch({ type: 'UPDATE_SYNC_TIMESTAMP', payload: Date.now() });
        } else {
          // Crea nuovo entry
          // Prima verifica se esiste già un'entry per stessa data e stesso punto vendita
          const normalizedDate = (entry.date instanceof Date ? entry.date : new Date(entry.date))
            .toISOString()
            .split('T')[0];

          const sameDayEntries = state.entries.filter(e => {
            const eDateStr = (e.date instanceof Date ? e.date : new Date(e.date)).toISOString().split('T')[0];
            return e.salesPointId === (selectedSalesPointId || 'default_salespoint') && eDateStr === normalizedDate;
          });

          if (sameDayEntries.length > 0) {
            // Se esistono più entries nello stesso giorno, mantieni la più recente e rimuovi le altre
            const sortedByUpdate = [...sameDayEntries].sort((a, b) => {
              const ta = new Date((a.updatedAt || a.createdAt) as any).getTime();
              const tb = new Date((b.updatedAt || b.createdAt) as any).getTime();
              return tb - ta;
            });
            const entryToKeep = sortedByUpdate[0];
            if (!entryToKeep) {
              // In caso estremo non ci sono entry valide: procedi con creazione normale
              const createData: any = {
                date: entry.date,
                userId: selectedUserId || 'default_user',
                salesPointId: selectedSalesPointId || 'default_salespoint',
                notes: entry.notes,
                chatNotes: entry.chatNotes,
                sales: entry.sales,
                actions: entry.actions,
                hasProblem: entry.hasProblem,
                tags: entry.tags,
                focusReferencesData: entry.focusReferencesData,
              };
              if (entry.repeatSettings && entry.repeatSettings.enabled) {
                createData.repeatSettings = entry.repeatSettings;
              }
              if (entry.problemDescription) {
                createData.problemDescription = entry.problemDescription;
              }
              const newEntry = await repository.saveCalendarEntry(createData);
              dispatch({ type: 'ADD_ENTRY', payload: newEntry });
              return;
            }

            // Aggiorna quella da mantenere
            const updateData: any = {
              date: entry.date,
              userId: selectedUserId || 'default_user',
              salesPointId: selectedSalesPointId || 'default_salespoint',
              notes: entry.notes,
              chatNotes: entry.chatNotes,
              sales: entry.sales,
              actions: entry.actions,
              hasProblem: entry.hasProblem,
              tags: entry.tags,
              focusReferencesData: entry.focusReferencesData,
            };
            if (entry.repeatSettings && entry.repeatSettings.enabled) {
              updateData.repeatSettings = entry.repeatSettings;
            }
            if (entry.problemDescription) {
              updateData.problemDescription = entry.problemDescription;
            }
            const updatedEntry = await repository.updateCalendarEntry(entryToKeep.id, updateData);
            dispatch({ type: 'UPDATE_ENTRY', payload: updatedEntry });
            dispatch({ type: 'UPDATE_SYNC_TIMESTAMP', payload: Date.now() });

            // Elimina eventuali duplicati residui (conservativo)
            const duplicatesToDelete = sortedByUpdate.slice(1);
            for (const dup of duplicatesToDelete) {
              try {
                await repository.deleteCalendarEntry(dup.id);
                dispatch({ type: 'DELETE_ENTRY', payload: dup.id });
              } catch (e) {
                console.warn('Impossibile eliminare entry duplicata', dup.id, e);
              }
            }
          } else {
            const createData: any = {
            date: entry.date,
            userId: selectedUserId || 'default_user',
            salesPointId: selectedSalesPointId || 'default_salespoint',
            notes: entry.notes,
            chatNotes: entry.chatNotes,
            sales: entry.sales,
            actions: entry.actions,
            hasProblem: entry.hasProblem,
            tags: entry.tags,
            focusReferencesData: entry.focusReferencesData,
          };
          
          // Aggiungi repeatSettings solo se è abilitato
          if (entry.repeatSettings && entry.repeatSettings.enabled) {
            createData.repeatSettings = entry.repeatSettings;
          }
          
          if (entry.problemDescription) {
            createData.problemDescription = entry.problemDescription;
          }
          
          const newEntry = await repository.saveCalendarEntry(createData);
          dispatch({ type: 'ADD_ENTRY', payload: newEntry });
          dispatch({ type: 'UPDATE_SYNC_TIMESTAMP', payload: Date.now() });
          }
        }
        
        setShowEntryModal(false);
        setEditingEntry(undefined);
      } catch (error) {
        console.error('❌ MainCalendarPage: Errore salvataggio entry:', error);
        Alert.alert('Errore', 'Impossibile salvare l\'entry. Riprova.');
      }
    }, [editingEntry, selectedUserId, selectedSalesPointId, dispatch, repository]);

    const handleDeleteEntry = async (entryId: string) => {
      if (__DEV__) {
        console.log('🗑️ MainCalendarPage: Richiesta eliminazione entry:', entryId);
      }
      
      // Trova l'entry per mostrare il titolo nella conferma
      const entryToDelete = state.entries.find(e => e.id === entryId);
      const entryTitle = entryToDelete?.date?.toLocaleDateString() || 'Entry';
      
      // Dialog di conferma per eliminazione
      Alert.alert(
        'Conferma eliminazione',
        `Sei sicuro di voler eliminare l'entry del ${entryTitle}?\n\nQuesta azione non può essere annullata.`,
        [
          {
            text: 'Annulla',
            style: 'cancel',
            onPress: () => { if (__DEV__) { console.log('🚫 MainCalendarPage: Eliminazione annullata'); } }
          },
          {
            text: 'Elimina',
            style: 'destructive',
            onPress: async () => {
              if (__DEV__) { console.log('🗑️ MainCalendarPage: Confermata eliminazione entry:', entryId); }
              try {
                await repository.deleteCalendarEntry(entryId);
                dispatch({ type: 'DELETE_ENTRY', payload: entryId });
                dispatch({ type: 'UPDATE_SYNC_TIMESTAMP', payload: Date.now() });
                setShowEntryModal(false);
                setEditingEntry(undefined);
                
                // Notifica di successo
                Alert.alert('Successo', 'Entry eliminata correttamente.');
              } catch (error) {
                console.error('❌ MainCalendarPage: Errore eliminazione entry:', error);
                Alert.alert('Errore', 'Impossibile eliminare l\'entry. Riprova.');
              }
            }
          }
        ]
      );
    };

    const handleCancelEntry = () => {
      if (__DEV__) { console.log('❌ MainCalendarPage: Annullamento modal entry - FUNZIONE CHIAMATA'); }
      setShowEntryModal(false);
      setEditingEntry(undefined);
      if (__DEV__) { console.log('✅ MainCalendarPage: Modal chiuso con successo'); }
    };

    const navigateWeek = useCallback((direction: 'prev' | 'next') => {
      if (__DEV__) { console.log('⏮️ MainCalendarPage: Navigazione settimana', direction); }
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 3);
      } else {
        newDate.setDate(newDate.getDate() + 3);
      }
      setCurrentDate(newDate);
      if (__DEV__) {
        console.log('📅 MainCalendarPage: Nuova data settimana:', newDate.toISOString());
      }
    }, [currentDate]);

    const navigateMonth = useCallback((direction: 'prev' | 'next') => {
      if (__DEV__) { console.log('⏮️ MainCalendarPage: Navigazione mese', direction); }
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
      if (__DEV__) {
        console.log('📅 MainCalendarPage: Nuova data mese:', newDate.toISOString());
      }
    }, [currentDate]);

    // Swipe gesture minimalista con soglie conservative
    const isSwipingRef = useRef(false);
    const lastDxRef = useRef(0);
    const swipeThreshold = 30; // pixel orizzontali per considerare swipe
    const verticalTolerance = 15; // max movimento verticale
    const panResponder = useMemo(() => PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => {
        const should = Math.abs(g.dx) > 10 && Math.abs(g.dy) < verticalTolerance;
        if (!should) isSwipingRef.current = false;
        return should;
      },
      onPanResponderMove: (_e, g) => {
        lastDxRef.current = g.dx;
        if (Math.abs(g.dx) > swipeThreshold && Math.abs(g.dy) < verticalTolerance) {
          isSwipingRef.current = true;
        }
      },
      onPanResponderRelease: () => {
        if (!isSwipingRef.current) return;
        const dx = lastDxRef.current;
        if (dx > swipeThreshold) {
          calendarView === 'week' ? navigateWeek('prev') : navigateMonth('prev');
        } else if (dx < -swipeThreshold) {
          calendarView === 'week' ? navigateWeek('next') : navigateMonth('next');
        }
        isSwipingRef.current = false;
        lastDxRef.current = 0;
      },
      onPanResponderTerminationRequest: () => true,
    }), [calendarView, navigateWeek, navigateMonth]);



    const handleResetFilters = useCallback(() => {
      if (__DEV__) {
        console.log('🔄 MainCalendarPage: Reset filtri');
      }
      setSelectedUserId('');
      setSelectedSalesPointId('default');
      dispatch({
        type: 'UPDATE_FILTERS',
        payload: {
          userId: '',
          salesPointId: '',
        },
      });
      Alert.alert(
        'Filtri resettati',
        'I filtri sono stati resettati ai valori predefiniti'
      );
    }, [dispatch]);

    const handleResetAllData = useCallback(async () => {
      if (__DEV__) {
        console.log('🗑️ MainCalendarPage: Reset dati punto vendita');
        console.log('🔍 MainCalendarPage: selectedSalesPointId:', selectedSalesPointId);
      }
      
      // Verifica che ci sia un punto vendita selezionato
      if (!selectedSalesPointId || selectedSalesPointId === 'default') {
        console.log('❌ MainCalendarPage: Nessun punto vendita selezionato, mostrando alert');
        // Usa window.alert per ambiente web
        if (typeof window !== 'undefined') {
          window.alert('Nessun punto vendita selezionato\n\nSeleziona prima un punto vendita per poter resettare i suoi dati.');
        } else {
          Alert.alert(
            'Nessun punto vendita selezionato',
            'Seleziona prima un punto vendita per poter resettare i suoi dati.'
          );
        }
        return;
      }
      
      // Trova il nome del punto vendita selezionato
      const selectedSalesPoint = state.salesPoints.find(sp => sp.id === selectedSalesPointId);
      const salesPointName = selectedSalesPoint?.name || 'Punto vendita selezionato';
      
      // Conferma di sicurezza
      Alert.alert(
        'Conferma Reset',
        `Sei sicuro di voler cancellare tutti i dati inseriti per il punto vendita "${salesPointName}"?\n\nQuesta azione non può essere annullata.`,
        [
          {
            text: 'Annulla',
            style: 'cancel',
          },
          {
            text: 'Cancella Dati',
            style: 'destructive',
            onPress: async () => {
              try {
                // Recupera tutte le entries del calendario
                const allEntries = await repository.getCalendarEntries(
                  new Date(2020, 0, 1), // Data molto vecchia
                  new Date(2030, 11, 31), // Data molto futura
                );
                
                // Filtra solo le entries del punto vendita selezionato
                const entriesToDelete = allEntries.filter(entry => 
                  entry.salesPointId === selectedSalesPointId
                );
                
                if (entriesToDelete.length === 0) {
                  Alert.alert(
                    'Nessun dato da cancellare',
                    `Non ci sono dati inseriti per il punto vendita "${salesPointName}".`
                  );
                  return;
                }
                
                // Cancella solo le entries del punto vendita selezionato
                for (const entry of entriesToDelete) {
                  await repository.deleteCalendarEntry(entry.id);
                }
                
                // Aggiorna lo stato del context rimuovendo solo le entries cancellate
                const currentEntries = state.entries.filter(entry => 
                  entry.salesPointId !== selectedSalesPointId
                );
                dispatch({ type: 'SET_ENTRIES', payload: currentEntries });
                
                // Reset del sistema progressivo per evitare che mantenga dati precedenti del punto vendita
                try {
                  if (progressiveSystem && typeof progressiveSystem.resetSystem === 'function') {
                    progressiveSystem.resetSystem();
                  }
                  if (progressiveSystem && typeof progressiveSystem.resetInitialization === 'function') {
                    progressiveSystem.resetInitialization();
                  }
                } catch (e) {
                  console.warn('Reset sistema progressivo dopo reset dati fallito:', e);
                }

                // Resetta il sell-in per il punto vendita selezionato
                const updatedDailySellIn = { ...dailySellIn };
                Object.keys(updatedDailySellIn).forEach(date => {
                  // Rimuovi il sell-in per le date che hanno entries del punto vendita cancellato
                  const dateEntries = currentEntries.filter(entry => 
                    entry.date.toISOString().split('T')[0] === date
                  );
                  if (dateEntries.length === 0) {
                    delete updatedDailySellIn[date];
                  }
                });
                setDailySellIn(updatedDailySellIn);
                
                console.log('✅ MainCalendarPage: Reset completato, entries cancellate:', entriesToDelete.length);
                
                Alert.alert(
                  'Reset completato',
                  `Sono state cancellate ${entriesToDelete.length} entries del calendario per il punto vendita "${salesPointName}".\n\nGli altri dati sono stati mantenuti.`
                );
              } catch (error) {
                console.error('❌ MainCalendarPage: Errore durante il reset:', error);
                Alert.alert(
                  'Errore',
                  'Si è verificato un errore durante il reset dei dati'
                );
              }
            },
          },
        ]
      );
    }, [repository, dispatch, selectedSalesPointId, state.salesPoints, state.entries, dailySellIn]);

    const handleUserChange = (userId: string) => {
      if (__DEV__) { console.log('👤 MainCalendarPage: Cambio utente:', userId); }
      setSelectedUserId(userId);
    };

      const handleSalesPointChange = (salesPointId: string) => {
    if (__DEV__) { console.log('🏪 MainCalendarPage: Cambio punto vendita:', salesPointId); }
    setSelectedSalesPointId(salesPointId);
  };

  const handleAMCodeChange = (amCode: string) => {
    if (__DEV__) { console.log('👨‍💼 MainCalendarPage: Cambio AM Code:', amCode); }
    setSelectedAMCode(amCode);
  };

  const handleNAMCodeChange = (namCode: string) => {
    if (__DEV__) { console.log('👩‍💼 MainCalendarPage: Cambio NAM Code:', namCode); }
    setSelectedNAMCode(namCode);
  };

  const handleLineChange = (line: string) => {
    if (__DEV__) { console.log('📊 MainCalendarPage: Cambio Linea:', line); }
    setSelectedLine(line);
  };

  // Gestione filtri progressivi
  const handleMultipleSelectionChange = (items: string[]) => {
    if (__DEV__) { console.log('🔍 MainCalendarPage: Cambio selezione multipla:', items); }
    
    // RESET IMMEDIATO E DRAMMATICO
    if (__DEV__) { console.log('💥 MainCalendarPage: RESET DRAMMATICO - Cambio filtro rilevato'); }
    
    // 1. Evita wipe immediato delle entries per ridurre jank (si ricaricheranno se serve)
    
    // 2. Reset focusReferencesStore
    focusReferencesStore.clearFocusReferences();
    
    // 3. Reset sistema progressivo
    if (progressiveSystem && typeof progressiveSystem.resetSystem === 'function') {
      progressiveSystem.resetSystem();
    }
    
    // 3.5. Reset inizializzazione sistema progressivo
    if (progressiveSystem && typeof progressiveSystem.resetInitialization === 'function') {
      progressiveSystem.resetInitialization();
    }
    
    // 4. Reset tooltip modal
    setShowTooltipModal(false);
    setTooltipType('stock');
    setTooltipDate('');
    setTooltipEntry(undefined);
    
    // 5. Pulisci TUTTA la cache
    if (typeof localStorage !== 'undefined') {
      // Pulisci solo chiavi rilevanti per evitare cache thrash
      localStorage.removeItem('calendar_entries');
      if (__DEV__) { console.log('🧹 MainCalendarPage: Cache entries pulita'); }
    }
    
    // 6. Aggiorna i filtri
    setSelectedFilterItems(items);
    
    // 7. Reset selectedSalesPointId - usa null invece di stringa vuota
    if (items.length === 0) {
      setSelectedSalesPointId('default');
    }
    
    // 8. Ricarica i dati se c'è un punto vendita selezionato (senza delay)
    if (selectedSalesPointId && selectedSalesPointId !== 'default') {
      if (__DEV__) { console.log('🔄 MainCalendarPage: Ricaricamento dati immediato dopo cambio filtri'); }
      loadInitialData({ showOverlayOnly: true });
    }
  };

  // Funzione per ottenere i dati filtrati in base ai filtri progressivi
  const getFilteredData = useMemo(() => {
    if (!selectedFilterItems || selectedFilterItems.length === 0) {
      return {
        filteredAgents: agents,
        filteredSalesPoints: state.salesPoints,
        filteredExcelRows: excelRows,
        autoDetectedAgent: null,
        autoDetectedSalesPoint: null,
      };
    }

    // Rimuovo log verboso per performance in produzione
    
    // Filtra i dati Excel in base alle selezioni
    const filteredExcelRows = excelRows.filter((row: any) => {
      const matches = selectedFilterItems.every((selectedItem: string) => {
        // Exact match
        let itemMatch = (
          row.linea === selectedItem ||
          row['amCode'] === selectedItem ||
          row['namCode'] === selectedItem ||
          row['agenteCode'] === selectedItem ||
          row['insegnaCliente'] === selectedItem ||
          row.codiceCliente === selectedItem ||
          row.cliente === selectedItem
        );
        
        // Fuzzy match per codici simili (es. "AM Ma9" vs "AM Pe6")
        if (!itemMatch && selectedItem?.startsWith('AM ')) {
          itemMatch = row['amCode']?.startsWith('AM ') || false;
        }
        if (!itemMatch && selectedItem?.startsWith('NAM ')) {
          itemMatch = row['namCode']?.startsWith('NAM ') || false;
        }
        
        // Logging mismatch disattivato per stabilità (evita setInterval e Set globali)
        
        return itemMatch;
      });
      
      return matches;
    });

    // Estrai agenti e punti vendita dai dati filtrati
    const filteredAgents = agents.filter((agent: any) => {
      return filteredExcelRows?.some(row => 
        row['agenteCode'] === agent.code ||
        row['amCode'] === agent.amCode ||
        row['namCode'] === agent.namCode ||
        row.linea === agent.line
      ) || false;
    });

    const filteredSalesPoints = state.salesPoints.filter(salesPoint => {
      return filteredExcelRows?.some(row => 
        row.codiceCliente === salesPoint.id ||
        row['insegnaCliente'] === salesPoint.name ||
        row.cliente === salesPoint.name
      ) || false;
    });

    // Logica per trovare automaticamente agente e punto vendita
    let autoDetectedAgent = null;
    let autoDetectedSalesPoint = null;

    // Se abbiamo selezionato un punto vendita (tramite filtri o selectedSalesPointId), trova l'agente associato
    const selectedSalesPoint = selectedFilterItems.find((item: string) => {
      return filteredExcelRows?.some(row => 
        row['insegnaCliente'] === item ||
        row.codiceCliente === item ||
        row.cliente === item
      ) || false;
    });
    
    // SOLUZIONE SEMPLICE: Se nei filtri c'è qualcosa che sembra un punto vendita, usalo
    let effectiveSalesPoint = selectedSalesPoint;
    let forcedSalesPointId = null;
    
    // Cerca nei selectedFilterItems qualcosa che potrebbe essere un punto vendita
    if (!effectiveSalesPoint && selectedFilterItems && selectedFilterItems.length > 0) {
      // Prova l'ultimo item selezionato (spesso è il punto vendita)
       const lastItem = selectedFilterItems[selectedFilterItems.length - 1];
       const matchingRow = excelRows.find((row: any) => 
        row.cliente === lastItem || 
        row['insegnaCliente'] === lastItem ||
        row.codiceCliente === lastItem
      );
      
      if (matchingRow) {
        effectiveSalesPoint = lastItem;
        forcedSalesPointId = matchingRow.codiceCliente;
        logger.debug('AgentMatcher', 'Punto vendita forzato nei filtri', {
          lastItem,
          forcedSalesPointId,
          matchingRow: {
            cliente: matchingRow.cliente,
            codiceCliente: matchingRow.codiceCliente
          }
        });
      }
    }

    if (effectiveSalesPoint) {
      // Trova l'agente associato a questo punto vendita
      const relatedRow = filteredExcelRows.find(row => 
        row['insegnaCliente'] === effectiveSalesPoint ||
        row.codiceCliente === effectiveSalesPoint ||
        row.cliente === effectiveSalesPoint ||
        (selectedSalesPointId && row.codiceCliente === selectedSalesPointId)
      );

      if (relatedRow) {
        autoDetectedAgent = {
          id: relatedRow['agenteCode'], // Aggiungo id per compatibilità con setSelectedUserId
          code: relatedRow['agenteCode'],
          name: relatedRow['agenteName'],
          amCode: relatedRow['amCode'],
          namCode: relatedRow['namCode'],
          line: relatedRow.linea,
        };
        autoDetectedSalesPoint = {
          id: forcedSalesPointId || relatedRow.codiceCliente,
          name: relatedRow['insegnaCliente'],
        };
        logger.info('AgentMatcher', 'Agente rilevato automaticamente', { agent: autoDetectedAgent });
      }
    }

    logger.debug('AgentMatcher', 'Dati filtrati', {
      agents: filteredAgents?.length || 0,
      salesPoints: filteredSalesPoints?.length || 0,
      excelRows: filteredExcelRows?.length || 0,
      autoDetectedAgent: autoDetectedAgent?.code,
      autoDetectedSalesPoint: autoDetectedSalesPoint?.name,
      selectedFilterItemsCount: selectedFilterItems?.length || 0
    });

    return {
      filteredAgents,
      filteredSalesPoints,
      filteredExcelRows,
      autoDetectedAgent,
      autoDetectedSalesPoint,
    };
  }, [selectedFilterItems, agents, state.salesPoints, excelRows]);

  // Ottieni i dati filtrati (usa solo ciò che serve per evitare re-render inutili)
      const { autoDetectedAgent } = getFilteredData;

      // LOGICA SEMPLICE: Cerca sempre un punto vendita e agente nei filtri selezionati
  useEffect(() => {
    if (selectedFilterItems && selectedFilterItems.length > 0) {
      // Cerca punto vendita
      for (const item of selectedFilterItems) {
        const matchingRow = excelRows.find(row => 
          row.cliente === item || 
          row['insegnaCliente'] === item ||
          row.codiceCliente === item
        );
        
        if (matchingRow) {
          const salesPointId = matchingRow.codiceCliente;
          if (selectedSalesPointId !== salesPointId) {
            setSelectedSalesPointId(salesPointId || 'default');
          }
          break;
        }
      }
      
      // Cerca agente
      for (const item of selectedFilterItems) {
        const matchingRow = excelRows.find(row => 
          row.codiceAgente === item ||
          row.nomeAgente === item
        );
        
        if (matchingRow) {
          const agentId = matchingRow.codiceAgente;
          if (selectedUserId !== agentId) {
            setSelectedUserId(agentId || '');
          }
          break;
        }
      }
    }
  }, [selectedFilterItems, excelRows, selectedSalesPointId, selectedUserId]);

  // Aggiorna selectedUserId se viene rilevato automaticamente un agente (mantieni per compatibilità)
  useEffect(() => {
    if (autoDetectedAgent) {
      console.log('🔍 MainCalendarPage: Impostazione automatica selectedUserId:', autoDetectedAgent.id);
      setSelectedUserId(autoDetectedAgent.id);
    }
  }, [autoDetectedAgent]);

  // Ricarica i dati quando cambia il punto vendita selezionato
  useEffect(() => {
    if (__DEV__) { console.log('🔄 MainCalendarPage: Cambio punto vendita, selectedSalesPointId:', selectedSalesPointId); }
    
    // Evita wipe immediato delle entries; verranno sovrascritte al termine del caricamento
    
    // Reset del focusReferencesStore
    focusReferencesStore.clearFocusReferences();
    
    // Reset del sistema progressivo
    if (progressiveSystem.resetSystem) {
      progressiveSystem.resetSystem();
    }
    
    // Pulisci la cache locale prima di ricaricare
    const clearLocalCache = async () => {
      try {
        // Pulisci solo le entries dal localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('calendar_entries');
          if (__DEV__) { console.log('🧹 MainCalendarPage: Cache locale pulita'); }
        }
      } catch (error) {
        console.warn('⚠️ MainCalendarPage: Errore pulizia cache:', error);
      }
    };
    
    clearLocalCache().then(() => {
      // Ricarica i dati solo se c'è un punto vendita selezionato
      if (selectedSalesPointId && selectedSalesPointId !== 'default') {
        loadInitialData({ showOverlayOnly: true });
      }
    });
  }, [selectedSalesPointId]);

    // Gestione tooltip
    /* const handleTooltipPress = (type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => {
      if (__DEV__) { console.log('🔧 MainCalendarPage: Apertura tooltip:', type, 'per data:', date); }
      
      // Prova prima con l'entry originale
      if (__DEV__) { console.log('🔧 MainCalendarPage: Entry originale:', entry?.id, 'chatNotes:', entry?.chatNotes?.length || 0); }
      
      // Recupera l'entry corretta dalle entries filtrate usando la data
      const correctEntry = filteredCalendarEntries.find(e => {
        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
        return entryDate.toISOString().split('T')[0] === date;
      });
      
      if (__DEV__) { console.log('🔧 MainCalendarPage: Entry filtrata:', correctEntry?.id, 'chatNotes:', correctEntry?.chatNotes?.length || 0); }
      
      // Prova anche con tutte le entries non filtrate dal calendario context
      const allEntries = state.entries;
      const entryFromContext = allEntries.find(e => {
        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
        return entryDate.toISOString().split('T')[0] === date && 
               e.salesPointId === selectedSalesPointId;
      });
      
      if (__DEV__) { console.log('🔧 MainCalendarPage: Entry dal context:', entryFromContext?.id, 'chatNotes:', entryFromContext?.chatNotes?.length || 0); }
      
      // Usa l'entry che ha più dati (priorità: context > filtrata > originale)
      const finalEntry = entryFromContext || correctEntry || entry;
      if (__DEV__) { console.log('🔧 MainCalendarPage: Entry finale scelta:', finalEntry?.id, 'chatNotes:', finalEntry?.chatNotes?.length || 0); }
      
      setTooltipType(type);
      setTooltipDate(date);
      setTooltipEntry(finalEntry);
      setShowTooltipModal(true);
    }; */

    /* const handleSellInChange = (date: string, sellIn: number) => {
      setDailySellIn(prev => ({
        ...prev,
        [date]: sellIn
      }));
    }; */

    const handleTooltipClose = () => {
      if (__DEV__) { console.log('🔧 MainCalendarPage: Chiusura tooltip'); }
      setShowTooltipModal(false);
      setTooltipType('stock');
      setTooltipDate('');
      setTooltipEntry(undefined);
    };

    const handleTooltipUpdateEntry = async (updatedEntry: CalendarEntry) => {
      try {
        if (__DEV__) { console.log('💬 MainCalendarPage: Aggiornamento entry dal tooltip:', updatedEntry.id); }
        
        // Prepara i dati per l'aggiornamento
        const updateData = {
          chatNotes: updatedEntry.chatNotes || [],
          updatedAt: new Date(),
        };
        
        await repository.updateCalendarEntry(updatedEntry.id, updateData);
        dispatch({ type: 'UPDATE_ENTRY', payload: updatedEntry });
        
        // Aggiorna anche l'entry nel tooltip se è lo stesso
        if (tooltipEntry?.id === updatedEntry.id) {
          setTooltipEntry(updatedEntry);
        }
      } catch (error) {
        console.error('❌ MainCalendarPage: Errore aggiornamento entry dal tooltip:', error);
        Alert.alert('Errore', 'Impossibile aggiornare l\'entry. Riprova.');
      }
    };

    // Helper per ottenere il nome del punto vendita
    const getSalesPointName = (salesPointId?: string): string => {
      if (!salesPointId) return 'Punto Vendita';
      
      const salesPoint = state.salesPoints.find(sp => sp.id === salesPointId);
      if (salesPoint) return salesPoint.name;
      
      // Cerca nei dati Excel se non trovato nei sales points
      const excelMatch = excelRows.find(row => row.codiceCliente === salesPointId);
      return excelMatch?.cliente || 'Punto Vendita';
    };

    // Funzione per copiare i tag da una data esistente
    const copyTagsFromDate = (sourceDate: string) => {
      const sourceEntry = state.entries.find(entry => {
        const entryDate = new Date(entry.date).toISOString().split('T')[0];
        return entryDate === sourceDate;
      });

        if (sourceEntry && sourceEntry.tags && sourceEntry.tags.length > 0) {
        if (__DEV__) { console.log('📋 MainCalendarPage: Copiando tag da', sourceDate, ':', sourceEntry.tags); }
        return sourceEntry.tags;
      }

      return [];
    };



    // Rimuoviamo questo log che causa re-render continui
    // console.log('🎨 MainCalendarPage: Rendering componente con stato:', {
    //   isLoading,
    //   calendarView,
    //   entriesCount: state.entries.length,
    //   showFilters,
    // });
    


    if (isLoading) {
      if (__DEV__) { console.log('⏳ MainCalendarPage: Mostrando loading screen'); }
      return (
        <SafeAreaView style={styles.loadingContainer}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.warmSecondary}
          />
          <View style={styles.loadingContent}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Caricamento dati…</Text>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    // Rimuoviamo questo log che causa re-render continui
    // console.log('✅ MainCalendarPage: Rendering componente principale');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.1)" translucent={true} />



        {/* HEADER MIGLIORATO - ORGANIZZAZIONE PROGETTO */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>📅 Calendario Vendite</Text>
            </View>
            <View style={styles.headerControls}>
              
              <TouchableOpacity
                style={[
                  styles.viewButtonPastel,
                  calendarView === 'week' && styles.viewButtonPastelActive,
                ]}
                onPress={() => {
                  console.log('📅 MainCalendarPage: Cambio vista a settimana');
                  setCalendarView('week');
                }}
                accessibilityLabel="Vista Settimanale"
                accessibilityHint="Passa alla vista settimanale per gestione dettagliata"
              >
                <Text style={styles.viewButtonPastelText}>
                  📅
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewButtonPastel,
                  calendarView === 'month' && styles.viewButtonPastelActive,
                ]}
                onPress={() => {
                  console.log('📆 MainCalendarPage: Cambio vista a mese');
                  setCalendarView('month');
                }}
                accessibilityLabel="Vista Mensile"
                accessibilityHint="Passa alla vista mensile per riepilogo organizzazione"
              >
                <Text style={styles.viewButtonPastelText}>
                  📆
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterButtonPastel}
                onPress={async () => {
                  console.log('🔍 MainCalendarPage: Apertura filtri');
                  // Ricarica i dati Excel prima di aprire i filtri
                  await reloadExcelData();
                  setShowFilters(true);
                }}
                accessibilityLabel="Filtri"
                accessibilityHint="Apri i filtri per personalizzare la vista"
              >
                <Text style={styles.filterButtonPastelText}>🔍</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigazione migliorata */}
          <View style={styles.navigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                calendarView === 'week'
                  ? navigateWeek('prev')
                  : navigateMonth('prev')
              }
            >
              <Text style={styles.navButtonText}>◀</Text>
            </TouchableOpacity>
            <View style={styles.navTitle}>
              <Text style={styles.navTitleText}>
                {currentDate.toLocaleDateString('it-IT', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                calendarView === 'week'
                  ? navigateWeek('next')
                  : navigateMonth('next')
              }
            >
              <Text style={styles.navButtonText}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todayPill}
              onPress={() => {
                setCurrentDate(new Date());
              }}
              accessibilityLabel="Oggi"
              accessibilityHint="Torna rapidamente alla data odierna"
            >
              <Text style={styles.todayPillText}>Oggi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEZIONE FILTRI ATTIVI */}
        {selectedFilterItems && selectedFilterItems.length > 0 && (
          <View style={styles.activeFiltersContainer}>
            <View style={styles.activeFiltersHeader}>
              <Text style={styles.activeFiltersTitle}>🔍 Filtri Attivi</Text>
              <Text style={styles.activeFiltersCount}>({selectedFilterItems?.length || 0} selezioni)</Text>
              <TouchableOpacity
                onPress={handleResetFilters}
                accessibilityLabel="Pulisci filtri"
                style={styles.clearFiltersButton}
              >
                <Text style={styles.clearFiltersButtonText}>Pulisci</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activeFiltersContent}>
              <View style={styles.filteredDataInfo}>
                <Text style={styles.filteredDataText}>
                  👤 Agenti: {selectedUserId ? 1 : 0} | 🏪 Punti Vendita: {selectedSalesPointId ? 1 : 0}
                </Text>

              </View>
              <View style={styles.selectedFiltersList}>
                {selectedFilterItems.map((item: string, index: number) => (
                  <View key={index} style={styles.selectedFilterItem}>
                    <Text style={styles.selectedFilterText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* CALENDARIO - OCCUPA TUTTO LO SPAZIO DISPONIBILE TRA HEADER E FOOTER */}
        <View style={styles.calendarContainer} {...panResponder.panHandlers}>
          {calendarView === 'week' ? (
            <WeekCalendar
              currentDate={currentDate}
              entries={filteredCalendarEntries}
              selectedDate={selectedDate}
              selectedSalesPointId={selectedSalesPointId}
              onDayPress={(d) => { if (!isSwipingRef.current) onDayPress(d); }}
              onTooltipPress={(type, date, entry) => {
                setTooltipType(type);
                setTooltipDate(date);
                setTooltipEntry(entry);
                setShowTooltipModal(true);
              }}
            />
          ) : (
            <VirtualizedMonthCalendar
              currentDate={currentDate}
              entries={filteredCalendarEntries}
              selectedDate={selectedDate}
              selectedSalesPointId={selectedSalesPointId}
              onDayPress={(d) => { if (!isSwipingRef.current) onDayPress(d); }}
              onTooltipPress={(type, date, entry) => {
                setTooltipType(type);
                setTooltipDate(date);
                setTooltipEntry(entry);
                setShowTooltipModal(true);
              }}
            />
          )}
        </View>

        {/* TEMPORANEO: Test Componenti - DISABILITATO */}
        {/* <View style={styles.testContainer}>
          <InputFieldTest />
        </View> */}
        {/* <View style={styles.testContainer}>
          <DatePickerTest />
        </View> */}

        {/* FOOTER MIGLIORATO - STATISTICHE E AZIONI */}
        <View style={styles.footer}>
          <View style={styles.footerStats}>
            <TouchableOpacity style={styles.kpiCard} onPress={() => Alert.alert('Dettaglio', `Entries: ${filteredCalendarEntries.length}`)}>
              <Text style={styles.kpiTitle}>Entries</Text>
              <Text style={styles.kpiValue}>{filteredCalendarEntries.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.kpiCard} onPress={() => Alert.alert('Dettaglio', `Sell-In cliente: €${Math.round(calendarTotals.filtered.sellInTotal)}`)}>
              <Text style={styles.kpiTitle}>Sell-In</Text>
              <Text style={styles.kpiValue}>€{Math.round(calendarTotals.filtered.sellInTotal)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.kpiCard} onPress={() => Alert.alert('Dettaglio', `Sell-In mese: €${Math.round(calendarTotals.filtered.sellInMonth)}`)}>
              <Text style={styles.kpiTitle}>Sell-In Mese</Text>
              <Text style={styles.kpiValue}>€{Math.round(calendarTotals.filtered.sellInMonth)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.kpiCard} onPress={() => Alert.alert('Dettaglio', `Azioni totali: ${calendarTotals.filtered.actionsTotal}`)}>
              <Text style={styles.kpiTitle}>Azioni</Text>
              <Text style={styles.kpiValue}>{calendarTotals.filtered.actionsTotal}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetAllData}
            >
              <Text style={styles.resetButtonText}>🗑️ Reset Dati</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Filtri */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowFilters(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtri</Text>
              </View>
              <FilterComponents
                users={state.users}
                salesPoints={state.salesPoints}
                agents={agents}
                selectedUserId={selectedUserId}
                selectedSalesPointId={selectedSalesPointId}
                selectedAMCode={selectedAMCode}
                selectedNAMCode={selectedNAMCode}
                selectedLine={selectedLine}
                selectedItems={selectedFilterItems}
                onUserChange={handleUserChange}
                onSalesPointChange={handleSalesPointChange}
                onAMCodeChange={handleAMCodeChange}
                onNAMCodeChange={handleNAMCodeChange}
                onLineChange={handleLineChange}
                onMultipleSelectionChange={handleMultipleSelectionChange}
                onReset={handleResetFilters}
                onClose={() => {
                  setShowFilters(false);
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Modal per inserimento/modifica entry */}
        <EntryFormModal
          visible={showEntryModal}
          entry={editingEntry}
          selectedDate={selectedDate}
          userId={selectedUserId || 'default_user'}
          salesPointId={selectedSalesPointId || 'default_salespoint'}
          onSave={handleSaveEntry}
          onCancel={handleCancelEntry}
          onDelete={handleDeleteEntry}
          onCopyTags={copyTagsFromDate}
        />

        {/* Modal per tooltip grafici */}
        <TooltipModal
          visible={showTooltipModal}
          type={tooltipType}
          entry={tooltipEntry}
          date={tooltipDate}
          onClose={handleTooltipClose}
          onUpdateEntry={handleTooltipUpdateEntry}
          activeFilters={{
            selectedUserId,
            selectedSalesPointId,
            selectedAMCode,
            selectedNAMCode,
            selectedLine,
            selectedFilterItems,
          }}
          users={state.users}
          salesPoints={state.salesPoints}
          agents={agents}
          excelRows={excelRows}
          userId={selectedUserId || "default_user"}
          salesPointName={getSalesPointName(selectedSalesPointId)}
        />

        <LoadingOverlay visible={filterReloading} message="Aggiornamento dati..." />
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.warmSecondary,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.warmBackground,
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.large,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
      default: { elevation: 5 },
    }),
  },
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: Colors.warmPrimary,
    paddingHorizontal: Spacing.medium,
    paddingTop: Spacing.small,
    paddingBottom: Spacing.small,
    minHeight: 90, // Aumentato per dare più spazio
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
    minHeight: 40, // Altezza minima per evitare tagli
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.small,
  },
  title: {
    fontSize: 18, // Aumentato per maggiore leggibilità
    fontWeight: 'bold',
    color: Colors.warmBackground,
    marginBottom: 2,
  },
  // subtitle rimosso
  headerControls: {
    flexDirection: 'row',
    gap: Spacing.small,
    alignItems: 'center',
  },
  viewButtonPastel: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  viewButtonPastelActive: {
    backgroundColor: Colors.warmBackground,
  },
  viewButtonPastelText: {
    color: Colors.warmPrimary,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  filterButtonPastel: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  filterButtonPastelText: {
    color: Colors.warmPrimary,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  navButton: {
    backgroundColor: Colors.warmBackground,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  navButtonText: {
    color: Colors.warmPrimary,
    fontSize: 16, // Aumentato per maggiore leggibilità
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navTitle: {
    alignItems: 'center',
    flex: 1, // Occupa tutto lo spazio disponibile
    paddingHorizontal: Spacing.small,
  },
  navTitleText: {
    fontSize: 16, // Aumentato per maggiore leggibilità
    fontWeight: 'bold',
    color: Colors.warmBackground,
    textAlign: 'center',
  },
  navSubtitle: {
    fontSize: 11,
    color: Colors.warmBackground,
    opacity: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  todayPill: {
    marginLeft: Spacing.small,
    backgroundColor: Colors.warmBackground,
    borderRadius: 14,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
  },
  todayPillText: {
    color: Colors.warmPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  calendarContainer: {
    flex: 1, // OCCUPA TUTTO LO SPAZIO DISPONIBILE
    backgroundColor: Colors.warmBackground,
  },
  // Stili per la sezione filtri attivi
  activeFiltersContainer: {
    backgroundColor: Colors.warmSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warmBorder,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.small,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.warmPrimary,
  },
  activeFiltersCount: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
  },
  clearFiltersButton: {
    backgroundColor: Colors.warmBackground,
    borderRadius: 12,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    marginLeft: Spacing.small,
  },
  clearFiltersButtonText: {
    color: Colors.warmPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeFiltersContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filteredDataInfo: {
    flex: 1,
  },
  filteredDataText: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
  },
  selectedFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  selectedFilterItem: {
    backgroundColor: Colors.warmPrimary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  selectedFilterText: {
    fontSize: 10,
    color: Colors.warmBackground,
    fontWeight: '500',
  },
  testContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.warmSurface,
    padding: Spacing.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.small,
    backgroundColor: Colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.warmBorder,
    minHeight: 54,
  },
  resetButton: {
    backgroundColor: Colors.warmError,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.warmBackground,
  },

  footerText: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.warmSuccess,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.warmBackground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.warmBackground,
    borderRadius: 12,
    margin: Spacing.large,
    maxHeight: Platform.OS === 'web' ? 700 : '80%',
    width: Platform.OS === 'web' ? '95%' : '90%',
    ...Platform.select({
      web: {
        minHeight: 600,
        maxWidth: 900,
      },
    }),
  },
  modalHeader: {
    backgroundColor: Colors.warmPrimary,
    padding: Spacing.medium,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.warmBackground,
  },
  closeButton: {
    backgroundColor: Colors.warmSurface,
    padding: Spacing.medium,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.warmBorder,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warmTextSecondary,
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.small,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.warmBackground,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  kpiTitle: {
    fontSize: 10,
    color: Colors.warmTextSecondary,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.warmPrimary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.small,
  },

});
