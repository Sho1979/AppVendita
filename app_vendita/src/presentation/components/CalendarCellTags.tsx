import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CellTags } from './common/CellTags';
import { CalendarEntry } from '../../data/models/CalendarEntry';

interface CalendarCellTagsProps {
  entry: CalendarEntry | undefined;
  isWeekView: boolean;
}

/**
 * Componente che gestisce la logica di visualizzazione dei tag
 * Centralizza la logica duplicata per determinare quali tag mostrare
 */
export const CalendarCellTags: React.FC<CalendarCellTagsProps> = React.memo(({ 
  entry, 
  isWeekView 
}) => {
  // Determina se ci sono contenuti
  const hasTags = entry?.tags && entry.tags.length > 0;
  const hasFocusData = entry?.focusReferencesData && entry.focusReferencesData.length > 0;
  const hasSales = entry?.sales && entry.sales.length > 0;
  const hasActions = entry?.actions && entry.actions.length > 0;
  const hasContent = hasTags || hasFocusData || hasSales || hasActions;
  
  // Determina quali tag mostrare
  let tagIds = entry?.tags || [];
  
  // Se l'entry ha tag espliciti (anche vuoti), rispetta la scelta dell'utente
  // Non aggiungere tag automatici se l'utente ha rimosso tutti i tag
  if (entry && 'tags' in entry) {
    // Se l'entry ha un campo tags definito (anche vuoto), rispetta la scelta dell'utente
    tagIds = entry.tags || [];
  } else if (!hasTags && hasContent) {
    // Genera tag di default basati sul contenuto solo se il campo tags è completamente mancante
    const defaultTags = [];
    if (hasFocusData) defaultTags.push('merchandiser'); // M per focus references
    if (hasSales) defaultTags.push('sell_in'); // SI per vendite
    if (hasActions) defaultTags.push('check'); // ✓ per azioni
    tagIds = defaultTags;
  }
  
  // Determina se mostrare i tag
  const shouldShowTags = hasContent && tagIds.length > 0;
  
  if (!shouldShowTags) {
    return null;
  }
  
  return (
    <View style={isWeekView ? [styles.tagsSection, styles.weekTagsContainer] : [styles.tagsContainer, styles.monthTagsContainer]}>
      <CellTags 
        tagIds={tagIds} 
        size={isWeekView ? 'small' : 'tiny'}
        maxVisible={isWeekView ? Math.min(tagIds.length, 8) : Math.min(tagIds.length, 8)}
        layout={isWeekView ? 'vertical' : 'horizontal'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  tagsSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  weekTagsContainer: {
    maxHeight: 40,
    justifyContent: 'flex-start',
    width: '100%'
  },
  tagsContainer: {
    marginTop: 1,
    marginBottom: 2,
    paddingHorizontal: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  monthTagsContainer: {
    maxHeight: 40, // due righe
    justifyContent: 'flex-start',
  },
});

CalendarCellTags.displayName = 'CalendarCellTags';