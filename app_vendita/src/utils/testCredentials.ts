/**
 * Credenziali di test per TestSprite e testing manuale
 * IMPORTANTE: Usare solo in ambiente di sviluppo/test
 */

export const TEST_CREDENTIALS = {
  // Utente principale per TestSprite
  DEMO_USER: {
    email: 'demo@testsprite.com',
    password: 'TestSprite123!',
    role: 'admin'
  },
  
  // Utenti per test multi-user
  USER_A: {
    email: 'userA@example.com',
    password: 'UserAPassword123',
    role: 'agent'
  },
  
  USER_B: {
    email: 'userB@example.com', 
    password: 'UserBPassword123',
    role: 'agent'
  },
  
  // Agente di test
  AGENT_USER: {
    email: 'agent@testsprite.com',
    password: 'AgentTest123!',
    role: 'agent'
  }
} as const;

// Funzione helper per ottenere credenziali di test
export function getTestCredentials(userType: keyof typeof TEST_CREDENTIALS) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test credentials should not be used in production!');
  }
  
  return TEST_CREDENTIALS[userType];
}

// Funzione per abilitare auto-login di test (solo in sviluppo)
export function enableTestAutoLogin(): boolean {
  return __DEV__ && process.env.NODE_ENV !== 'production';
}

// Credenziali sicure per auto-login TestSprite
export function getSecureTestCredentials() {
  if (!enableTestAutoLogin()) {
    throw new Error('Test auto-login non disponibile in produzione');
  }
  return TEST_CREDENTIALS.DEMO_USER;
}

// Credenziale di default per fallback
export const DEFAULT_TEST_CREDENTIAL = TEST_CREDENTIALS.DEMO_USER;

// Funzione per validare e normalizzare email per Firebase
export function validateEmailForFirebase(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email non valida');
  }
  
  // Normalizza l'email: trim e lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  // Regex base per validazione email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Formato email non valido');
  }
  
  return normalizedEmail;
}

// Esporta per uso nei test
export const { DEMO_USER, USER_A, USER_B, AGENT_USER } = TEST_CREDENTIALS;