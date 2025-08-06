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
}

export const MonthTooltipButtons: React.FC<MonthTooltipButtonsProps> = React.memo(({
  handleTooltipPress,
  entry,
  shouldShowPhotos,
  photoManager,
  selectedSalesPointId,
}) => {
  return (
    <View style={styles.monthTooltipContainer}>
      <SafeTouchableOpacity
        style={styles.monthTooltipButton}
        onPress={() => handleTooltipPress('notes')}
        activeOpacity={0.8}
        accessibilityLabel="Note"
        accessibilityHint="Aggiungi o visualizza note per questo giorno"
      >
        <View style={styles.monthTooltipButtonContent}>
          <Text style={styles.monthTooltipText}>📝</Text>
                      {selectedSalesPointId && selectedSalesPointId !== 'default' && selectedSalesPointId !== '' && 
           ((entry?.notes && entry.notes.trim() !== '') || 
            (entry?.chatNotes && entry.chatNotes.length > 0)) && (
            <View style={styles.monthMessageCountBadge}>
              <Text style={styles.monthMessageCountText}>
                {entry?.chatNotes && entry.chatNotes.length > 9 ? '9+' : (entry?.chatNotes?.length || 1)}
              </Text>
            </View>
          )}
        </View>
      </SafeTouchableOpacity>
      
      <SafeTouchableOpacity
        style={styles.monthTooltipButton}
        onPress={() => handleTooltipPress('images')}
        activeOpacity={0.8}
        accessibilityLabel="Immagini"
        accessibilityHint="Carica o visualizza immagini per questo giorno"
      >
        <View style={styles.monthTooltipButtonContent}>
          <Text style={styles.monthTooltipText}>📷</Text>
          {shouldShowPhotos && photoManager.photos && photoManager.photos.length > 0 && (
            <View style={styles.monthMessageCountBadge}>
              <Text style={styles.monthMessageCountText}>
                {photoManager.photos.length > 9 ? '9+' : photoManager.photos.length}
              </Text>
            </View>
          )}
        </View>
      </SafeTouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  monthTooltipContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'row',
    gap: 2,
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
  monthTooltipButtonContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTooltipText: {
    fontSize: 10,
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