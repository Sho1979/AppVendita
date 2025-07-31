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
}

export const CellTags: React.FC<CellTagsProps> = ({
  tagIds,
  maxVisible = 4,
  size = 'small'
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
  
  const personTags = allTags
    .filter(tag => tag.type === 'person')
    .slice(0, Math.ceil(maxVisible / 2));

  const actionTags = allTags
    .filter(tag => tag.type === 'action')
    .slice(0, Math.ceil(maxVisible / 2));
    
  // Rimuoviamo questo log che causa re-render continui
  // console.log('🏷️ CellTags: Person tags:', personTags.length, 'Action tags:', actionTags.length);

  return (
    <View style={styles.container}>
      {/* Righe separate per persone e azioni */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 1,
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center',
  },
}); 