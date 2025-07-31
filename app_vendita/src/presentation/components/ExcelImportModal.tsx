import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ExcelImportService } from '../../services/ExcelImportService';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface ExcelImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: (data: {
    agents: any[];
    users: any[];
    salesPoints: any[];
    excelRows: any[];
  }) => void;
}

export default function ExcelImportModal({
  visible,
  onClose,
  onImportComplete,
}: ExcelImportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    agents: number;
    users: number;
    salesPoints: number;
    excelRows: number;
    firstTwoRows: any[];
    errors: string[];
  } | null>(null);

  const handleFilePick = async () => {
    try {
      setIsLoading(true);
      setImportResults(null);

             const result = await DocumentPicker.getDocumentAsync({
         type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
         copyToCacheDirectory: true,
       });

       if (result.canceled === false && result.assets && result.assets.length > 0) {
         const file = result.assets[0];
        console.log('📁 ExcelImportModal: File selezionato:', file.name);

        // Leggi il file
        const response = await fetch(file.uri);
        const arrayBuffer = await response.arrayBuffer();

        // Processa il file Excel
        const { agents, users, salesPoints, excelRows } = ExcelImportService.processExcelFile(arrayBuffer);

        // Mostra i risultati
        setImportResults({
          agents: agents.length,
          users: users.length,
          salesPoints: salesPoints.length,
          excelRows: excelRows.length,
          firstTwoRows: excelRows.slice(0, 2),
          errors: [],
        });

        // Passa i dati al componente padre
        onImportComplete({ agents, users, salesPoints, excelRows });

        Alert.alert(
          'Importazione Completata',
          `Importati con successo:\n• ${agents.length} agenti\n• ${users.length} utenti\n• ${salesPoints.length} punti vendita\n• ${excelRows.length} righe Excel`,
          [
            {
              text: 'OK',
              onPress: onClose,
            },
          ]
        );
      }
         } catch (error) {
       console.error('❌ ExcelImportModal: Errore durante l\'importazione:', error);
       
       if (error && typeof error === 'object' && 'canceled' in error) {
         console.log('📁 ExcelImportModal: Selezione file annullata');
       } else {
        Alert.alert(
          'Errore di Importazione',
          'Si è verificato un errore durante l\'importazione del file Excel. Verifica che il file sia nel formato corretto.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Importa Dati Excel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.description}>
              Seleziona un file Excel (.xlsx o .xls) contenente i dati degli agenti e dei punti vendita.
            </Text>

                         <View style={styles.instructions}>
               <Text style={styles.instructionsTitle}>Struttura Richiesta:</Text>
               <Text style={styles.instructionItem}>• Linea</Text>
               <Text style={styles.instructionItem}>• AM Code</Text>
               <Text style={styles.instructionItem}>• NAM Code</Text>
               <Text style={styles.instructionItem}>• Agente CODE</Text>
               <Text style={styles.instructionItem}>• Insegna Cliente</Text>
               <Text style={styles.instructionItem}>• Codice Cliente</Text>
               <Text style={styles.instructionItem}>• Cliente</Text>
             </View>

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Elaborazione in corso...</Text>
              </View>
            )}

            {importResults && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Risultati Importazione:</Text>
                <Text style={styles.resultItem}>✅ Righe Excel: {importResults.excelRows}</Text>
                <Text style={styles.resultItem}>✅ Agenti: {importResults.agents}</Text>
                <Text style={styles.resultItem}>✅ Utenti: {importResults.users}</Text>
                <Text style={styles.resultItem}>✅ Punti Vendita: {importResults.salesPoints}</Text>
                
                {/* Preview Prime 2 Righe */}
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>📋 Preview Prime 2 Righe:</Text>
                  {importResults.firstTwoRows.map((row, index) => (
                    <View key={index} style={styles.rowPreview}>
                      <Text style={styles.rowTitle}>Riga {index + 1}:</Text>
                      <Text style={styles.rowData}>Linea: {row.linea}</Text>
                      <Text style={styles.rowData}>AM Code: {row.amCode}</Text>
                      <Text style={styles.rowData}>NAM Code: {row.namCode}</Text>
                      <Text style={styles.rowData}>Agente: {row.agenteCode} - {row.agenteName}</Text>
                      <Text style={styles.rowData}>Lev 4: {row.insegnaCliente}</Text>
                      <Text style={styles.rowData}>Codice Cliente: {row.codiceCliente}</Text>
                      <Text style={styles.rowData}>Cliente: {row.cliente}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.importButton, isLoading && styles.disabledButton]}
              onPress={handleFilePick}
              disabled={isLoading}
            >
              <Text style={styles.importButtonText}>
                {isLoading ? 'Elaborazione...' : 'Seleziona File Excel'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.medium,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.medium,
    lineHeight: 20,
  },
  instructions: {
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  instructionItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.large,
  },
  loadingText: {
    marginTop: Spacing.small,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resultsContainer: {
    backgroundColor: Colors.success + '20',
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: Spacing.small,
  },
  resultItem: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  previewContainer: {
    marginTop: Spacing.medium,
    padding: Spacing.medium,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  rowPreview: {
    marginBottom: Spacing.medium,
    padding: Spacing.small,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  rowData: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  importButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.medium,
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 