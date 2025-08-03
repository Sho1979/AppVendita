import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TextInput, TouchableOpacity, FlatList } from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { User } from '../../data/models/User';
import { SalesPoint } from '../../data/models/SalesPoint';
import { Agent } from '../../data/models/Agent';
import { useFirebaseExcelData, ExcelDataRow } from '../../hooks/useFirebaseExcelData';

interface FilterComponentsProps {
  users: User[];
  salesPoints: SalesPoint[];
  agents?: Agent[];
  selectedUserId?: string;
  selectedSalesPointId?: string;
  selectedAMCode?: string;
  selectedNAMCode?: string;
  selectedLine?: string;
  selectedItems?: string[]; // Array per selezione multipla
  onUserChange: (userId: string) => void;
  onSalesPointChange: (salesPointId: string) => void;
  onAMCodeChange?: (amCode: string) => void;
  onNAMCodeChange?: (namCode: string) => void;
  onLineChange?: (line: string) => void;
  onMultipleSelectionChange?: (items: string[]) => void;
  onSave: () => void;
  onReset: () => void;
  onClose?: () => void;
}

function FilterComponents({
  users,
  salesPoints,
  agents = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedUserId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedSalesPointId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedAMCode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedNAMCode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedLine,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUserChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSalesPointChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAMCodeChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNAMCodeChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLineChange,
  onMultipleSelectionChange,
  onSave,
  onReset,
  onClose,
}: FilterComponentsProps) {
  const [activeTab, setActiveTab] = useState<'linea' | 'areaManager' | 'nam' | 'agente' | 'insegna' | 'codice' | 'cliente'>('linea');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState<{[key: string]: string}>({}); // Tiene traccia del tipo di ogni selezione
  const [selectAll, setSelectAll] = useState(false);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(true);
  const [showAllOptions, setShowAllOptions] = useState(false); // Nuovo stato per mostrare tutte le opzioni
  const itemsPerPage = 20;

  // Usa i dati da Firebase Excel
  const { excelData, isLoading: excelDataLoading } = useFirebaseExcelData();

  // Dati filtrati per tab
  const filteredData = useMemo(() => {
    let data: string[] = [];
    
    if (__DEV__) {
      console.log('🔍 FilterComponents: Debug dati per tab', {
        activeTab,
        agentsCount: agents.length,
        usersCount: users.length,
        salesPointsCount: salesPoints.length,
        excelDataCount: excelData.length,
        selectedItems,
        showAllOptions,
        firstExcelRow: excelData[0],
        sampleExcelRows: excelData.slice(0, 3).map(r => ({ 
          linea: r.linea, 
          codiceAreaManager: r.codiceAreaManager, 
          codiceNam: r.codiceNam, 
          codiceAgente: r.codiceAgente,
          nomeAgente: r.nomeAgente,
          insegna: r.insegna,
          codiceCliente: r.codiceCliente,
          cliente: r.cliente
        })),
      });
    }

    // Se showAllOptions è true, usa tutti i dati Excel senza filtrare per selezioni precedenti
    let filteredExcelData = excelData;
    
    // Se ci sono selezioni precedenti E showAllOptions è false, filtra i dati Excel
    if (selectedItems && selectedItems.length > 0 && !showAllOptions) {
      console.log('🔍 FilterComponents: Applicando filtri progressivi con selezioni:', selectedItems);
      console.log('🔍 FilterComponents: Tipi delle selezioni:', selectedItemTypes);
      
      // Filtra i dati Excel in base alle selezioni precedenti
      filteredExcelData = excelData.filter((row: ExcelDataRow) => {
        // Controlla se la riga corrisponde a TUTTE le selezioni precedenti (filtro progressivo)
        return selectedItems.every(selectedItem => {
          const itemType = selectedItemTypes[selectedItem];
          console.log('🔍 FilterComponents: Controllando item:', selectedItem, 'di tipo:', itemType);
          
          // Controlla il campo appropriato in base al tipo di selezione
          switch (itemType) {
            case 'linea':
              return row.linea === selectedItem || (row as any)['Linea'] === selectedItem;
            case 'areaManager':
              return row.codiceAreaManager === selectedItem || (row as any)['Codice Area Manager'] === selectedItem;
            case 'nam':
              return row.codiceNam === selectedItem || (row as any)['Codice Nam'] === selectedItem;
            case 'agente':
              return row.codiceAgente === selectedItem || row.nomeAgente === selectedItem || 
                     (row as any)['Codige Agente'] === selectedItem || (row as any)['Nome Agente'] === selectedItem;
            case 'insegna':
              return row.insegna === selectedItem || (row as any)['Insegna'] === selectedItem;
            case 'codice':
              return row.codiceCliente === selectedItem || (row as any)['Codice Cliente'] === selectedItem;
            case 'cliente':
              return row.cliente === selectedItem || (row as any)['Cliente'] === selectedItem;
            default:
              // Fallback: controlla tutti i campi possibili
              return (
                row.linea === selectedItem || (row as any)['Linea'] === selectedItem ||
                row.codiceAreaManager === selectedItem || (row as any)['Codice Area Manager'] === selectedItem ||
                row.codiceNam === selectedItem || (row as any)['Codice Nam'] === selectedItem ||
                row.codiceAgente === selectedItem || (row as any)['Codige Agente'] === selectedItem ||
                row.nomeAgente === selectedItem || (row as any)['Nome Agente'] === selectedItem ||
                row.insegna === selectedItem || (row as any)['Insegna'] === selectedItem ||
                row.codiceCliente === selectedItem || (row as any)['Codice Cliente'] === selectedItem ||
                row.cliente === selectedItem || (row as any)['Cliente'] === selectedItem
              );
          }
        });
      });
      
      console.log('🔍 FilterComponents: Dati Excel filtrati progressivamente:', filteredExcelData.length, 'righe');
    } else if (showAllOptions) {
      console.log('🔍 FilterComponents: Mostrando tutte le opzioni per il filtro corrente');
    }
    
    switch (activeTab) {
      case 'linea':
        // Usa i dati Excel se disponibili, altrimenti fallback
        if (filteredExcelData.length > 0) {
          console.log('📊 FilterComponents: Usando dati Excel per Linea');
          const lineeValues = filteredExcelData.map((row: ExcelDataRow) => {
            // Prova prima il campo normalizzato, poi il campo originale
            return row.linea || (row as any)['Linea'] || '';
          });
          console.log('📊 FilterComponents: Valori linea estratti:', lineeValues.slice(0, 10));
          data = Array.from(new Set(lineeValues.filter((linea): linea is string => Boolean(linea)))).sort();
          console.log('📊 FilterComponents: Linee trovate:', data);
        } else {
          console.log('📊 FilterComponents: Fallback per Linea');
          // Fallback con agents e users
          const lineeFromAgents = agents.map(agent => agent.line).filter((line): line is string => Boolean(line));
          const lineeFromUsers = users.filter(user => user.role === 'agent').map(user => {
            const name = user.name.toLowerCase();
            if (name.includes('linea') || name.includes('liv')) {
              const match = name.match(/(liv|linea)\s*(\d+)/i);
              return match ? `LIV ${match[2]}` : '';
            }
            return '';
          }).filter(Boolean);
          data = Array.from(new Set([...lineeFromAgents, ...lineeFromUsers])).sort();
        }
        break;
      case 'areaManager':
        // Usa i dati Excel se disponibili, altrimenti fallback
        if (filteredExcelData.length > 0) {
          console.log('📊 FilterComponents: Usando dati Excel per Area Manager');
          const amValues = filteredExcelData.map((row: ExcelDataRow) => {
            // Prova prima il campo normalizzato, poi il campo originale
            return row.codiceAreaManager || (row as any)['Codice Area Manager'] || '';
          });
          console.log('📊 FilterComponents: Valori Area Manager estratti:', amValues.slice(0, 10));
          data = Array.from(new Set(amValues.filter((code): code is string => Boolean(code)))).sort();
          console.log('📊 FilterComponents: Area Manager trovati:', data);
        } else {
          console.log('📊 FilterComponents: Fallback per Area Manager');
          // Fallback con agents e users
          const amCodesFromAgents = agents.map(agent => agent.amCode).filter((code): code is string => Boolean(code));
          const amCodesFromUsers = users.filter(user => user.role === 'agent').map(user => {
            const name = user.name.toLowerCase();
            if (name.includes('am')) {
              const match = name.match(/am\s*(\w+)/i);
              return match ? `AM ${match[1]}` : '';
            }
            return '';
          }).filter(Boolean);
          data = Array.from(new Set([...amCodesFromAgents, ...amCodesFromUsers])).sort();
        }
        break;
      case 'nam':
        // Usa i dati Excel se disponibili, altrimenti fallback
        if (filteredExcelData.length > 0) {
          console.log('📊 FilterComponents: Usando dati Excel per NAM Code');
          const namValues = filteredExcelData.map((row: ExcelDataRow) => {
            // Prova prima il campo normalizzato, poi il campo originale
            return row.codiceNam || (row as any)['Codice Nam'] || '';
          });
          console.log('📊 FilterComponents: Valori NAM estratti:', namValues.slice(0, 10));
          data = Array.from(new Set(namValues.filter((code): code is string => Boolean(code)))).sort();
          console.log('📊 FilterComponents: NAM Codes trovati:', data);
        } else {
          console.log('📊 FilterComponents: Fallback per NAM Code');
          // Fallback con agents e users
          const namCodesFromAgents = agents.map(agent => agent.namCode).filter((code): code is string => Boolean(code));
          const namCodesFromUsers = users.filter(user => user.role === 'agent').map(user => {
            const name = user.name.toLowerCase();
            if (name.includes('nam')) {
              const match = name.match(/nam\s*(\w+)/i);
              return match ? `NAM ${match[1]}` : '';
            }
            return '';
          }).filter(Boolean);
          data = Array.from(new Set([...namCodesFromAgents, ...namCodesFromUsers])).sort();
        }
        break;
      case 'agente':
        // Usa i dati Excel se disponibili, altrimenti fallback
        if (filteredExcelData.length > 0) {
          console.log('📊 FilterComponents: Usando dati Excel per Agente');
          const agenteValues = filteredExcelData.map((row: ExcelDataRow) => {
            // Prova prima il campo normalizzato, poi il campo originale
            return row.codiceAgente || (row as any)['Codige Agente'] || '';
          });
          console.log('📊 FilterComponents: Valori Agente estratti:', agenteValues.slice(0, 10));
          // Usa codiceAgente invece di nomeAgente per consistenza
          data = Array.from(new Set(agenteValues.filter((code): code is string => Boolean(code)))).sort();
          console.log('📊 FilterComponents: Agenti trovati:', data);
        } else {
          console.log('📊 FilterComponents: Fallback per Agente');
          // Fallback con users
          data = Array.from(new Set(users.filter(user => user.role === 'agent').map(user => user.name).filter(Boolean))).sort();
        }
        break;
      case 'insegna':
        // Usa i dati Excel se disponibili, altrimenti fallback
        if (filteredExcelData.length > 0) {
          console.log('📊 FilterComponents: Usando dati Excel per Insegna');
          const insegnaValues = filteredExcelData.map((row: ExcelDataRow) => {
            // Prova prima il campo normalizzato, poi il campo originale
            return row.insegna || (row as any)['Insegna'] || '';
          });
          console.log('📊 FilterComponents: Valori Insegna estratti:', insegnaValues.slice(0, 10));
          
          // Debug: mostra anche i valori cliente per confronto
          const clienteValues = filteredExcelData.map((row: ExcelDataRow) => row.cliente);
          console.log('📊 FilterComponents: Valori Cliente per confronto:', clienteValues.slice(0, 10));
          
          // Debug: mostra alcuni record completi per capire la differenza
          console.log('📊 FilterComponents: Esempi di record filtrati (primi 3):', 
            filteredExcelData.slice(0, 3).map(row => ({
              linea: row.linea,
              insegna: row.insegna,
              cliente: row.cliente,
              codiceCliente: row.codiceCliente
            }))
          );
          
          data = Array.from(new Set(insegnaValues.filter((insegna): insegna is string => Boolean(insegna)))).sort();
          console.log('📊 FilterComponents: Insegne trovate:', data);
        } else {
          console.log('📊 FilterComponents: Fallback per Insegna');
          // Fallback con salesPoints
          data = Array.from(new Set(salesPoints.map(sp => sp.name).filter(Boolean))).sort();
        }
        break;
      case 'codice':
        // Usa i dati Excel se disponibili, altrimenti fallback
        if (filteredExcelData.length > 0) {
          console.log('📊 FilterComponents: Usando dati Excel per Codice Cliente');
          const codiceValues = filteredExcelData.map((row: ExcelDataRow) => {
            // Prova prima il campo normalizzato, poi il campo originale
            return row.codiceCliente || (row as any)['Codice Cliente'] || '';
          });
          console.log('📊 FilterComponents: Valori Codice Cliente estratti:', codiceValues.slice(0, 10));
          data = Array.from(new Set(codiceValues.filter((code): code is string => Boolean(code)))).sort();
          console.log('📊 FilterComponents: Codici Cliente trovati:', data);
        } else {
          console.log('📊 FilterComponents: Fallback per Codice Cliente');
          // Fallback con salesPoints
          data = Array.from(new Set(salesPoints.map(sp => sp.name).filter(Boolean))).sort();
        }
        break;
      case 'cliente':
        // Usa i dati Excel se disponibili, altrimenti fallback
        if (filteredExcelData.length > 0) {
          console.log('📊 FilterComponents: Usando dati Excel per Cliente');
          const clienteValues = filteredExcelData.map((row: ExcelDataRow) => {
            // Prova prima il campo normalizzato, poi il campo originale
            return row.cliente || (row as any)['Cliente'] || '';
          });
          console.log('📊 FilterComponents: Valori Cliente estratti:', clienteValues.slice(0, 10));
          
          // Debug: mostra anche i valori insegna per confronto
          const insegnaValues = filteredExcelData.map((row: ExcelDataRow) => row.insegna);
          console.log('📊 FilterComponents: Valori Insegna per confronto:', insegnaValues.slice(0, 10));
          
          data = Array.from(new Set(clienteValues.filter((cliente): cliente is string => Boolean(cliente)))).sort();
          console.log('📊 FilterComponents: Clienti trovati:', data);
        } else {
          console.log('📊 FilterComponents: Fallback per Cliente');
          // Fallback con salesPoints
          data = Array.from(new Set(salesPoints.map(sp => sp.name).filter(Boolean))).sort();
        }
        break;
    }
    
    console.log('🔍 FilterComponents: Dati estratti per', activeTab, ':', data.length, 'elementi');
    
    // Applica filtro di ricerca
    if (searchText) {
      data = data.filter(item => 
        item.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    return data;
  }, [activeTab, excelData, selectedItems, selectedItemTypes, agents, users, salesPoints, showAllOptions]);

  // Paginazione
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset solo paginazione quando cambia tab, mantieni le selezioni
  useEffect(() => {
    setCurrentPage(1);
    setSelectAll(false);
    setShowAllOptions(false); // Reset showAllOptions quando cambia tab
  }, [activeTab, searchText]);

  // Gestione selezione multipla
  const handleItemSelect = (item: string) => {
    if (multiSelectEnabled) {
      const newSelectedItems = selectedItems.includes(item)
        ? selectedItems.filter(i => i !== item)
        : [...selectedItems, item];
      
      // Aggiorna anche i tipi delle selezioni
      const newSelectedItemTypes = { ...selectedItemTypes };
      if (selectedItems.includes(item)) {
        // Rimuovi l'item
        delete newSelectedItemTypes[item];
      } else {
        // Aggiungi l'item con il suo tipo
        newSelectedItemTypes[item] = activeTab;
      }
      
      setSelectedItems(newSelectedItems);
      setSelectedItemTypes(newSelectedItemTypes);
      onMultipleSelectionChange?.(newSelectedItems);
    } else {
      // Selezione singola
      const newSelectedItems = [item];
      const newSelectedItemTypes = { [item]: activeTab };
      
      setSelectedItems(newSelectedItems);
      setSelectedItemTypes(newSelectedItemTypes);
      onMultipleSelectionChange?.(newSelectedItems);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectedItemTypes({});
      onMultipleSelectionChange?.([]);
    } else {
      setSelectedItems(filteredData);
      // Assegna il tipo corrente a tutti gli elementi
      const newSelectedItemTypes: {[key: string]: string} = {};
      filteredData.forEach(item => {
        newSelectedItemTypes[item] = activeTab;
      });
      setSelectedItemTypes(newSelectedItemTypes);
      onMultipleSelectionChange?.(filteredData);
    }
    setSelectAll(!selectAll);
  };

  const isItemSelected = (item: string) => {
    return selectedItems.includes(item);
  };

  return (
    <View style={styles.container}>
      {/* Header filtri */}
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>🔍 Filtri Excel</Text>
        <Text style={styles.filterSubtitle}>
          {selectedItems && selectedItems.length > 0 
            ? `Filtri progressivi (${selectedItems.length} selezioni attive)` 
            : 'Filtra per colonna Excel'
          }
        </Text>
        {excelDataLoading && (
          <Text style={styles.filterInfo}>
            🔄 Caricamento dati da Firebase...
          </Text>
        )}
        {selectedItems && selectedItems.length > 0 && (
          <Text style={styles.filterInfo}>
            📊 Mostrando solo elementi che corrispondono a TUTTE le selezioni
          </Text>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'linea' && styles.activeTab]}
            onPress={() => setActiveTab('linea')}
          >
            <Text style={[styles.tabText, activeTab === 'linea' && styles.activeTabText]}>
              📊 Linea
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'areaManager' && styles.activeTab]}
            onPress={() => setActiveTab('areaManager')}
          >
            <Text style={[styles.tabText, activeTab === 'areaManager' && styles.activeTabText]}>
              👨‍💼 Area Manager
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nam' && styles.activeTab]}
            onPress={() => setActiveTab('nam')}
          >
            <Text style={[styles.tabText, activeTab === 'nam' && styles.activeTabText]}>
              👩‍💼 NAM Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'agente' && styles.activeTab]}
            onPress={() => setActiveTab('agente')}
          >
            <Text style={[styles.tabText, activeTab === 'agente' && styles.activeTabText]}>
              👤 Agente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'insegna' && styles.activeTab]}
            onPress={() => setActiveTab('insegna')}
          >
            <Text style={[styles.tabText, activeTab === 'insegna' && styles.activeTabText]}>
              🏪 Insegna
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'codice' && styles.activeTab]}
            onPress={() => setActiveTab('codice')}
          >
            <Text style={[styles.tabText, activeTab === 'codice' && styles.activeTabText]}>
              🔢 Codice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'cliente' && styles.activeTab]}
            onPress={() => setActiveTab('cliente')}
          >
            <Text style={[styles.tabText, activeTab === 'cliente' && styles.activeTabText]}>
              🏢 Cliente
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenuto principale con scroll */}
      <View style={styles.mainContent}>
        {/* Campo di ricerca */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`🔍 Cerca ${activeTab}...`}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {/* Pulsante per mostrare tutte le opzioni */}
          {selectedItems && selectedItems.length > 0 && (
            <TouchableOpacity
              style={[styles.showAllOptionsButton, showAllOptions && styles.showAllOptionsButtonActive]}
              onPress={() => setShowAllOptions(!showAllOptions)}
            >
              <Text style={[styles.showAllOptionsButtonText, showAllOptions && styles.showAllOptionsButtonTextActive]}>
                {showAllOptions ? '🔍 Mostra filtrati' : '📋 Mostra tutte le opzioni'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Risultati con Checkbox - Virtualizzati con FlatList */}
        <View style={styles.resultsContainer}>
          {/* Opzione "Tutti" con checkbox */}
          <View style={styles.filterItemContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleSelectAll}
            >
              <View style={[styles.checkbox, selectAll && styles.checkboxChecked]}>
                {selectAll && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterItemText}
              onPress={handleSelectAll}
            >
              <Text style={styles.filterItemLabel}>
                📋 Tutti ({filteredData.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Lista elementi in griglia con FlatList */}
          <FlatList
            data={paginatedData}
            keyExtractor={(item, index) => `${activeTab}-${index}`}
            numColumns={Platform.OS === 'web' ? 3 : 2} // 3 colonne su web, 2 su mobile
            renderItem={({ item }) => (
              <View style={styles.filterItemGridContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleItemSelect(item)}
                >
                  <View style={[styles.checkbox, isItemSelected(item) && styles.checkboxChecked]}>
                    {isItemSelected(item) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterItemText}
                  onPress={() => handleItemSelect(item)}
                >
                  <Text style={styles.filterItemLabel} numberOfLines={2}>
                    {item}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            contentContainerStyle={styles.gridContentContainer}
          />

          {/* Opzione selezione multipla */}
          <View style={styles.multiSelectContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setMultiSelectEnabled(!multiSelectEnabled)}
            >
              <View style={[styles.checkbox, multiSelectEnabled && styles.checkboxChecked]}>
                {multiSelectEnabled && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <Text style={styles.multiSelectLabel}>
              Seleziona più elementi ({selectedItems.length} selezionati)
            </Text>
          </View>

          {/* Paginazione */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Text style={styles.paginationButtonText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.paginationText}>
                Pagina {currentPage} di {totalPages}
              </Text>
              
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.paginationButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Azioni filtri - Fissate in basso */}
      <View style={styles.filterActions}>
        {selectedItems && selectedItems.length > 0 && (
          <SafeTouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedItems([]);
              setSelectedItemTypes({});
              onMultipleSelectionChange?.([]);
            }}
          >
            <Text style={styles.clearFiltersButtonText}>🗑️ Cancella</Text>
          </SafeTouchableOpacity>
        )}
        <SafeTouchableOpacity
          style={styles.resetButton}
          onPress={onReset}
        >
          <Text style={styles.resetButtonText}>🔄 Reset</Text>
        </SafeTouchableOpacity>
        <SafeTouchableOpacity
          style={styles.saveButton}
          onPress={onSave}
        >
          <Text style={styles.saveButtonText}>💾 Applica</Text>
        </SafeTouchableOpacity>
        {onClose && (
          <SafeTouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>❌ Chiudi</Text>
          </SafeTouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 8,
    elevation: 4,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
        minHeight: 600,
        maxHeight: 700,
        display: 'flex',
        flexDirection: 'column',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        flex: 1,
      },
    }),
  },
  filterHeader: {
    backgroundColor: '#2196F3',
    padding: Platform.OS === 'web' ? 12 : 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  filterTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 2 : 4,
  },
  filterSubtitle: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: Platform.OS === 'web' ? 2 : 4,
  },
  filterInfo: {
    fontSize: Platform.OS === 'web' ? 10 : 12,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: Platform.OS === 'web' ? 2 : 4,
    opacity: 0.8,
  },
  filterGrid: {
    maxHeight: 300,
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionHeader: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
  },
  filterDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  filterActions: {
    flexDirection: 'row',
    padding: Platform.OS === 'web' ? 12 : 16,
    gap: Platform.OS === 'web' ? 12 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        justifyContent: 'space-between',
        flexShrink: 0,
        minHeight: 60,
      },
    }),
  },
  clearFiltersButton: {
    flex: Platform.OS === 'web' ? 0 : 1,
    backgroundColor: '#ff9800',
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    borderRadius: 6,
    alignItems: 'center',
    ...Platform.select({
      web: {
        minWidth: 100,
      },
    }),
  },
  clearFiltersButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetButton: {
    flex: Platform.OS === 'web' ? 0 : 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    ...Platform.select({
      web: {
        minWidth: 100,
      },
    }),
  },
  resetButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: Platform.OS === 'web' ? 0 : 1,
    backgroundColor: '#4CAF50',
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    borderRadius: 6,
    alignItems: 'center',
    ...Platform.select({
      web: {
        minWidth: 100,
      },
    }),
  },
  saveButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    flex: Platform.OS === 'web' ? 0 : 1,
    backgroundColor: '#f44336',
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    borderRadius: 6,
    alignItems: 'center',
    ...Platform.select({
      web: {
        minWidth: 100,
      },
    }),
  },
  closeButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Stili per i filtri intelligenti
  searchContainer: {
    marginBottom: Platform.OS === 'web' ? 8 : 12,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 10,
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#333',
    ...Platform.select({
      web: {
        minHeight: 36,
      },
    }),
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationButton: {
    backgroundColor: '#2196F3',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  paginationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  // Stili per i filtri avanzati
  advancedFilterToggle: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  advancedFilterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
  },
  advancedFiltersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  advancedFilterSection: {
    marginBottom: 16,
  },
  advancedFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  // Stili per i tab
  tabContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: Platform.OS === 'web' ? 4 : 8,
    ...Platform.select({
      web: {
        paddingHorizontal: 4,
      },
    }),
  },
  tab: {
    paddingHorizontal: Platform.OS === 'web' ? 8 : 12,
    paddingVertical: Platform.OS === 'web' ? 6 : 10,
    marginHorizontal: Platform.OS === 'web' ? 1 : 2,
    borderRadius: 6,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        minWidth: 70,
      },
    }),
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    padding: Platform.OS === 'web' ? 12 : 16,
    ...Platform.select({
      web: {
        maxHeight: 350,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },
  resultsContainer: {
    flex: 1,
    marginTop: Platform.OS === 'web' ? 8 : 12,
    ...Platform.select({
      web: {
        maxHeight: 250,
        overflowY: 'auto',
        flex: 1,
      },
    }),
  },
  // Stili per checkbox e selezione multipla
  filterItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 6 : 8,
    paddingHorizontal: Platform.OS === 'web' ? 8 : 12,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: Platform.OS === 'web' ? 2 : 4,
  },
  // Stili per layout a griglia
  filterItemGridContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 10 : 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    margin: Platform.OS === 'web' ? 4 : 6,
    minHeight: Platform.OS === 'web' ? 50 : 60,
    ...Platform.select({
      web: {
        width: '32%', // Per 3 colonne con margini
      },
      default: {
        width: '48%', // Per 2 colonne su mobile
      },
    }),
  },
  gridContentContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 8 : 12,
    paddingBottom: Platform.OS === 'web' ? 8 : 12,
  },
  checkboxContainer: {
    marginRight: Platform.OS === 'web' ? 8 : 12,
  },
  checkbox: {
    width: Platform.OS === 'web' ? 16 : 20,
    height: Platform.OS === 'web' ? 16 : 20,
    borderWidth: Platform.OS === 'web' ? 1.5 : 2,
    borderColor: '#2196F3',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterItemText: {
    flex: 1,
  },
  filterItemLabel: {
    fontSize: Platform.OS === 'web' ? 13 : 14,
    color: '#333',
  },
  multiSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'web' ? 8 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginTop: Platform.OS === 'web' ? 8 : 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  multiSelectLabel: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#666',
    marginLeft: Platform.OS === 'web' ? 6 : 8,
  },
  showAllOptionsButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 8 : 10,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  showAllOptionsButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  showAllOptionsButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontWeight: '600',
    color: '#333',
  },
  showAllOptionsButtonTextActive: {
    color: '#ffffff',
  },
});

export default React.memo(FilterComponents);
