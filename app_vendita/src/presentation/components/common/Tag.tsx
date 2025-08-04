import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TagConfig } from '../../../constants/Tags';

interface TagProps {
  tag: TagConfig;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export const Tag: React.FC<TagProps> = ({
  tag,
  size = 'medium',
  onPress,
  selected = false,
  disabled = false
}) => {
  const isPerson = tag.type === 'person';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isAction = tag.type === 'action';
  
  const sizeConfig = {
    tiny: { width: 18, height: 18, fontSize: 8 },
    small: { width: 24, height: 24, fontSize: 10 },
    medium: { width: 32, height: 32, fontSize: 12 },
    large: { width: 40, height: 40, fontSize: 14 }
  };

  const config = sizeConfig[size];

  const containerStyle = [
    styles.container,
    {
      width: config.width,
      height: config.height,
      borderRadius: isPerson ? config.width / 2 : 6, // Cerchio per persone, quadrato arrotondato per azioni
      backgroundColor: selected ? '#007AFF' : tag.backgroundColor,
      opacity: disabled ? 0.5 : 1,
      borderWidth: selected ? 2 : 1.5, // Contorno più marcato
      borderColor: selected ? '#FFFFFF' : '#333333' // Contorno scuro per tutti i tag
    }
  ];

  const textStyle = [
    styles.text,
    {
      fontSize: config.fontSize,
      color: selected ? '#FFFFFF' : tag.color,
      fontWeight: selected ? 'bold' : 'normal'
    }
  ];

  const TagContent = (
    <View style={containerStyle}>
      <Text style={textStyle}>{tag.acronym}</Text>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.touchable}
        activeOpacity={0.7}
      >
        {TagContent}
      </TouchableOpacity>
    );
  }

  return TagContent;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 3px rgba(0, 0, 0, 0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
    }),
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  touchable: {
    margin: 2,
  },
}); 