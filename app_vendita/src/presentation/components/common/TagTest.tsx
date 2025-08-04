import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Tag } from './Tag';
import { TagLegend } from './TagLegend';
import { getAllTags, TagConfig } from '../../../constants/Tags';

export const TagTest: React.FC = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagPress = (tag: TagConfig) => {
    setSelectedTags(prev => {
      if (prev.includes(tag.id)) {
        return prev.filter(id => id !== tag.id);
      } else {
        return [...prev, tag.id];
      }
    });
  };

  const allTags = getAllTags();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test Componenti Tag</Text>
      
      {/* Sezione Tag Singoli */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tag Singoli (Diverse Dimensioni)</Text>
        <View style={styles.tagRow}>
          {allTags.slice(0, 3).map((tag) => (
            <View key={tag.id} style={styles.tagContainer}>
              <Tag tag={tag} size="small" />
              <Text style={styles.tagName}>Small</Text>
            </View>
          ))}
        </View>
        <View style={styles.tagRow}>
          {allTags.slice(3, 6).map((tag) => (
            <View key={tag.id} style={styles.tagContainer}>
              <Tag tag={tag} size="medium" />
              <Text style={styles.tagName}>Medium</Text>
            </View>
          ))}
        </View>
        <View style={styles.tagRow}>
          {allTags.slice(6, 9).map((tag) => (
            <View key={tag.id} style={styles.tagContainer}>
              <Tag tag={tag} size="large" />
              <Text style={styles.tagName}>Large</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sezione Tag Interattivi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tag Interattivi (Cliccabili)</Text>
        <View style={styles.tagGrid}>
          {allTags.map((tag) => (
            <View key={tag.id} style={styles.tagContainer}>
              <Tag 
                tag={tag} 
                size="medium"
                onPress={() => handleTagPress(tag)}
                selected={selectedTags.includes(tag.id)}
              />
              <Text style={styles.tagName}>{tag.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.selectedText}>
          Tag selezionati: {selectedTags.length > 0 ? selectedTags.join(', ') : 'Nessuno'}
        </Text>
      </View>

      {/* Sezione Legenda */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legenda Tag</Text>
        <TagLegend 
          onTagPress={handleTagPress}
          selectedTags={selectedTags}
          collapsible={true}
        />
      </View>

      {/* Sezione Legenda Non Collassabile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legenda Fissa</Text>
        <TagLegend 
          onTagPress={handleTagPress}
          selectedTags={selectedTags}
          collapsible={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  tagContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  tagName: {
    fontSize: 12,
    color: '#8A8A8E',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 