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
  onReset: () => void;
  onClose?: () => void;
}

function FilterComponents({
  users,
  salesPoints,
  agents = [],
  selectedUserId,
  selectedSalesPointId,
  selectedAMCode,
  selectedNAMCode,
  selectedLine,
  onUserChange,
  onSalesPointChange,
  onAMCodeChange,
  onNAMCodeChange,
  onLineChange,
  onMultipleSelectionChange,
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
    
    // Se showAllOptions è true, usa tutti i dati Excel senza filtrare per selezioni precedenti
    let filteredExcelData = excelData;
    
    // Se ci sono selezioni precedenti E showAllOptions è false, filtra i dati Excel
    if (!showAllOptions && Object.keys(selectedItemTypes).length > 0) {
      filteredExcelData = excelData.filter(row => {
        // Per ogni selezione precedente, verifica che la riga Excel contenga quel valore
        return Object.entries(selectedItemTypes).every(([item, type]) => {
          switch (type) {
            case 'linea':
              return row.linea === item;
            case 'areaManager':
              return row.codiceAreaManager === item;
            case 'nam':
              return row.codiceNam === item;
            case 'agente':
              return row.codiceAgente === item;
            case 'insegna':
              return row.insegna === item;
            case 'codice':
              return row.codiceCliente === item;
            case 'cliente':
              return row.cliente === item;
            default:
              return true;
          }
        });
      });
    }

    // Estrai i dati unici per il tab corrente
    switch (activeTab) {
      case 'linea':
        data = [...new Set(filteredExcelData.map(row => row.linea).filter((linea): linea is string => Boolean(linea)))];
        break;
      case 'areaManager':
        data = [...new Set(filteredExcelData.map(row => row.codiceAreaManager).filter((code): code is string => Boolean(code)))];
        break;
      case 'nam':
        data = [...new Set(filteredExcelData.map(row => row.codiceNam).filter((code): code is string => Boolean(code)))];
        break;
      case 'agente':
        data = [...new Set(filteredExcelData.map(row => row.codiceAgente).filter((code): code is string => Boolean(code)))];
        break;
      case 'insegna':
        data = [...new Set(filteredExcelData.map(row => row.insegna).filter((insegna): insegna is string => Boolean(insegna)))];
        break;
      case 'codice':
        data = [...new Set(filteredExcelData.map(row => row.codiceCliente).filter((code): code is string => Boolean(code)))];
        break;
      case 'cliente':
        data = [...new Set(filteredExcelData.map(row => row.cliente).filter((cliente): cliente is string => Boolean(cliente)))];
        break;
    }

    // Applica filtro di ricerca
    if (searchText.trim()) {
      data = data.filter(item => 
        item.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return data.sort();
  }, [activeTab, excelData, searchText, selectedItemTypes, showAllOptions]);

  // Paginazione
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset della paginazione quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchText, showAllOptions]);

  // Reset della selezione quando cambia il tab
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [activeTab]);

  // Aggiorna la selezione globale quando cambiano gli elementi selezionati
  useEffect(() => {
    if (onMultipleSelectionChange) {
      onMultipleSelectionChange(selectedItems);
    }
  }, [selectedItems, onMultipleSelectionChange]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchText('');
    setCurrentPage(1);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  const handleItemSelect = (item: string) => {
    if (multiSelectEnabled) {
      // Modalità selezione multipla
      setSelectedItems(prev => {
        const newSelection = prev.includes(item)
          ? prev.filter(i => i !== item)
          : [...prev, item];
        
        // Aggiorna il tipo di selezione
        setSelectedItemTypes(prevTypes => {
          const newTypes = { ...prevTypes };
          if (newSelection.includes(item)) {
            newTypes[item] = activeTab;
          } else {
            delete newTypes[item];
          }
          return newTypes;
        });
        
        return newSelection;
      });
    } else {
      // Modalità selezione singola
      setSelectedItems([item]);
      setSelectedItemTypes({ [item]: activeTab });
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deseleziona tutto
      setSelectedItems([]);
      setSelectedItemTypes({});
      setSelectAll(false);
    } else {
      // Seleziona tutto
      const allItems = currentData;
      setSelectedItems(allItems);
      const newTypes: {[key: string]: string} = {};
      allItems.forEach(item => {
        newTypes[item] = activeTab;
      });
      setSelectedItemTypes(newTypes);
      setSelectAll(true);
    }
  };

  const isItemSelected = (item: string) => {
    return selectedItems.includes(item);
  };

  const getTabTitle = (tab: typeof activeTab) => {
    switch (tab) {
      case 'linea': return 'Linea';
      case 'areaManager': return 'Area Manager';
      case 'nam': return 'NAM';
      case 'agente': return 'Agente';
      case 'insegna': return 'Insegna';
      case 'codice': return 'Codice Cliente';
      case 'cliente': return 'Cliente';
      default: return tab;
    }
  };

  const getTabIcon = (tab: typeof activeTab) => {
    switch (tab) {
      case 'linea': return '📊';
      case 'areaManager': return '👨‍💼';
      case 'nam': return '👩‍💼';
      case 'agente': return '👤';
      case 'insegna': return '🏪';
      case 'codice': return '🔢';
      case 'cliente': return '👥';
      default: return '📋';
    }
  };

  const handleReset = () => {
    setSelectedItems([]);
    setSelectedItemTypes({});
    setSelectAll(false);
    setSearchText('');
    setCurrentPage(1);
    setShowAllOptions(false);
    onReset();
  };

  const handleToggleShowAll = () => {
    setShowAllOptions(!showAllOptions);
    setCurrentPage(1);
  };

  if (excelDataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento filtri...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Filtri Avanzati</Text>
        <View style={styles.headerActions}>
          <SafeTouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            accessibilityLabel="Reset filtri"
            accessibilityHint="Rimuovi tutti i filtri applicati"
          >
            <Text style={styles.resetButtonText}>🔄 Reset</Text>
          </SafeTouchableOpacity>
          
          {onClose && (
            <SafeTouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Chiudi"
              accessibilityHint="Chiudi i filtri"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </SafeTouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {(['linea', 'areaManager', 'nam', 'agente', 'insegna', 'codice', 'cliente'] as const).map((tab) => (
          <SafeTouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => handleTabChange(tab)}
            accessibilityLabel={`Tab ${getTabTitle(tab)}`}
            accessibilityHint={`Seleziona il tab ${getTabTitle(tab)}`}
          >
            <Text style={styles.tabIcon}>{getTabIcon(tab)}</Text>
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {getTabTitle(tab)}
            </Text>
          </SafeTouchableOpacity>
        ))}
      </ScrollView>

      {/* Controlli */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca..."
            value={searchText}
            onChangeText={handleSearchChange}
            placeholderTextColor="#999999"
          />
        </View>
        
        <View style={styles.controlButtons}>
          <SafeTouchableOpacity
            style={[
              styles.controlButton,
              showAllOptions && styles.controlButtonActive
            ]}
            onPress={handleToggleShowAll}
          >
            <Text style={styles.controlButtonText}>
              {showAllOptions ? '🔒 Solo Correlati' : '🔓 Tutte le Opzioni'}
            </Text>
          </SafeTouchableOpacity>
          
          <SafeTouchableOpacity
            style={[
              styles.controlButton,
              multiSelectEnabled && styles.controlButtonActive
            ]}
            onPress={() => setMultiSelectEnabled(!multiSelectEnabled)}
          >
            <Text style={styles.controlButtonText}>
              {multiSelectEnabled ? '☑️ Multi' : '☑️ Singolo'}
            </Text>
          </SafeTouchableOpacity>
        </View>
      </View>

      {/* Contenuto */}
      <View style={styles.content}>
        {/* Header della lista */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {getTabTitle(activeTab)} ({filteredData.length})
          </Text>
          
          {multiSelectEnabled && (
            <SafeTouchableOpacity
              style={[
                styles.selectAllButton,
                selectAll && styles.selectAllButtonActive
              ]}
              onPress={handleSelectAll}
            >
              <Text style={styles.selectAllButtonText}>
                {selectAll ? '☑️ Deseleziona Tutto' : '☐ Seleziona Tutto'}
              </Text>
            </SafeTouchableOpacity>
          )}
        </View>

        {/* Lista elementi */}
        <FlatList
          data={currentData}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <SafeTouchableOpacity
              style={[
                styles.listItem,
                isItemSelected(item) && styles.selectedItem
              ]}
              onPress={() => handleItemSelect(item)}
            >
              <Text style={[
                styles.itemText,
                isItemSelected(item) && styles.selectedItemText
              ]}>
                {item}
              </Text>
              {isItemSelected(item) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </SafeTouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />

        {/* Paginazione */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <SafeTouchableOpacity
              style={[
                styles.pageButton,
                currentPage === 1 && styles.pageButtonDisabled
              ]}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.pageButtonText}>‹</Text>
            </SafeTouchableOpacity>
            
            <Text style={styles.pageInfo}>
              Pagina {currentPage} di {totalPages}
            </Text>
            
            <SafeTouchableOpacity
              style={[
                styles.pageButton,
                currentPage === totalPages && styles.pageButtonDisabled
              ]}
              onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.pageButtonText}>›</Text>
            </SafeTouchableOpacity>
          </View>
        )}
      </View>

      {/* Footer con selezione */}
      {selectedItems.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.selectionInfo}>
            {selectedItems.length} elemento{selectedItems.length !== 1 ? 'i' : ''} selezionato{selectedItems.length !== 1 ? 'i' : ''}
          </Text>
        </View>
      )}
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
  header: {
    backgroundColor: '#2196F3',
    padding: Platform.OS === 'web' ? 12 : 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 16 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 2 : 4,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetButton: {
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
  closeButton: {
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
  tabsContainer: {
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
  tabsContent: {
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tabIcon: {
    fontSize: 18,
    marginRight: 8,
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
  controls: {
    padding: Platform.OS === 'web' ? 12 : 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
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
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    ...Platform.select({
      web: {
        minWidth: 100,
      },
    }),
  },
  controlButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  controlButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontWeight: '600',
    color: '#333',
  },
  content: {
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
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 8 : 12,
  },
  listTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectAllButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    ...Platform.select({
      web: {
        minWidth: 100,
      },
    }),
  },
  selectAllButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  selectAllButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontWeight: '600',
    color: '#333',
  },
  list: {
    flex: 1,
    ...Platform.select({
      web: {
        maxHeight: 250,
        overflowY: 'auto',
        flex: 1,
      },
    }),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 10 : 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: Platform.OS === 'web' ? 4 : 6,
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
  selectedItem: {
    backgroundColor: '#e0f7fa', // Light blue background for selected items
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  itemText: {
    flex: 1,
    fontSize: Platform.OS === 'web' ? 13 : 14,
    color: '#333',
  },
  selectedItemText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  checkmark: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  pageButton: {
    backgroundColor: '#2196F3',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  pageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: Platform.OS === 'web' ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectionInfo: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default React.memo(FilterComponents);
