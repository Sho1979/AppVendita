import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { CalendarEntry } from '../../data/models/CalendarEntry';

interface WeekTooltipButtonsProps {
  hoveredTooltip: string | null;
  setHoveredTooltip: (tooltip: string | null) => void;
  handleTooltipPress: (type: 'stock' | 'notes' | 'info' | 'images') => void;
  hasStockContent: () => boolean;
  hasInfoContent: () => boolean;
  entry?: CalendarEntry | undefined;
  shouldShowPhotos: boolean;
  photoManager: {
    photos?: any[];
  };
  selectedSalesPointId?: string | undefined;
}

export const WeekTooltipButtons: React.FC<WeekTooltipButtonsProps> = React.memo(({
  hoveredTooltip,
  setHoveredTooltip,
  handleTooltipPress,
  hasStockContent,
  hasInfoContent,
  entry,
  shouldShowPhotos,
  photoManager,
  selectedSalesPointId,
}) => {
  // Calcolo robusto del badge per le note: conta chatNotes, usa 1 se esiste nota standard
  const notesBadgeCount = (() => {
    // Badge conteggia SOLO le chat; la nota standard non influisce
    const chatCount = Array.isArray((entry as any)?.chatNotes) ? (entry as any).chatNotes.length : 0;
    return chatCount > 0 ? Math.min(chatCount, 99) : 0;
  })();

  return (
    <View style={styles.tooltipSection}>
      <View style={styles.tooltipContainer}>
        {/* Stock: sempre visibile; indicatore blu solo se hasStockContent() */}
        <SafeTouchableOpacity
          style={[
            styles.tooltipButton,
            styles.tooltipStock,
            hoveredTooltip === 'stock' && styles.tooltipButtonHovered,
          ]}
          onPress={() => handleTooltipPress('stock')}
          onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('stock')}
          onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
          activeOpacity={0.8}
          accessibilityLabel="Gestione Stock"
          accessibilityHint="Apri la gestione dello stock per questo giorno"
        >
          <View style={styles.tooltipButtonContent}>
            <Text style={styles.tooltipText}>📦</Text>
            {hasStockContent() && (
              <View style={styles.contentIndicatorBadge}>
                <Text style={styles.contentIndicatorText}>•</Text>
              </View>
            )}
          </View>
        </SafeTouchableOpacity>

        {/* Note: sempre visibile; badge numerico solo se presenti chatNotes/notes */}
        <SafeTouchableOpacity
          style={[
            styles.tooltipButton,
            styles.tooltipNotes,
            hoveredTooltip === 'notes' && styles.tooltipButtonHovered,
          ]}
          onPress={() => handleTooltipPress('notes')}
          onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('notes')}
          onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
          activeOpacity={0.8}
          accessibilityLabel="Note"
          accessibilityHint="Aggiungi o visualizza note per questo giorno"
        >
          <View style={styles.tooltipButtonContent}>
            <Text style={styles.tooltipText}>📝</Text>
            {selectedSalesPointId && selectedSalesPointId !== 'default' && selectedSalesPointId !== '' &&
             notesBadgeCount > 0 && (
              <View style={styles.messageCountBadge}>
                <Text style={styles.messageCountText}>
                  {notesBadgeCount > 99 ? '99+' : notesBadgeCount}
                </Text>
              </View>
            )}
          </View>
        </SafeTouchableOpacity>

        {/* Info (Agente): sempre visibile; pallino sempre mostrato quando filtro attivo (hasInfoContent) */}
        <SafeTouchableOpacity
          style={[
            styles.tooltipButton,
            styles.tooltipInfo,
            hoveredTooltip === 'info' && styles.tooltipButtonHovered,
          ]}
          onPress={() => handleTooltipPress('info')}
          onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('info')}
          onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
          activeOpacity={0.8}
          accessibilityLabel="Informazioni"
          accessibilityHint="Visualizza informazioni dettagliate per questo giorno"
        >
          <View style={styles.tooltipButtonContent}>
            <Text style={styles.tooltipText}>👤</Text>
            {hasInfoContent() && (
              <View style={styles.contentIndicatorBadge}>
                <Text style={styles.contentIndicatorText}>•</Text>
              </View>
            )}
          </View>
        </SafeTouchableOpacity>

        {/* Immagini: sempre visibile; badge numerico solo se presenti foto */}
        <SafeTouchableOpacity
          style={[
            styles.tooltipButton,
            styles.tooltipImages,
            hoveredTooltip === 'images' && styles.tooltipButtonHovered,
          ]}
          onPress={() => handleTooltipPress('images')}
          onPressIn={() => Platform.OS === 'web' && setHoveredTooltip('images')}
          onPressOut={() => Platform.OS === 'web' && setHoveredTooltip(null)}
          activeOpacity={0.8}
          accessibilityLabel="Immagini"
          accessibilityHint="Carica o visualizza immagini per questo giorno"
        >
          <View style={styles.tooltipButtonContent}>
            <Text style={styles.tooltipText}>📷</Text>
            {shouldShowPhotos && Array.isArray(photoManager.photos) && photoManager.photos.length > 0 && (
              <View style={styles.messageCountBadge}>
                <Text style={styles.messageCountText}>
                  {photoManager.photos.length > 99 ? '99+' : photoManager.photos.length}
                </Text>
              </View>
            )}
          </View>
        </SafeTouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  tooltipSection: {
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  tooltipContainer: {
    flexDirection: 'row',
    gap: Platform.OS === 'web' ? 4 : 2,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tooltipButton: {
    width: Platform.OS === 'web' ? 28 : 26,
    height: Platform.OS === 'web' ? 28 : 26,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
    } : {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    }),
  },
  tooltipStock: {
    backgroundColor: '#FFE4B5',
    borderColor: '#DEB887',
  },
  tooltipNotes: {
    backgroundColor: '#E6E6FA',
    borderColor: '#9370DB',
  },
  tooltipInfo: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4169E1',
  },
  tooltipImages: {
    backgroundColor: '#F0FFF0',
    borderColor: '#3CB371',
  },
  tooltipButtonHovered: {
    transform: Platform.OS === 'web' ? [{ scale: 1.1 }] : [],
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    } : {
      elevation: 4,
    }),
  },
  tooltipText: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#333333',
  },
  tooltipButtonContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  messageCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentIndicatorBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  contentIndicatorText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

WeekTooltipButtons.displayName = 'WeekTooltipButtons';