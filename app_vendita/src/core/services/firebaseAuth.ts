import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export class FirebaseAuthService {
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Ascolta i cambiamenti di stato dell'autenticazione
    onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
      } else {
        this.currentUser = null;
      }

      // Notifica tutti i listener
      this.authStateListeners.forEach(listener => {
        listener(this.currentUser);
      });
    });
  }

  // ===== AUTENTICAZIONE =====

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };

      console.log('✅ FirebaseAuthService: Login completato per:', email);
      return authUser;
    } catch (error: any) {
      console.error('❌ FirebaseAuthService: Errore nel login:', error.message);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Aggiorna il profilo se fornito
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };

      console.log('✅ FirebaseAuthService: Registrazione completata per:', email);
      return authUser;
    } catch (error: any) {
      console.error('❌ FirebaseAuthService: Errore nella registrazione:', error.message);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      
      // Aggiorna manualmente lo stato interno
      this.currentUser = null;
      
      // Notifica tutti i listener del cambio di stato
      this.authStateListeners.forEach(listener => {
        listener(null);
      });
      
      console.log('✅ FirebaseAuthService: Logout completato');
    } catch (error: any) {
      console.error('❌ FirebaseAuthService: Errore nel logout:', error.message);
      
      // Anche se c'è un errore, forziamo il logout locale
      this.currentUser = null;
      this.authStateListeners.forEach(listener => {
        listener(null);
      });
      
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ FirebaseAuthService: Email di reset inviata a:', email);
    } catch (error: any) {
      console.error('❌ FirebaseAuthService: Errore nell\'invio email reset:', error.message);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // ===== STATO UTENTE =====

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // ===== LISTENER =====

  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Esegui immediatamente con lo stato corrente
    listener(this.currentUser);
    
    // Restituisci funzione per rimuovere il listener
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // ===== UTILITY =====

  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Utente non trovato. Verifica la tua email.';
      case 'auth/wrong-password':
        return 'Password non corretta. Riprova.';
      case 'auth/email-already-in-use':
        return 'Email già in uso. Prova con un\'altra email.';
      case 'auth/weak-password':
        return 'Password troppo debole. Usa almeno 6 caratteri.';
      case 'auth/invalid-email':
        return 'Email non valida. Verifica il formato.';
      case 'auth/too-many-requests':
        return 'Troppi tentativi. Riprova più tardi.';
      case 'auth/network-request-failed':
        return 'Errore di connessione. Verifica la tua connessione internet.';
      default:
        return 'Errore di autenticazione. Riprova.';
    }
  }
}

// Esporta un'istanza singleton
export const firebaseAuthService = new FirebaseAuthService(); 