import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestComponent() {
  console.log('🧪 TestComponent: Componente di test renderizzato');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test App Vendita</Text>
      <Text style={styles.subtitle}>Se vedi questo, l'app funziona!</Text>
      <Text style={styles.debug}>
        Debug: Componente di test caricato correttamente
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
  },
  debug: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
});
