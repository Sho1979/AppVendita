import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Tag } from './Tag';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ScrollView } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TagLegend } from './TagLegend';
import SafeTouchableOpacity from './SafeTouchableOpacity';
import { getAllTags, getTagsByType, TagConfig } from '../../../constants/Tags';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  repeatEnabled: boolean;
  onRepeatChange: (enabled: boolean) => void;
  weeksCount: number;
  onWeeksCountChange: (count: number) => void;
  onCopyTags?: () => string[];
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  repeatEnabled,
  onRepeatChange,
  weeksCount,
  onWeeksCountChange,
  onCopyTags,
}) => {
  console.log('🏷️ TagSelector: Componente inizializzato con:', {
    selectedTags,
    repeatEnabled,
    weeksCount,
    onCopyTags: !!onCopyTags
  });

  const personTags = getTagsByType('person');
  const actionTags = getTagsByType('action');

  console.log('🏷️ TagSelector: Tag caricati:', {
    personTags: personTags.length,
    actionTags: actionTags.length
  });

  const handleTagPress = (tag: TagConfig) => {
    const newSelectedTags = selectedTags.includes(tag.id)
      ? selectedTags.filter(id => id !== tag.id)
      : [...selectedTags, tag.id];
    onTagsChange(newSelectedTags);
  };

  const renderTagSection = (title: string, tags: TagConfig[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tagGrid}>
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tagItem}>
                         <Tag
               tag={tag}
               size="small"
               selected={selectedTags.includes(tag.id)}
               onPress={() => handleTagPress(tag)}
             />
            <Text style={styles.tagLabel}>{tag.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sezione Tag */}
      <View style={styles.tagSection}>
        <Text style={styles.mainTitle}>🏷️ Seleziona Tag</Text>
        <Text style={styles.subtitle}>
          Scegli le persone presenti e le azioni da svolgere
        </Text>
        
        {/* Pulsante per copiare tag */}
        {onCopyTags && (
          <SafeTouchableOpacity
            style={styles.copyTagsButton}
            onPress={() => {
              const copiedTags = onCopyTags();
              if (copiedTags.length > 0) {
                onTagsChange([...selectedTags, ...copiedTags]);
              }
            }}
          >
            <Text style={styles.copyTagsButtonText}>📋 Copia Tag da Altri Giorni</Text>
          </SafeTouchableOpacity>
        )}
        
        <View style={styles.tagContent}>
          {renderTagSection('👥 PERSONE', personTags)}
          {renderTagSection('⚡ AZIONI', actionTags)}
        </View>
      </View>

      {/* Sezione Ripetizione */}
      <View style={styles.repeatSection}>
        <Text style={styles.sectionTitle}>🔄 Ripetizione</Text>
        
        <View style={styles.repeatToggle}>
          <Text style={styles.repeatLabel}>Ripeti questo giorno</Text>
          <Switch
            value={repeatEnabled}
            onValueChange={onRepeatChange}
            trackColor={{ false: '#E0E0E0', true: Colors.warmPrimary }}
            thumbColor={repeatEnabled ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        {repeatEnabled && (
          <View style={styles.weeksSelector}>
            <Text style={styles.weeksLabel}>Numero di settimane:</Text>
            <View style={styles.weeksButtons}>
              {[1, 2, 3, 4].map((weeks) => (
                <View
                  key={weeks}
                  style={[
                    styles.weekButton,
                    weeksCount === weeks && styles.weekButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekButtonText,
                      weeksCount === weeks && styles.weekButtonTextActive,
                    ]}
                    onPress={() => onWeeksCountChange(weeks)}
                  >
                    {weeks}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Riepilogo Tag Selezionati */}
      {selectedTags.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>📋 Tag Selezionati:</Text>
          <View style={styles.selectedTagsContainer}>
            {selectedTags.map((tagId) => {
              const tag = getAllTags().find(t => t.id === tagId);
              return tag ? (
                <View key={tagId} style={styles.selectedTag}>
                  <Tag tag={tag} size="small" />
                  <Text style={styles.selectedTagLabel}>{tag.label}</Text>
                </View>
              ) : null;
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tagSection: {
    marginBottom: Spacing.medium,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
    marginBottom: Spacing.small,
  },
  tagContent: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.small,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  tagLabel: {
    fontSize: 9,
    color: Colors.warmTextSecondary,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  repeatSection: {
    marginBottom: Spacing.medium,
    padding: Spacing.small,
    backgroundColor: Colors.warmSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  repeatToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  repeatLabel: {
    fontSize: 14,
    color: Colors.warmText,
  },
  weeksSelector: {
    marginTop: Spacing.small,
  },
  weeksLabel: {
    fontSize: 14,
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  weeksButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weekButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekButtonActive: {
    backgroundColor: Colors.warmPrimary,
    borderColor: Colors.warmPrimary,
  },
  weekButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warmText,
  },
  weekButtonTextActive: {
    color: '#FFFFFF',
  },
  summary: {
    padding: Spacing.medium,
    backgroundColor: Colors.warmSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warmText,
    marginBottom: Spacing.small,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  selectedTagLabel: {
    fontSize: 12,
    color: Colors.warmText,
    marginLeft: 4,
  },
  copyTagsButton: {
    backgroundColor: Colors.warmPrimary,
    padding: Spacing.small,
    borderRadius: 8,
    marginBottom: Spacing.medium,
    alignItems: 'center',
  },
  copyTagsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 