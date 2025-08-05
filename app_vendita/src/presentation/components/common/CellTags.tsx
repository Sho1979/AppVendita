import React from 'react';
import { View, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Text } from 'react-native';
import { Tag } from './Tag';
import { getTagById } from '../../../constants/Tags';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getTagsByType } from '../../../constants/Tags';

interface CellTagsProps {
  tagIds: string[];
  maxVisible?: number;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
}

export const CellTags: React.FC<CellTagsProps> = ({
  tagIds,
  maxVisible = 4,
  size = 'small',
  layout = 'vertical'
}) => {
  // Rimuoviamo questo log che causa re-render continui
  // console.log('🏷️ CellTags: Ricevuti tagIds:', tagIds);
  
  if (!tagIds || tagIds.length === 0) {
    // Rimuoviamo questo log che causa re-render continui
    // console.log('🏷️ CellTags: Nessun tag da visualizzare');
    return null;
  }

  // Separa i tag per tipo
  const allTags = tagIds.map(id => getTagById(id)).filter(tag => tag);
  // Rimuoviamo questo log che causa re-render continui
  // console.log('🏷️ CellTags: Tag trovati:', allTags.map(t => ({ id: t.id, type: t.type, label: t.label })));
  
  // Se maxVisible è uguale al numero totale di tag, mostra tutti senza limiti per tipo
  const shouldShowAll = maxVisible >= allTags.length;
  
  const personTags = shouldShowAll 
    ? allTags.filter(tag => tag.type === 'person')
    : allTags
        .filter(tag => tag.type === 'person')
        .slice(0, Math.ceil(maxVisible / 2));

  const actionTags = shouldShowAll
    ? allTags.filter(tag => tag.type === 'action')
    : allTags
        .filter(tag => tag.type === 'action')
        .slice(0, Math.ceil(maxVisible / 2));
    
  // Rimuoviamo questo log che causa re-render continui
  // console.log('🏷️ CellTags: Person tags:', personTags.length, 'Action tags:', actionTags.length);

  return (
    <View style={[styles.container, layout === 'horizontal' && styles.horizontalContainer]}>
      {layout === 'horizontal' ? (
        // Layout orizzontale: tutti i tag in una riga
        <View style={styles.horizontalRow}>
          {allTags.slice(0, maxVisible).map((tag) => (
            <Tag
              key={tag.id}
              tag={tag}
              size={size}
              disabled={false}
            />
          ))}
        </View>
      ) : (
        // Layout verticale: righe separate per persone e azioni
        <>
          {personTags.length > 0 && (
            <View style={styles.row}>
              {personTags.map((tag) => (
                <Tag
                  key={tag.id}
                  tag={tag}
                  size={size}
                  disabled={false}
                />
              ))}
            </View>
          )}
          
          {actionTags.length > 0 && (
            <View style={styles.row}>
              {actionTags.map((tag) => (
                <Tag
                  key={tag.id}
                  tag={tag}
                  size={size}
                  disabled={false}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 1,
    alignItems: 'flex-start',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center',
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
}); 