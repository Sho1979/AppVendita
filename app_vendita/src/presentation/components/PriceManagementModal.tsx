import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

interface PriceManagementModalProps {
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

export default function PriceManagementModal({
  visible,
  onClose,
}: PriceManagementModalProps) {
  const [priceReferences, setPriceReferences] = useState<PriceReference[]>([]);
  const [filteredReferences, setFilteredReferences] = useState<PriceReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    if (visible) {
      loadPriceReferences();
    }
  }, [visible]);

  useEffect(() => {
    filterReferences();
  }, [searchTerm, priceReferences]);

  const loadPriceReferences = async () => {
    try {
      setIsLoading(true);
      const references = await firebaseCalendarService.getPriceReferences();
      setPriceReferences(references);
      console.log('✅ PriceManagementModal: Caricate', references.length, 'referenze');
    } catch (error) {
      console.error('❌ PriceManagementModal: Errore caricamento referenze:', error);
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
    setEditingPrice(referenceId);
    setEditingValue(currentPrice.toString());
  };

  const handleSavePrice = async (referenceId: string) => {
    try {
      const newPrice = parseFloat(editingValue);
      if (isNaN(newPrice) || newPrice < 0) {
        Alert.alert('Errore', 'Inserisci un prezzo valido');
        return;
      }

      // Aggiorna il prezzo nella lista locale
      setPriceReferences(prev => 
        prev.map(ref => 
          ref.id === referenceId 
            ? { ...ref, netPrice: newPrice, updatedAt: new Date() }
            : ref
        )
      );

      // Salva su Firebase
      const reference = priceReferences.find(ref => ref.id === referenceId);
      if (reference) {
        await firebaseCalendarService.updatePriceReference({
          ...reference,
          netPrice: newPrice,
          updatedAt: new Date()
        });
      }

      setEditingPrice(null);
      setEditingValue('');
      Alert.alert('Successo', 'Prezzo aggiornato con successo');
    } catch (error) {
      console.error('❌ PriceManagementModal: Errore aggiornamento prezzo:', error);
      Alert.alert('Errore', 'Impossibile aggiornare il prezzo');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setEditingValue('');
  };

  const renderPriceCell = (reference: PriceReference) => {
    if (editingPrice === reference.id) {
      return (
        <View style={styles.editCell}>
          <TextInput
            style={styles.priceInput}
            value={editingValue}
            onChangeText={setEditingValue}
            keyboardType="numeric"
            placeholder="0.00"
            autoFocus
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={() => handleSavePrice(reference.id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={handleCancelEdit}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.priceCell}
        onPress={() => handleEditPrice(reference.id, reference.netPrice)}
      >
        <Text style={styles.priceText}>
          €{reference.netPrice?.toFixed(2) || '0.00'}
        </Text>
        <Ionicons name="pencil" size={12} color="#666" />
      </TouchableOpacity>
    );
  };

  const renderReferenceRow = ({ item }: { item: PriceReference }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.codeCell]}>
        <Text style={styles.cellText} numberOfLines={1}>{item.code}</Text>
      </View>
      <View style={[styles.tableCell, styles.descriptionCell]}>
        <Text style={styles.cellText} numberOfLines={2}>{item.description}</Text>
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
          <Text style={styles.headerTitle}>💰 Gestione Prezzi</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per codice, descrizione, brand..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
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
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  statsContainer: {
    padding: Spacing.small,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statsText: {
    fontSize: 14,
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
    fontSize: 12,
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
  },
  tableCell: {
    padding: 8,
    justifyContent: 'center',
  },
  codeCell: {
    flex: 1.5,
  },
  descriptionCell: {
    flex: 2.5,
  },
  brandCell: {
    flex: 1,
  },
  unitPriceCell: {
    flex: 1,
  },
  netPriceCell: {
    flex: 1,
  },
  cellText: {
    fontSize: 12,
    color: '#333',
  },
  priceCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  editCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    marginRight: 4,
  },
  editButtons: {
    flexDirection: 'row',
  },
  editButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 16,
    color: '#666',
  },
}); 