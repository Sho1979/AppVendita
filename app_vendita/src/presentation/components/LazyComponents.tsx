import React, { Suspense, lazy } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Loading component per lazy loading
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2196F3" />
    <Text style={styles.loadingText}>Caricamento...</Text>
  </View>
);

// Componenti lazy per performance
export const LazyTooltipModal = lazy(() => import('./TooltipModal'));
export const LazyEntryFormModal = lazy(() => import('./EntryFormModal'));
export const LazyFilterComponents = lazy(() => import('./FilterComponents'));

// Wrapper per componenti lazy con Suspense
export const LazyComponentWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
}); 