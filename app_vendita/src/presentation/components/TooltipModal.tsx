import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useFocusReferencesStore } from '../../stores/focusReferencesStore';

interface TooltipModalProps {
  visible: boolean;
  type: 'stock' | 'notes' | 'info' | 'images';
  entry?: CalendarEntry | undefined;
  date: string;
  onClose: () => void;
  onUpdateEntry?: (entry: CalendarEntry) => void;
  // Filtri attivi per il tooltip info
  activeFilters?: {
    selectedUserId?: string;
    selectedSalesPointId?: string;
    selectedAMCode?: string;
    selectedNAMCode?: string;
    selectedLine?: string;
    selectedFilterItems?: string[];
  };
  // Dati per mostrare i nomi dei filtri
  users?: any[];
  salesPoints?: any[];
  agents?: any[];
  excelRows?: any[];
}

export default function TooltipModal({
  visible,
  type,
  entry,
  date,
  onClose,
  onUpdateEntry,
  activeFilters,
}: TooltipModalProps) {
  const focusReferencesStore = useFocusReferencesStore();
  
  const getFocusReferenceById = (id: string) => {
    return focusReferencesStore.getAllReferences().find(ref => ref.id === id);
  };
  const scrollViewRef = useRef<ScrollView>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (visible && type === 'notes') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, type, entry?.chatNotes?.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !entry || !onUpdateEntry) return;

    const newChatNote = {
      id: `note_${Date.now()}`,
      userId: 'default_user', // TODO: Usare utente selezionato
      userName: 'Utente', // TODO: Usare nome utente selezionato
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    const updatedEntry: CalendarEntry = {
      ...entry,
      chatNotes: [...(entry.chatNotes || []), newChatNote],
      updatedAt: new Date(),
    };

    onUpdateEntry(updatedEntry);
    setNewMessage('');
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const getModalTitle = () => {
    switch (type) {
      case 'stock':
        return '📦 Gestione Stock';
      case 'notes':
        return '📝 Note e Commenti';
      case 'info':
        return '👤 Informazioni';
      case 'images':
        return '📷 Immagini';
      default:
        return 'Tooltip';
    }
  };

  const getModalContent = () => {
    switch (type) {
      case 'stock':
        return (
          <View style={styles.stockContent}>
            <Text style={styles.sectionTitle}>📦 Gestione Stock</Text>
            <Text style={styles.description}>
              Gestisci le scorte e le vendite per questo giorno
            </Text>
            
            {entry?.focusReferencesData && entry.focusReferencesData.length > 0 ? (
              <View style={styles.stockList}>
                {entry.focusReferencesData.map((focusData) => {
                  const reference = getFocusReferenceById(focusData.referenceId);
                  if (!reference) return null;

                  const soldPieces = parseFloat(focusData.soldPieces) || 0;
                  const stockPieces = parseFloat(focusData.stockPieces) || 0;
                  const orderedPieces = parseFloat(focusData.orderedPieces) || 0;

                  return (
                    <View key={focusData.referenceId} style={styles.stockItem}>
                      <View style={styles.stockHeader}>
                        <Text style={styles.stockCode}>{reference.code}</Text>
                        <Text style={styles.stockDescription}>{reference.description}</Text>
                      </View>
                      <View style={styles.stockDetails}>
                        <View style={styles.stockRow}>
                          <Text style={styles.stockLabel}>Ordinati:</Text>
                          <Text style={styles.stockValue}>{orderedPieces}</Text>
                        </View>
                        <View style={styles.stockRow}>
                          <Text style={styles.stockLabel}>Venduti:</Text>
                          <Text style={styles.stockValue}>{soldPieces}</Text>
                        </View>
                        <View style={styles.stockRow}>
                          <Text style={styles.stockLabel}>Scorte:</Text>
                          <Text style={[
                            styles.stockValue,
                            stockPieces <= 0 && styles.stockValueWarning
                          ]}>
                            {stockPieces}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nessun dato stock disponibile</Text>
                <Text style={styles.emptySubtext}>
                  Aggiungi dati delle referenze focus per visualizzare le informazioni stock
                </Text>
              </View>
            )}
          </View>
        );

      case 'notes':
        return (
          <View style={styles.notesContent}>
            <Text style={styles.sectionTitle}>💬 Chat Note</Text>
            
            {/* Lista messaggi esistenti */}
            {entry?.chatNotes && entry.chatNotes.length > 0 ? (
              <ScrollView 
                ref={scrollViewRef}
                style={styles.chatContainer}
                showsVerticalScrollIndicator={false}
              >
                {entry.chatNotes.map((note) => {
                  const isCurrentUser = note.userId === 'default_user'; // TODO: Usare utente corrente
                  const userInitials = (note.userName || note.userId).substring(0, 2).toUpperCase();
                  
                  return (
                    <View key={note.id} style={[
                      styles.chatMessage,
                      isCurrentUser ? styles.chatMessageOwn : styles.chatMessageOther
                    ]}>
                      <View style={[
                        styles.chatBubble,
                        isCurrentUser ? styles.chatBubbleOwn : styles.chatBubbleOther
                      ]}>
                        <View style={styles.chatHeader}>
                          <View style={[
                            styles.userAvatar,
                            isCurrentUser ? styles.userAvatarOwn : styles.userAvatarOther
                          ]}>
                            <Text style={styles.userInitials}>{userInitials}</Text>
                          </View>
                          <Text style={styles.userName}>{note.userName}</Text>
                          <Text style={styles.messageTime}>
                            {new Date(note.timestamp).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                        <Text style={[
                          styles.messageText,
                          isCurrentUser ? styles.messageTextOwn : styles.messageTextOther
                        ]}>
                          {note.message}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nessun messaggio</Text>
                <Text style={styles.emptySubtext}>
                  Inizia la conversazione aggiungendo un messaggio
                </Text>
              </View>
            )}

            {/* Input per nuovo messaggio */}
            <View style={styles.messageInputContainer}>
              <View style={styles.messageInputRow}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Scrivi un messaggio..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                  maxLength={500}
                />
                <SafeTouchableOpacity
                  style={[
                    styles.sendButton,
                    !newMessage.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Text style={styles.sendButtonText}>📤</Text>
                </SafeTouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'info':
        return (
          <View style={styles.infoContent}>
            <Text style={styles.sectionTitle}>👤 Informazioni</Text>
            <Text style={styles.description}>
              Informazioni dettagliate per questo giorno
            </Text>
            
            {activeFilters ? (
              <View style={styles.infoList}>
                {activeFilters.selectedUserId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Utente:</Text>
                    <Text style={styles.infoValue}>{activeFilters.selectedUserId}</Text>
                  </View>
                )}
                {activeFilters.selectedSalesPointId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Punto Vendita:</Text>
                    <Text style={styles.infoValue}>{activeFilters.selectedSalesPointId}</Text>
                  </View>
                )}
                {activeFilters.selectedAMCode && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>AM Code:</Text>
                    <Text style={styles.infoValue}>{activeFilters.selectedAMCode}</Text>
                  </View>
                )}
                {activeFilters.selectedNAMCode && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>NAM Code:</Text>
                    <Text style={styles.infoValue}>{activeFilters.selectedNAMCode}</Text>
                  </View>
                )}
                {activeFilters.selectedLine && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Linea:</Text>
                    <Text style={styles.infoValue}>{activeFilters.selectedLine}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nessun filtro attivo</Text>
                <Text style={styles.emptySubtext}>
                  Seleziona dei filtri per visualizzare le informazioni
                </Text>
              </View>
            )}
          </View>
        );

      case 'images':
        return (
          <View style={styles.imagesContent}>
            <Text style={styles.sectionTitle}>📷 Immagini</Text>
            <Text style={styles.description}>
              Carica e visualizza immagini per questo giorno
            </Text>
            
            <View style={styles.imagesContainer}>
              <SafeTouchableOpacity
                style={styles.uploadButton}
                onPress={() => {
                  // TODO: Implementare upload immagini
                  Alert.alert('Upload Immagini', 'Funzionalità in sviluppo');
                }}
              >
                <Text style={styles.uploadButtonText}>📷 Carica Immagine</Text>
              </SafeTouchableOpacity>
              
              <View style={styles.imagesList}>
                <Text style={styles.emptyText}>Nessuna immagine caricata</Text>
                <Text style={styles.emptySubtext}>
                  Carica immagini per documentare questo giorno
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.defaultContent}>
            <Text style={styles.sectionTitle}>Tooltip</Text>
            <Text style={styles.description}>
              Contenuto non disponibile per questo tipo di tooltip
            </Text>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <SafeTouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Chiudi"
            accessibilityHint="Chiudi il modal"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </SafeTouchableOpacity>
          
          <Text style={styles.title}>{getModalTitle()}</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Contenuto */}
        <View style={styles.content}>
          {getModalContent()}
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 18,
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
  dateSection: {
    alignItems: 'center',
    marginBottom: Spacing.large,
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  contentSection: {
    marginBottom: Spacing.large,
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  contentText: {
    fontSize: 14,
    color: Colors.warmTextSecondary,
    marginBottom: Spacing.medium,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: Colors.warmPrimary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Stili per il tooltip stock
  stockItem: {
    marginBottom: Spacing.medium,
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  stockHeader: {
    marginBottom: Spacing.small,
  },
  stockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: 4,
  },
  stockCode: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
  },
  stockDetails: {
    gap: Spacing.small,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  stockLabel: {
    fontSize: 14,
    color: Colors.warmText,
    flex: 2,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
    flex: 1,
    textAlign: 'right',
  },
  stockPercentage: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    flex: 1,
    textAlign: 'right',
  },
  stockTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.small,
    borderTopWidth: 1,
    borderTopColor: Colors.warmBorder,
    marginTop: Spacing.small,
  },
  stockTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  stockTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmPrimary,
  },
  // Stili per la chat delle note (stile WhatsApp)
  chatContainer: {
    flex: 1,
    marginBottom: Spacing.large,
  },
  chatMessages: {
    flex: 1,
    marginBottom: Spacing.medium,
    paddingHorizontal: Spacing.small,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.small,
    alignItems: 'flex-end',
  },
  messageWrapperLeft: {
    justifyContent: 'flex-start',
  },
  messageWrapperRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warmPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.small,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 18,
    position: 'relative',
  },
  messageBubbleLeft: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: Colors.warmPrimary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: Colors.warmText,
  },
  messageTextOwn: {
    color: '#ffffff',
  },
  messageTextOther: {
    color: Colors.warmText,
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  messageTimestampLeft: {
    color: '#666666',
    textAlign: 'left',
  },
  messageTimestampRight: {
    color: '#ffffff',
    textAlign: 'right',
  },
  emptyChat: {
    alignItems: 'center',
    padding: Spacing.large,
  },
  emptyChatText: {
    fontSize: 16,
    color: Colors.warmTextSecondary,
    marginBottom: Spacing.small,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.medium,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: Spacing.small,
  },
  chatInput: {
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sendButton: {
    padding: Spacing.small,
    backgroundColor: Colors.warmPrimary,
    borderRadius: 20,
    marginLeft: Spacing.small,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.warmTextSecondary,
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  chatInfoBox: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    marginTop: Spacing.medium,
  },
  chatInfoText: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Stili per l'emoji picker
  emojiButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.warmSurface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  emojiButtonText: {
    fontSize: 18,
  },
  emojiPickerContainer: {
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    marginTop: Spacing.small,
    padding: Spacing.medium,
  },
  emojiPickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emojiItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    backgroundColor: Colors.warmBackground,
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 20,
  },
  // Stili per i filtri attivi
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  filterValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  filterItemsList: {
    marginTop: 4,
  },
  filterItemText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  noFiltersContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  noFiltersSubtext: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'center',
  },
  stockContent: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  description: {
    fontSize: 14,
    color: Colors.warmTextSecondary,
    marginBottom: Spacing.medium,
    textAlign: 'center',
  },
  stockList: {
    marginTop: Spacing.medium,
  },
  stockItem: {
    marginBottom: Spacing.medium,
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  stockCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.warmText,
  },
  stockDescription: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
  },
  stockDetails: {
    gap: Spacing.small,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: Colors.warmText,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
  },
  stockValueWarning: {
    color: '#f44336',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.large,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.warmTextSecondary,
    marginBottom: Spacing.small,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
  },
  notesContent: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  chatMessage: {
    marginBottom: Spacing.small,
    alignItems: 'flex-end',
  },
  chatMessageOther: {
    alignItems: 'flex-start',
  },
  chatMessageOwn: {
    alignItems: 'flex-end',
  },
  chatBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 18,
    position: 'relative',
  },
  chatBubbleOther: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  chatBubbleOwn: {
    backgroundColor: Colors.warmPrimary,
    borderBottomRightRadius: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warmPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.small,
  },
  userAvatarOther: {
    backgroundColor: '#e0e0e0',
  },
  userAvatarOwn: {
    backgroundColor: Colors.warmPrimary,
  },
  userInitials: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warmText,
    marginRight: Spacing.small,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.warmTextSecondary,
  },
  messageInputContainer: {
    padding: Spacing.medium,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  messageInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  imagesContent: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  imagesContainer: {
    marginTop: Spacing.medium,
  },
  uploadButton: {
    backgroundColor: Colors.warmPrimary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagesList: {
    alignItems: 'center',
    padding: Spacing.medium,
  },
  defaultContent: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  headerSpacer: {
    width: 40, // Placeholder for spacer width
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.warmText,
    textAlign: 'center',
  },
  infoContent: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  infoList: {
    marginTop: Spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.warmPrimary,
    fontWeight: '500',
  },
}); 