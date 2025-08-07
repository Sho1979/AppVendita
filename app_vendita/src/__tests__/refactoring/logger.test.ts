/**
 * Test per il nuovo sistema di logging
 * 
 * Verifica che il refactoring del logger funzioni correttamente
 * e che non ci siano regressioni nelle funzionalità.
 */

import { logger, LogLevel, setupLogger } from '../../utils/logger';

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
  logger.clearLogs();
});

describe('Logger Refactoring', () => {
  describe('Development Mode', () => {
    beforeEach(() => {
      // Simula __DEV__ = true
      (global as any).__DEV__ = true;
    });

    it('dovrebbe loggare debug in sviluppo', () => {
      const devLogger = setupLogger.forDevelopment();
      
      devLogger.debug('TEST', 'Messaggio di debug', { data: 'test' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛 ['),
        { data: 'test' }
      );
    });

    it('dovrebbe loggare info in sviluppo', () => {
      const devLogger = setupLogger.forDevelopment();
      
      devLogger.info('TEST', 'Messaggio info', { userId: '123' });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ ['),
        { userId: '123' }
      );
    });

    it('dovrebbe sempre loggare warning e errori', () => {
      const devLogger = setupLogger.forDevelopment();
      
      devLogger.warn('TEST', 'Warning message');
      devLogger.error('TEST', 'Error message', new Error('Test error'));
      
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Production Mode', () => {
    beforeEach(() => {
      // Simula __DEV__ = false
      (global as any).__DEV__ = false;
    });

    it('NON dovrebbe loggare debug in produzione', () => {
      const prodLogger = setupLogger.forProduction();
      
      prodLogger.debug('TEST', 'Debug message');
      prodLogger.info('TEST', 'Info message');
      
      expect(console.log).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });

    it('dovrebbe loggare SOLO errori in produzione', () => {
      const prodLogger = setupLogger.forProduction();
      
      prodLogger.error('TEST', 'Production error', new Error('Critical'));
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[TEST] Production error'),
        new Error('Critical')
      );
    });

    it('NON dovrebbe loggare warning in produzione (comportamento corretto)', () => {
      const prodLogger = setupLogger.forProduction();
      
      prodLogger.warn('TEST', 'Warning in production');
      
      // In produzione il logger logga solo errori, non warning
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Metodi Specializzati', () => {
    it('dovrebbe avere metodi per categorie specifiche', () => {
      // Test che i metodi esistano e funzionino
      expect(() => {
        logger.ui('UI operation');
        logger.business('Business logic');
        logger.data('Data operation');
        logger.performance('Performance metric');
        logger.network('Network call');
      }).not.toThrow();
    });

    it('dovrebbe usare le categorie corrette', () => {
      const devLogger = setupLogger.forDevelopment();
      
      devLogger.ui('Test UI');
      devLogger.business('Test Business');
      devLogger.data('Test Data');
      
      const logs = devLogger.getLogs();
      
      expect(logs).toHaveLength(3);
      expect(logs[0].category).toBe('UI');
      expect(logs[1].category).toBe('BUSINESS');
      expect(logs[2].category).toBe('DATA');
    });
  });

  describe('Gestione Log Interni', () => {
    it('dovrebbe memorizzare i log', () => {
      logger.info('TEST', 'Test message');
      logger.error('TEST', 'Error message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Test message');
      expect(logs[1].message).toBe('Error message');
    });

    it('dovrebbe limitare i log memorizzati', () => {
      // Simula molti log
      for (let i = 0; i < 1200; i++) {
        logger.info('TEST', `Message ${i}`);
      }
      
      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('dovrebbe poter esportare i log', () => {
      logger.info('TEST', 'Export test');
      
      const exported = logger.exportLogs();
      expect(typeof exported).toBe('string');
      expect(JSON.parse(exported)).toHaveLength(1);
    });

    it('dovrebbe poter pulire i log', () => {
      logger.info('TEST', 'Test message');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('Configurazione Livelli', () => {
    it('dovrebbe rispettare i livelli di log', () => {
      logger.setLevel(LogLevel.WARN);
      
      logger.debug('TEST', 'Debug message');
      logger.info('TEST', 'Info message');
      logger.warn('TEST', 'Warning message');
      logger.error('TEST', 'Error message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(2); // Solo WARN e ERROR
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[1].level).toBe(LogLevel.ERROR);
    });
  });

  describe('Retrocompatibilità', () => {
    it('dovrebbe sostituire console.log senza breaking changes', () => {
      // Verifica che l'interfaccia sia semplice da usare
      expect(() => {
        logger.ui('Simple message');
        logger.business('Business operation', { data: 'test' });
        logger.error('ERROR', 'Error occurred', new Error('test'));
      }).not.toThrow();
    });
  });
});

describe('Performance Impact', () => {
  it('NON dovrebbe impattare le performance in produzione', () => {
    (global as any).__DEV__ = false;
    const prodLogger = setupLogger.forProduction();
    
    const start = performance.now();
    
    // Simula molte chiamate di log che non dovrebbero fare nulla
    for (let i = 0; i < 1000; i++) {
      prodLogger.debug('PERF', `Debug message ${i}`, { data: i });
      prodLogger.info('PERF', `Info message ${i}`, { data: i });
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // In produzione, il logging non dovrebbe richiedere più di 10ms per 1000 chiamate
    expect(duration).toBeLessThan(10);
  });
});
