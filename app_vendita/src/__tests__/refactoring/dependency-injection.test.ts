/**
 * Test per il sistema di Dependency Injection
 * 
 * Verifica che il DI Container funzioni correttamente
 * e sostituisca le istanze hardcoded senza regressioni.
 */

import { DIContainer, ServiceLifetime, SERVICE_TOKENS } from '../../infrastructure/container';
import { useRepository, useCalendarRepository } from '../../hooks/useRepository';
import { renderHook } from '@testing-library/react-native';

// Mock dei repository per testing
const mockFirebaseRepository = {
  getCalendarEntries: jest.fn(),
  getUsers: jest.fn(),
  getSalesPoints: jest.fn(),
  saveCalendarEntry: jest.fn(),
  updateCalendarEntry: jest.fn(),
  deleteCalendarEntry: jest.fn(),
};

const mockAsyncStorageRepository = {
  getEntries: jest.fn(),
  getUsers: jest.fn(),
  getSalesPoints: jest.fn(),
  addEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
};

// Mock dei moduli repository
jest.mock('../../data/repositories/firebaseCalendarRepositoryAdapter', () => ({
  FirebaseCalendarRepositoryAdapter: jest.fn(() => mockFirebaseRepository),
}));

jest.mock('../../data/repositories/CalendarRepository', () => ({
  AsyncStorageCalendarRepository: jest.fn(() => mockAsyncStorageRepository),
}));

describe('DI Container', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
    jest.clearAllMocks();
  });

  describe('Service Registration', () => {
    it('dovrebbe registrare servizi con factory function', () => {
      const mockService = { test: 'value' };
      container.register('TestService', () => mockService);
      
      expect(container.isRegistered('TestService')).toBe(true);
      expect(container.resolve('TestService')).toBe(mockService);
    });

    it('dovrebbe registrare servizi con constructor', () => {
      class TestService {
        name = 'test';
      }
      
      container.registerClass('TestService', TestService);
      
      const instance = container.resolve('TestService');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.name).toBe('test');
    });

    it('dovrebbe registrare istanze preesistenti', () => {
      const instance = { id: '123', name: 'test' };
      container.registerInstance('TestInstance', instance);
      
      expect(container.resolve('TestInstance')).toBe(instance);
    });
  });

  describe('Service Lifetimes', () => {
    it('SINGLETON: dovrebbe restituire sempre la stessa istanza', () => {
      let counter = 0;
      container.register('CounterService', () => ({ count: ++counter }), ServiceLifetime.SINGLETON);
      
      const instance1 = container.resolve('CounterService');
      const instance2 = container.resolve('CounterService');
      
      expect(instance1).toBe(instance2);
      expect(instance1.count).toBe(1);
    });

    it('TRANSIENT: dovrebbe creare una nuova istanza ogni volta', () => {
      let counter = 0;
      container.register('CounterService', () => ({ count: ++counter }), ServiceLifetime.TRANSIENT);
      
      const instance1 = container.resolve('CounterService');
      const instance2 = container.resolve('CounterService');
      
      expect(instance1).not.toBe(instance2);
      expect(instance1.count).toBe(1);
      expect(instance2.count).toBe(2);
    });

    it('SCOPED: dovrebbe riutilizzare istanze nello stesso scope', () => {
      let counter = 0;
      container.register('CounterService', () => ({ count: ++counter }), ServiceLifetime.SCOPED);
      
      const instance1 = container.resolve('CounterService');
      const instance2 = container.resolve('CounterService');
      
      expect(instance1).toBe(instance2);
      expect(instance1.count).toBe(1);
      
      // Nuovo scope
      container.clearScoped();
      const instance3 = container.resolve('CounterService');
      
      expect(instance3).not.toBe(instance1);
      expect(instance3.count).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('dovrebbe lanciare errore per servizi non registrati', () => {
      expect(() => {
        container.resolve('NonExistentService');
      }).toThrow("Service 'NonExistentService' not registered in DI container");
    });

    it('dovrebbe gestire errori nella factory', () => {
      container.register('FailingService', () => {
        throw new Error('Service creation failed');
      });
      
      expect(() => {
        container.resolve('FailingService');
      }).toThrow('Service creation failed');
    });
  });

  describe('Container Management', () => {
    it('dovrebbe permettere di rimuovere servizi', () => {
      container.register('TempService', () => ({}));
      
      expect(container.isRegistered('TempService')).toBe(true);
      
      container.unregister('TempService');
      
      expect(container.isRegistered('TempService')).toBe(false);
    });

    it('dovrebbe listare servizi registrati', () => {
      container.register('Service1', () => ({}));
      container.register('Service2', () => ({}));
      
      const services = container.getRegisteredServices();
      
      expect(services).toContain('Service1');
      expect(services).toContain('Service2');
    });

    it('dovrebbe creare scope separati', () => {
      container.register('SharedService', () => ({ id: 'original' }));
      
      const scope = container.createScope();
      
      expect(scope.isRegistered('SharedService')).toBe(true);
      expect(scope.resolve('SharedService')).toEqual({ id: 'original' });
    });
  });
});

