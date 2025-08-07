/**
 * Setup iniziale dei servizi per l'applicazione AppVendita
 * 
 * Configura il DI Container con tutti i servizi necessari.
 * Questa configurazione elimina le istanze hardcoded sparse nel codebase.
 */

import { container, SERVICE_TOKENS, ServiceLifetime } from './container';

// Import lazy per evitare circular dependencies
const getFirebaseCalendarRepositoryAdapter = () => 
  import('../data/repositories/firebaseCalendarRepositoryAdapter').then(
    module => module.FirebaseCalendarRepositoryAdapter
  );

const getAsyncStorageCalendarRepository = () =>
  import('../data/repositories/CalendarRepository').then(
    module => module.AsyncStorageCalendarRepository
  );

const getRepositoryAdapter = () =>
  import('../data/repositories/repositoryAdapter').then(
    module => module.RepositoryAdapter
  );

const getFirebaseAuthService = () =>
  import('../core/services/firebaseAuth').then(
    module => module.firebaseAuthService
  );

const getProgressiveCalculationService = () =>
  import('../services/ProgressiveCalculationService').then(
    module => module.ProgressiveCalculationService
  );

/**
 * Configura tutti i servizi di base dell'applicazione
 */
export const setupServices = async (): Promise<void> => {
  try {
    // ===== REPOSITORIES =====
    
    // Firebase Calendar Repository Adapter (main)
    container.registerClass(
      SERVICE_TOKENS.FIREBASE_REPOSITORY_ADAPTER,
      await getFirebaseCalendarRepositoryAdapter(),
      ServiceLifetime.SINGLETON
    );

    // AsyncStorage Repository (fallback)
    container.registerClass(
      SERVICE_TOKENS.ASYNC_STORAGE_REPOSITORY,
      await getAsyncStorageCalendarRepository(),
      ServiceLifetime.SINGLETON
    );

    // Repository Adapter (legacy compatibility)
    container.register(
      SERVICE_TOKENS.REPOSITORY_ADAPTER,
      async () => {
        const RepositoryAdapter = await getRepositoryAdapter();
        return new RepositoryAdapter(true); // Use Firebase by default
      },
      ServiceLifetime.SINGLETON
    );

    // Main Calendar Repository (defaulta a Firebase)
    container.register(
      SERVICE_TOKENS.CALENDAR_REPOSITORY,
      () => container.resolve(SERVICE_TOKENS.FIREBASE_REPOSITORY_ADAPTER),
      ServiceLifetime.SINGLETON
    );

    // ===== SERVICES =====
    
    // Firebase Auth Service
    container.register(
      SERVICE_TOKENS.FIREBASE_AUTH_SERVICE,
      async () => await getFirebaseAuthService(),
      ServiceLifetime.SINGLETON
    );

    // Progressive Calculation Service
    container.registerClass(
      SERVICE_TOKENS.PROGRESSIVE_CALCULATION_SERVICE,
      await getProgressiveCalculationService(),
      ServiceLifetime.SINGLETON
    );

    console.log('✅ DI Container: Servizi configurati correttamente');
    
  } catch (error) {
    console.error('❌ DI Container: Errore nella configurazione servizi:', error);
    throw error;
  }
};

/**
 * Setup rapido per testing (con mock)
 */
export const setupTestServices = (): void => {
  // Mock repositories per testing
  container.registerInstance(SERVICE_TOKENS.CALENDAR_REPOSITORY, {
    getCalendarEntries: jest.fn(),
    getUsers: jest.fn(),
    getSalesPoints: jest.fn(),
    // ... altri metodi mock
  });

  console.log('✅ DI Container: Servizi di test configurati');
};

/**
 * Reset del container (utile per testing)
 */
export const resetServices = (): void => {
  const tokens = Object.values(SERVICE_TOKENS);
  tokens.forEach(token => {
    if (container.isRegistered(token)) {
      container.unregister(token);
    }
  });
  
  container.clearScoped();
  console.log('🔄 DI Container: Reset completato');
};

/**
 * Verifica che tutti i servizi essenziali siano registrati
 */
export const validateServiceSetup = (): boolean => {
  const essentialServices = [
    SERVICE_TOKENS.CALENDAR_REPOSITORY,
    SERVICE_TOKENS.FIREBASE_AUTH_SERVICE,
  ];

  const missingServices = essentialServices.filter(
    service => !container.isRegistered(service)
  );

  if (missingServices.length > 0) {
    console.error('❌ DI Container: Servizi mancanti:', missingServices);
    return false;
  }

  console.log('✅ DI Container: Tutti i servizi essenziali sono registrati');
  return true;
};

// Export default per facilità d'uso
export default {
  setup: setupServices,
  setupTest: setupTestServices,
  reset: resetServices,
  validate: validateServiceSetup,
};
