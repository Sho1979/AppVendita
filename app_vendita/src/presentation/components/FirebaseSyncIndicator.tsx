import React from 'react';
import { View, Text, StyleSheet, SafeTouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useFirebaseCalendar } from '../../hooks/useFirebaseCalendar';

interface FirebaseSyncIndicatorProps {
  userId: string;
  onSync?: () => void;
}

export const FirebaseSyncIndicator: React.FC<FirebaseSyncIndicatorProps> = ({
  userId,
  onSync,
}) => {
  const {
    isLoading,
    error,
    isConnected,
    syncData,
    checkConnection,
    clearError,
  } = useFirebaseCalendar();

  const handleSync = async () => {
    try {
      await syncData(userId);
      onSync?.();
    } catch (error) {
      console.error('❌ FirebaseSyncIndicator: Errore sincronizzazione:', error);
    }
  };

  const handleRetryConnection = async () => {
    try {
      await checkConnection();
    } catch (error) {
      console.error('❌ FirebaseSyncIndicator: Errore controllo connessione:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Indicatore stato connessione */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
        <Text style={styles.statusText}>
          {isConnected ? '🟢 Connesso' : '🔴 Disconnesso'}
        </Text>
      </View>

      {/* Indicatore caricamento */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⏳ Sincronizzazione in corso...</Text>
        </View>
      )}

      {/* Gestione errori */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <SafeTouchableOpacity 
            style={styles.errorDismissButton}
            onPress={clearError}
          >
            <Text style={styles.errorDismissText}>✕</Text>
          </SafeTouchableOpacity>
        </View>
      )}

      {/* Azioni */}
      <View style={styles.actionsContainer}>
        <SafeTouchableOpacity 
          style={[styles.actionButton, styles.syncButton]}
          onPress={handleSync}
          disabled={isLoading || !isConnected}
        >
          <Text style={styles.actionButtonText}>
            {isLoading ? '⏳' : '🔄'} Sincronizza
          </Text>
        </SafeTouchableOpacity>

        {!isConnected && (
          <SafeTouchableOpacity 
            style={[styles.actionButton, styles.retryButton]}
            onPress={handleRetryConnection}
          >
            <Text style={styles.actionButtonText}>🔄 Riprova</Text>
          </SafeTouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.small,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    marginBottom: Spacing.small,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.small,
  },
  connected: {
    backgroundColor: '#34C759',
  },
  disconnected: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 14,
    color: Colors.warmText,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.warmTextSecondary,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.small,
    backgroundColor: '#ffebee',
    borderRadius: 6,
    marginBottom: Spacing.small,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.small,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.small,
    borderRadius: 6,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: Colors.warmPrimary,
  },
  retryButton: {
    backgroundColor: Colors.warmTextSecondary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
}); 