describe('Repository Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useRepository Hook', () => {
    it('dovrebbe restituire un repository funzionante', () => {
      const { result } = renderHook(() => useRepository());
      
      expect(result.current).toBeDefined();
      expect(typeof result.current.getUsers).toBe('function');
    });

    it('dovrebbe usare Firebase come default', () => {
      const { result } = renderHook(() => useRepository());
      
      // Verifica che sia stata istanziata la classe Firebase
      expect(result.current).toBe(mockFirebaseRepository);
    });

    it('dovrebbe fallback ad AsyncStorage se Firebase fallisce', () => {
      // Mock Firebase per fallire
      const FirebaseAdapter = require('../../data/repositories/firebaseCalendarRepositoryAdapter')
        .FirebaseCalendarRepositoryAdapter;
      
      FirebaseAdapter.mockImplementationOnce(() => {
        throw new Error('Firebase not available');
      });
      
      const { result } = renderHook(() => 
        useCalendarRepository({ type: 'auto', enableFallback: true })
      );
      
      expect(result.current).toBe(mockAsyncStorageRepository);
    });
  });

  describe('Configurazione Repository', () => {
    it('dovrebbe permettere di forzare Firebase', () => {
      const { result } = renderHook(() => 
        useCalendarRepository({ type: 'firebase', enableFallback: false })
      );
      
      expect(result.current).toBe(mockFirebaseRepository);
    });

    it('dovrebbe permettere di forzare AsyncStorage', () => {
      const { result } = renderHook(() => 
        useCalendarRepository({ type: 'localStorage', enableFallback: false })
      );
      
      expect(result.current).toBe(mockAsyncStorageRepository);
    });
  });
});

describe('Service Tokens', () => {
  it('dovrebbe avere tutti i token necessari definiti', () => {
    expect(SERVICE_TOKENS.CALENDAR_REPOSITORY).toBeDefined();
    expect(SERVICE_TOKENS.FIREBASE_REPOSITORY_ADAPTER).toBeDefined();
    expect(SERVICE_TOKENS.ASYNC_STORAGE_REPOSITORY).toBeDefined();
    expect(SERVICE_TOKENS.FIREBASE_AUTH_SERVICE).toBeDefined();
    expect(SERVICE_TOKENS.PROGRESSIVE_CALCULATION_SERVICE).toBeDefined();
  });

  it('dovrebbe prevenire magic strings', () => {
    // Verifica che i token siano stringhe non vuote
    Object.values(SERVICE_TOKENS).forEach(token => {
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });
});

describe('Eliminazione Istanze Hardcoded', () => {
  it('dovrebbe sostituire new Repository() con hook', () => {
    // Test di integrazione: verifica che l'hook sostituisca correttamente
    // le istanze hardcoded nel codice
    
    const { result: repo1 } = renderHook(() => useRepository());
    const { result: repo2 } = renderHook(() => useRepository());
    
    // Con il pattern singleton, dovrebbero essere la stessa istanza
    expect(repo1.current).toBe(repo2.current);
  });

  it('dovrebbe mantenere la stessa interfaccia', () => {
    const { result } = renderHook(() => useRepository());
    
    // Verifica che tutti i metodi richiesti esistano
    const expectedMethods = [
      'getUsers',
      'getSalesPoints',
      'getCalendarEntries',
      'saveCalendarEntry',
      'updateCalendarEntry', 
      'deleteCalendarEntry'
    ];

    expectedMethods.forEach(method => {
      expect(typeof result.current[method]).toBe('function');
    });
  });
});

describe('Performance del DI', () => {
  it('dovrebbe risolvere servizi rapidamente', () => {
    const container = new DIContainer();
    container.register('FastService', () => ({ data: 'test' }));
    
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      container.resolve('FastService');
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // Il DI non dovrebbe aggiungere overhead significativo
    expect(duration).toBeLessThan(50); // Meno di 50ms per 1000 risoluzioni
  });
});
