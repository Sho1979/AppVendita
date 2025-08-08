import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { CalendarEntry } from '../../data/models/CalendarEntry';

interface MonthTooltipButtonsProps {
  handleTooltipPress: (type: 'stock' | 'notes' | 'info' | 'images') => void;
  entry?: CalendarEntry | undefined;
  shouldShowPhotos: boolean;
  photoManager: {
    photos?: any[];
  };
  selectedSalesPointId?: string | undefined;
  inline?: boolean;
  buttonSize?: 'small' | 'medium' | 'large';
}

export const MonthTooltipButtons: React.FC<MonthTooltipButtonsProps> = React.memo(({
  handleTooltipPress,
  entry,
  shouldShowPhotos,
  photoManager,
  selectedSalesPointId,
  inline = false,
  buttonSize = 'small',
}) => {
  const containerStyle = inline ? styles.inlineContainer : styles.monthTooltipContainer;
  const buttonStyle = inline ? styles.inlineTooltipButton : styles.monthTooltipButton;
  const textStyle = inline ? styles.inlineTooltipText : styles.monthTooltipText;

  const sizeDims = {
    small: { w: inline ? 18 : 20, h: inline ? 18 : 20, fs: inline ? 9 : 10 },
    medium: { w: inline ? 20 : 22, h: inline ? 20 : 22, fs: inline ? 10 : 11 },
    large: { w: inline ? 22 : 24, h: inline ? 22 : 24, fs: inline ? 11 : 12 },
  } as const;
  const dims = sizeDims[buttonSize];
  const notesEnabled = !!(
    selectedSalesPointId &&
    selectedSalesPointId !== 'default' &&
    ((entry?.notes && entry.notes.trim() !== '') || (entry?.chatNotes && entry.chatNotes.length > 0))
  );

  const imagesEnabled = !!(shouldShowPhotos && photoManager.photos && photoManager.photos.length > 0);

  if (!notesEnabled && !imagesEnabled) {
    return null;
  }

  return (
    <View style={containerStyle}>
      {notesEnabled && (
        <SafeTouchableOpacity
          style={[buttonStyle, { width: dims.w, height: dims.h, borderRadius: dims.w / 2 }]}
          onPress={() => handleTooltipPress('notes')}
          activeOpacity={0.8}
          accessibilityLabel="Note"
          accessibilityHint="Aggiungi o visualizza note per questo giorno"
        >
          <View style={styles.monthTooltipButtonContent}>
            <Text style={[textStyle, { fontSize: dims.fs }]}>📝</Text>
            {entry?.chatNotes && entry.chatNotes.length > 0 && (
              <View style={styles.monthMessageCountBadge}>
                <Text style={styles.monthMessageCountText}>
                  {entry.chatNotes.length > 9 ? '9+' : entry.chatNotes.length}
                </Text>
              </View>
            )}
          </View>
        </SafeTouchableOpacity>
      )}

      {imagesEnabled && (
        <SafeTouchableOpacity
          style={[buttonStyle, { width: dims.w, height: dims.h, borderRadius: dims.w / 2 }]}
          onPress={() => handleTooltipPress('images')}
          activeOpacity={0.8}
          accessibilityLabel="Immagini"
          accessibilityHint="Carica o visualizza immagini per questo giorno"
        >
          <View style={styles.monthTooltipButtonContent}>
            <Text style={[textStyle, { fontSize: dims.fs }]}>📷</Text>
            <View style={styles.monthMessageCountBadge}>
              <Text style={styles.monthMessageCountText}>
                {photoManager.photos!.length > 9 ? '9+' : photoManager.photos!.length}
              </Text>
            </View>
          </View>
        </SafeTouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  monthTooltipContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    gap: 2,
  },
  inlineContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  monthTooltipButton: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inlineTooltipButton: {
    width: 18,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  monthTooltipButtonContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTooltipText: {
    fontSize: 10,
    color: '#666666',
  },
  inlineTooltipText: {
    fontSize: 9,
    color: '#666666',
  },
  monthMessageCountBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    minWidth: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  monthMessageCountText: {
    color: '#ffffff',
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

MonthTooltipButtons.displayName = 'MonthTooltipButtons';