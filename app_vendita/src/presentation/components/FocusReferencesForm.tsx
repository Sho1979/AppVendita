import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';
import { FocusReferenceData } from '../../data/models/FocusReferenceData';

interface FocusReferencesFormProps {
  selectedDate: string;
  existingData: FocusReferenceData[] | undefined;
  onDataChange?: (data: FocusReferenceData[]) => void;
}

const FocusReferencesForm: React.FC<FocusReferencesFormProps> = ({
  selectedDate,
  existingData,
  onDataChange,
}) => {
  const focusReferencesStore = useFocusReferencesStore();
  const focusReferences = focusReferencesStore.getAllReferences().filter(ref => 
    focusReferencesStore.getFocusReferences().includes(ref.id)
  );
  const loading = focusReferencesStore.isLoading;
  
  const getNetPrice = (referenceId: string): string => {
    const netPrices = focusReferencesStore.getNetPrices();
    const netPrice = netPrices[referenceId];
    return netPrice || '0';
  };

  const [focusData, setFocusData] = useState<FocusReferenceData[]>([]);
  const isInitialized = useRef(false);

  // Carica le referenze focus all'inizializzazione del componente
  useEffect(() => {
    const loadFocusReferences = async () => {
      console.log('🔍 FocusReferencesForm: Caricamento referenze focus...');
      
      // Carica il listino completo (statico)
      focusReferencesStore.loadAllReferences();
      
      // Carica le configurazioni focus da Firestore (globali)
      await focusReferencesStore.loadFocusReferencesFromFirestore();
      
      console.log('✅ FocusReferencesForm: Referenze focus caricate');
    };
    
    loadFocusReferences();
  }, []); // Esegui solo all'inizializzazione - nessuna dipendenza per evitare loop

  // Carica le referenze focus quando cambia la data
  useEffect(() => {
    console.log('🔍 FocusReferencesForm: useEffect triggered:', {
      focusReferencesLength: focusReferences.length,
      existingData: existingData,
      existingDataLength: existingData?.length || 0,
      isInitialized: isInitialized.current
    });
    
    if (focusReferences.length > 0) {
      // Se abbiamo dati esistenti, li utilizziamo, altrimenti creiamo dati vuoti
      const initialData = existingData && existingData.length > 0 
        ? existingData 
        : focusReferences.map(ref => ({
            referenceId: ref.id,
            orderedPieces: '',
            soldPieces: '',
            stockPieces: '',
            soldVsStockPercentage: '',
            netPrice: getNetPrice(ref.id), // Prezzo netto fisso da Firebase
          }));
      
      console.log('📋 FocusReferencesForm: Dati iniziali impostati:', {
        usingExistingData: existingData && existingData.length > 0,
        initialDataLength: initialData.length,
        firstItem: initialData[0]
      });
      
      setFocusData(initialData);
      isInitialized.current = true;
    }
  }, [focusReferences.length, existingData]); // Uso focusReferences.length invece di focusReferences per evitare loop

  // Notifica il parent quando focusData cambia
  useEffect(() => {
    if (focusData.length > 0 && onDataChange && isInitialized.current) {
      onDataChange(focusData);
    }
  }, [focusData]); // Rimossa onDataChange dalle dipendenze per evitare loop

  const calculatePercentage = (sold: string, ordered: string): string => {
    const soldNum = parseFloat(sold) || 0;
    const orderedNum = parseFloat(ordered) || 0;
    
    if (orderedNum === 0) return '0';
    
    const percentage = (soldNum / orderedNum) * 100;
    return percentage.toFixed(1);
  };

  const handleSoldChange = (referenceId: string, value: string) => {
    console.log('🔍 handleSoldChange called:', { referenceId, value, type: typeof value });
    setFocusData(prev => {
      const updatedData = prev.map(item => {
        if (item.referenceId === referenceId) {
          const orderedNum = parseFloat(item.orderedPieces) || 0;
          const soldNum = parseFloat(value) || 0;
          const stockNum = Math.max(0, orderedNum - soldNum);
          const percentage = calculatePercentage(value, item.orderedPieces);
          
          return {
            ...item,
            soldPieces: value,
            stockPieces: stockNum.toString(),
            soldVsStockPercentage: percentage
          };
        }
        return item;
      });
      
      return updatedData;
    });
  };

  const handleOrderedChange = (referenceId: string, value: string) => {
    console.log('🔍 handleOrderedChange called:', { referenceId, value, type: typeof value });
    setFocusData(prev => {
      const updatedData = prev.map(item => {
        if (item.referenceId === referenceId) {
          const soldNum = parseFloat(item.soldPieces) || 0;
          const orderedNum = parseFloat(value) || 0;
          const stockNum = Math.max(0, orderedNum - soldNum);
          const percentage = calculatePercentage(item.soldPieces, value);
          
          return {
            ...item,
            orderedPieces: value,
            stockPieces: stockNum.toString(),
            soldVsStockPercentage: percentage
          };
        }
        return item;
      });
      
      return updatedData;
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Caricamento referenze focus...</Text>
      </View>
    );
  }

  if (focusReferences.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
                           <Ionicons name="locate-outline" size={48} color="#8E8E93" />
          <Text style={styles.emptyTitle}>Nessuna Referenza Focus</Text>
          <Text style={styles.emptySubtitle}>
            Vai nelle Impostazioni per selezionare le referenze focus
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
                         <Ionicons name="locate" size={20} color="#007AFF" />
        <Text style={styles.headerTitle}>Referenze Focus - {selectedDate}</Text>
        <Text style={styles.headerCount}>({focusReferences.length})</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header della tabella */}
        <View style={styles.tableHeader}>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Codice</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Descrizione</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>N° PZ</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Prezzo Netto</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Ordinato (PZ)</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Venduto (PZ)</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>Stock (PZ)</Text>
          </View>
                     <View style={styles.headerCell}>
             <Text style={styles.headerText}>% Venduto/Ordinato</Text>
           </View>
        </View>

        {/* Righe delle referenze */}
        {focusReferences.map((reference) => {
          const data = focusData.find(d => d.referenceId === reference.id) || {
            referenceId: reference.id,
            orderedPieces: '',
            soldPieces: '',
            stockPieces: '',
            soldVsStockPercentage: '',
          };

          return (
            <View key={reference.id} style={styles.tableRow}>
              {/* Codice */}
              <View style={styles.cell}>
                <Text style={styles.codeText}>{reference.code}</Text>
              </View>

              {/* Descrizione */}
              <View style={styles.cell}>
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {reference.description}
                </Text>
              </View>

              {/* Numero pezzi per cartone */}
              <View style={styles.cell}>
                <Text style={styles.piecesText}>{reference.piecesPerCarton}</Text>
              </View>

              {/* Prezzo netto */}
              <View style={styles.cell}>
                <Text style={styles.netPriceText}>€{getNetPrice(reference.id)}</Text>
              </View>

                             {/* Ordinato */}
               <View style={styles.cell}>
                 <TextInput
                   style={styles.inputCell}
                   value={data.orderedPieces}
                   onChangeText={(text) => {
                     console.log('🔍 Ordinato onChangeText:', { text, currentValue: data.orderedPieces });
                     handleOrderedChange(reference.id, text);
                   }}
                   keyboardType="numeric"
                   placeholder="0"
                   placeholderTextColor="#8E8E93"
                   editable={true}
                   selectTextOnFocus={true}
                 />
               </View>

              {/* Venduto */}
              <View style={styles.cell}>
                <TextInput
                  style={styles.inputCell}
                  value={data.soldPieces}
                  onChangeText={(text) => {
                    console.log('🔍 Venduto onChangeText:', { text, currentValue: data.soldPieces });
                    handleSoldChange(reference.id, text);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#8E8E93"
                  editable={true}
                  selectTextOnFocus={true}
                />
              </View>

                             {/* Stock - Calcolato automaticamente */}
               <View style={styles.cell}>
                 <Text style={[styles.inputCell, styles.calculatedCell]}>
                   {data.stockPieces}
                 </Text>
               </View>

              {/* Percentuale */}
              <View style={styles.cell}>
                <Text style={styles.percentageText}>
                  {data.soldVsStockPercentage}%
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  headerCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  scrollView: {
    maxHeight: 400,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 70,
  },
  cell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 12,
  },
  piecesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  netPriceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#28A745',
    textAlign: 'center',
  },
  inputCell: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 10,
    backgroundColor: '#FFFFFF',
    width: '90%',
    textAlign: 'center',
    minHeight: 35,
    zIndex: 1,
  },
  calculatedCell: {
    backgroundColor: '#F8F9FA',
    borderColor: '#D1D5DB',
    color: '#6B7280',
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B35',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default FocusReferencesForm; 