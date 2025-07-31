import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Tag } from './Tag';
import { getTagsByType, TagConfig } from '../../../constants/Tags';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAllTags } from '../../../constants/Tags';

interface TagLegendProps {
  onTagPress?: (tag: TagConfig) => void;
  selectedTags?: string[];
  collapsible?: boolean;
  showTitle?: boolean;
}

export const TagLegend: React.FC<TagLegendProps> = ({
  onTagPress,
  selectedTags = [],
  collapsible = true,
  showTitle = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const personTags = getTagsByType('person');
  const actionTags = getTagsByType('action');

  const isTagSelected = (tagId: string) => selectedTags.includes(tagId);

  const renderTagSection = (title: string, tags: TagConfig[]) => (
    <View style={styles.section}>
      {showTitle && (
        <Text style={styles.sectionTitle}>{title}</Text>
      )}
      <View style={styles.tagGrid}>
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tagItem}>
            <Tag
              tag={tag}
              size="medium"
              selected={isTagSelected(tag.id)}
              onPress={() => onTagPress?.(tag)}
            />
            <Text style={styles.tagLabel}>{tag.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const LegendContent = (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderTagSection('👥 PERSONE', personTags)}
      {renderTagSection('⚡ AZIONI', actionTags)}
    </ScrollView>
  );

  if (!collapsible) {
    return (
      <View style={styles.wrapper}>
        {showTitle && (
          <Text style={styles.title}>Legenda Tag</Text>
        )}
        {LegendContent}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>
          {showTitle ? 'Legenda Tag' : 'Tag'}
        </Text>
        <Text style={styles.collapseIcon}>
          {isCollapsed ? '▼' : '▲'}
        </Text>
      </TouchableOpacity>
      
      {!isCollapsed && LegendContent}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    margin: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  collapseIcon: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  container: {
    maxHeight: 300,
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tagItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  tagLabel: {
    fontSize: 10,
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
}); 