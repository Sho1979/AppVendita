import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusReferencesStore, FocusReference } from '../../stores/focusReferencesStore';

// Rimuovo l'interfaccia PriceReference perché ora uso FocusReference dal store

interface FocusReferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

const FocusReferencesModal: React.FC<FocusReferencesModalProps> = ({
  visible,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usa il nuovo store per le referenze focus
  const focusReferencesStore = useFocusReferencesStore();
  const allReferences = focusReferencesStore.getAllReferences();
  const focusReferences = focusReferencesStore.getFocusReferences();
  const netPrices = focusReferencesStore.getNetPrices();
  const loading = focusReferencesStore.isLoading;

  // Carica tutte le referenze e le configurazioni focus quando si apre il modal
  useEffect(() => {
    if (visible) {
      const loadData = async () => {
        // Carica il listino completo (statico)
        focusReferencesStore.loadAllReferences();
        
        // Carica le configurazioni focus da Firestore (globali)
        await focusReferencesStore.loadFocusReferencesFromFirestore();
      };
      
      loadData();
    }
  }, [visible]); // Rimuovo focusReferencesStore dalle dipendenze per evitare loop infinito

  const toggleFocusReference = (referenceId: string) => {
    console.log('🔍 FocusReferencesModal: Toggle referenza:', referenceId);
    focusReferencesStore.toggleFocusReference(referenceId);
  };

  const saveFocusReferences = async () => {
    try {
      console.log('💾 FocusReferencesModal: Salvataggio referenze focus su Firestore...', {
        focusReferences: focusReferences.length,
        netPrices: Object.keys(netPrices).length
      });
      
      // Salva le configurazioni focus su Firestore (globale per tutti gli utenti)
      await focusReferencesStore.saveFocusReferencesToFirestore();
      
      console.log('✅ FocusReferencesModal: Salvataggio completato su Firestore');
      Alert.alert('Successo', 'Referenze focus salvate con successo (configurazione globale)');
      
      // Chiudi il modal
      console.log('🚪 FocusReferencesModal: Chiusura modal');
      if (typeof onClose === 'function') {
        onClose();
      } else {
        console.error('❌ FocusReferencesModal: onClose non è una funzione!');
      }
      
    } catch (error) {
      console.error('❌ FocusReferencesModal: Errore nel salvataggio:', error);
      Alert.alert('Errore', 'Impossibile salvare le referenze focus su Firestore');
    }
  };

  const clearAllFocus = () => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler rimuovere tutte le referenze focus? Questa azione sarà applicata a tutti gli utenti.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Rimuovi', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Pulisce lo store locale
              focusReferencesStore.clearFocusReferences();
              
              // Salva la configurazione vuota su Firestore (globale)
              await focusReferencesStore.saveFocusReferencesToFirestore();
              
              console.log('🗑️ FocusReferencesModal: Tutte le referenze focus rimosse (configurazione globale)');
              Alert.alert('Successo', 'Referenze focus rimosse con successo (configurazione globale)');
            } catch (error) {
              console.error('Errore nella rimozione:', error);
              Alert.alert('Errore', 'Impossibile rimuovere le referenze focus');
            }
          }
        }
      ]
    );
  };

  const filteredReferences = allReferences.filter(ref =>
    ref.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.subBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.code.includes(searchTerm)
  );

    const renderReferenceItem = ({ item }: { item: FocusReference }) => {
    const isSelected = focusReferences.includes(item.id);
    const currentNetPrice = netPrices[item.id] || item.netPrice.toString();
    
    console.log('🔍 FocusReferencesModal: Rendering item:', item.id, 'isSelected:', isSelected);
    
    return (
      <TouchableOpacity
        style={[styles.gridItem, isSelected && styles.selectedGridItem]}
        onPress={() => toggleFocusReference(item.id)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View style={styles.gridCheckbox}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
          ) : (
            <Ionicons name="ellipse-outline" size={20} color="#8E8E93" />
          )}
        </View>
        
        {/* Contenuto compatto */}
        <View style={styles.gridContent}>
          <Text style={styles.gridBrand}>{item.brand}</Text>
          <Text style={styles.gridSubBrand}>{item.subBrand}</Text>
          <Text style={styles.gridDescription} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.gridCode}>COD: {item.code}</Text>
          <Text style={styles.gridPrice}>€{item.unitPrice.toFixed(2)}</Text>
        </View>
        
        {/* Prezzo Netto sempre visibile ma modificabile solo se selezionato */}
        <View style={styles.gridNetPriceSection}>
          <Text style={styles.gridNetPriceLabel}>Netto:</Text>
          <TextInput
            style={[styles.gridNetPriceInput, !isSelected && styles.disabledInput]}
            value={currentNetPrice}
            onChangeText={(text) => {
              if (isSelected) {
                focusReferencesStore.updateNetPrice(item.id, text);
              }
            }}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            editable={isSelected}
          />
          <Text style={styles.gridNetPriceCurrency}>€</Text>
        </View>
      </TouchableOpacity>
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Gestisci Referenze Focus (Globale)</Text>
          <TouchableOpacity 
            onPress={() => {
              console.log('🔘 FocusReferencesModal: Pulsante Salva premuto');
              saveFocusReferences();
            }} 
            style={styles.saveButton}
          >
                         <Text style={styles.saveButtonText}>Salva Globale</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
                                 <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Seleziona le referenze per il focus del calendario (configurazione globale)
              </Text>
            </View>
                       <View style={styles.counterRow}>
              <Text style={styles.counterText}>
                Selezionate: {focusReferences.length}
              </Text>
             {focusReferences.length > 0 && (
               <TouchableOpacity onPress={clearAllFocus} style={styles.clearButton}>
                 <Text style={styles.clearButtonText}>Rimuovi Tutte</Text>
               </TouchableOpacity>
             )}
           </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per brand, sottobrand, descrizione..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* References List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Caricamento referenze...</Text>
          </View>
                 ) : (
           <FlatList
             data={filteredReferences}
             renderItem={renderReferenceItem}
             keyExtractor={(item) => item.id}
             style={styles.gridList}
             numColumns={2}
             columnWrapperStyle={styles.gridRow}
             showsVerticalScrollIndicator={true}
             scrollEnabled={true}
             ListEmptyComponent={
               <View style={styles.emptyContainer}>
                 <Ionicons name="document-outline" size={48} color="#8E8E93" />
                 <Text style={styles.emptyText}>
                   {searchTerm ? 'Nessuna referenza trovata' : 'Nessuna referenza disponibile'}
                 </Text>
               </View>
             }
           />
         )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
     // Stili per la griglia
   gridList: {
     flex: 1,
     paddingHorizontal: 8,
   },
   gridRow: {
     justifyContent: 'space-between',
   },
     gridItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '48%',
    minHeight: 140,
  },
   selectedGridItem: {
     borderColor: '#007AFF',
     backgroundColor: '#F0F8FF',
   },
   gridCheckbox: {
     alignItems: 'center',
     marginBottom: 8,
   },
   gridContent: {
     flex: 1,
   },
   gridBrand: {
     fontSize: 14,
     fontWeight: '600',
     color: '#000000',
     marginBottom: 2,
     textAlign: 'center',
   },
     gridSubBrand: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
    textAlign: 'center',
  },
  gridDescription: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: 12,
  },
  gridCode: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
    textAlign: 'center',
  },
   gridPrice: {
     fontSize: 14,
     fontWeight: '600',
     color: '#007AFF',
     textAlign: 'center',
   },
   gridNetPriceSection: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 8,
     justifyContent: 'center',
   },
   gridNetPriceLabel: {
     fontSize: 10,
     color: '#666666',
     marginRight: 4,
   },
   gridNetPriceInput: {
     borderWidth: 1,
     borderColor: '#E5E5EA',
     borderRadius: 4,
     paddingHorizontal: 6,
     paddingVertical: 2,
     fontSize: 12,
     backgroundColor: '#FFFFFF',
     width: 50,
     textAlign: 'center',
   },
   disabledInput: {
     backgroundColor: '#F5F5F5',
     color: '#8E8E93',
   },
   gridNetPriceCurrency: {
     fontSize: 10,
     fontWeight: '600',
     color: '#007AFF',
     marginLeft: 2,
   },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
     emptyText: {
     fontSize: 16,
     color: '#8E8E93',
     marginTop: 12,
     textAlign: 'center',
   },
   
 });

export default FocusReferencesModal; 