import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firebaseCalendarService } from '../../services/FirebaseCalendarService';
import { PriceReference } from '../../data/models/PriceReference';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface PriceReferencesEditorProps {
  visible: boolean;
  onClose: () => void;
}

export default function PriceReferencesEditor({
  visible,
  onClose,
}: PriceReferencesEditorProps) {
  const [priceReferences, setPriceReferences] = useState<PriceReference[]>([]);
  const [filteredReferences, setFilteredReferences] = useState<PriceReference[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{id: string, field: 'netPrice'} | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Carica le referenze da Firebase
  useEffect(() => {
    if (visible) {
      loadPriceReferences();
    }
  }, [visible]);

  // Filtra le referenze in base alla ricerca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReferences(priceReferences);
    } else {
      const filtered = priceReferences.filter(ref => 
        ref.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReferences(filtered);
    }
  }, [searchTerm, priceReferences]);

  const loadPriceReferences = async () => {
    try {
      setLoading(true);
      const references = await firebaseCalendarService.getPriceReferences();
      console.log('🔍 PriceReferencesEditor: Dati ricevuti da Firebase:', references.slice(0, 3));
      
      // Assicurati che i prezzi siano numeri
      const processedReferences = references.map(ref => ({
        ...ref,
        unitPrice: typeof ref.unitPrice === 'number' ? ref.unitPrice : parseFloat(ref.unitPrice) || 0,
        netPrice: typeof ref.netPrice === 'number' ? ref.netPrice : parseFloat(ref.netPrice) || 0,
      }));
      
      setPriceReferences(processedReferences);
      setFilteredReferences(processedReferences);
      console.log('✅ PriceReferencesEditor: Caricate', processedReferences.length, 'referenze');
    } catch (error) {
      console.error('❌ PriceReferencesEditor: Errore caricamento referenze:', error);
      Alert.alert('Errore', 'Impossibile caricare le referenze');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCell = (referenceId: string, field: 'netPrice', currentValue: number) => {
    setEditingCell({ id: referenceId, field });
    setEditingValue(currentValue.toString());
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;

    const newValue = parseFloat(editingValue);
    if (isNaN(newValue) || newValue < 0) {
      Alert.alert('Errore', 'Inserisci un prezzo valido');
      return;
    }

    try {
      setSaving(true);
      
      const reference = priceReferences.find(ref => ref.id === editingCell.id);
      if (!reference) return;

      // Aggiorna la referenza
      const updatedReference: PriceReference = {
        ...reference,
        netPrice: newValue,
        updatedAt: new Date(),
      };

      // Salva su Firebase
      await firebaseCalendarService.updatePriceReference(updatedReference);

      // Aggiorna la lista locale
      setPriceReferences(prev => 
        prev.map(ref => 
          ref.id === editingCell.id ? updatedReference : ref
        )
      );

      setEditingCell(null);
      setEditingValue('');
      
      Alert.alert('Successo', 'Prezzo netto aggiornato');
    } catch (error) {
      console.error('❌ PriceReferencesEditor: Errore salvataggio:', error);
      Alert.alert('Errore', 'Impossibile salvare il prezzo');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.codeCell]}>Codice</Text>
      <Text style={[styles.headerCell, styles.descriptionCell]}>Descrizione</Text>
      <Text style={[styles.headerCell, styles.priceCell]}>Listino</Text>
      <Text style={[styles.headerCell, styles.priceCell]}>Netto</Text>
    </View>
  );

  const renderReferenceRow = ({ item: reference }: { item: PriceReference }) => {
    const isEditing = editingCell?.id === reference.id;
    
    return (
      <View style={styles.dataRow}>
        {/* Codice */}
        <View style={[styles.cell, styles.codeCell]}>
          <Text style={styles.cellText} numberOfLines={1}>
            {reference.code || 'N/A'}
          </Text>
        </View>
        
        {/* Descrizione */}
        <View style={[styles.cell, styles.descriptionCell]}>
          <Text style={styles.cellText} numberOfLines={2}>
            {reference.description || 'N/A'}
          </Text>
        </View>
        
        {/* Prezzo Listino */}
        <View style={[styles.cell, styles.priceCell]}>
          <Text style={styles.cellText}>
            €{reference.unitPrice?.toFixed(2) || '0.00'}
          </Text>
        </View>
        
        {/* Prezzo Netto - Editabile */}
        <View style={[styles.cell, styles.priceCell]}>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editingValue}
              onChangeText={setEditingValue}
              keyboardType="numeric"
              placeholder="0.00"
              autoFocus
            />
          ) : (
            <TouchableOpacity
              style={styles.priceButton}
              onPress={() => handleEditCell(reference.id, 'netPrice', reference.netPrice || 0)}
            >
              <Text style={[
                styles.cellText,
                reference.netPrice === 0 ? styles.zeroPrice : null
              ]}>
                €{reference.netPrice?.toFixed(2) || '0.00'}
              </Text>
              <Ionicons name="pencil" size={12} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Modifica Prezzi Netto</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per codice, descrizione o brand..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {filteredReferences.length} referenze trovate
          </Text>
          {searchTerm.length > 0 && (
            <Text style={styles.searchTerm}>
              Ricerca: "{searchTerm}"
            </Text>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Caricamento referenze...</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {renderHeader()}
            <FlatList
              data={filteredReferences}
              renderItem={renderReferenceRow}
              keyExtractor={(item) => item.id}
              style={styles.tableList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Edit Modal */}
        {editingCell && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Modifica Prezzo Netto</Text>
                
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceInputLabel}>Prezzo Netto (€):</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    keyboardType="numeric"
                    placeholder="0.00"
                    autoFocus
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Annulla</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveCell}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.saveButtonText}>Salva</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.small,
    fontSize: 16,
    color: Colors.text,
  },
  resultsContainer: {
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.small,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchTerm: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.small,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: Spacing.medium,
  },
  tableList: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.small,
    borderRadius: 8,
    marginBottom: Spacing.small,
  },
  headerCell: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginBottom: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cell: {
    padding: Spacing.small,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    color: Colors.text,
  },
  codeCell: {
    flex: 1,
    maxWidth: 80,
  },
  descriptionCell: {
    flex: 2,
  },
  priceCell: {
    flex: 1,
    maxWidth: 70,
  },
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 4,
    padding: 2,
    fontSize: 12,
    color: Colors.text,
    backgroundColor: 'white',
  },
  zeroPrice: {
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.large,
    margin: Spacing.medium,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.medium,
    textAlign: 'center',
  },
  priceInputContainer: {
    marginBottom: Spacing.large,
  },
  priceInputLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.small,
    fontSize: 16,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.small,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: Spacing.small,
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 