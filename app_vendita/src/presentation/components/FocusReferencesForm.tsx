import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusReferences } from '../../hooks/useFocusReferences';


interface FocusReferenceData {
  referenceId: string;
  orderedPieces: string;
  soldPieces: string;
  stockPieces: string;
  soldVsStockPercentage: string;
}

interface FocusReferencesFormProps {
  selectedDate: string;
  onDataChange?: (data: FocusReferenceData[]) => void;
}

const FocusReferencesForm: React.FC<FocusReferencesFormProps> = ({
  selectedDate,
  onDataChange,
}) => {
  const {
    focusReferences,
    loading,
    getNetPrice,
  } = useFocusReferences();

  const [focusData, setFocusData] = useState<FocusReferenceData[]>([]);

  // Carica le referenze focus quando cambia la data
  useEffect(() => {
    if (focusReferences.length > 0) {
      const initialData = focusReferences.map(ref => ({
        referenceId: ref.id,
        orderedPieces: '',
        soldPieces: '',
        stockPieces: '',
        soldVsStockPercentage: '',
      }));
      setFocusData(initialData);
    }
  }, [focusReferences]);

  // Notifica il cambio dati solo quando focusData cambia effettivamente
  useEffect(() => {
    if (onDataChange && focusData.length > 0) {
      onDataChange(focusData);
    }
  }, [focusData]); // Solo focusData come dependency

  const updateFocusData = (referenceId: string, field: keyof FocusReferenceData, value: string) => {
    setFocusData(prev => 
      prev.map(item => 
        item.referenceId === referenceId 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const calculatePercentage = (sold: string, ordered: string): string => {
    const soldNum = parseFloat(sold) || 0;
    const orderedNum = parseFloat(ordered) || 0;
    
    if (orderedNum === 0) return '0';
    
    const percentage = (soldNum / orderedNum) * 100;
    return percentage.toFixed(1);
  };

  const handleSoldChange = (referenceId: string, value: string) => {
    updateFocusData(referenceId, 'soldPieces', value);
    
    // Calcola automaticamente lo Stock e la percentuale
    const item = focusData.find(d => d.referenceId === referenceId);
    if (item) {
      const orderedNum = parseFloat(item.orderedPieces) || 0;
      const soldNum = parseFloat(value) || 0;
      const stockNum = Math.max(0, orderedNum - soldNum); // Stock = Ordinato - Venduto
      
      // Aggiorna lo Stock automaticamente
      updateFocusData(referenceId, 'stockPieces', stockNum.toString());
      
      // Calcola automaticamente la percentuale (Venduto / Ordinato)
      const percentage = calculatePercentage(value, item.orderedPieces);
      updateFocusData(referenceId, 'soldVsStockPercentage', percentage);
    }
  };

  const handleOrderedChange = (referenceId: string, value: string) => {
    updateFocusData(referenceId, 'orderedPieces', value);
    
    // Calcola automaticamente lo Stock e la percentuale
    const item = focusData.find(d => d.referenceId === referenceId);
    if (item) {
      const orderedNum = parseFloat(value) || 0;
      const soldNum = parseFloat(item.soldPieces) || 0;
      const stockNum = Math.max(0, orderedNum - soldNum); // Stock = Ordinato - Venduto
      
      // Aggiorna lo Stock automaticamente
      updateFocusData(referenceId, 'stockPieces', stockNum.toString());
      
      // Calcola automaticamente la percentuale (Venduto / Ordinato)
      const percentage = calculatePercentage(item.soldPieces, value);
      updateFocusData(referenceId, 'soldVsStockPercentage', percentage);
    }
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                   onChangeText={(text) => handleOrderedChange(reference.id, text)}
                   keyboardType="numeric"
                   placeholder="0"
                   placeholderTextColor="#8E8E93"
                 />
               </View>

              {/* Venduto */}
              <View style={styles.cell}>
                <TextInput
                  style={styles.inputCell}
                  value={data.soldPieces}
                  onChangeText={(text) => handleSoldChange(reference.id, text)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#8E8E93"
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    minHeight: 60,
  },
  cell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
     paddingVertical: 4,
     fontSize: 10,
     backgroundColor: '#FFFFFF',
     width: '90%',
     textAlign: 'center',
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