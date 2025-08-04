import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState<{[key: string]: string}>({});
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Stato temporaneo per i filtri (non applicati finché non si conferma)
  const [tempSelectedItems, setTempSelectedItems] = useState<string[]>([]);
  const [tempSelectedItemTypes, setTempSelectedItemTypes] = useState<{[key: string]: string}>({});
  const [tempShowAllOptions, setTempShowAllOptions] = useState(false);

  // Usa i dati da Firebase Excel
  const { excelData, isLoading: excelDataLoading } = useFirebaseExcelData();

  // Dati filtrati per tab
  const filteredData = useMemo(() => {
    let data: string[] = [];
    
    let filteredExcelData = excelData;
    
    console.log('🔍 FilterComponents: Dati Excel ricevuti:', excelData.length);
    console.log('🔍 FilterComponents: showAllOptions:', showAllOptions);
    console.log('🔍 FilterComponents: selectedItemTypes:', selectedItemTypes);
    
    if (!tempShowAllOptions && Object.keys(tempSelectedItemTypes).length > 0) {
      filteredExcelData = excelData.filter(row => {
        return Object.entries(tempSelectedItemTypes).every(([item, type]) => {
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
      console.log('🔍 FilterComponents: Dati filtrati dopo selezione:', filteredExcelData.length);
    }

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

    console.log(`🔍 FilterComponents: ${activeTab} - Valori unici trovati:`, data.length);
    console.log(`🔍 FilterComponents: ${activeTab} - Primi 5 valori:`, data.slice(0, 5));

    if (searchText.trim()) {
      data = data.filter(item => 
        item.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return data.sort();
  }, [activeTab, excelData, searchText, tempShowAllOptions, tempSelectedItemTypes]);

  // Aggiorna la selezione globale quando cambiano gli elementi selezionati
  useEffect(() => {
    if (onMultipleSelectionChange) {
      onMultipleSelectionChange(selectedItems);
    }
  }, [selectedItems]);

  // Inizializza lo stato temporaneo quando si apre il modal
  useEffect(() => {
    if (isModalVisible) {
      setTempSelectedItems(selectedItems);
      setTempSelectedItemTypes(selectedItemTypes);
      setTempShowAllOptions(showAllOptions);
    }
  }, [isModalVisible, selectedItems, selectedItemTypes, showAllOptions]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchText('');
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleItemSelect = (item: string) => {
    setTempSelectedItems(prev => {
      const newSelection = prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item];
      
      setTempSelectedItemTypes(prevTypes => {
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
  };

  const isItemSelected = (item: string) => {
    return tempSelectedItems.includes(item);
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
    setTempSelectedItems([]);
    setTempSelectedItemTypes({});
    setSearchText('');
    setTempShowAllOptions(false);
    onReset();
  };

  const handleToggleShowAll = () => {
    setTempShowAllOptions(!tempShowAllOptions);
  };

  const handleClose = () => {
    // Annulla le modifiche e ripristina lo stato originale
    setTempSelectedItems(selectedItems);
    setTempSelectedItemTypes(selectedItemTypes);
    setTempShowAllOptions(showAllOptions);
    setIsModalVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleConfirm = () => {
    // Applica le modifiche temporanee
    setSelectedItems(tempSelectedItems);
    setSelectedItemTypes(tempSelectedItemTypes);
    setShowAllOptions(tempShowAllOptions);
    
    // Notifica il cambio
    if (onMultipleSelectionChange) {
      onMultipleSelectionChange(tempSelectedItems);
    }
    
    setIsModalVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Funzione per aprire il modal (da chiamare dall'esterno)
  const openFilters = () => {
    setIsModalVisible(true);
  };

  if (excelDataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento filtri...</Text>
      </View>
    );
  }

  // Versione mobile semplificata
  if (Platform.OS !== 'web') {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.mobileContainer}>
          {/* Header Mobile */}
          <View style={styles.mobileHeader}>
            <Text style={styles.mobileTitle}>🔍 Filtri</Text>
            <View style={styles.mobileHeaderActions}>
              <SafeTouchableOpacity
                style={styles.mobileResetButton}
                onPress={handleReset}
              >
                <Text style={styles.mobileResetButtonText}>🔄 Reset</Text>
              </SafeTouchableOpacity>
            </View>
          </View>

          {/* Tabs Mobile */}
          <View style={styles.mobileTabsContainer}>
            <View style={styles.mobileTabsGrid}>
              {(['linea', 'areaManager', 'nam', 'agente', 'insegna', 'codice', 'cliente'] as const).map((tab) => (
                <SafeTouchableOpacity
                  key={tab}
                  style={[
                    styles.mobileTab,
                    activeTab === tab && styles.mobileActiveTab
                  ]}
                  onPress={() => handleTabChange(tab)}
                >
                  <Text style={styles.mobileTabIcon}>{getTabIcon(tab)}</Text>
                  <Text style={[
                    styles.mobileTabText,
                    activeTab === tab && styles.mobileActiveTabText
                  ]}>
                    {getTabTitle(tab)}
                  </Text>
                </SafeTouchableOpacity>
              ))}
            </View>
          </View>

          {/* Controlli Mobile */}
          <View style={styles.mobileControls}>
            <TextInput
              style={styles.mobileSearchInput}
              placeholder="Cerca..."
              value={searchText}
              onChangeText={handleSearchChange}
              placeholderTextColor="#999999"
            />
            
            <SafeTouchableOpacity
              style={[
                styles.mobileToggleButton,
                tempShowAllOptions && styles.mobileToggleButtonActive
              ]}
              onPress={handleToggleShowAll}
            >
              <Text style={styles.mobileToggleButtonText}>
                {tempShowAllOptions ? '🔒 Correlati' : '🔓 Tutti'}
              </Text>
            </SafeTouchableOpacity>
          </View>

          {/* Lista Mobile */}
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item}
            numColumns={2}
            renderItem={({ item }) => (
              <SafeTouchableOpacity
                style={[
                  styles.mobileListItem,
                  isItemSelected(item) && styles.mobileSelectedItem
                ]}
                onPress={() => handleItemSelect(item)}
              >
                <Text 
                  style={[
                    styles.mobileItemText,
                    isItemSelected(item) && styles.mobileSelectedItemText
                  ]}
                  numberOfLines={2}
                >
                  {item}
                </Text>
                {isItemSelected(item) && (
                  <Text style={styles.mobileCheckmark}>✓</Text>
                )}
              </SafeTouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.mobileList}
            columnWrapperStyle={styles.mobileListRow}
          />

          {/* Footer Mobile */}
          {/* Footer con selezione e pulsanti */}
          <View style={styles.mobileFooter}>
            {tempSelectedItems.length > 0 && (
              <Text style={styles.mobileSelectionInfo}>
                {tempSelectedItems.length} elemento{tempSelectedItems.length !== 1 ? 'i' : ''} selezionato{tempSelectedItems.length !== 1 ? 'i' : ''}
              </Text>
            )}
            
            {/* Pulsanti di azione */}
            <View style={styles.mobileFooterActions}>
              <SafeTouchableOpacity
                style={styles.mobileCancelButton}
                onPress={handleClose}
              >
                <Text style={styles.mobileCancelButtonText}>❌ Annulla</Text>
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity
                style={styles.mobileConfirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.mobileConfirmButtonText}>✅ Conferma</Text>
              </SafeTouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Versione web (invariata)
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
      <View style={styles.tabsContainer}>
        <View style={styles.tabsGrid}>
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
        </View>
      </View>

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
                tempShowAllOptions && styles.controlButtonActive
              ]}
              onPress={handleToggleShowAll}
            >
              <Text style={styles.controlButtonText}>
                {tempShowAllOptions ? '🔒 Solo Correlati' : '🔓 Tutte le Opzioni'}
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
        </View>

        {/* Lista elementi */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item}
          onLayout={() => console.log('🔍 FilterComponents: FlatList renderizzata con', filteredData.length, 'elementi')}
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
      </View>

      {/* Footer con selezione e pulsanti */}
      <View style={styles.footer}>
        {tempSelectedItems.length > 0 && (
          <Text style={styles.selectionInfo}>
            {tempSelectedItems.length} elemento{tempSelectedItems.length !== 1 ? 'i' : ''} selezionato{tempSelectedItems.length !== 1 ? 'i' : ''}
          </Text>
        )}
        
        {/* Pulsanti di azione */}
        <View style={styles.footerActions}>
          <SafeTouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>❌ Annulla</Text>
          </SafeTouchableOpacity>
          
          <SafeTouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>✅ Conferma</Text>
          </SafeTouchableOpacity>
        </View>
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
    paddingVertical: Platform.OS === 'web' ? 2 : 8,
    ...Platform.select({
      web: {
        paddingHorizontal: 4,
        maxHeight: 80,
      },
    }),
  },
  tabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabsContent: {
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 6 : 12,
    paddingVertical: Platform.OS === 'web' ? 4 : 10,
    marginHorizontal: Platform.OS === 'web' ? 1 : 2,
    marginVertical: Platform.OS === 'web' ? 1 : 0,
    borderRadius: 6,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        minWidth: 60,
        maxWidth: 80,
      },
    }),
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabIcon: {
    fontSize: Platform.OS === 'web' ? 14 : 18,
    marginRight: Platform.OS === 'web' ? 4 : 8,
  },
  tabText: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
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
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: Platform.OS === 'web' ? 8 : 8,
  },
  cancelButton: {
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
  cancelButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  confirmButton: {
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
  confirmButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
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
  // New styles for mobile version
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'web' ? 16 : 0,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    paddingBottom: Platform.OS === 'web' ? 16 : 12,
  },
  mobileHeader: {
    backgroundColor: '#2196F3',
    paddingVertical: Platform.OS === 'web' ? 12 : 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
  mobileTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: Platform.OS === 'web' ? 2 : 4,
  },
  mobileHeaderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  mobileResetButton: {
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
  mobileResetButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: '600',
    color: '#666',
  },
  mobileCancelButton: {
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
  mobileCancelButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mobileConfirmButton: {
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
  mobileConfirmButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mobileTabsContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: Platform.OS === 'web' ? 2 : 2,
    ...Platform.select({
      web: {
        paddingHorizontal: 4,
        maxHeight: 80,
      },
    }),
  },
  mobileTabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  mobileTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 6 : 6,
    paddingVertical: Platform.OS === 'web' ? 4 : 4,
    marginHorizontal: Platform.OS === 'web' ? 1 : 1,
    marginVertical: Platform.OS === 'web' ? 1 : 2,
    borderRadius: 6,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        minWidth: 60,
        maxWidth: 80,
      },
      default: {
        minWidth: 80,
        maxWidth: 100,
      },
    }),
  },
  mobileActiveTab: {
    backgroundColor: '#2196F3',
  },
  mobileTabIcon: {
    fontSize: Platform.OS === 'web' ? 14 : 14,
    marginRight: Platform.OS === 'web' ? 4 : 4,
  },
  mobileTabText: {
    fontSize: Platform.OS === 'web' ? 12 : 12,
    fontWeight: '500',
    color: '#666',
  },
  mobileActiveTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mobileControls: {
    padding: Platform.OS === 'web' ? 12 : 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mobileSearchInput: {
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
  mobileToggleButton: {
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
  mobileToggleButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  mobileToggleButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontWeight: '600',
    color: '#333',
  },
  mobileList: {
    flex: 1,
    ...Platform.select({
      web: {
        maxHeight: 300,
        overflowY: 'auto',
        flex: 1,
        minHeight: 200,
      },
    }),
  },
  mobileListRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  mobileListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    paddingHorizontal: Platform.OS === 'web' ? 10 : 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: Platform.OS === 'web' ? 4 : 4,
    marginHorizontal: Platform.OS === 'web' ? 0 : 2,
    minHeight: Platform.OS === 'web' ? 50 : 40,
    ...Platform.select({
      web: {
        width: '32%', // Per 3 colonne con margini
      },
      default: {
        flex: 1, // Per 2 colonne su mobile con spazio distribuito
        marginHorizontal: 2,
      },
    }),
  },
  mobileSelectedItem: {
    backgroundColor: '#e0f7fa', // Light blue background for selected items
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  mobileItemText: {
    flex: 1,
    fontSize: Platform.OS === 'web' ? 13 : 12,
    color: '#333',
  },
  mobileSelectedItemText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  mobileCheckmark: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mobileFooter: {
    backgroundColor: '#f8f9fa',
    padding: Platform.OS === 'web' ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  mobileFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: Platform.OS === 'web' ? 8 : 8,
  },
  mobileSelectionInfo: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#666',
  },
});

export default React.memo(FilterComponents);
