import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import InputField from './common/InputField';
import DatePicker from './common/DatePicker';
import { TagSelector } from './common/TagSelector';
import FocusReferencesForm from './FocusReferencesForm';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

interface EntryFormModalProps {
  visible: boolean;
  entry?: CalendarEntry | undefined;
  selectedDate: string;
  onSave: (entry: CalendarEntry) => void;
  onCancel: () => void;
  onDelete?: (entryId: string) => void;
  onCopyTags?: (sourceDate: string) => string[];
}

export default function EntryFormModal({
  visible,
  entry,
  selectedDate,
  onSave,
  onCancel,
  onDelete,
  onCopyTags,
}: EntryFormModalProps) {
  // Rimuoviamo questo log che causa re-render continui
  // console.log('📝 EntryFormModal: Modal inizializzato con:', {
  //   visible,
  //   entryId: entry?.id,
  //   selectedDate,
  //   isEdit: !!entry,
  // });

  // Stato del form
  const [formData, setFormData] = useState<{
    notes: string;
    hasProblem: boolean;
    problemDescription: string;
    tags: string[];
    repeatSettings: {
      enabled: boolean;
      weeksCount: number;
    };
    focusReferencesData: {
      referenceId: string;
      orderedPieces: string;
      soldPieces: string;
      stockPieces: string;
      soldVsStockPercentage: string;
    }[];
  }>({
    notes: '',
    hasProblem: false,
    problemDescription: '',
    tags: [],
    repeatSettings: {
      enabled: false,
      weeksCount: 1,
    },
    focusReferencesData: [],
  });



  // Inizializza il form quando il modal si apre
  useEffect(() => {
    if (visible) {
      // Rimuoviamo questo log che causa re-render continui
      // console.log('📝 EntryFormModal: Form si apre con entry:', {
      //   entryId: entry?.id,
      //   entryTags: entry?.tags,
      //   entryFocusData: entry?.focusReferencesData,
      //   selectedDate,
      // });
      
      if (entry) {
        // Modalità modifica
        const newFormData = {
          notes: entry.notes || '',
          hasProblem: entry.hasProblem || false,
          problemDescription: entry.problemDescription || '',
          tags: entry.tags || [],
          repeatSettings: entry.repeatSettings || {
            enabled: false,
            weeksCount: 1,
          },
          focusReferencesData: entry.focusReferencesData || [],
        };
        
        // Rimuoviamo questo log che causa re-render continui
        // console.log('📝 EntryFormModal: Caricamento dati esistenti:', {
        //   tags: newFormData.tags,
        //   focusReferencesData: newFormData.focusReferencesData,
        // });
        
        setFormData(newFormData);
      } else {
        // Modalità nuovo
        // Rimuoviamo questo log che causa re-render continui
        // console.log('📝 EntryFormModal: Inizializzazione form vuoto');
        setFormData({
          notes: '',
          hasProblem: false,
          problemDescription: '',
          tags: [],
          repeatSettings: {
            enabled: false,
            weeksCount: 1,
          },
          focusReferencesData: [],
        });
      }
    }
  }, [visible, entry, selectedDate]);

  const handleSave = () => {
    // Rimuoviamo questi log che causano re-render continui
    // console.log('💾 EntryFormModal: Salvataggio entry...');
    // console.log('📊 EntryFormModal: Stato formData:', {
    //   tags: formData.tags,
    //   tagsLength: formData.tags.length,
    //   focusReferencesData: formData.focusReferencesData,
    //   focusReferencesLength: formData.focusReferencesData.length,
    //   hasProblem: formData.hasProblem,
    //   notes: formData.notes,
    // });

    // Validazione base - permette di salvare anche solo con tag o referenze focus
    if (formData.tags.length === 0 && formData.focusReferencesData.length === 0) {
      // Rimuoviamo questo log che causa re-render continui
      // console.log('❌ EntryFormModal: Validazione fallita - nessun dato inserito');
      Alert.alert(
        'Dati insufficienti',
        'Inserisci almeno un tag o dati delle referenze focus per salvare l\'entry.'
      );
      return;
    }

    // Prepara i messaggi chat
    const existingChatNotes = entry?.chatNotes || [];
    let chatNotes = existingChatNotes;
    
    // Se c'è un nuovo messaggio, aggiungilo alla chat
    if (formData.notes.trim()) {
      const newChatNote = {
        id: `note_${Date.now()}`,
        userId: 'default_user', // TODO: Usare utente selezionato
        userName: 'Utente', // TODO: Usare nome utente selezionato
        message: formData.notes.trim(),
        timestamp: new Date(),
      };
      chatNotes = [...existingChatNotes, newChatNote];
      console.log('💬 EntryFormModal: Aggiunto nuovo messaggio alla chat. Totale messaggi:', chatNotes.length);
    } else {
      console.log('💬 EntryFormModal: Nessun nuovo messaggio, mantenuti i chatNotes esistenti:', existingChatNotes.length);
    }

    const entryToSave: CalendarEntry = {
      id: entry?.id || `entry_${Date.now()}`,
      date: new Date(selectedDate),
      userId: 'default_user', // TODO: Usare utente selezionato
      salesPointId: 'default_salespoint', // TODO: Usare punto vendita selezionato
      notes: '', // Reset del campo note dopo il salvataggio
      chatNotes: chatNotes, // Mantiene i chatNotes esistenti + il nuovo messaggio
      sales: [],
      actions: [],
      hasProblem: formData.hasProblem,
      problemDescription: formData.problemDescription,
      tags: formData.tags,
      repeatSettings: formData.repeatSettings.enabled ? {
        enabled: formData.repeatSettings.enabled,
        weeksCount: formData.repeatSettings.weeksCount
      } : undefined,
      focusReferencesData: formData.focusReferencesData,
      createdAt: entry?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Rimuoviamo questo log che causa re-render continui
    // console.log('✅ EntryFormModal: Entry pronto per salvataggio:', {
    //   id: entryToSave.id,
    //   date: entryToSave.date,
    //   tagsCount: entryToSave.tags.length,
    //   tagsDetails: entryToSave.tags,
    //   focusReferencesCount: entryToSave.focusReferencesData?.length || 0,
    //   hasProblem: entryToSave.hasProblem,
    // });

    onSave(entryToSave);
    
    // Reset del campo note dopo il salvataggio
    setFormData(prev => ({ ...prev, notes: '' }));
  };

  const handleDelete = () => {
    if (!entry?.id || !onDelete) return;

    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questo entry?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            // Rimuoviamo questo log che causa re-render continui
            // console.log('🗑️ EntryFormModal: Eliminazione entry:', entry.id);
            onDelete(entry.id);
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
          <Text style={styles.headerTitle}>
            {entry ? 'Modifica Entry' : 'Nuovo Entry'}
          </Text>
          <View style={styles.headerActions}>
            {entry && onDelete && (
              <SafeTouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </SafeTouchableOpacity>
            )}
            <SafeTouchableOpacity 
              style={styles.closeButton} 
                        onPress={() => {
            // Rimuoviamo questo log che causa re-render continui
            // console.log('🔘 EntryFormModal: Pulsante X (chiudi) cliccato');
            onCancel();
          }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </SafeTouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Chat Note</Text>
            <InputField
              label="Messaggio"
              placeholder="Scrivi un messaggio per la chat..."
              value={formData.notes}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, notes: text }))
              }
              multiline
              numberOfLines={3}
            />
            <Text style={styles.noteHint}>
              💡 Il messaggio verrà salvato nella chat del tooltip
            </Text>
          </View>

          {/* Tag Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Tag</Text>
            <TagSelector
              selectedTags={formData.tags}
              onTagsChange={(tags) => {
                // Rimuoviamo questo log che causa re-render continui
                // console.log('🏷️ EntryFormModal: Tags cambiati:', tags);
                setFormData(prev => ({ ...prev, tags }));
              }}
              repeatEnabled={formData.repeatSettings.enabled}
              onRepeatChange={(enabled) =>
                setFormData(prev => ({
                  ...prev,
                  repeatSettings: { ...prev.repeatSettings, enabled }
                }))
              }
              weeksCount={formData.repeatSettings.weeksCount}
              onWeeksCountChange={(weeksCount) =>
                setFormData(prev => ({
                  ...prev,
                  repeatSettings: { ...prev.repeatSettings, weeksCount }
                }))
              }
              onCopyTags={() => onCopyTags ? onCopyTags(selectedDate) : []}
            />
          </View>

          {/* Referenze Focus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Referenze Focus</Text>
            <FocusReferencesForm
              selectedDate={selectedDate}
              existingData={entry?.focusReferencesData}
              onDataChange={(data) => {
                // Rimuoviamo questo log che causa re-render continui
                // console.log('🎯 EntryFormModal: FocusReferencesData cambiati:', data);
                setFormData(prev => ({ ...prev, focusReferencesData: data }));
              }}
            />
          </View>

          {/* Problemi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Problemi</Text>
            <SafeTouchableOpacity
              style={[
                styles.problemToggle,
                formData.hasProblem && styles.problemToggleActive,
              ]}
              onPress={() =>
                setFormData(prev => ({ ...prev, hasProblem: !prev.hasProblem }))
              }
            >
              <Text style={styles.problemToggleText}>
                {formData.hasProblem ? '✅' : '❌'} Segnala problema
              </Text>
            </SafeTouchableOpacity>
            
            {formData.hasProblem && (
              <InputField
                label="Descrizione problema"
                placeholder="Descrivi il problema riscontrato..."
                value={formData.problemDescription}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, problemDescription: text }))
                }
                multiline
                numberOfLines={3}
              />
            )}
          </View>

          {/* Riepilogo */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>📊 Riepilogo</Text>
            {formData.hasProblem && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Problemi:</Text>
                <Text style={styles.summaryValue}>⚠️ Segnalato</Text>
              </View>
            )}
            {formData.tags.length > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tag selezionati:</Text>
                <Text style={styles.summaryValue}>{formData.tags.length}</Text>
              </View>
            )}
            {formData.focusReferencesData.length > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Referenze focus:</Text>
                <Text style={styles.summaryValue}>{formData.focusReferencesData.length}</Text>
              </View>
            )}
            {formData.repeatSettings.enabled && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ripetizione:</Text>
                <Text style={styles.summaryValue}>
                  {formData.repeatSettings.weeksCount} settimana{formData.repeatSettings.weeksCount > 1 ? 'e' : ''}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer con azioni */}
        <View style={styles.footer}>
          <SafeTouchableOpacity 
            style={styles.cancelButton} 
                      onPress={() => {
            // Rimuoviamo questo log che causa re-render continui
            // console.log('🔘 EntryFormModal: Pulsante Annulla cliccato');
            onCancel();
          }}
          >
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </SafeTouchableOpacity>
          <SafeTouchableOpacity 
            style={styles.saveButton} 
                      onPress={() => {
            // Rimuoviamo questi log che causano re-render continui
            // console.log('🔘 EntryFormModal: Pulsante Salva cliccato');
            // console.log('📊 EntryFormModal: Stato finale formData prima del salvataggio:', {
            //   tags: formData.tags,
            //   tagsLength: formData.tags.length,
            //   focusReferencesData: formData.focusReferencesData,
            //   focusReferencesLength: formData.focusReferencesData.length,
            //   hasProblem: formData.hasProblem,
            //   notes: formData.notes,
            // });
            handleSave();
          }}
          >
            <Text style={styles.saveButtonText}>
              {entry ? 'Aggiorna' : 'Salva'}
            </Text>
          </SafeTouchableOpacity>
        </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: Spacing.small,
    marginRight: Spacing.small,
  },
  deleteButtonText: {
    fontSize: 18,
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
    padding: Spacing.small,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.small,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
  },
  itemValue: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    marginTop: 2,
  },
  itemSubtitle: {
    fontSize: 11,
    color: Colors.warmTextSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: Spacing.small,
  },
  removeButtonText: {
    color: '#f44336',
    fontSize: 16,
  },
  addForm: {
    marginTop: Spacing.small,
    padding: Spacing.small,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  addFormTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  addButton: {
    backgroundColor: Colors.warmPrimary,
    padding: Spacing.small,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: Spacing.small,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  problemToggle: {
    padding: Spacing.small,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    marginBottom: Spacing.small,
  },
  problemToggleActive: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  problemToggleText: {
    fontSize: 14,
    color: Colors.warmText,
  },
  summary: {
    padding: Spacing.small,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.small,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.warmTextSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.warmBorder,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.medium,
    marginRight: Spacing.small,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.warmTextSecondary,
  },
  saveButton: {
    flex: 1,
    padding: Spacing.medium,
    marginLeft: Spacing.small,
    backgroundColor: Colors.warmPrimary,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  noteHint: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.small,
  },
}); 