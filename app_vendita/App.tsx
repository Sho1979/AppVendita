import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import ErrorBoundary from './src/presentation/components/ErrorBoundary';
import { CalendarProvider } from './src/presentation/providers/CalendarContext';
import MainTabNavigator from './src/presentation/navigation/MainTabNavigator';
import { LoginPage } from './src/presentation/pages/LoginPage';
import { useAuth } from './src/hooks/useAuth';
import { AuthUser } from './src/core/services/firebaseAuth';

export default function App() {
  console.log('🚀 App: Componente principale inizializzato');

  const { user, isLoading, isAuthenticated } = useAuth();

  const handleLoginSuccess = (user: AuthUser) => {
    console.log('✅ App: Login completato per:', user.email);
  };

  // Mostra loading mentre verifica lo stato di autenticazione
  if (isLoading) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <LoginPage onLoginSuccess={handleLoginSuccess} />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  // Se non autenticato, mostra la pagina di login come porta d'accesso
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <LoginPage onLoginSuccess={handleLoginSuccess} />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  // Se autenticato, mostra l'app principale
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
