import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getTagById } from '../../constants/Tags';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';
import { logger } from '../../utils/logger';
import { useRepository } from '../../hooks/useRepository';

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
  
  const getFocusReferenceById = (id: string) => {
    return focusReferencesStore.getAllReferences().find(ref => ref.id === id);
  };
  
  const getNetPrice = (referenceId: string): string => {
    const netPrices = focusReferencesStore.getNetPrices();
    const netPrice = netPrices[referenceId];
    return netPrice || '0';
  };
  if (__DEV__) {
    // Rimuoviamo questo log che causa re-render continui
    // console.log('✅ MainCalendarPage: useCalendar hook eseguito con successo');
  }
  
  // Stati locali (non filtri)
  const [isLoading, setIsLoading] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filtri con Zustand
  const {
    selectedDate,
    selectedUserId,
    selectedSalesPointId,
    selectedAMCode,
    selectedNAMCode,
    selectedLine,
    selectedFilterItems,
    showFilters,
    agents,
    setSelectedDate,
    setSelectedUserId,
    setSelectedSalesPointId,
    setSelectedAMCode,
    setSelectedNAMCode,
    setSelectedLine,
    setSelectedItems: setSelectedFilterItems,
    setShowFilters,
    setAgents,
  } = useFiltersStore();

  // Dati Excel da Firebase
  const { excelData: excelRows, isLoading: excelDataLoading, reloadData: reloadExcelData } = useFirebaseExcelData();
  
  // Debug: log dei dati caricati
  useEffect(() => {
    console.log('📊 MainCalendarPage: Excel data caricati:', excelRows.length);
    console.log('📊 MainCalendarPage: Calendar entries:', state.entries.length);
    console.log('📊 MainCalendarPage: Excel loading:', excelDataLoading);
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
  const getFilteredEntries = useCallback(() => {
    const filtersState = useFiltersStore.getState();
    return state.entries.filter(entry => {
      if (filtersState.selectedSalesPointId && entry.salesPointId !== filtersState.selectedSalesPointId) return false;
      if (filtersState.selectedUserId && entry.userId !== filtersState.selectedUserId) return false;
      if (filtersState.selectedDate) {
        // Gestisci il caso in cui entry.date potrebbe essere una stringa
        let entryDate: Date;
        if (entry.date instanceof Date) {
          entryDate = entry.date;
        } else if (typeof entry.date === 'string') {
          entryDate = new Date(entry.date);
        } else {
          // Se non è né Date né stringa, salta questa entry
          return false;
        }
        
        const entryDateString = entryDate.toISOString().split('T')[0];
        if (entryDateString !== filtersState.selectedDate) return false;
      }
      return true;
    });
  }, [state.entries]);

  // Memoizzo le entries filtrate per evitare ricalcoli inutili
  const filteredCalendarEntries = useMemo(() => {
    const filtersState = useFiltersStore.getState();
    
    // SOLUZIONE SEMPLICE: Se c'è un punto vendita selezionato, usa SOLO quello
    // Ignora completamente tutti gli altri filtri (userId, AM, NAM, etc.)
    if (filtersState.selectedSalesPointId && filtersState.selectedSalesPointId !== 'default') {
      const filteredEntries = state.entries.filter(entry => {
        return entry.salesPointId === filtersState.selectedSalesPointId;
      });
      
      // Log rimosso per performance - decommentare solo per debug
      // console.log('🎯 getCalendarEntries: SOLO PUNTO VENDITA:', {
      //   selectedSalesPointId: filtersState.selectedSalesPointId,
      //   filteredEntries: filteredEntries.length,
      // });
      
      return filteredEntries;
    }
    
    // Se NON c'è punto vendita, usa la logica originale
    const filteredEntries = state.entries.filter(entry => {
      if (filtersState.selectedUserId && entry.userId !== filtersState.selectedUserId) {
        return false;
      }
      return true;
    });
    
    return filteredEntries;
  }, [state.entries, selectedSalesPointId, selectedUserId]);

  // Funzione per ottenere tutte le entries per le viste calendario (senza filtro data)
  const getCalendarEntries = useCallback(() => {
    return filteredCalendarEntries;
  }, [filteredCalendarEntries]);
  


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
      if (navigation?.addListener) {
        const unsubscribe = navigation.addListener('focus', () => {
          logger.ui('Pagina attiva, ricaricamento dati Excel');
          reloadExcelData();
        });

        return unsubscribe;
      }
    }, [navigation, reloadExcelData]);

    const loadInitialData = async () => {
      logger.business('Inizio caricamento dati iniziali');
      try {
        setIsLoading(true);
        dispatch({ type: 'SET_LOADING', payload: true });

        logger.data('Caricamento utenti...');
        const users = await repository.getUsers();
        logger.data('Utenti caricati', { count: users.length });

        logger.data('Caricamento punti vendita...');
        const salesPoints = await repository.getSalesPoints();
        console.log(
          '✅ MainCalendarPage: Punti vendita caricati:',
          salesPoints.length
        );

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
        console.log('✅ MainCalendarPage: Agents estratti:', agentsData.length);

        // Dati Excel ora caricati automaticamente dal hook useFirebaseExcelData
        console.log('📊 MainCalendarPage: Dati Excel disponibili:', excelRows.length, 'righe');
        
        // Carica le referenze focus (statiche + configurazioni globali)
        console.log('🔍 MainCalendarPage: Caricamento referenze focus...');
        focusReferencesStore.loadAllReferences();
        await focusReferencesStore.loadFocusReferencesFromFirestore();
        console.log('✅ MainCalendarPage: Referenze focus caricate');

        // Carica entries del periodo corrente (esteso per includere più giorni)
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Dal mese precedente
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Al mese successivo

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
        
        // LOGICA PRIORITARIA: Se c'è punto vendita, ignora userId (come nella vista calendario)
        let entries;
        if (selectedSalesPointId && selectedSalesPointId !== 'default') {
          console.log('🎯 MainCalendarPage: Caricamento SOLO per punto vendita:', selectedSalesPointId);
          entries = await repository.getCalendarEntries(
            startDate, 
            endDate, 
            undefined,  // Ignora userId quando c'è salesPointId
            selectedSalesPointId
          );
        } else {
          console.log('🔍 MainCalendarPage: Caricamento con filtri normali');
          entries = await repository.getCalendarEntries(
            startDate, 
            endDate, 
            selectedUserId || undefined,
            undefined  // No salesPointId se non selezionato
          );
        }
        console.log('✅ MainCalendarPage: Entries caricati:', entries.length);
        console.log('✅ MainCalendarPage: Dettagli entries:', entries.map(entry => ({
          id: entry.id,
          date: entry.date,
          focusReferencesData: entry.focusReferencesData,
          focusReferencesCount: entry.focusReferencesData?.length || 0,
          focusReferencesDataRaw: JSON.stringify(entry.focusReferencesData),
        })));

        dispatch({ type: 'SET_ENTRIES', payload: entries });

        console.log(
          '🎉 MainCalendarPage: Caricamento dati completato con successo'
        );
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
        setIsLoading(false);
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('🏁 MainCalendarPage: Caricamento dati terminato');
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
    const showDayDetails = (entries: CalendarEntry[]) => {
      console.log(
        '📋 MainCalendarPage: Mostrando dettagli per',
        entries.length,
        'entries'
      );
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
    };

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
        } else {
          // Crea nuovo entry
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
        }
        
        setShowEntryModal(false);
        setEditingEntry(undefined);
      } catch (error) {
        console.error('❌ MainCalendarPage: Errore salvataggio entry:', error);
        Alert.alert('Errore', 'Impossibile salvare l\'entry. Riprova.');
      }
    }, [editingEntry, selectedUserId, selectedSalesPointId, dispatch, repository]);

    const handleDeleteEntry = async (entryId: string) => {
      console.log('🗑️ MainCalendarPage: Richiesta eliminazione entry:', entryId);
      
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
            onPress: () => console.log('🚫 MainCalendarPage: Eliminazione annullata')
          },
          {
            text: 'Elimina',
            style: 'destructive',
            onPress: async () => {
              console.log('🗑️ MainCalendarPage: Confermata eliminazione entry:', entryId);
              try {
                await repository.deleteCalendarEntry(entryId);
                dispatch({ type: 'DELETE_ENTRY', payload: entryId });
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
      console.log('❌ MainCalendarPage: Annullamento modal entry - FUNZIONE CHIAMATA');
      setShowEntryModal(false);
      setEditingEntry(undefined);
      console.log('✅ MainCalendarPage: Modal chiuso con successo');
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
      console.log('⏮️ MainCalendarPage: Navigazione settimana', direction);
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      setCurrentDate(newDate);
      console.log(
        '📅 MainCalendarPage: Nuova data settimana:',
        newDate.toISOString()
      );
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      console.log('⏮️ MainCalendarPage: Navigazione mese', direction);
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
      console.log(
        '📅 MainCalendarPage: Nuova data mese:',
        newDate.toISOString()
      );
    };



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
      console.log('👤 MainCalendarPage: Cambio utente:', userId);
      setSelectedUserId(userId);
    };

      const handleSalesPointChange = (salesPointId: string) => {
    console.log('🏪 MainCalendarPage: Cambio punto vendita:', salesPointId);
    setSelectedSalesPointId(salesPointId);
  };

  const handleAMCodeChange = (amCode: string) => {
    console.log('👨‍💼 MainCalendarPage: Cambio AM Code:', amCode);
    setSelectedAMCode(amCode);
  };

  const handleNAMCodeChange = (namCode: string) => {
    console.log('👩‍💼 MainCalendarPage: Cambio NAM Code:', namCode);
    setSelectedNAMCode(namCode);
  };

  const handleLineChange = (line: string) => {
    console.log('📊 MainCalendarPage: Cambio Linea:', line);
    setSelectedLine(line);
  };

  // Gestione filtri progressivi
  const handleMultipleSelectionChange = (items: string[]) => {
    console.log('🔍 MainCalendarPage: Cambio selezione multipla:', items);
    
    // RESET IMMEDIATO E DRAMMATICO
    console.log('💥 MainCalendarPage: RESET DRAMMATICO - Cambio filtro rilevato');
    
    // 1. Reset immediato dello stato
    dispatch({ type: 'SET_ENTRIES', payload: [] });
    
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
      localStorage.clear(); // Pulisci TUTTO
      console.log('🧹 MainCalendarPage: Cache completamente pulita');
    }
    
    // 6. Aggiorna i filtri
    setSelectedFilterItems(items);
    
    // 7. Reset selectedSalesPointId - usa null invece di stringa vuota
    if (items.length === 0) {
      setSelectedSalesPointId('default');
    }
    
    // 8. Ricarica i dati se c'è un punto vendita selezionato
    if (selectedSalesPointId && selectedSalesPointId !== 'default') {
      setTimeout(() => {
        console.log('🔄 MainCalendarPage: Ricaricamento dati dopo reset drammatico');
        loadInitialData();
      }, 200);
    }
    
    // 9. Forza re-render
    setTimeout(() => {
      console.log('🔄 MainCalendarPage: Forzando re-render dopo reset');
      // Forza un re-render
      setCurrentDate(new Date(currentDate));
    }, 100);
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
    const filteredExcelRows = excelRows.filter(row => {
      const matches = selectedFilterItems.every(selectedItem => {
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
        
        // Sistema di logging ottimizzato con cleanup automatico cache
        if (!itemMatch && __DEV__) {
          const mismatchKey = `${selectedItem}_${row['amCode']}_${row['namCode']}_${row['agenteCode']}`;
          
          // Inizializza cache con cleanup automatico
          if (!(global as any).loggedMismatches) {
            (global as any).loggedMismatches = new Set();
            (global as any).mismatchCacheCreated = Date.now();
            
            // Cleanup automatico ogni 10 minuti per prevenire memory leaks
            setInterval(() => {
              if ((global as any).loggedMismatches) {
                const oldSize = (global as any).loggedMismatches.size;
                (global as any).loggedMismatches.clear();
                logger.debug('AgentMatcher', 'Cache cleaned up', { 
                  oldSize, 
                  runtime: `${(Date.now() - (global as any).mismatchCacheCreated) / 1000}s` 
                });
              }
            }, 600000); // 10 minuti
          }
          
          // Log con throttling intelligente - max 5 mismatch per tipo
          const baseKey = selectedItem;
          const existingForType = Array.from((global as any).loggedMismatches as Set<string>)
            .filter((key: string) => key.startsWith(baseKey)).length;
          
          if (!((global as any).loggedMismatches).has(mismatchKey) && existingForType < 5) {
            ((global as any).loggedMismatches).add(mismatchKey);
            logger.warn('AgentMatcher', `Mismatch: ${selectedItem}`, { 
              disponibili: [...new Set([row['amCode'], row['namCode'], row['agenteCode']].filter(Boolean))],
              mismatchCount: existingForType + 1,
              cacheSize: ((global as any).loggedMismatches).size
            });
          }
        }
        
        return itemMatch;
      });
      
      return matches;
    });

    // Estrai agenti e punti vendita dai dati filtrati
    const filteredAgents = agents.filter(agent => {
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
    const selectedSalesPoint = selectedFilterItems.find(item => {
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
      const matchingRow = excelRows.find(row => 
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

  // Ottieni i dati filtrati
      const { filteredAgents, filteredSalesPoints, autoDetectedAgent, autoDetectedSalesPoint } = getFilteredData;

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
    console.log('🔄 MainCalendarPage: Cambio punto vendita, selectedSalesPointId:', selectedSalesPointId);
    
    // Reset immediato dello stato locale
    dispatch({ type: 'SET_ENTRIES', payload: [] });
    
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
          console.log('🧹 MainCalendarPage: Cache locale pulita');
        }
      } catch (error) {
        console.warn('⚠️ MainCalendarPage: Errore pulizia cache:', error);
      }
    };
    
    clearLocalCache().then(() => {
      // Ricarica i dati solo se c'è un punto vendita selezionato
      if (selectedSalesPointId && selectedSalesPointId !== 'default') {
        loadInitialData();
      }
    });
  }, [selectedSalesPointId]);

    // Gestione tooltip
    const handleTooltipPress = (type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => {
      console.log('🔧 MainCalendarPage: Apertura tooltip:', type, 'per data:', date);
      
      // Prova prima con l'entry originale
      console.log('🔧 MainCalendarPage: Entry originale:', entry?.id, 'chatNotes:', entry?.chatNotes?.length || 0);
      
      // Recupera l'entry corretta dalle entries filtrate usando la data
      const correctEntry = filteredCalendarEntries.find(e => {
        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
        return entryDate.toISOString().split('T')[0] === date;
      });
      
      console.log('🔧 MainCalendarPage: Entry filtrata:', correctEntry?.id, 'chatNotes:', correctEntry?.chatNotes?.length || 0);
      
      // Prova anche con tutte le entries non filtrate dal calendario context
      const allEntries = state.entries;
      const entryFromContext = allEntries.find(e => {
        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
        return entryDate.toISOString().split('T')[0] === date && 
               e.salesPointId === selectedSalesPointId;
      });
      
      console.log('🔧 MainCalendarPage: Entry dal context:', entryFromContext?.id, 'chatNotes:', entryFromContext?.chatNotes?.length || 0);
      
      // Usa l'entry che ha più dati (priorità: context > filtrata > originale)
      const finalEntry = entryFromContext || correctEntry || entry;
      console.log('🔧 MainCalendarPage: Entry finale scelta:', finalEntry?.id, 'chatNotes:', finalEntry?.chatNotes?.length || 0);
      
      setTooltipType(type);
      setTooltipDate(date);
      setTooltipEntry(finalEntry);
      setShowTooltipModal(true);
    };

    const handleSellInChange = (date: string, sellIn: number) => {
      setDailySellIn(prev => ({
        ...prev,
        [date]: sellIn
      }));
    };

    const handleTooltipClose = () => {
      console.log('🔧 MainCalendarPage: Chiusura tooltip');
      setShowTooltipModal(false);
      setTooltipType('stock');
      setTooltipDate('');
      setTooltipEntry(undefined);
    };

    const handleTooltipUpdateEntry = async (updatedEntry: CalendarEntry) => {
      try {
        console.log('💬 MainCalendarPage: Aggiornamento entry dal tooltip:', updatedEntry.id);
        
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
        console.log('📋 MainCalendarPage: Copiando tag da', sourceDate, ':', sourceEntry.tags);
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
      console.log('⏳ MainCalendarPage: Mostrando loading screen');
      return (
        <SafeAreaView style={styles.loadingContainer}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Colors.primary}
          />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // Rimuoviamo questo log che causa re-render continui
    // console.log('✅ MainCalendarPage: Rendering componente principale');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />



        {/* HEADER MIGLIORATO - ORGANIZZAZIONE PROGETTO */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>
                📅 Calendario Vendite
              </Text>
              <Text style={styles.subtitle}>
                {calendarView === 'week' 
                  ? 'Vista Settimanale - Gestione Dettagliata' 
                  : 'Vista Mensile - Riepilogo Organizzazione'
                }
              </Text>
            </View>
            <View style={styles.headerControls}>
              
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  calendarView === 'week' && styles.activeViewButton,
                ]}
                onPress={() => {
                  console.log('📅 MainCalendarPage: Cambio vista a settimana');
                  setCalendarView('week');
                }}
                accessibilityLabel="Vista Settimanale"
                accessibilityHint="Passa alla vista settimanale per gestione dettagliata"
              >
                <Text
                  style={[
                    styles.viewButtonText,
                    calendarView === 'week' && styles.activeViewButtonText,
                  ]}
                >
                  📅
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  calendarView === 'month' && styles.activeViewButton,
                ]}
                onPress={() => {
                  console.log('📆 MainCalendarPage: Cambio vista a mese');
                  setCalendarView('month');
                }}
                accessibilityLabel="Vista Mensile"
                accessibilityHint="Passa alla vista mensile per riepilogo organizzazione"
              >
                <Text
                  style={[
                    styles.viewButtonText,
                    calendarView === 'month' && styles.activeViewButtonText,
                  ]}
                >
                  📆
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterButton}
                onPress={async () => {
                  console.log('🔍 MainCalendarPage: Apertura filtri');
                  // Ricarica i dati Excel prima di aprire i filtri
                  await reloadExcelData();
                  setShowFilters(true);
                }}
                accessibilityLabel="Filtri"
                accessibilityHint="Apri i filtri per personalizzare la vista"
              >
                <Text style={styles.filterButtonText}>🔍</Text>
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
              <Text style={styles.navSubtitle}>
                {calendarView === 'week'
                  ? `Settimana ${currentDate.getDate()}-${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}`
                  : `${currentDate.getFullYear()}`
                }
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
          </View>
        </View>

        {/* SEZIONE FILTRI ATTIVI */}
        {selectedFilterItems && selectedFilterItems.length > 0 && (
          <View style={styles.activeFiltersContainer}>
            <View style={styles.activeFiltersHeader}>
              <Text style={styles.activeFiltersTitle}>🔍 Filtri Attivi</Text>
              <Text style={styles.activeFiltersCount}>({selectedFilterItems?.length || 0} selezioni)</Text>
            </View>
            <View style={styles.activeFiltersContent}>
              <View style={styles.filteredDataInfo}>
                <Text style={styles.filteredDataText}>
                  👤 Agenti: {selectedUserId ? 1 : 0} | 🏪 Punti Vendita: {selectedSalesPointId ? 1 : 0}
                </Text>

              </View>
              <View style={styles.selectedFiltersList}>
                {selectedFilterItems.map((item, index) => (
                  <View key={index} style={styles.selectedFilterItem}>
                    <Text style={styles.selectedFilterText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* CALENDARIO - 90% DELLO SCHERMO */}
        <View style={styles.calendarContainer}>
          {calendarView === 'week' ? (
            <WeekCalendar
              currentDate={currentDate}
              entries={filteredCalendarEntries}
              selectedDate={selectedDate}
              selectedSalesPointId={selectedSalesPointId}
              onDayPress={onDayPress}
              onTooltipPress={handleTooltipPress}

            />
          ) : (
                          <VirtualizedMonthCalendar
              currentDate={currentDate}
              entries={filteredCalendarEntries}
              selectedDate={selectedDate}
              selectedSalesPointId={selectedSalesPointId}
              onDayPress={onDayPress}
              onTooltipPress={handleTooltipPress}

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
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📊 Entries</Text>
                              <Text style={styles.statValue}>{filteredCalendarEntries.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💰 Sell-In</Text>
              <Text style={styles.statValue}>
                €{progressiveSystem.isInitialized ? progressiveSystem.getTotalSellIn() : 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📅 Sell-In Mensile</Text>
                              <Text style={styles.statValue}>
                €{(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth() + 1;
                  const monthlySellIn = progressiveSystem.isInitialized ? progressiveSystem.getMonthlySellIn(year, month) : 0;

                  return monthlySellIn;
                })()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>⚡ Azioni</Text>
              <Text style={styles.statValue}>
                {filteredCalendarEntries.reduce((sum, entry) => {
                  const actionTags = entry.tags?.filter(tagId => {
                    const tag = getTagById(tagId);
                    return tag?.type === 'action';
                  }) || [];
                  return sum + actionTags.length;
                }, 0)}
              </Text>
            </View>
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
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: 16,
    color: Colors.background,
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
  subtitle: {
    fontSize: 13, // Aumentato leggermente
    color: Colors.warmBackground,
    opacity: 0.9,
  },
  headerControls: {
    flexDirection: 'row',
    gap: Spacing.small,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40, // Leggermente aumentato per le icone
    height: 40, // Leggermente aumentato per le icone
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6, // Padding interno per le icone
  },
  activeViewButton: {
    backgroundColor: Colors.warmBackground,
  },
  viewButtonText: {
    color: Colors.warmBackground,
    fontWeight: 'bold',
    fontSize: 16, // Aumentato per le icone
    textAlign: 'center',
  },
  activeViewButtonText: {
    color: Colors.warmPrimary,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40, // Leggermente aumentato per le icone
    height: 40, // Leggermente aumentato per le icone
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6, // Padding interno per le icone
  },
  filterButtonText: {
    color: Colors.warmBackground,
    fontWeight: 'bold',
    fontSize: 16, // Aumentato per le icone
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 30, // Altezza minima per evitare tagli
  },
  navButton: {
    backgroundColor: Colors.warmBackground,
    width: 32, // Aumentato per evitare tagli
    height: 32, // Aumentato per evitare tagli
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4, // Padding interno per le icone
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
    fontSize: 11, // Aumentato leggermente
    color: Colors.warmBackground,
    opacity: 0.8,
    marginTop: 2,
    textAlign: 'center',
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
    padding: Spacing.small,
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
    padding: Spacing.small,
    backgroundColor: Colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.warmBorder,
    height: 50, // Altezza fissa minima
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
    justifyContent: 'space-around',
    flex: 1,
    maxHeight: 20, // Dimezza l'altezza massima
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8, // Riduce la dimensione del font
    color: Colors.warmTextSecondary,
    marginTop: 1, // Riduce il margin
  },
  statValue: {
    fontSize: 12, // Riduce la dimensione del font
    fontWeight: 'bold',
    color: Colors.warmPrimary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.small,
  },

});
