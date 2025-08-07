import { firebaseAuthService } from '../core/services/firebaseAuth';

/**
 * Script per creare utenti di test per TestSprite
 * Eseguire questo script una volta per configurare gli utenti di test
 */

export const TEST_USERS = [
  {
    email: 'demo@testsprite.com',
    password: 'TestSprite123!',
    displayName: 'Demo TestSprite User'
  },
  {
    email: 'userA@example.com', 
    password: 'UserAPassword123',
    displayName: 'Test User A'
  },
  {
    email: 'userB@example.com',
    password: 'UserBPassword123', 
    displayName: 'Test User B'
  },
  {
    email: 'agent@testsprite.com',
    password: 'AgentTest123!',
    displayName: 'Test Agent User'
  }
];

export async function createTestUsers(): Promise<void> {
  console.log('🚀 Creazione utenti di test per TestSprite...');
  
  for (const testUser of TEST_USERS) {
    try {
      await firebaseAuthService.signUp(
        testUser.email, 
        testUser.password, 
        testUser.displayName
      );
      console.log(`✅ Utente creato: ${testUser.email}`);
    } catch (error: any) {
      if (error.message.includes('Email già in uso')) {
        console.log(`⚠️ Utente già esistente: ${testUser.email}`);
      } else {
        console.error(`❌ Errore creazione ${testUser.email}:`, error.message);
      }
    }
  }
  
  console.log('✅ Setup utenti di test completato!');
}

// Per eseguire il setup manualmente
if (typeof window !== 'undefined') {
  (window as any).createTestUsers = createTestUsers;
  console.log('💡 Per creare utenti di test, esegui: createTestUsers()');
}