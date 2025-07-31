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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TouchableOpacity } from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { CalendarEntry } from '../../data/models/CalendarEntry';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useFocusReferences } from '../../hooks/useFocusReferences';

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
  const { getFocusReferenceById } = useFocusReferences();
  const scrollViewRef = useRef<ScrollView>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Rimuoviamo questo log che causa re-render continui
  // console.log('🔧 TooltipModal: Modal inizializzato con:', {
  //   visible,
  //   type,
  //   date,
  //   hasEntry: !!entry,
  // });

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
        return '👤 Info Agente e Punto Vendita';
      case 'images':
        return '📷 Immagini e Documenti';
      default:
        return 'Tooltip';
    }
  };

  const getModalContent = () => {
    switch (type) {
      case 'stock':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>📦 Situazione Stock Completa</Text>
            
            {entry?.focusReferencesData && entry.focusReferencesData.length > 0 ? (
              entry.focusReferencesData.map((focusData, index) => {
                const reference = getFocusReferenceById(focusData.referenceId);
                if (!reference) return null;
                
                const orderedPieces = parseFloat(focusData.orderedPieces) || 0;
                const soldPieces = parseFloat(focusData.soldPieces) || 0;
                const stockPieces = parseFloat(focusData.stockPieces) || 0;
                const totalPieces = orderedPieces + soldPieces + stockPieces;
                
                // Calcola percentuali
                const orderedPercentage = totalPieces > 0 ? ((orderedPieces / totalPieces) * 100).toFixed(1) : '0';
                const soldPercentage = totalPieces > 0 ? ((soldPieces / totalPieces) * 100).toFixed(1) : '0';
                const stockPercentage = totalPieces > 0 ? ((stockPieces / totalPieces) * 100).toFixed(1) : '0';
                
                return (
                  <View key={index} style={styles.stockItem}>
                    <View style={styles.stockHeader}>
                      <Text style={styles.stockTitle}>{reference.description}</Text>
                      <Text style={styles.stockCode}>Codice: {reference.code}</Text>
                    </View>
                    
                    <View style={styles.stockDetails}>
                      <View style={styles.stockRow}>
                        <Text style={styles.stockLabel}>📦 Ordinati:</Text>
                        <Text style={styles.stockValue}>{orderedPieces} pz</Text>
                        <Text style={styles.stockPercentage}>({orderedPercentage}%)</Text>
                      </View>
                      
                      <View style={styles.stockRow}>
                        <Text style={styles.stockLabel}>💰 Venduti:</Text>
                        <Text style={styles.stockValue}>{soldPieces} pz</Text>
                        <Text style={styles.stockPercentage}>({soldPercentage}%)</Text>
                      </View>
                      
                      <View style={styles.stockRow}>
                        <Text style={styles.stockLabel}>📋 Stock:</Text>
                        <Text style={styles.stockValue}>{stockPieces} pz</Text>
                        <Text style={styles.stockPercentage}>({stockPercentage}%)</Text>
                      </View>
                      
                      <View style={styles.stockTotal}>
                        <Text style={styles.stockTotalLabel}>📊 Totale:</Text>
                        <Text style={styles.stockTotalValue}>{totalPieces} pz</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.contentText}>
                Nessun dato stock disponibile per questo giorno
              </Text>
            )}
          </View>
        );

      case 'notes':
        return (
          <View style={styles.chatContainer}>
            <Text style={styles.sectionTitle}>💬 Chat Note</Text>
            
            {/* Chat Messages */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.chatMessages}
              showsVerticalScrollIndicator={false}
            >
              {entry?.chatNotes && entry.chatNotes.length > 0 ? (
                entry.chatNotes.map((note) => {
                  const isCurrentUser = note.userId === 'default_user'; // TODO: Usare utente corrente
                  const userInitials = (note.userName || note.userId).substring(0, 2).toUpperCase();
                  
                  return (
                    <View key={note.id} style={[
                      styles.messageWrapper,
                      isCurrentUser ? styles.messageWrapperRight : styles.messageWrapperLeft
                    ]}>
                      {/* Avatar/Iniziali per altri utenti */}
                      {!isCurrentUser && (
                        <View style={styles.avatarContainer}>
                          <Text style={styles.avatarText}>{userInitials}</Text>
                        </View>
                      )}
                      
                      {/* Messaggio */}
                      <View style={[
                        styles.messageBubble,
                        isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft
                      ]}>
                        <Text style={[
                          styles.messageText,
                          isCurrentUser ? styles.messageTextRight : styles.messageTextLeft
                        ]}>
                          {note.message}
                        </Text>
                        
                        {/* Timestamp discreto */}
                        <Text style={[
                          styles.messageTimestamp,
                          isCurrentUser ? styles.messageTimestampRight : styles.messageTimestampLeft
                        ]}>
                          {new Date(note.timestamp).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatText}>
                    Nessun messaggio per questo giorno
                  </Text>
                  <Text style={styles.emptyChatSubtext}>
                    Scrivi un messaggio qui sotto
                  </Text>
                </View>
              )}
            </ScrollView>
            
            {/* Chat Input (stile WhatsApp) */}
            <View style={styles.chatInputContainer}>
              <SafeTouchableOpacity
                style={styles.emojiButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Text style={styles.emojiButtonText}>😊</Text>
              </SafeTouchableOpacity>
              
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Messaggio..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                  maxLength={500}
                  placeholderTextColor="#999999"
                />
              </View>
              
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
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <View style={styles.emojiPickerContainer}>
                <Text style={styles.emojiPickerTitle}>Seleziona emoji:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.emojiGrid}>
                    {['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '👏', '🙏', '😍', '🤔', '😢', '😡', '😴', '🤗', '😎', '🤩', '😭', '😱', '🤯'].map((emoji, index) => (
                      <SafeTouchableOpacity
                        key={index}
                        style={styles.emojiItem}
                        onPress={() => handleEmojiSelect({ native: emoji })}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </SafeTouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        );

      case 'info':
        // Conta i filtri attivi
        const activeFiltersCount = [
          activeFilters?.selectedLine,
          activeFilters?.selectedAMCode,
          activeFilters?.selectedNAMCode,
          activeFilters?.selectedUserId,
          activeFilters?.selectedSalesPointId,
          ...(activeFilters?.selectedFilterItems || [])
        ].filter(Boolean).length;

        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>👤 Riassunto Filtri</Text>
            
            {activeFiltersCount > 0 ? (
              <View>
                <Text style={styles.contentText}>
                  📊 Filtri attivi: {activeFiltersCount}
                </Text>
                <Text style={styles.contentText}>
                  I filtri selezionati influenzano la visualizzazione dei dati nel calendario.
                </Text>
              </View>
            ) : (
              <View style={styles.noFiltersContainer}>
                <Text style={styles.noFiltersText}>Nessun filtro attivo</Text>
                <Text style={styles.noFiltersSubtext}>
                  Seleziona filtri per personalizzare la vista
                </Text>
              </View>
            )}
          </View>
        );

      case 'images':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Immagini e Documenti</Text>
            <Text style={styles.contentText}>
              {entry ? 'Gestione immagini per questo giorno' : 'Nessun dato per questo giorno'}
            </Text>
            <SafeTouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('📷 Azione immagini per:', date);
                Alert.alert('Immagini', 'Funzionalità immagini in sviluppo');
              }}
            >
              <Text style={styles.actionButtonText}>📷 Carica Immagine</Text>
            </SafeTouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentText}>Tooltip non riconosciuto</Text>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getModalTitle()}</Text>
          <SafeTouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </SafeTouchableOpacity>
        </View>

        {/* Content */}
        {type === 'notes' ? (
          <View style={styles.content}>
            <View style={styles.dateSection}>
              <Text style={styles.dateText}>
                📅 {new Date(date).toLocaleDateString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {getModalContent()}
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dateSection}>
              <Text style={styles.dateText}>
                📅 {new Date(date).toLocaleDateString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {getModalContent()}
          </ScrollView>
        )}
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
    lineHeight: 20,
  },
  messageTextLeft: {
    color: '#000000',
  },
  messageTextRight: {
    color: '#ffffff',
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
    width: 40,
    height: 40,
    backgroundColor: Colors.warmPrimary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#ffffff',
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
}); 