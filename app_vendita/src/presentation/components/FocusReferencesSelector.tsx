import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useAppDataStore } from '../../stores/appDataStore';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface FocusReferencesSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function FocusReferencesSelector({
  visible,
  onClose,
}: FocusReferencesSelectorProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedSubBrand, setSelectedSubBrand] = useState<string>('');
  const [selectedTypology, setSelectedTypology] = useState<string>('');
  
  const {
    priceReferences,
    selectedFocusReferences,
    setSelectedFocusReferences,
    addFocusReference,
    removeFocusReference,
    getFilteredPriceReferences,
  } = useAppDataStore();

  // Filtri disponibili
  const availableBrands = useMemo(() => {
    const brands = [...new Set(priceReferences.map(ref => ref.brand))].sort();
    return brands;
  }, [priceReferences]);

  const availableSubBrands = useMemo(() => {
    const subBrands = [...new Set(priceReferences.map(ref => ref.subBrand))].sort();
    return subBrands;
  }, [priceReferences]);

  const availableTypologies = useMemo(() => {
    const typologies = [...new Set(priceReferences.map(ref => ref.typology))].sort();
    return typologies;
  }, [priceReferences]);

  // Referenze filtrate
  const filteredReferences = useMemo(() => {
    let filtered = getFilteredPriceReferences({
      brand: selectedBrand || undefined,
      subBrand: selectedSubBrand || undefined,
      typology: selectedTypology || undefined,
    });

    if (searchText) {
      filtered = filtered.filter(ref =>
        ref.description.toLowerCase().includes(searchText.toLowerCase()) ||
        ref.code.toLowerCase().includes(searchText.toLowerCase()) ||
        ref.brand.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  }, [priceReferences, selectedBrand, selectedSubBrand, selectedTypology, searchText, getFilteredPriceReferences]);

  const handleToggleReference = (referenceId: string) => {
    if (selectedFocusReferences.includes(referenceId)) {
      removeFocusReference(referenceId);
    } else {
      addFocusReference(referenceId);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredReferences.map(ref => ref.id);
    setSelectedFocusReferences(allIds);
  };

  const handleClearSelection = () => {
    setSelectedFocusReferences([]);
  };

  const handleSaveSelection = () => {
    Alert.alert(
      'Conferma Selezione',
      `Hai selezionato ${selectedFocusReferences.length} referenze focus. Queste saranno utilizzate come base per l'applicazione.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Salva',
          onPress: () => {
            Alert.alert(
              'Selezione Salvata',
              `${selectedFocusReferences.length} referenze focus sono state salvate come base dell'applicazione.`
            );
            onClose();
          },
        },
      ]
    );
  };

  const selectedReferences = priceReferences.filter(ref => 
    selectedFocusReferences.includes(ref.id)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Selezione Referenze Focus</Text>
          <SafeTouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </SafeTouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Statistiche */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>📊 Statistiche</Text>
            <Text style={styles.statsItem}>• Referenze totali: {priceReferences.length}</Text>
            <Text style={styles.statsItem}>• Referenze selezionate: {selectedFocusReferences.length}</Text>
            <Text style={styles.statsItem}>• Referenze filtrate: {filteredReferences.length}</Text>
          </View>

          {/* Filtri */}
          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>🔍 Filtri</Text>
            
            {/* Ricerca */}
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca per descrizione, codice o brand..."
              value={searchText}
              onChangeText={setSearchText}
            />

            {/* Filtri a cascata */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Brand:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <SafeTouchableOpacity
                  style={[styles.filterChip, !selectedBrand && styles.filterChipActive]}
                  onPress={() => setSelectedBrand('')}
                >
                  <Text style={[styles.filterChipText, !selectedBrand && styles.filterChipTextActive]}>
                    Tutti
                  </Text>
                </SafeTouchableOpacity>
                {availableBrands.map(brand => (
                  <SafeTouchableOpacity
                    key={brand}
                    style={[styles.filterChip, selectedBrand === brand && styles.filterChipActive]}
                    onPress={() => setSelectedBrand(brand)}
                  >
                    <Text style={[styles.filterChipText, selectedBrand === brand && styles.filterChipTextActive]}>
                      {brand}
                    </Text>
                  </SafeTouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sottobrand:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <SafeTouchableOpacity
                  style={[styles.filterChip, !selectedSubBrand && styles.filterChipActive]}
                  onPress={() => setSelectedSubBrand('')}
                >
                  <Text style={[styles.filterChipText, !selectedSubBrand && styles.filterChipTextActive]}>
                    Tutti
                  </Text>
                </SafeTouchableOpacity>
                {availableSubBrands.map(subBrand => (
                  <SafeTouchableOpacity
                    key={subBrand}
                    style={[styles.filterChip, selectedSubBrand === subBrand && styles.filterChipActive]}
                    onPress={() => setSelectedSubBrand(subBrand)}
                  >
                    <Text style={[styles.filterChipText, selectedSubBrand === subBrand && styles.filterChipTextActive]}>
                      {subBrand}
                    </Text>
                  </SafeTouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Tipologia:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <SafeTouchableOpacity
                  style={[styles.filterChip, !selectedTypology && styles.filterChipActive]}
                  onPress={() => setSelectedTypology('')}
                >
                  <Text style={[styles.filterChipText, !selectedTypology && styles.filterChipTextActive]}>
                    Tutte
                  </Text>
                </SafeTouchableOpacity>
                {availableTypologies.map(typology => (
                  <SafeTouchableOpacity
                    key={typology}
                    style={[styles.filterChip, selectedTypology === typology && styles.filterChipActive]}
                    onPress={() => setSelectedTypology(typology)}
                  >
                    <Text style={[styles.filterChipText, selectedTypology === typology && styles.filterChipTextActive]}>
                      {typology}
                    </Text>
                  </SafeTouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Azioni rapide */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>⚡ Azioni Rapide</Text>
            <View style={styles.quickActionsRow}>
              <SafeTouchableOpacity
                style={styles.quickActionButton}
                onPress={handleSelectAll}
              >
                <Text style={styles.quickActionText}>Seleziona Tutti</Text>
              </SafeTouchableOpacity>
              <SafeTouchableOpacity
                style={styles.quickActionButton}
                onPress={handleClearSelection}
              >
                <Text style={styles.quickActionText}>Deseleziona Tutti</Text>
              </SafeTouchableOpacity>
            </View>
          </View>

          {/* Lista referenze */}
          <View style={styles.referencesSection}>
            <Text style={styles.sectionTitle}>
              📋 Referenze ({filteredReferences.length})
            </Text>
            
            {filteredReferences.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Nessuna referenza trovata con i filtri attuali.
                </Text>
              </View>
            ) : (
              filteredReferences.map((reference) => {
                const isSelected = selectedFocusReferences.includes(reference.id);
                return (
                  <SafeTouchableOpacity
                    key={reference.id}
                    style={[styles.referenceItem, isSelected && styles.referenceItemSelected]}
                    onPress={() => handleToggleReference(reference.id)}
                  >
                    <View style={styles.referenceHeader}>
                      <Text style={styles.referenceCode}>{reference.code}</Text>
                      <Text style={[styles.referenceStatus, isSelected && styles.referenceStatusSelected]}>
                        {isSelected ? '✓ Selezionata' : 'Non selezionata'}
                      </Text>
                    </View>
                    <Text style={styles.referenceDescription}>{reference.description}</Text>
                    <View style={styles.referenceDetails}>
                      <Text style={styles.referenceDetail}>Brand: {reference.brand}</Text>
                      <Text style={styles.referenceDetail}>Sottobrand: {reference.subBrand}</Text>
                      <Text style={styles.referenceDetail}>Tipologia: {reference.typology}</Text>
                      <Text style={styles.referenceDetail}>Prezzo: €{reference.unitPrice}</Text>
                    </View>
                  </SafeTouchableOpacity>
                );
              })
            )}
          </View>

          {/* Azioni finali */}
          <View style={styles.finalActionsSection}>
            <SafeTouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveSelection}
            >
              <Text style={styles.saveButtonText}>
                💾 Salva Selezione ({selectedFocusReferences.length})
              </Text>
            </SafeTouchableOpacity>
          </View>
        </ScrollView>
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: Spacing.medium,
  },
  statsSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: 12,
    marginBottom: Spacing.medium,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  statsItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  filtersSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: 12,
    marginBottom: Spacing.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  searchInput: {
    backgroundColor: Colors.background,
    padding: Spacing.small,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.small,
    fontSize: 14,
  },
  filterRow: {
    marginBottom: Spacing.small,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.small,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  quickActionsSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: 12,
    marginBottom: Spacing.medium,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.small,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.small,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  referencesSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: 12,
    marginBottom: Spacing.medium,
  },
  emptyState: {
    padding: Spacing.large,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  referenceItem: {
    backgroundColor: Colors.background,
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  referenceItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  referenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  referenceCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  referenceStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  referenceStatusSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  referenceDescription: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    lineHeight: 20,
  },
  referenceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.small,
  },
  referenceDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  finalActionsSection: {
    marginTop: Spacing.medium,
  },
  saveButton: {
    backgroundColor: Colors.success,
    padding: Spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 