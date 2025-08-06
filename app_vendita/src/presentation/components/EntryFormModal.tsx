import React, { useState, useEffect, useCallback } from 'react';
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

import { TagSelector } from './common/TagSelector';
import FocusReferencesForm from './FocusReferencesForm';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useFirebaseCalendar } from '../../hooks/useFirebaseCalendar';
import { AsyncStorageCalendarRepository } from '../../data/repositories/CalendarRepository';

interface EntryFormModalProps {
  visible: boolean;
  entry?: CalendarEntry | undefined;
  selectedDate: string;
  userId?: string;
  salesPointId?: string;
  onSave: (entry: CalendarEntry) => void;
  onCancel: () => void;
  onDelete?: (entryId: string) => void;
  onCopyTags?: (sourceDate: string) => string[];
}

export default function EntryFormModal({
  visible,
  entry,
  selectedDate,
  userId = 'default_user',
  salesPointId = 'default_salespoint',
  onSave,
  onCancel,
  onDelete,
  onCopyTags,
}: EntryFormModalProps) {
  // Usa Firebase sempre - è la nostra memoria permanente
  const {
    addEntry,
    updateEntry,
    deleteEntry,
    entryExists,
    isLoading: isFirebaseLoading,
    error: firebaseError,
    clearError,
  } = useFirebaseCalendar();

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
      netPrice: string;
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

  // Funzione per gestire i cambiamenti dei dati delle referenze focus
  const handleFocusReferencesDataChange = useCallback((data: {
    referenceId: string;
    orderedPieces: string;
    soldPieces: string;
    stockPieces: string;
    soldVsStockPercentage: string;
    netPrice: string;
  }[]) => {
    setFormData(prev => ({ ...prev, focusReferencesData: data }));
  }, []);

  // Inizializza il form quando il modal si apre
  useEffect(() => {
    if (visible) {
      if (entry) {
        // Modalità modifica - carica dati esistenti

        // Gestisci repeatSettings: se esiste ma non è abilitato, non includerlo
        const repeatSettings = entry.repeatSettings && entry.repeatSettings.enabled 
          ? entry.repeatSettings 
          : { enabled: false, weeksCount: 1 };
        
        setFormData({
          notes: entry.notes || '',
          hasProblem: entry.hasProblem || false,
          problemDescription: entry.problemDescription || '',
          tags: entry.tags || [],
          repeatSettings: repeatSettings,
          focusReferencesData: entry.focusReferencesData || [],
        });
      } else {
        // Modalità nuovo - form vuoto

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

  const handleSave = async () => {
    // Validazione base - permette di salvare anche solo con tag o referenze focus
    if (formData.tags.length === 0 && formData.focusReferencesData.length === 0) {
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
    }

    // Prepara l'oggetto entry base senza campi undefined
    const entryToSave: any = {
      id: entry?.id || `entry_${Date.now()}`,
      date: new Date(selectedDate),
      userId: userId,
      salesPointId: salesPointId,
      notes: formData.notes, // Usa le note dal form
      chatNotes: chatNotes, // Mantiene i chatNotes esistenti + il nuovo messaggio
      sales: [],
      actions: [],
      hasProblem: formData.hasProblem,
      problemDescription: formData.problemDescription,
      tags: Array.isArray(formData.tags) ? formData.tags : [], // <-- Forza sempre array
      focusReferencesData: formData.focusReferencesData,
      createdAt: entry?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Aggiungi repeatSettings SOLO se è abilitato
    if (formData.repeatSettings.enabled) {
      entryToSave.repeatSettings = {
        enabled: formData.repeatSettings.enabled,
        weeksCount: formData.repeatSettings.weeksCount
      };
    }
    // Se non è abilitato, NON aggiungere il campo repeatSettings (non deve esistere nell'oggetto)
    // Assicurati che il campo non esista affatto nell'oggetto
    if (!formData.repeatSettings.enabled && entryToSave.repeatSettings !== undefined) {
      delete entryToSave.repeatSettings;
    }

    try {
      // Usa Firebase sempre
      console.log('💾 EntryFormModal: Salvando entry:', entryToSave);
      
      // Pulisci i dati rimuovendo i campi undefined
      const cleanEntry = { ...entryToSave };
      Object.keys(cleanEntry).forEach(key => {
        if (cleanEntry[key as keyof typeof cleanEntry] === undefined) {
          delete cleanEntry[key as keyof typeof cleanEntry];
        }
      });
      
      // Rimuovi repeatSettings se non è abilitato (anche se esiste nell'oggetto)
      if (!formData.repeatSettings.enabled) {
        delete cleanEntry.repeatSettings;
      }
      
      // Rimuovi anche altri campi che potrebbero essere undefined
      if (cleanEntry.repeatSettings && !cleanEntry.repeatSettings.enabled) {
        delete cleanEntry.repeatSettings;
      }
      
      console.log('🧹 EntryFormModal: Entry pulita:', cleanEntry);
      console.log('🔍 EntryFormModal: Verifica repeatSettings:', {
        hasRepeatSettings: 'repeatSettings' in cleanEntry,
        repeatSettingsValue: cleanEntry.repeatSettings,
        formDataRepeatEnabled: formData.repeatSettings.enabled
      });
      
      // Controllo finale: assicurati che repeatSettings non esista se non abilitato
      if (!formData.repeatSettings.enabled && 'repeatSettings' in cleanEntry) {
        console.log('⚠️ EntryFormModal: Rimozione finale repeatSettings non abilitato');
        delete cleanEntry.repeatSettings;
      }
      
      const entryExistsInFirebase = await entryExists(cleanEntry.id);
      
      console.log('🔍 EntryFormModal: Verifica entry esistente:', {
        hasEntry: !!entry,
        entryId: entry?.id,
        cleanEntryId: cleanEntry.id,
        entryExistsInFirebase,
        shouldUpdate: !!(entry && entryExistsInFirebase)
      });
      
      if (entry && entryExistsInFirebase) {
        // Modalità modifica - aggiorna entry esistente
        console.log('✏️ EntryFormModal: Aggiornamento entry esistente');
        await updateEntry(cleanEntry as CalendarEntry);
      } else {
        // Modalità nuovo - aggiungi nuova entry
        console.log('➕ EntryFormModal: Creazione nuova entry');
        const { id, ...entryWithoutId } = cleanEntry;
        const newEntryId = await addEntry(entryWithoutId as Omit<CalendarEntry, 'id'>);
        console.log('✅ EntryFormModal: Entry salvata con ID:', newEntryId);
      }

      // Chiama la callback originale per aggiornare l'UI
      onSave(cleanEntry as CalendarEntry);
      
      // Pulisci eventuali errori
      clearError();
      
    } catch (error) {
      Alert.alert(
        'Errore di Salvataggio',
        'Si è verificato un errore durante il salvataggio. Riprova.'
      );
    }
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
          onPress: async () => {
            try {
              // Elimina da Firebase
              await deleteEntry(entry.id);
              
              // Chiama la callback originale per aggiornare l'UI
              onDelete(entry.id);
              
              // Pulisci eventuali errori
              clearError();
              
            } catch (error) {
              Alert.alert(
                'Errore di Eliminazione',
                'Si è verificato un errore durante l\'eliminazione. Riprova.'
              );
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    onCancel();
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleCopyTags = () => {
    if (onCopyTags) {
      const copiedTags = onCopyTags(selectedDate);
      setFormData(prev => ({ ...prev, tags: copiedTags }));
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <SafeTouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityLabel="Chiudi"
            accessibilityHint="Chiudi il modal"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </SafeTouchableOpacity>
          
          <Text style={styles.title}>
            {entry ? 'Modifica Entry' : 'Nuovo Entry'}
          </Text>
          
          {entry && onDelete && (
            <SafeTouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              accessibilityLabel="Elimina"
              accessibilityHint="Elimina questo entry"
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </SafeTouchableOpacity>
          )}
        </View>

        {/* Contenuto */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Data</Text>
            <Text style={styles.dateText}>
              {new Date(selectedDate).toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Tag */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏷️ Tag</Text>
              {onCopyTags && (
                <SafeTouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyTags}
                  accessibilityLabel="Copia tag"
                  accessibilityHint="Copia i tag da un altro giorno"
                >
                  <Text style={styles.copyButtonText}>📋 Copia</Text>
                </SafeTouchableOpacity>
              )}
            </View>
            <TagSelector
              selectedTags={formData.tags}
              onTagsChange={handleTagsChange}
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
              onDataChange={handleFocusReferencesDataChange}
            />
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Chat Note</Text>
            <InputField
              placeholder="Aggiungi una nota..."
              value={formData.notes}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, notes: text }))
              }
              multiline
              numberOfLines={3}
            />
            <Text style={styles.noteHint}>
              Le note vengono aggiunte alla chat esistente
            </Text>
          </View>

          {/* Problemi */}
          <View style={styles.section}>
            <View style={styles.problemHeader}>
              <Text style={styles.sectionTitle}>⚠️ Problemi</Text>
              <SafeTouchableOpacity
                style={[
                  styles.toggleButton,
                  formData.hasProblem && styles.toggleButtonActive,
                ]}
                onPress={() =>
                  setFormData(prev => ({ ...prev, hasProblem: !prev.hasProblem }))
                }
              >
                <Text style={styles.toggleButtonText}>
                  {formData.hasProblem ? 'ON' : 'OFF'}
                </Text>
              </SafeTouchableOpacity>
            </View>
            
            {formData.hasProblem && (
              <InputField
                placeholder="Descrivi il problema..."
                value={formData.problemDescription}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, problemDescription: text }))
                }
                multiline
                numberOfLines={2}
              />
            )}
          </View>

          {/* Impostazioni ripetizione */}
          <View style={styles.section}>
            <View style={styles.repeatHeader}>
              <Text style={styles.sectionTitle}>🔄 Ripetizione</Text>
              <SafeTouchableOpacity
                style={[
                  styles.toggleButton,
                  formData.repeatSettings.enabled && styles.toggleButtonActive,
                ]}
                onPress={() =>
                  setFormData(prev => ({
                    ...prev,
                    repeatSettings: {
                      ...prev.repeatSettings,
                      enabled: !prev.repeatSettings.enabled,
                    },
                  }))
                }
              >
                <Text style={styles.toggleButtonText}>
                  {formData.repeatSettings.enabled ? 'ON' : 'OFF'}
                </Text>
              </SafeTouchableOpacity>
            </View>
            
            {formData.repeatSettings.enabled && (
              <View style={styles.repeatSettings}>
                <Text style={styles.repeatLabel}>
                  Ripeti per {formData.repeatSettings.weeksCount} settimana{formData.repeatSettings.weeksCount !== 1 ? 'e' : ''}
                </Text>
                <View style={styles.weeksSelector}>
                  {[1, 2, 3, 4].map((weeks) => (
                    <SafeTouchableOpacity
                      key={weeks}
                      style={[
                        styles.weekButton,
                        formData.repeatSettings.weeksCount === weeks && styles.weekButtonActive,
                      ]}
                      onPress={() =>
                        setFormData(prev => ({
                          ...prev,
                          repeatSettings: {
                            ...prev.repeatSettings,
                            weeksCount: weeks,
                          },
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.weekButtonText,
                          formData.repeatSettings.weeksCount === weeks && styles.weekButtonTextActive,
                        ]}
                      >
                        {weeks}
                      </Text>
                    </SafeTouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer con pulsanti */}
        <View style={styles.footer}>
          <SafeTouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            accessibilityLabel="Annulla"
            accessibilityHint="Annulla le modifiche e chiudi"
          >
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </SafeTouchableOpacity>
          
          <SafeTouchableOpacity
            style={[
              styles.saveButton,
              isFirebaseLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isFirebaseLoading}
            accessibilityLabel="Salva"
            accessibilityHint="Salva le modifiche"
          >
            <Text style={styles.saveButtonText}>
              {isFirebaseLoading ? 'Salvando...' : 'Salva'}
            </Text>
          </SafeTouchableOpacity>
        </View>

        {/* Messaggio di errore */}
        {firebaseError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{firebaseError}</Text>
          </View>
        )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.warmText,
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: Spacing.small,
    marginLeft: Spacing.small,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  copyButton: {
    padding: Spacing.small,
    backgroundColor: Colors.warmPrimary,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  saveButtonDisabled: {
    backgroundColor: Colors.warmTextSecondary,
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.small,
    backgroundColor: '#ffebee',
    borderTopWidth: 1,
    borderTopColor: '#f44336',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#f44336',
    marginRight: Spacing.small,
  },
  errorDismissButton: {
    padding: Spacing.small,
  },
  errorDismissText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: 'bold',
  },
  noteHint: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.small,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  toggleButton: {
    padding: Spacing.small,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  toggleButtonActive: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  toggleButtonText: {
    fontSize: 14,
    color: Colors.warmText,
  },
  repeatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  repeatSettings: {
    marginTop: Spacing.small,
  },
  repeatLabel: {
    fontSize: 14,
    color: Colors.warmTextSecondary,
  },
  weeksSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.small,
  },
  weekButton: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  weekButtonActive: {
    backgroundColor: Colors.warmPrimary,
    borderColor: Colors.warmPrimary,
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
  },
  weekButtonTextActive: {
    color: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginTop: Spacing.small,
  },
}); 