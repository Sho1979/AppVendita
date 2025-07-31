import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import SafeTouchableOpacity from '../components/common/SafeTouchableOpacity';
import { LoginModal } from '../components/LoginModal';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { AuthUser } from '../../core/services/firebaseAuth';
import { useAuth } from '../../hooks/useAuth';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginSuccess = (user: AuthUser) => {
    console.log('✅ AccountPage: Login completato per:', user.email);
    setShowLoginModal(false);
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire dall\'account?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              console.log('✅ AccountPage: Logout completato');
            } catch (error) {
              console.error('❌ AccountPage: Errore logout:', error);
              Alert.alert('Errore', 'Impossibile effettuare il logout.', [{ text: 'OK' }]);
            }
          }
        }
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Accedi per sincronizzare i tuoi dati</Text>
          
          <View style={styles.features}>
            <Text style={styles.featureText}>🔐 Accesso Sicuro</Text>
            <Text style={styles.featureText}>☁️ Sincronizzazione Cloud</Text>
            <Text style={styles.featureText}>📱 Multi-Device</Text>
            <Text style={styles.featureText}>🔄 Backup Automatico</Text>
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
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Informazioni del tuo account</Text>
        
        <View style={styles.accountInfo}>
          <Text style={styles.accountLabel}>Email:</Text>
          <Text style={styles.accountValue}>{user?.email}</Text>
          
          <Text style={styles.accountLabel}>Nome:</Text>
          <Text style={styles.accountValue}>{user?.displayName || 'Non specificato'}</Text>
          
          <Text style={styles.accountLabel}>ID Utente:</Text>
          <Text style={styles.accountValue}>{user?.uid}</Text>
        </View>

        <SafeTouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </SafeTouchableOpacity>

        <Text style={styles.infoText}>
          I tuoi dati sono sincronizzati e al sicuro
        </Text>
      </View>
    </View>
  );
}

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
  accountInfo: {
    width: '100%',
    marginBottom: Spacing.xlarge,
    padding: Spacing.large,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  accountValue: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.xlarge,
    marginBottom: Spacing.large,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.xlarge,
    marginBottom: Spacing.large,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
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