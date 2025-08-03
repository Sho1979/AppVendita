import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firebaseCalendarService } from '../../services/FirebaseCalendarService';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface CompactPriceManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PriceReference {
  id: string;
  brand: string;
  subBrand: string;
  typology: string;
  ean: string;
  code: string;
  description: string;
  piecesPerCarton: number;
  unitPrice: number;
  netPrice: number;
  isActive: boolean;
}

export default function CompactPriceManagementModal({
  visible,
  onClose,
}: CompactPriceManagementModalProps) {
  const [priceReferences, setPriceReferences] = useState<PriceReference[]>([]);
  const [filteredReferences, setFilteredReferences] = useState<PriceReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [modifiedPrices, setModifiedPrices] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (visible) {
      loadPriceReferences();
      setSearchTerm('');
      // Pulisci lo stato di editing quando si apre il modal
      setEditingPrice(null);
      setEditingValue('');
      setModifiedPrices({});
    }
  }, [visible]);

  useEffect(() => {
    filterReferences();
  }, [searchTerm, priceReferences]);

  const loadPriceReferences = async () => {
    try {
      setIsLoading(true);
      // Carica solo le referenze attive (focus) invece di tutte
      const references = await firebaseCalendarService.getActivePriceReferences();
      setPriceReferences(references);
      console.log('✅ CompactPriceManagementModal: Caricate', references.length, 'referenze focus');
    } catch (error) {
      console.error('❌ CompactPriceManagementModal: Errore caricamento referenze:', error);
      Alert.alert('Errore', 'Impossibile caricare le referenze prezzi.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReferences = () => {
    if (!searchTerm.trim()) {
      setFilteredReferences(priceReferences);
      return;
    }

    const filtered = priceReferences.filter(ref => 
      ref.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.ean?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReferences(filtered);
  };

  const handleEditPrice = (referenceId: string, currentPrice: number) => {
    console.log('🔍 CompactPriceManagementModal: handleEditPrice chiamato:', {
      referenceId,
      currentPrice,
      currentPriceType: typeof currentPrice
    });
    
    setEditingPrice(referenceId);
    // Assicurati che il valore iniziale sia corretto
    const initialValue = currentPrice > 0 ? currentPrice.toString() : '';
    setEditingValue(initialValue);
    
    console.log('🔍 CompactPriceManagementModal: Valore iniziale impostato:', initialValue);
  };

  const handleSavePrice = async (referenceId: string) => {
    try {
      console.log('🔍 CompactPriceManagementModal: handleSavePrice chiamato:', {
        referenceId,
        editingValue,
        editingValueType: typeof editingValue
      });
      
      const newPrice = parseFloat(editingValue);
      console.log('🔍 CompactPriceManagementModal: Prezzo parsato:', newPrice);
      
      if (isNaN(newPrice) || newPrice < 0) {
        Alert.alert('Errore', 'Inserisci un prezzo valido');
        return;
      }

      // Salva su Firebase prima di aggiornare la lista locale
      const reference = priceReferences.find(ref => ref.id === referenceId);
      console.log('🔍 CompactPriceManagementModal: Referenza trovata per salvataggio:', {
        found: !!reference,
        referenceId,
        referenceData: reference
      });
      
      if (reference) {
        console.log('🔍 CompactPriceManagementModal: Referenza trovata, salvataggio su Firebase...');
        
        const updatedReference = {
          ...reference,
          netPrice: newPrice,
          updatedAt: new Date()
        };
        
        console.log('🔍 CompactPriceManagementModal: Dati da salvare:', updatedReference);
        
        await firebaseCalendarService.updatePriceReference(updatedReference);
        
        console.log('✅ CompactPriceManagementModal: Prezzo salvato su Firebase:', newPrice);
      } else {
        console.error('❌ CompactPriceManagementModal: Referenza non trovata per ID:', referenceId);
        console.log('🔍 CompactPriceManagementModal: Referenze disponibili:', priceReferences.map(r => ({ id: r.id, code: r.code })));
      }

      // Aggiorna il prezzo nella lista locale immediatamente
      setPriceReferences(prev => 
        prev.map(ref => 
          ref.id === referenceId 
            ? { ...ref, netPrice: newPrice, updatedAt: new Date() }
            : ref
        )
      );

      // Aggiorna anche la lista filtrata
      setFilteredReferences(prev => 
        prev.map(ref => 
          ref.id === referenceId 
            ? { ...ref, netPrice: newPrice, updatedAt: new Date() }
            : ref
        )
      );

      setEditingPrice(null);
      setEditingValue('');
      
      console.log('✅ CompactPriceManagementModal: Prezzo aggiornato localmente:', newPrice);
      Alert.alert('Successo', 'Prezzo aggiornato con successo');
    } catch (error) {
      console.error('❌ CompactPriceManagementModal: Errore aggiornamento prezzo:', error);
      Alert.alert('Errore', 'Impossibile aggiornare il prezzo');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setEditingValue('');
  };

  const handleGlobalSave = async () => {
    try {
      console.log('🔍 CompactPriceManagementModal: handleGlobalSave chiamato');
      console.log('🔍 CompactPriceManagementModal: Prezzi modificati:', modifiedPrices);
      
      if (Object.keys(modifiedPrices).length === 0) {
        Alert.alert('Info', 'Nessun prezzo da salvare');
        return;
      }

      // Salva tutti i prezzi modificati
      for (const [referenceId, newPrice] of Object.entries(modifiedPrices)) {
        const reference = priceReferences.find(ref => ref.id === referenceId);
        if (reference) {
          console.log('🔍 CompactPriceManagementModal: Salvataggio prezzo per', referenceId, '=', newPrice);
          
          await firebaseCalendarService.updatePriceReference({
            ...reference,
            netPrice: newPrice,
            updatedAt: new Date()
          });
        }
      }

      // Ricarica i dati
      await loadPriceReferences();
      setModifiedPrices({});
      
      Alert.alert('Successo', `${Object.keys(modifiedPrices).length} prezzi salvati con successo`);
    } catch (error) {
      console.error('❌ CompactPriceManagementModal: Errore salvataggio globale:', error);
      Alert.alert('Errore', 'Impossibile salvare i prezzi');
    }
  };

  const renderPriceCell = (reference: PriceReference) => {
    const currentModifiedPrice = modifiedPrices[reference.id];
    const displayPrice = currentModifiedPrice !== undefined ? currentModifiedPrice : reference.netPrice;
    
    console.log('🔍 CompactPriceManagementModal: Rendering cella per:', {
      referenceId: reference.id,
      referenceNetPrice: reference.netPrice,
      currentModifiedPrice,
      displayPrice
    });
    
    return (
      <View style={styles.editCell}>
        <TextInput
          style={styles.priceInput}
          value={displayPrice > 0 ? displayPrice.toString() : ''}
          onChangeText={(text) => {
            // Permetti solo numeri e virgola/punto
            const cleanText = text.replace(/[^0-9.,]/g, '').replace(',', '.');
            const newPrice = parseFloat(cleanText) || 0;
            console.log('🔍 CompactPriceManagementModal: Prezzo modificato per', reference.id, '=', newPrice);
            setModifiedPrices(prev => ({
              ...prev,
              [reference.id]: newPrice
            }));
          }}
          keyboardType="default"
          placeholder="0.00"
        />
        {currentModifiedPrice !== undefined && currentModifiedPrice !== reference.netPrice && (
          <Text style={styles.modifiedIndicator}>*</Text>
        )}
      </View>
    );
  };

  const renderReferenceRow = ({ item }: { item: PriceReference }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.codeCell]}>
        <Text style={styles.cellText} numberOfLines={1}>{item.code}</Text>
      </View>
      <View style={[styles.tableCell, styles.descriptionCell]}>
        <Text style={styles.cellText} numberOfLines={1}>{item.description}</Text>
      </View>
      <View style={[styles.tableCell, styles.brandCell]}>
        <Text style={styles.cellText} numberOfLines={1}>{item.brand}</Text>
      </View>
      <View style={[styles.tableCell, styles.unitPriceCell]}>
        <Text style={styles.cellText}>€{item.unitPrice?.toFixed(2) || '0.00'}</Text>
      </View>
      <View style={[styles.tableCell, styles.netPriceCell]}>
        {renderPriceCell(item)}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💰 Gestione Prezzi Referenze Focus</Text>
          <View style={styles.headerButtons}>
            <Pressable
              style={styles.headerTestButton}
              onPress={() => {
                console.log('🔍 CompactPriceManagementModal: PULSANTE HEADER CLICCATO!');
                Alert.alert('Test', 'Pulsante header funziona!');
              }}
            >
              <Text style={styles.headerTestButtonText}>TEST</Text>
            </Pressable>
            <Pressable
              style={styles.headerSaveButton}
              onPress={() => {
                console.log('🔍 CompactPriceManagementModal: SALVATAGGIO GLOBALE!');
                handleGlobalSave();
              }}
            >
              <Text style={styles.headerSaveButtonText}>SALVA TUTTO</Text>
            </Pressable>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per codice, descrizione, brand..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {filteredReferences.length} di {priceReferences.length} referenze
          </Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={[styles.tableCell, styles.codeCell]}>
            <Text style={styles.headerText}>Codice</Text>
          </View>
          <View style={[styles.tableCell, styles.descriptionCell]}>
            <Text style={styles.headerText}>Descrizione</Text>
          </View>
          <View style={[styles.tableCell, styles.brandCell]}>
            <Text style={styles.headerText}>Brand</Text>
          </View>
          <View style={[styles.tableCell, styles.unitPriceCell]}>
            <Text style={styles.headerText}>Listino</Text>
          </View>
          <View style={[styles.tableCell, styles.netPriceCell]}>
            <Text style={styles.headerText}>Netto</Text>
          </View>
        </View>

        {/* Table Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Caricamento referenze...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredReferences}
            renderItem={renderReferenceRow}
            keyExtractor={(item) => item.id}
            style={styles.tableContainer}
            showsVerticalScrollIndicator={false}
            initialNumToRender={30}
            maxToRenderPerBatch={30}
            windowSize={15}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTestButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 5,
  },
  headerTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerSaveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 5,
  },
  headerSaveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.small,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  statsContainer: {
    padding: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 40,
  },
  tableCell: {
    padding: 4,
    justifyContent: 'center',
  },
  codeCell: {
    flex: 1.2,
  },
  descriptionCell: {
    flex: 2.2,
  },
  brandCell: {
    flex: 0.8,
  },
  unitPriceCell: {
    flex: 0.8,
  },
  netPriceCell: {
    flex: 0.8,
  },
  cellText: {
    fontSize: 10,
    color: '#333',
  },
  priceCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  editCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 3,
    padding: 2,
    marginRight: 2,
  },
  editButtons: {
    flexDirection: 'row',
  },
  editButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  textButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 5,
  },
  textButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modifiedIndicator: {
    fontSize: 10,
    color: 'red',
    marginLeft: 5,
  },
}); 