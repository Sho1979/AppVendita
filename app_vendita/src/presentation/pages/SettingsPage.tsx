import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import SafeTouchableOpacity from '../components/common/SafeTouchableOpacity';
import ExcelImportModal from '../components/ExcelImportModal';
import PriceReferencesImportModal from '../components/PriceReferencesImportModal';
import FocusReferencesModal from '../components/FocusReferencesModal';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { AsyncStorageCalendarRepository } from '../../data/repositories/CalendarRepository';
import { ExcelRow } from '../../data/models/ExcelData';
import { PriceReference } from '../../data/models/PriceReference';
import { useAuth } from '../../hooks/useAuth';

interface SettingsPageProps {
  navigation: any;
}

export default function SettingsPage({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  navigation 
}: SettingsPageProps) {
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showPriceReferencesImportModal, setShowPriceReferencesImportModal] = useState(false);
  const [showFocusReferencesModal, setShowFocusReferencesModal] = useState(false);
  const repository = new AsyncStorageCalendarRepository();
  const { user, logout } = useAuth();

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [shouldCancelImport, setShouldCancelImport] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire dall\'account?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 SettingsPage: Avvio logout...');
              await logout();
              console.log('✅ SettingsPage: Logout completato');
              Alert.alert('Logout Completato', 'Sei stato disconnesso con successo.', [{ text: 'OK' }]);
            } catch (error) {
              console.error('❌ SettingsPage: Errore logout:', error);
              Alert.alert('Errore', 'Impossibile effettuare il logout.', [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  const handleExcelImport = async (importData: {
    agents: any[];
    users: any[];
    salesPoints: any[];
    excelRows?: ExcelRow[];
  }) => {
    console.log('📊 SettingsPage: Importazione Excel completata:', {
      agents: importData.agents.length,
      users: importData.users.length,
      salesPoints: importData.salesPoints.length,
      excelRows: importData.excelRows?.length || 0,
    });

    try {
      setIsImporting(true);
      setImportProgress(0);
      setShouldCancelImport(false);
      
      console.log('💾 SettingsPage: Salvataggio dati in massa (sovrascrittura)...');
      
      // Attiva silent mode per velocizzare l'importazione
      repository.setSilentMode(true);
      
      // **SOVRASCRITTURA COMPLETA** invece di aggiunta
      // Prima pulisci i dati esistenti
      console.log('🗑️ SettingsPage: Pulizia dati esistenti...');
      await repository.clearUsers();
      await repository.clearSalesPoints();
      await repository.clearExcelRows();
      
      setImportProgress(20);
      
      // Salva tutti i punti vendita in una volta (sovrascrittura)
      console.log('💾 SettingsPage: Salvataggio punti vendita...');
      await repository.saveSalesPoints(importData.salesPoints);
      setImportProgress(40);
      
      // Salva tutti gli utenti in una volta (sovrascrittura)
      console.log('💾 SettingsPage: Salvataggio utenti...');
      await repository.saveUsers(importData.users);
      setImportProgress(60);
      
      // Salva dati Excel completi
      if (importData.excelRows && importData.excelRows.length > 0) {
        console.log('💾 SettingsPage: Salvataggio dati Excel completi...');
        await repository.saveExcelRows(importData.excelRows);
        console.log('✅ SettingsPage: Dati Excel completi salvati:', importData.excelRows.length, 'righe');
      }
      setImportProgress(80);
      
      // Salva agenti come utenti (sovrascrittura)
      console.log('💾 SettingsPage: Salvataggio agenti...');
      const agentUsers = importData.agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        email: agent.email || `${agent.code.toLowerCase()}@company.com`,
        role: 'agent',
        salesPointId: agent.salesPointId,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }));
      
      // Aggiungi gli agenti agli utenti esistenti
      const allUsers = [...importData.users, ...agentUsers];
      await repository.saveUsers(allUsers);
      
      setImportProgress(100);

      // Disattiva silent mode
      repository.setSilentMode(false);

      console.log('✅ SettingsPage: Salvataggio completato');

      if (shouldCancelImport) {
        Alert.alert(
          'Importazione Interrotta',
          'L\'importazione è stata interrotta dall\'utente. I dati già processati sono stati salvati.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Importazione Completata',
          `Importati e salvati con successo:\n• ${importData.agents.length} agenti\n• ${importData.users.length} utenti\n• ${importData.salesPoints.length} punti vendita\n\nI dati sono ora disponibili nei filtri del calendario!`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Disattiva silent mode in caso di errore
      repository.setSilentMode(false);
      
      console.error('❌ SettingsPage: Errore durante il salvataggio:', error);
      Alert.alert(
        'Errore Importazione',
        'Si è verificato un errore durante il salvataggio dei dati. Riprova.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setShouldCancelImport(false);
    }
  };

  const handleCancelImport = () => {
    setShouldCancelImport(true);
    Alert.alert(
      'Conferma Cancellazione',
      'Sei sicuro di voler interrompere l\'importazione? I dati già processati verranno mantenuti.',
      [
        { text: 'Continua Importazione', style: 'cancel' },
        { 
          text: 'Interrompi', 
          style: 'destructive',
          onPress: () => {
            setShouldCancelImport(true);
          }
        }
      ]
    );
  };

  const handlePriceReferencesImport = async (references: PriceReference[]) => {
    console.log('📊 SettingsPage: Importazione referenze prezzi completata:', references.length);
    
    Alert.alert(
      'Importazione Completata',
      `Importate ${references.length} referenze prezzi con successo.\n\nLe referenze sono ora disponibili per l'attivazione nella tab "Calendario".`,
      [{ text: 'OK' }]
    );
  };

  const settingsSections = [
    {
      title: '👤 Account',
      items: [
        {
          title: 'Informazioni Account',
          subtitle: `Email: ${user?.email || 'Non disponibile'}`,
          icon: '📧',
          onPress: () => Alert.alert('Account', `Email: ${user?.email}\nNome: ${user?.displayName || 'Non specificato'}\nID: ${user?.uid}`),
        },
        {
          title: 'Logout',
          subtitle: `Disconnetti da ${user?.email || 'account'}`,
          icon: '🚪',
          onPress: () => {
            console.log('🔄 SettingsPage: Pulsante logout cliccato!');
            handleLogout();
          },
        },
        {
          title: 'Test Pulsante',
          subtitle: 'Test per verificare se i pulsanti funzionano',
          icon: '🧪',
          onPress: () => {
            console.log('🧪 SettingsPage: Pulsante test cliccato!');
            Alert.alert('Test', 'Il pulsante funziona!', [{ text: 'OK' }]);
          },
        },
      ],
    },
    {
      title: '📊 Gestione Dati',
      items: [
        {
          title: 'Importa Dati Excel',
          subtitle: 'Carica agenti e punti vendita da file Excel',
          icon: '📁',
          onPress: () => setShowExcelImportModal(true),
        },
        {
          title: 'Importa Listino Prezzi',
          subtitle: 'Carica referenze e prezzi da file Excel',
          icon: '💰',
          onPress: () => setShowPriceReferencesImportModal(true),
        },
        {
          title: 'Visualizza Dati Importati',
          subtitle: 'Vedi gli agenti, punti vendita e referenze caricati',
          icon: '👥',
          onPress: async () => {
            try {
              const users = await repository.getAllUsers();
              const salesPoints = await repository.getAllSalesPoints();
              const priceReferences = await repository.getPriceReferences();
              const activePriceReferences = await repository.getActivePriceReferences();
              
              const agentUsers = users.filter(u => u.role === 'agent');
              const regularUsers = users.filter(u => u.role !== 'agent');
              
              Alert.alert(
                'Dati Importati',
                `📊 Statistiche attuali:\n\n` +
                `👤 Agenti: ${agentUsers.length}\n` +
                `👥 Utenti: ${regularUsers.length}\n` +
                `🏪 Punti Vendita: ${salesPoints.length}\n` +
                `💰 Referenze Prezzi: ${priceReferences.length}\n` +
                `✅ Referenze Attive: ${activePriceReferences.length}\n\n` +
                `I dati sono disponibili nei filtri del calendario principale. Vai alla tab "Calendario" e clicca sull'icona 🔍 per vedere i filtri.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ SettingsPage: Errore nel recupero dati:', error);
              Alert.alert('Errore', 'Impossibile recuperare i dati importati.', [{ text: 'OK' }]);
            }
          },
        },
        {
          title: 'Svuota Dati Importati',
          subtitle: 'Rimuovi tutti i dati importati (irreversibile)',
          icon: '🗑️',
          onPress: () => {
            Alert.alert(
              'Conferma Svuotamento',
              'Sei sicuro di voler rimuovere tutti i dati importati? Questa operazione è irreversibile.',
              [
                { text: 'Annulla', style: 'cancel' },
                { 
                  text: 'Svuota', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      console.log('🗑️ SettingsPage: Svuotamento dati importati...');
                      
                      // Pulisci tutti i dati importati
                      await repository.clearUsers();
                      await repository.clearSalesPoints();
                      await repository.clearExcelRows();
                      await repository.clearPriceReferences();
                      
                      console.log('✅ SettingsPage: Dati importati svuotati con successo');
                      
                      Alert.alert(
                        'Dati Svuotati',
                        'Tutti i dati importati sono stati rimossi con successo.',
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      console.error('❌ SettingsPage: Errore svuotamento:', error);
                      Alert.alert('Errore', 'Impossibile svuotare i dati.', [{ text: 'OK' }]);
                    }
                  }
                }
              ]
            );
          },
        },
        {
          title: 'Gestisci Referenze Prezzi',
          subtitle: 'Seleziona le referenze focus per il calendario',
          icon: '🎯',
          onPress: () => setShowFocusReferencesModal(true),
        },
        {
          title: 'Esporta Dati',
          subtitle: 'Esporta i dati in formato Excel',
          icon: '📤',
          onPress: () => Alert.alert('Info', 'Funzionalità in sviluppo'),
        },
      ],
    },
    {
      title: '⚙️ Configurazione',
      items: [
        {
          title: 'Impostazioni App',
          subtitle: 'Configura le impostazioni dell\'applicazione',
          icon: '🔧',
          onPress: () => Alert.alert('Info', 'Funzionalità in sviluppo'),
        },
        {
          title: 'Backup e Ripristino',
          subtitle: 'Gestisci backup e ripristino dati',
          icon: '💾',
          onPress: () => Alert.alert('Info', 'Funzionalità in sviluppo'),
        },
      ],
    },
    {
      title: 'ℹ️ Informazioni',
      items: [
        {
          title: 'Versione App',
          subtitle: 'Calendario Vendite v1.0.0',
          icon: '📱',
          onPress: () => Alert.alert('Versione', 'Calendario Vendite v1.0.0'),
        },
        {
          title: 'Guida',
          subtitle: 'Leggi la guida all\'uso dell\'app',
          icon: '📖',
          onPress: () => Alert.alert('Info', 'Guida in sviluppo'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Impostazioni</Text>
        <Text style={styles.subtitle}>Gestisci l'applicazione</Text>
      </View>

      <ScrollView style={styles.content}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item, itemIndex) => (
              <SafeTouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                
                <View style={styles.settingArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </SafeTouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Progresso Importazione */}
      {isImporting && (
        <View style={styles.importProgressOverlay}>
          <View style={styles.importProgressModal}>
            <Text style={styles.importProgressTitle}>Importazione in Corso</Text>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${importProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{importProgress}%</Text>
            </View>
            
            <Text style={styles.importProgressSubtitle}>
              Elaborazione dati in batch per evitare sovraccarico...
            </Text>
            
            <SafeTouchableOpacity
              style={styles.cancelImportButton}
              onPress={handleCancelImport}
            >
              <Text style={styles.cancelImportButtonText}>⏹️ Stop Importazione</Text>
            </SafeTouchableOpacity>
          </View>
        </View>
      )}

      <ExcelImportModal
        visible={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        onImportComplete={handleExcelImport}
        isImporting={isImporting}
        onCancelImport={handleCancelImport}
      />

      <PriceReferencesImportModal
        visible={showPriceReferencesImportModal}
        onClose={() => setShowPriceReferencesImportModal(false)}
        onImportComplete={handlePriceReferencesImport}
      />

      <FocusReferencesModal
        visible={showFocusReferencesModal}
        onClose={() => setShowFocusReferencesModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.large,
    paddingTop: Spacing.large + 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: Spacing.medium,
  },
  section: {
    marginBottom: Spacing.large,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
    paddingHorizontal: Spacing.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.medium,
  },
  iconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingArrow: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  // Stili per il progresso di importazione
  importProgressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  importProgressModal: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.large,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  importProgressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: Spacing.medium,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.small,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  importProgressSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.large,
    lineHeight: 20,
  },
  cancelImportButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelImportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
