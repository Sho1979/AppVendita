import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

const InitialLoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.brandCard}>
        <Text style={styles.title}>Calendario Vendite</Text>
        <Text style={styles.subtitle}>Preparazione ambiente…</Text>
        <ActivityIndicator size={Platform.OS === 'web' ? 'large' : 'small'} color={Colors.warmBackground} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    color: Colors.warmBackground,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.warmBackground,
    opacity: 0.9,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InitialLoadingScreen;


