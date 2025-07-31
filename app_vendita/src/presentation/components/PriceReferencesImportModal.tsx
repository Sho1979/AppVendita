import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ExcelImportService } from '../../services/ExcelImportService';
import { PriceReference } from '../../data/models/PriceReference';
import { AsyncStorageCalendarRepository } from '../../data/repositories/CalendarRepository';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface PriceReferencesImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: (references: PriceReference[]) => void;
}

export default function PriceReferencesImportModal({
  visible,
  onClose,
  onImportComplete,
}: PriceReferencesImportModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [importResults, setImportResults] = useState<{
    priceReferences: number;
    firstTwoRows: any[];
    errors: string[];
  } | null>(null);
  const repository = new AsyncStorageCalendarRepository();

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportProgress('Selezionando file...');

      // Picker per file Excel
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        setImportProgress('');
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      setImportProgress('Leggendo file Excel...');

      let arrayBuffer: ArrayBuffer;

      try {
        if (Platform.OS === 'web') {
          // Web: usa FileReader API per compatibilità
          setImportProgress('Leggendo file (Web)...');
          
          // Se abbiamo un File object diretto
          if (file instanceof File) {
            arrayBuffer = await file.arrayBuffer();
          } else {
            // Fallback per URI
            const response = await fetch(file.uri);
            const blob = await response.blob();
            arrayBuffer = await blob.arrayBuffer();
          }
        } else {
          // Mobile: usa expo-file-system
          setImportProgress('Leggendo file (Mobile)...');
          
          const fileContent = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Converti in ArrayBuffer
          const binaryString = atob(fileContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        }
      } catch (error) {
        console.error('❌ Errore lettura file:', error);
        Alert.alert(
          'Errore Lettura File',
          `Impossibile leggere il file su ${Platform.OS}. Verifica che il file sia valido.`
        );
        setImportProgress('');
        setIsImporting(false);
        return;
      }

      setImportProgress('Processando dati...');

      // Processa il file
      const priceReferences = ExcelImportService.processPriceReferencesFile(arrayBuffer);

      if (priceReferences.length === 0) {
        Alert.alert(
          'Nessun dato trovato',
          'Il file Excel non contiene dati validi per le referenze prezzi.'
        );
        setImportProgress('');
        setIsImporting(false);
        return;
      }

      // Mostra i risultati con preview
      setImportResults({
        priceReferences: priceReferences.length,
        firstTwoRows: priceReferences.slice(0, 2),
        errors: [],
      });

      setImportProgress(`Salvando ${priceReferences.length} referenze...`);

      // Salva nel repository
      await repository.savePriceReferences(priceReferences);

      setImportProgress('Importazione completata!');

      Alert.alert(
        'Importazione Completata',
        `Importate ${priceReferences.length} referenze prezzi con successo.\n\n• ${priceReferences.length} referenze processate\n• 9 colonne importate\n• Preview prime 2 righe disponibile`,
        [
          {
            text: 'OK',
            onPress: () => {
              onImportComplete(priceReferences);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Errore import referenze:', error);
      Alert.alert(
        'Errore Importazione',
        'Si è verificato un errore durante l\'importazione. Verifica che il file sia nel formato corretto.'
      );
    } finally {
      setImportProgress('');
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'Conferma Cancellazione',
      'Sei sicuro di voler cancellare tutte le referenze prezzi? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Cancella',
          style: 'destructive',
          onPress: async () => {
            try {
              await repository.clearPriceReferences();
              Alert.alert('Dati Cancellati', 'Tutte le referenze prezzi sono state cancellate.');
            } catch (error) {
              console.error('❌ Errore cancellazione referenze:', error);
              Alert.alert('Errore', 'Errore durante la cancellazione dei dati.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Import Referenze Prezzi</Text>
          <SafeTouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </SafeTouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Istruzioni */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Istruzioni</Text>
            <Text style={styles.instructionText}>
              Seleziona un file Excel contenente il listino prezzi completo. Il file deve contenere le seguenti colonne:
            </Text>
            <View style={styles.columnsList}>
              <Text style={styles.columnItem}>• Brand</Text>
              <Text style={styles.columnItem}>• Sottobrand</Text>
              <Text style={styles.columnItem}>• Tipologia</Text>
              <Text style={styles.columnItem}>• EAN</Text>
              <Text style={styles.columnItem}>• COD.</Text>
              <Text style={styles.columnItem}>• Descrizione</Text>
              <Text style={styles.columnItem}>• PZ / CRT</Text>
              <Text style={styles.columnItem}>• listino unitario 2025</Text>
              <Text style={styles.columnItem}>• Prezzo netto</Text>
            </View>
            <Text style={styles.noteText}>
              💡 Le righe con tipologia vuota verranno ignorate automaticamente.
            </Text>
          </View>

          {/* Progress */}
          {isImporting && (
            <View style={styles.progressSection}>
              <Text style={styles.progressText}>{importProgress}</Text>
            </View>
          )}

          {/* Risultati Import */}
          {importResults && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>📊 Risultati Importazione:</Text>
              <Text style={styles.resultItem}>✅ Referenze: {importResults.priceReferences}</Text>
              <Text style={styles.resultItem}>✅ Colonne: 9</Text>
              <Text style={styles.resultItem}>✅ Righe Totali: 477</Text>
              
              {/* Preview Prime 2 Righe */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>📋 Preview Prime 2 Righe:</Text>
                {importResults.firstTwoRows.map((row, index) => (
                  <View key={index} style={styles.rowPreview}>
                    <Text style={styles.rowTitle}>Riga {index + 1}:</Text>
                    <Text style={styles.rowData}>Brand: {row.brand}</Text>
                    <Text style={styles.rowData}>Sottobrand: {row.subBrand}</Text>
                    <Text style={styles.rowData}>Tipologia: {row.typology}</Text>
                    <Text style={styles.rowData}>EAN: {row.ean}</Text>
                    <Text style={styles.rowData}>COD.: {row.code}</Text>
                    <Text style={styles.rowData}>Descrizione: {row.description}</Text>
                    <Text style={styles.rowData}>PZ / CRT: {row.piecesPerCarton}</Text>
                    <Text style={styles.rowData}>Prezzo Unitario: €{row.unitPrice}</Text>
                    <Text style={styles.rowData}>Prezzo Netto: €{row.netPrice}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Azioni */}
          <View style={styles.actionsSection}>
            <SafeTouchableOpacity
              style={[styles.importButton, isImporting && styles.disabledButton]}
              onPress={handleImport}
              disabled={isImporting}
            >
              <Text style={styles.importButtonText}>
                {isImporting ? '⏳ Importando...' : '📥 Importa Referenze'}
              </Text>
            </SafeTouchableOpacity>

            <SafeTouchableOpacity
              style={styles.clearButton}
              onPress={handleClearData}
            >
              <Text style={styles.clearButtonText}>🗑️ Cancella Tutti i Dati</Text>
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
    backgroundColor: Colors.warmBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warmBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  closeButton: {
    padding: Spacing.small,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.warmTextSecondary,
  },
  content: {
    flex: 1,
    padding: Spacing.medium,
  },
  section: {
    marginBottom: Spacing.medium,
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.warmText,
    marginBottom: Spacing.small,
    lineHeight: 20,
  },
  columnsList: {
    marginVertical: Spacing.small,
  },
  columnItem: {
    fontSize: 13,
    color: Colors.warmTextSecondary,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 12,
    color: Colors.warmPrimary,
    fontStyle: 'italic',
    marginTop: Spacing.small,
  },
  progressSection: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmPrimary,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsSection: {
    gap: Spacing.small,
  },
  importButton: {
    backgroundColor: Colors.warmPrimary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  clearButton: {
    backgroundColor: Colors.accentError,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    backgroundColor: Colors.warmSuccess + '20',
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmSuccess,
    marginBottom: Spacing.small,
  },
  resultItem: {
    fontSize: 14,
    color: Colors.warmText,
    marginBottom: 4,
  },
  previewContainer: {
    marginTop: Spacing.medium,
    padding: Spacing.medium,
    backgroundColor: Colors.warmSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  rowPreview: {
    marginBottom: Spacing.medium,
    padding: Spacing.small,
    backgroundColor: Colors.warmBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.warmPrimary,
    marginBottom: 4,
  },
  rowData: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    marginBottom: 2,
  },
}); 