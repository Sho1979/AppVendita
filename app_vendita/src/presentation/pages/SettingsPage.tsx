import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import SafeTouchableOpacity from '../components/common/SafeTouchableOpacity';
import FocusReferencesModal from '../components/FocusReferencesModal';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { AsyncStorageCalendarRepository } from '../../data/repositories/CalendarRepository';
import { useRepository } from '../../hooks/useRepository';
import { useCalendarStore } from '../../stores/calendarStore';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';
import { PriceReference } from '../../data/models/PriceReference';
import { useAuth } from '../../hooks/useAuth';
import { useMasterDataStore } from '../../stores/masterDataStore';
import VademecumImportSection from '../components/settings/VademecumImportSection';
import VademecumPdfUploadSection from '../components/settings/VademecumPdfUploadSection';

interface SettingsPageProps {
  navigation: any;
}

export default function SettingsPage({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  navigation 
}: SettingsPageProps) {
  const [showFocusReferencesModal, setShowFocusReferencesModal] = useState(false);
  const repository = new AsyncStorageCalendarRepository();
  const liveRepo = useRepository();
  const calendarStore = useCalendarStore();
  const focusReferencesStore = useFocusReferencesStore();
  const { user, logout } = useAuth();
  const masterDataStore = useMasterDataStore();



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







  const settingsSections = [
    {
      title: '📄 Vademecum Viewer',
      items: [
        {
          title: 'Apri Vademecum FOOD',
          subtitle: 'Visualizza il testo estratto completo del PDF FOOD',
          icon: '🍽️',
          onPress: () => {
            navigation?.navigate?.('Calendario');
            // usa evento custom sul window per aprire viewer (isolato)
            try { (window as any).dispatchEvent(new CustomEvent('openVademecumViewer', { detail: { channel: 'FOOD' } })); } catch {}
          },
        },
        {
          title: 'Apri Vademecum DIY',
          subtitle: 'Visualizza il testo estratto completo del PDF DIY',
          icon: '🛠️',
          onPress: () => {
            navigation?.navigate?.('Calendario');
            try { (window as any).dispatchEvent(new CustomEvent('openVademecumViewer', { detail: { channel: 'DIY' } })); } catch {}
          },
        },
      ],
    },
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
          title: 'Reset TOTale (TUTTI i clienti) ',
          subtitle: 'Cancella entries, tag e note per tutti i clienti (le Focus References RESTANO). Operazione irreversibile.',
          icon: '🧨',
          onPress: () => {
            Alert.alert(
              'Conferma Reset Totale',
              'Questa operazione cancellerà TUTTI i dati di inserimento (entries, tag, note) per tutti i clienti e ripulirà le cache locali. Le Focus References resteranno invariate. Procedere?',
              [
                { text: 'Annulla', style: 'cancel' },
                {
                  text: 'Conferma',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // 1) Cancella tutte le entries dal backend (range molto ampio)
                      const start = new Date(2020, 0, 1);
                      const end = new Date(2030, 11, 31);
                      const all = await liveRepo.getCalendarEntries(start, end);
                      for (const e of all) {
                        await liveRepo.deleteCalendarEntry(e.id);
                      }
                      // 2) Pulisci store locale
                      calendarStore.setEntries([]);
                      calendarStore.setLastSyncTimestamp(0);
                      // 3) NON toccare le Focus References (restano). Pulisci solo cache entries
                      if (typeof localStorage !== 'undefined') {
                        try { localStorage.removeItem('calendar_entries'); } catch {}
                      }
                      // 4) Invalida classifica (live refresh)
                      calendarStore.bumpLeaderboardRefreshToken();
                      // 5) Notifica
                      Alert.alert('Reset completato', 'Tutti i dati sono stati cancellati. L\'app ripartirà da zero.');
                    } catch (error) {
                      console.error('❌ Reset totale fallito:', error);
                      Alert.alert('Errore', 'Impossibile completare il reset totale.');
                    }
                  }
                }
              ]
            );
          }
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
        <VademecumPdfUploadSection />
        <VademecumImportSection />
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
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
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

});
