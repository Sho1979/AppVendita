import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { TagTest } from '../components/common/TagTest';

export const TagTestPage: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <TagTest />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
}); 