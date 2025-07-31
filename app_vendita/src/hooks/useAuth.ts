import { useState, useEffect, useCallback } from 'react';
import { firebaseAuthService, AuthUser } from '../core/services/firebaseAuth';

export interface UseAuthReturn {
  // Stato
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Azioni
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== GESTIONE STATO =====

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== AUTENTICAZIONE =====

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const authUser = await firebaseAuthService.signIn(email, password);
      setUser(authUser);
      console.log('✅ useAuth: Login completato per:', email);
    } catch (error) {
      console.error('❌ useAuth: Errore nel login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore di autenticazione';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const authUser = await firebaseAuthService.signUp(email, password, displayName);
      setUser(authUser);
      console.log('✅ useAuth: Registrazione completata per:', email);
    } catch (error) {
      console.error('❌ useAuth: Errore nella registrazione:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore di registrazione';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await firebaseAuthService.signOut();
      
      // Forza l'aggiornamento dello stato locale
      setUser(null);
      setIsLoading(false);
      
      console.log('✅ useAuth: Logout completato');
    } catch (error) {
      console.error('❌ useAuth: Errore nel logout:', error);
      
      // Anche se c'è un errore, forziamo il logout locale
      setUser(null);
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Errore nel logout';
      setError(errorMessage);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    setError(null);

    try {
      await firebaseAuthService.resetPassword(email);
      console.log('✅ useAuth: Email di reset inviata a:', email);
    } catch (error) {
      console.error('❌ useAuth: Errore nell\'invio email reset:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'invio email';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // ===== EFFETTI =====

  // Ascolta i cambiamenti di stato dell'autenticazione
  useEffect(() => {
    console.log('🔄 useAuth: Inizializzazione listener autenticazione');
    
    const unsubscribe = firebaseAuthService.onAuthStateChange((authUser) => {
      console.log('🔄 useAuth: Cambio stato autenticazione:', authUser ? authUser.email : 'null');
      setUser(authUser);
      setIsLoading(false);
      
      if (authUser) {
        console.log('✅ useAuth: Utente autenticato:', authUser.email);
      } else {
        console.log('🔓 useAuth: Nessun utente autenticato');
      }
    });

    return unsubscribe;
  }, []);

  return {
    // Stato
    user,
    isLoading,
    isAuthenticated: user !== null,
    
    // Azioni
    login,
    signUp,
    logout,
    resetPassword,
    
    // Utility
    clearError,
  };
}; 