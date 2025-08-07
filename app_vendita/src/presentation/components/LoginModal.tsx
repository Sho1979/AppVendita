import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import SafeTouchableOpacity from './common/SafeTouchableOpacity';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { firebaseAuthService, AuthUser } from '../../core/services/firebaseAuth';
import { DEFAULT_TEST_CREDENTIAL, enableTestAutoLogin, getSecureTestCredentials, validateEmailForFirebase } from '../../utils/testCredentials';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
}) => {
  // Auto-popolamento per TestSprite con validazione sicura
  const getInitialCredentials = () => {
    if (enableTestAutoLogin()) {
      try {
        const secureCredentials = getSecureTestCredentials();
        return {
          email: secureCredentials.email,
          password: secureCredentials.password,
          displayName: secureCredentials.displayName
        };
      } catch (error) {
        console.warn('TestSprite: Errore credenziali sicure, using fallback', error);
        return {
          email: DEFAULT_TEST_CREDENTIAL.email,
          password: DEFAULT_TEST_CREDENTIAL.password,
          displayName: DEFAULT_TEST_CREDENTIAL.displayName
        };
      }
    }
    return { email: '', password: '', displayName: '' };
  };

  const initialCredentials = getInitialCredentials();
  const [email, setEmail] = useState(initialCredentials.email);
  const [password, setPassword] = useState(initialCredentials.password);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState(initialCredentials.displayName);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Errore', 'Inserisci email e password');
      return;
    }

    setIsLoading(true);

    try {
      // Validazione email per Firebase
      const validatedEmail = validateEmailForFirebase(email);
      
      let user: AuthUser;

      if (isSignUp) {
        user = await firebaseAuthService.signUp(validatedEmail, password, displayName || undefined);
        Alert.alert('Successo', 'Account creato con successo!');
      } else {
        user = await firebaseAuthService.signIn(validatedEmail, password);
      }

      onLoginSuccess(user);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore di autenticazione';
      console.error('LoginModal: Errore autenticazione', { email, error: errorMessage });
      Alert.alert('Errore', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Errore', 'Inserisci la tua email per il reset della password');
      return;
    }

    try {
      await firebaseAuthService.resetPassword(email);
      Alert.alert('Successo', 'Email di reset inviata! Controlla la tua casella email.');
    } catch (error) {
      Alert.alert('Errore', error instanceof Error ? error.message : 'Errore nell\'invio email');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {isSignUp ? 'Crea Account' : 'Accedi'}
          </Text>

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Nome completo (opzionale)"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <SafeTouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Crea Account' : 'Accedi'}
              </Text>
            )}
          </SafeTouchableOpacity>

          <SafeTouchableOpacity
            style={styles.linkButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.linkText}>
              {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
            </Text>
          </SafeTouchableOpacity>

          {!isSignUp && (
            <SafeTouchableOpacity
              style={styles.linkButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.linkText}>Password dimenticata?</Text>
            </SafeTouchableOpacity>
          )}

          <SafeTouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Annulla</Text>
          </SafeTouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.large,
    width: '90%',
    maxWidth: 400,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.large,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.medium,
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: Spacing.medium,
  },
  cancelText: {
    color: Colors.gray,
    fontSize: 14,
  },
}); 