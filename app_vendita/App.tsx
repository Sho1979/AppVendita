import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import ErrorBoundary from './src/presentation/components/ErrorBoundary';
import { CalendarProvider } from './src/presentation/providers/CalendarContext';
import MainTabNavigator from './src/presentation/navigation/MainTabNavigator';

export default function App() {
  console.log('🚀 App: Componente principale inizializzato');

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <CalendarProvider>
            <MainTabNavigator />
            <StatusBar style="light" />
          </CalendarProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
