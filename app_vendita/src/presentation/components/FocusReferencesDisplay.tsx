import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusReferences } from '../../hooks/useFocusReferences';


interface FocusReferencesDisplayProps {
  onRefresh?: () => void;
}

const FocusReferencesDisplay: React.FC<FocusReferencesDisplayProps> = ({
  onRefresh,
}) => {
  const {
    focusReferences,
    loading,
    updateNetPrice,
    getNetPrice,
  } = useFocusReferences();

  const handleNetPriceChange = async (referenceId: string, value: string) => {
    await updateNetPrice(referenceId, value);
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
          {onRefresh && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color="#007AFF" />
              <Text style={styles.refreshButtonText}>Aggiorna</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
                     <Ionicons name="locate" size={20} color="#007AFF" />
          <Text style={styles.headerTitle}>Referenze Focus</Text>
          <Text style={styles.headerCount}>({focusReferences.length})</Text>
        </View>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {focusReferences.map((reference) => (
          <View key={reference.id} style={styles.referenceItem}>
            <View style={styles.referenceHeader}>
              <View style={styles.referenceInfo}>
                <Text style={styles.brandText}>{reference.brand}</Text>
                <Text style={styles.subBrandText}>{reference.subBrand}</Text>
                <Text style={styles.codeText}>COD: {reference.code}</Text>
              </View>
              <View style={styles.priceInfo}>
                <Text style={styles.unitPriceText}>€{reference.unitPrice.toFixed(2)}</Text>
              </View>
            </View>
            
            <View style={styles.netPriceSection}>
              <Text style={styles.netPriceLabel}>Prezzo Netto:</Text>
              <TextInput
                style={styles.netPriceInput}
                value={getNetPrice(reference.id)}
                onChangeText={(text) => handleNetPriceChange(reference.id, text)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#8E8E93"
              />
              <Text style={styles.netPriceCurrency}>€</Text>
            </View>
          </View>
        ))}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  scrollView: {
    maxHeight: 200,
  },
  referenceItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  referenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  referenceInfo: {
    flex: 1,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  subBrandText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  codeText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  unitPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  netPriceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netPriceLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 8,
  },
  netPriceInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    width: 60,
    textAlign: 'center',
  },
  netPriceCurrency: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
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

export default FocusReferencesDisplay; 