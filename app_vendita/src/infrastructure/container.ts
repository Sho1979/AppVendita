/**
 * Dependency Injection Container per AppVendita
 * 
 * Gestisce l'iniezione delle dipendenze e il ciclo di vita dei servizi.
 * Elimina le istanze hardcoded e viola la Dependency Inversion.
 */

type ServiceFactory<T = any> = () => T;
type ServiceConstructor<T = any> = new (...args: any[]) => T;

export enum ServiceLifetime {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  SCOPED = 'scoped'
}

interface ServiceRegistration<T = any> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

export class DIContainer {
  private services = new Map<string, ServiceRegistration>();
  private scopedInstances = new Map<string, any>();

  /**
   * Registra un servizio con factory function
   */
  register<T>(
    token: string, 
    factory: ServiceFactory<T>, 
    lifetime: ServiceLifetime = ServiceLifetime.SINGLETON
  ): void {
    this.services.set(token, {
      factory,
      lifetime,
      instance: undefined
    });
  }

  /**
   * Registra un servizio con constructor
   */
  registerClass<T>(
    token: string,
    constructor: ServiceConstructor<T>,
    lifetime: ServiceLifetime = ServiceLifetime.SINGLETON,
    ...args: any[]
  ): void {
    this.register(token, () => new constructor(...args), lifetime);
  }

  /**
   * Registra un'istanza già creata
   */
  registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, {
      factory: () => instance,
      lifetime: ServiceLifetime.SINGLETON,
      instance
    });
  }

  /**
   * Risolve un servizio
   */
  resolve<T>(token: string): T {
    const registration = this.services.get(token);
    if (!registration) {
      throw new Error(`Service '${token}' not registered in DI container`);
    }

    switch (registration.lifetime) {
      case ServiceLifetime.SINGLETON:
        if (!registration.instance) {
          registration.instance = registration.factory();
        }
        return registration.instance as T;

      case ServiceLifetime.SCOPED:
        if (!this.scopedInstances.has(token)) {
          this.scopedInstances.set(token, registration.factory());
        }
        return this.scopedInstances.get(token) as T;

      case ServiceLifetime.TRANSIENT:
        return registration.factory() as T;

      default:
        throw new Error(`Unknown service lifetime: ${registration.lifetime}`);
    }
  }

  /**
   * Verifica se un servizio è registrato
   */
  isRegistered(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Rimuove un servizio dal container
   */
  unregister(token: string): void {
    this.services.delete(token);
    this.scopedInstances.delete(token);
  }

  /**
   * Pulisce tutte le istanze scoped (utile per reset)
   */
  clearScoped(): void {
    this.scopedInstances.clear();
  }

  /**
   * Ottieni tutti i servizi registrati (per debugging)
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Crea un nuovo scope (utile per testing)
   */
  createScope(): DIContainer {
    const scope = new DIContainer();
    
    // Copia tutte le registrazioni
    for (const [token, registration] of this.services.entries()) {
      scope.services.set(token, {
        factory: registration.factory,
        lifetime: registration.lifetime,
        instance: registration.lifetime === ServiceLifetime.SINGLETON 
          ? registration.instance 
          : undefined
      });
    }
    
    return scope;
  }
}

// Istanza globale del container
export const container = new DIContainer();

// ===== SERVICE TOKENS =====
// Definizioni centralizzate per evitare magic strings

export const SERVICE_TOKENS = {
  // Repositories
  CALENDAR_REPOSITORY: 'CalendarRepository',
  FIREBASE_CALENDAR_REPOSITORY: 'FirebaseCalendarRepository',
  ASYNC_STORAGE_REPOSITORY: 'AsyncStorageRepository',
  
  // Services
  FIREBASE_AUTH_SERVICE: 'FirebaseAuthService',
  FIREBASE_CALENDAR_SERVICE: 'FirebaseCalendarService',
  PHOTO_SERVICE: 'PhotoService',
  PROGRESSIVE_CALCULATION_SERVICE: 'ProgressiveCalculationService',
  IMAGE_COMPRESSION_SERVICE: 'ImageCompressionService',
  
  // Adapters
  REPOSITORY_ADAPTER: 'RepositoryAdapter',
  FIREBASE_REPOSITORY_ADAPTER: 'FirebaseRepositoryAdapter',
  
  // Stores (se necessario)
  FILTERS_STORE: 'FiltersStore',
  MASTER_DATA_STORE: 'MasterDataStore',
  CALENDAR_STORE: 'CalendarStore',
} as const;

// Helper type per type safety
export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];

// ===== SETUP FUNCTION =====

/**
 * Configura i servizi di base dell'applicazione
 */
export const setupDIContainer = (): void => {
  // Qui registreremo tutti i servizi quando faremo il setup completo
  // Per ora, setup di base per il logger
  
  // Logger già configurato come singleton nel suo modulo
  // Altri servizi verranno aggiunti gradualmente nella prossima fase
};

// ===== HOOKS PER REACT =====

/**
 * Hook per utilizzare il DI container nei componenti React
 */
export const useService = <T>(token: string): T => {
  return container.resolve<T>(token);
};

/**
 * Hook per servizi opzionali
 */
export const useOptionalService = <T>(token: string): T | null => {
  try {
    return container.resolve<T>(token);
  } catch {
    return null;
  }
};

export default container;
