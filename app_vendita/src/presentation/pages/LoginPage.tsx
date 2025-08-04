import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import SafeTouchableOpacity from '../components/common/SafeTouchableOpacity';
import { LoginModal } from '../components/LoginModal';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { AuthUser } from '../../core/services/firebaseAuth';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginSuccess = (user: AuthUser) => {
    console.log('✅ LoginPage: Login completato per:', user.email);
    onLoginSuccess(user);
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>App Vendita</Text>
        <Text style={styles.subtitle}>Gestione Vendite Multi-Piattaforma</Text>
        
        <View style={styles.features}>
          <Text style={styles.featureText}>📅 Calendario Vendite Interattivo</Text>
          <Text style={styles.featureText}>📊 Filtri Progressivi Avanzati</Text>
          <Text style={styles.featureText}>📈 Importazione Excel Completa</Text>
          <Text style={styles.featureText}>🔄 Sincronizzazione Real-time</Text>
          <Text style={styles.featureText}>📱 Multi-Piattaforma</Text>
        </View>

        <SafeTouchableOpacity
          style={styles.loginButton}
          onPress={handleShowLogin}
        >
          <Text style={styles.loginButtonText}>Accedi o Registrati</Text>
        </SafeTouchableOpacity>

        <Text style={styles.infoText}>
          Accedi per sincronizzare i tuoi dati e accedere a tutte le funzionalità
        </Text>
      </View>

      <LoginModal
        visible={showLoginModal}
        onClose={handleCloseLogin}
        onLoginSuccess={handleLoginSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xlarge,
  },
  features: {
    marginBottom: Spacing.xlarge,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.xlarge,
    marginBottom: Spacing.large,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
    } : {
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }),
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 