/**
 * Gestore avanzato per errori di rete e Firebase
 * Categorizza gli errori e fornisce strategie di retry appropriate
 */

export interface NetworkError {
  code: string;
  message: string;
  isRetryable: boolean;
  retryAfter?: number; // ms
  category: 'network' | 'auth' | 'permission' | 'quota' | 'server' | 'client';
}

export class NetworkErrorHandler {
  
  /**
   * Analizza un errore e determina la strategia appropriata
   */
  static analyzeError(error: any): NetworkError {
    // Errori Firebase Auth
    if (error?.code?.startsWith('auth/')) {
      return this.handleAuthError(error);
    }
    
    // Errori Firebase Firestore
    if (error?.code?.startsWith('firestore/')) {
      return this.handleFirestoreError(error);
    }
    
    // Errori di rete generici
    if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
      return {
        code: 'network/connection-failed',
        message: 'Connessione di rete non disponibile',
        isRetryable: true,
        retryAfter: 2000,
        category: 'network'
      };
    }
    
    // Timeout
    if (error?.message?.includes('timeout')) {
      return {
        code: 'network/timeout',
        message: 'Timeout della richiesta',
        isRetryable: true,
        retryAfter: 1000,
        category: 'network'
      };
    }
    
    // Errore generico
    return {
      code: 'unknown/error',
      message: error?.message || 'Errore sconosciuto',
      isRetryable: false,
      category: 'client'
    };
  }

  private static handleAuthError(error: any): NetworkError {
    const code = error.code;
    
    switch (code) {
      case 'auth/network-request-failed':
        return {
          code,
          message: 'Connessione di rete non disponibile per autenticazione',
          isRetryable: true,
          retryAfter: 3000,
          category: 'network'
        };
        
      case 'auth/too-many-requests':
        return {
          code,
          message: 'Troppe richieste. Riprova tra qualche minuto',
          isRetryable: true,
          retryAfter: 60000, // 1 minuto
          category: 'quota'
        };
        
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return {
          code,
          message: 'Credenziali non valide',
          isRetryable: false,
          category: 'auth'
        };
        
      default:
        return {
          code,
          message: error.message || 'Errore di autenticazione',
          isRetryable: false,
          category: 'auth'
        };
    }
  }

  private static handleFirestoreError(error: any): NetworkError {
    const code = error.code;
    
    switch (code) {
      case 'firestore/unavailable':
        return {
          code,
          message: 'Servizio database temporaneamente non disponibile',
          isRetryable: true,
          retryAfter: 5000,
          category: 'server'
        };
        
      case 'firestore/deadline-exceeded':
        return {
          code,
          message: 'Timeout del database',
          isRetryable: true,
          retryAfter: 2000,
          category: 'network'
        };
        
      case 'firestore/permission-denied':
        return {
          code,
          message: 'Permessi insufficienti',
          isRetryable: false,
          category: 'permission'
        };
        
      case 'firestore/quota-exceeded':
        return {
          code,
          message: 'Quota database superata',
          isRetryable: true,
          retryAfter: 30000,
          category: 'quota'
        };
        
      default:
        return {
          code,
          message: error.message || 'Errore del database',
          isRetryable: true,
          retryAfter: 1000,
          category: 'server'
        };
    }
  }

  /**
   * Esegue un'operazione con retry automatico
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const networkError = this.analyzeError(error);
        
        // Se non è retryable o è l'ultimo tentativo, fallisce
        if (!networkError.isRetryable || attempt === maxRetries) {
          throw error;
        }
        
        // Calcola delay progressivo
        const delay = networkError.retryAfter || (initialDelay * Math.pow(2, attempt));
        console.warn(`⚠️ NetworkErrorHandler: Tentativo ${attempt + 1}/${maxRetries + 1} fallito. Retry in ${delay}ms`, {
          error: networkError.message,
          code: networkError.code
        });
        
        // Aspetta prima del retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Formatta un messaggio user-friendly per l'errore
   */
  static getUserFriendlyMessage(error: any): string {
    const networkError = this.analyzeError(error);
    
    switch (networkError.category) {
      case 'network':
        return 'Problema di connessione. Verifica la tua connessione internet e riprova.';
        
      case 'auth':
        return 'Problema di autenticazione. Verifica le tue credenziali.';
        
      case 'permission':
        return 'Non hai i permessi necessari per questa operazione.';
        
      case 'quota':
        return 'Limite di utilizzo raggiunto. Riprova tra qualche minuto.';
        
      case 'server':
        return 'Problema temporaneo del server. Riprova tra qualche momento.';
        
      default:
        return networkError.message || 'Si è verificato un errore. Riprova.';
    }
  }
}
