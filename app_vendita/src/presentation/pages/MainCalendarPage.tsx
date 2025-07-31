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
import { AsyncStorageCalendarRepository } from '../../data/repositories/CalendarRepository';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Agent } from '../../data/models/Agent';
import { ExcelRow } from '../../data/models/ExcelData';
import WeekCalendar from '../components/WeekCalendar';
import MonthCalendar from '../components/MonthCalendar';
import FilterComponents from '../components/FilterComponents';
import EntryFormModal from '../components/EntryFormModal';
import TooltipModal from '../components/TooltipModal';

import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { getTagById } from '../../constants/Tags';




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

  const { state, dispatch } = useCalendar();
  if (__DEV__) {
    // Rimuoviamo questo log che causa re-render continui
    // console.log('✅ MainCalendarPage: useCalendar hook eseguito con successo');
  }
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedSalesPointId, setSelectedSalesPointId] = useState<string>('');
  const [selectedAMCode, setSelectedAMCode] = useState<string>('');
  const [selectedNAMCode, setSelectedNAMCode] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [selectedFilterItems, setSelectedFilterItems] = useState<string[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | undefined>();
  const [showTooltipModal, setShowTooltipModal] = useState(false);
  const [tooltipType, setTooltipType] = useState<'stock' | 'notes' | 'info' | 'images'>('stock');
  const [tooltipDate, setTooltipDate] = useState<string>('');
  const [tooltipEntry, setTooltipEntry] = useState<CalendarEntry | undefined>();
  const [dailySellIn, setDailySellIn] = useState<{ [date: string]: number }>({});

  const repository = new AsyncStorageCalendarRepository();

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
      if (__DEV__) {
        console.log(
          '🔄 MainCalendarPage: useEffect triggered - caricamento dati iniziali'
        );
      }
      loadInitialData();
    }, []);

    // Ricarica i dati Excel quando l'utente torna alla pagina
    useEffect(() => {
      const loadExcelData = async () => {
        console.log('📊 MainCalendarPage: Ricaricamento dati Excel...');
        try {
          const excelRowsData = await repository.getExcelRows();
          setExcelRows(excelRowsData);
          console.log('✅ MainCalendarPage: Dati Excel aggiornati:', excelRowsData.length, 'righe');
        } catch (error) {
          console.error('❌ MainCalendarPage: Errore nel caricamento dati Excel:', error);
        }
      };

      // Ricarica i dati Excel quando il componente diventa attivo
      if (navigation?.addListener) {
        const unsubscribe = navigation.addListener('focus', () => {
          console.log('🔄 MainCalendarPage: Pagina attiva, ricaricamento dati Excel...');
          loadExcelData();
        });

        return unsubscribe;
      }
    }, [navigation]);

    // Funzione per ricaricare i dati Excel
    const reloadExcelData = async () => {
      console.log('📊 MainCalendarPage: Ricaricamento manuale dati Excel...');
      try {
        const excelRowsData = await repository.getExcelRows();
        setExcelRows(excelRowsData);
        console.log('✅ MainCalendarPage: Dati Excel ricaricati:', excelRowsData.length, 'righe');
      } catch (error) {
        console.error('❌ MainCalendarPage: Errore nel ricaricamento dati Excel:', error);
      }
    };

    const loadInitialData = async () => {
      console.log('📥 MainCalendarPage: Inizio caricamento dati iniziali');
      try {
        setIsLoading(true);
        dispatch({ type: 'SET_LOADING', payload: true });

        console.log('👥 MainCalendarPage: Caricamento utenti...');
        const users = await repository.getUsers();
        console.log('✅ MainCalendarPage: Utenti caricati:', users.length);

        console.log('🏪 MainCalendarPage: Caricamento punti vendita...');
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

        // Carica dati Excel completi
        console.log('📊 MainCalendarPage: Caricamento dati Excel...');
        const excelRowsData = await repository.getExcelRows();
        setExcelRows(excelRowsData);
        console.log('✅ MainCalendarPage: Dati Excel caricati:', excelRowsData.length, 'righe');

        // Carica entries del periodo corrente (esteso per includere più giorni)
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Dal mese precedente
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Al mese successivo

        console.log(
          '📅 MainCalendarPage: Caricamento entries dal',
          startDate.toISOString(),
          'al',
          endDate.toISOString()
        );
        const entries = await repository.getCalendarEntries(startDate, endDate);
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

    // Gestisce la selezione di una data
    const onDayPress = (dateString: string) => {
      console.log('📅 MainCalendarPage: Giorno selezionato:', dateString);
      setSelectedDate(dateString);
      dispatch({
        type: 'UPDATE_FILTERS',
        payload: { selectedDate: new Date(dateString) },
      });

      // Apri il form solo nel calendario settimanale (guida principale)
      if (calendarView === 'week') {
        console.log('📅 MainCalendarPage: Apertura diretta modal per calendario settimanale');
        
        // Controlla se esistono già entry per questa data
        const existingEntries = state.entries.filter((entry: CalendarEntry) => {
          const entryDate = new Date(entry.date);
          const selectedDate = new Date(dateString);
          return entryDate.toDateString() === selectedDate.toDateString();
        });
        
        console.log('📅 MainCalendarPage: Entry esistenti per', dateString, ':', existingEntries.length);
        
        if (existingEntries.length > 0) {
          // Se esistono entry, apri in modalità modifica con il primo entry
          console.log('📝 MainCalendarPage: Apertura modal modifica per entry esistente');
          showEditEntryModal(existingEntries[0]!);
        } else {
          // Se non esistono entry, apri in modalità nuovo
          console.log('📝 MainCalendarPage: Apertura modal nuovo entry');
          showAddEntryModal(dateString);
        }
      } else {
        // Nel calendario mensile (riassunto) - solo log, nessuna azione
        console.log('📅 MainCalendarPage: Clic nel calendario mensile (riassunto) - nessuna azione');
      }
    };

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

    const showAddEntryModal = (dateString: string) => {
      console.log('📝 MainCalendarPage: Apertura modal nuovo entry per:', dateString);
      setSelectedDate(dateString);
      setEditingEntry(undefined);
      setShowEntryModal(true);
    };

    const showEditEntryModal = (entry: CalendarEntry) => {
      console.log('📝 MainCalendarPage: Apertura modal modifica entry:', entry.id);
      setEditingEntry(entry);
      setShowEntryModal(true);
    };

    const handleSaveEntry = async (entry: CalendarEntry) => {
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
            repeatSettings: entry.repeatSettings,
            focusReferencesData: entry.focusReferencesData,
          };
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
            repeatSettings: entry.repeatSettings,
            focusReferencesData: entry.focusReferencesData,
          };
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
    };

    const handleDeleteEntry = async (entryId: string) => {
      console.log('🗑️ MainCalendarPage: Eliminazione entry:', entryId);
      try {
        await repository.deleteCalendarEntry(entryId);
        dispatch({ type: 'DELETE_ENTRY', payload: entryId });
        setShowEntryModal(false);
        setEditingEntry(undefined);
      } catch (error) {
        console.error('❌ MainCalendarPage: Errore eliminazione entry:', error);
        Alert.alert('Errore', 'Impossibile eliminare l\'entry. Riprova.');
      }
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

    const handleSaveFilters = useCallback(() => {
      if (__DEV__) {
        console.log('💾 MainCalendarPage: Salvataggio filtri');
      }
      dispatch({
        type: 'UPDATE_FILTERS',
        payload: {
          userId: selectedUserId,
          salesPointId: selectedSalesPointId,
        },
      });
      setShowFilters(false);
      Alert.alert(
        'Filtri salvati',
        'I filtri sono stati applicati con successo'
      );
    }, [selectedUserId, selectedSalesPointId, dispatch]);

    const handleResetFilters = useCallback(() => {
      if (__DEV__) {
        console.log('🔄 MainCalendarPage: Reset filtri');
      }
      setSelectedUserId('');
      setSelectedSalesPointId('');
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
        console.log('🗑️ MainCalendarPage: Reset completo dati');
      }
      
      try {
        // Cancella tutte le entries del calendario
        const allEntries = await repository.getCalendarEntries(
          new Date(2020, 0, 1), // Data molto vecchia
          new Date(2030, 11, 31), // Data molto futura
        );
        
        for (const entry of allEntries) {
          await repository.deleteCalendarEntry(entry.id);
        }
        
        // Resetta lo stato del context
        dispatch({ type: 'SET_ENTRIES', payload: [] });
        
        // Resetta il sell-in
        setDailySellIn({});
        
        console.log('✅ MainCalendarPage: Reset completato, entries cancellate:', allEntries.length);
        
        Alert.alert(
          'Reset completato',
          `Sono state cancellate ${allEntries.length} entries del calendario.\n\nLe configurazioni (referenze focus, prezzi, utenti, punti vendita) sono state mantenute.`
        );
      } catch (error) {
        console.error('❌ MainCalendarPage: Errore durante il reset:', error);
        Alert.alert(
          'Errore',
          'Si è verificato un errore durante il reset dei dati'
        );
      }
    }, [repository, dispatch]);

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
    setSelectedFilterItems(items);
  };

  // Funzione per ottenere i dati filtrati in base ai filtri progressivi
  const getFilteredData = useMemo(() => {
    if (selectedFilterItems.length === 0) {
      return {
        filteredAgents: agents,
        filteredSalesPoints: state.salesPoints,
        filteredExcelRows: excelRows,
        autoDetectedAgent: null,
        autoDetectedSalesPoint: null,
      };
    }

    if (__DEV__) {
      console.log('🔍 MainCalendarPage: Applicando filtri progressivi:', selectedFilterItems);
    }
    
    // Filtra i dati Excel in base alle selezioni
    const filteredExcelRows = excelRows.filter(row => {
      return selectedFilterItems.every(selectedItem => {
        return (
          row.linea === selectedItem ||
          row.amCode === selectedItem ||
          row.namCode === selectedItem ||
          row.agenteCode === selectedItem ||
          row.insegnaCliente === selectedItem ||
          row.codiceCliente === selectedItem ||
          row.cliente === selectedItem
        );
      });
    });

    // Estrai agenti e punti vendita dai dati filtrati
    const filteredAgents = agents.filter(agent => {
      return filteredExcelRows.some(row => 
        row.agenteCode === agent.code ||
        row.amCode === agent.amCode ||
        row.namCode === agent.namCode ||
        row.linea === agent.line
      );
    });

    const filteredSalesPoints = state.salesPoints.filter(salesPoint => {
      return filteredExcelRows.some(row => 
        row.codiceCliente === salesPoint.id ||
        row.insegnaCliente === salesPoint.name ||
        row.cliente === salesPoint.name
      );
    });

    // Logica per trovare automaticamente agente e punto vendita
    let autoDetectedAgent = null;
    let autoDetectedSalesPoint = null;

    // Se abbiamo selezionato un punto vendita, trova l'agente associato
    const selectedSalesPoint = selectedFilterItems.find(item => {
      return filteredExcelRows.some(row => 
        row.insegnaCliente === item ||
        row.codiceCliente === item ||
        row.cliente === item
      );
    });

    if (selectedSalesPoint) {
      // Trova l'agente associato a questo punto vendita
      const relatedRow = filteredExcelRows.find(row => 
        row.insegnaCliente === selectedSalesPoint ||
        row.codiceCliente === selectedSalesPoint ||
        row.cliente === selectedSalesPoint
      );

      if (relatedRow) {
        autoDetectedAgent = {
          code: relatedRow.agenteCode,
          name: relatedRow.agenteName,
          amCode: relatedRow.amCode,
          namCode: relatedRow.namCode,
          line: relatedRow.linea,
        };
        autoDetectedSalesPoint = {
          id: relatedRow.codiceCliente,
          name: relatedRow.insegnaCliente,
        };
        console.log('🔍 MainCalendarPage: Agente rilevato automaticamente:', autoDetectedAgent);
      }
    }

    console.log('🔍 MainCalendarPage: Dati filtrati:', {
      agents: filteredAgents.length,
      salesPoints: filteredSalesPoints.length,
      excelRows: filteredExcelRows.length,
      autoDetectedAgent,
      autoDetectedSalesPoint,
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

    // Gestione tooltip
    const handleTooltipPress = (type: 'stock' | 'notes' | 'info' | 'images', date: string, entry?: CalendarEntry) => {
      console.log('🔧 MainCalendarPage: Apertura tooltip:', type, 'per data:', date);
      setTooltipType(type);
      setTooltipDate(date);
      setTooltipEntry(entry);
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
        {selectedFilterItems.length > 0 && (
          <View style={styles.activeFiltersContainer}>
            <View style={styles.activeFiltersHeader}>
              <Text style={styles.activeFiltersTitle}>🔍 Filtri Attivi</Text>
              <Text style={styles.activeFiltersCount}>({selectedFilterItems.length} selezioni)</Text>
            </View>
            <View style={styles.activeFiltersContent}>
              <View style={styles.filteredDataInfo}>
                <Text style={styles.filteredDataText}>
                  👤 Agenti: {autoDetectedAgent ? 1 : filteredAgents.length} | 🏪 Punti Vendita: {autoDetectedSalesPoint ? 1 : filteredSalesPoints.length}
                </Text>
              </View>
              <View style={styles.selectedFiltersList}>
                {/* Mostra solo agente e punto vendita se rilevati automaticamente */}
                {autoDetectedAgent && autoDetectedSalesPoint ? (
                  <>
                    <View style={styles.selectedFilterItem}>
                      <Text style={styles.selectedFilterText}>👤 {autoDetectedAgent.name}</Text>
                    </View>
                    <View style={styles.selectedFilterItem}>
                      <Text style={styles.selectedFilterText}>🏪 {autoDetectedSalesPoint.name}</Text>
                    </View>
                  </>
                ) : (
                  /* Altrimenti mostra tutti i filtri selezionati */
                  selectedFilterItems.map((item, index) => (
                    <View key={index} style={styles.selectedFilterItem}>
                      <Text style={styles.selectedFilterText}>{item}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}

        {/* CALENDARIO - 90% DELLO SCHERMO */}
        <View style={styles.calendarContainer}>
          {/* Rimuoviamo questo log che causa re-render continui */}
          {/* {(() => {
            console.log('📊 MainCalendarPage: Rendering calendar con entries:', {
              entriesCount: state.entries.length,
              entriesWithFocusData: state.entries.filter(e => e.focusReferencesData && e.focusReferencesData.length > 0).length,
              entriesWithTags: state.entries.filter(e => e.tags && e.tags.length > 0).length,
              sampleEntry: state.entries.length > 0 && state.entries[0] ? {
                id: state.entries[0]?.id,
                date: state.entries[0]?.date,
                focusReferencesData: state.entries[0]?.focusReferencesData,
                hasFocusData: state.entries[0]?.focusReferencesData && state.entries[0]?.focusReferencesData.length > 0,
                tags: state.entries[0]?.tags,
                tagsCount: state.entries[0]?.tags?.length || 0
              } : null
            });
            return null;
          })()} */}
          {calendarView === 'week' ? (
            <WeekCalendar
              currentDate={currentDate}
              entries={state.entries}
              selectedDate={selectedDate}
              onDayPress={onDayPress}
              onTooltipPress={handleTooltipPress}
              onSellInChange={handleSellInChange}
            />
          ) : (
            <MonthCalendar
              currentDate={currentDate}
              entries={state.entries}
              selectedDate={selectedDate}
              onDayPress={onDayPress}
              onTooltipPress={handleTooltipPress}
              onSellInChange={handleSellInChange}
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
              <Text style={styles.statValue}>{state.entries.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>💰 Sell-In</Text>
              <Text style={styles.statValue}>
                €{Object.values(dailySellIn).reduce((sum, sellIn) => sum + sellIn, 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>⚡ Azioni</Text>
              <Text style={styles.statValue}>
                {state.entries.reduce((sum, entry) => {
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
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveFilters}
            >
              <Text style={styles.saveButtonText}>💾 Salva</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Filtri */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            console.log('❌ MainCalendarPage: Chiusura modal filtri');
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
                excelRows={excelRows}
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
                onSave={handleSaveFilters}
                onReset={handleResetFilters}
                onClose={() => {
                  console.log('❌ MainCalendarPage: Chiusura modal filtri');
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
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.warmTextSecondary,
    marginTop: Spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmPrimary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.small,
  },

});
