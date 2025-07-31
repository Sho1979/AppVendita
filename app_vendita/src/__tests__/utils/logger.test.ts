import { logger } from '../../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should be enabled in development', () => {
      expect(logger).toBeDefined();
    });
  });

  describe('Log Levels', () => {
    it('should log init messages', () => {
      logger.init('Test init message');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log sync messages', () => {
      logger.sync('Test sync message');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log ui messages when debug level is enabled', () => {
      // Configura il logger per abilitare debug e ui
      logger.configure({ level: 'debug', categories: ['init', 'sync', 'ui', 'data', 'performance'] });
      logger.ui('Test ui message');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log data messages when debug level is enabled', () => {
      // Configura il logger per abilitare debug e data
      logger.configure({ level: 'debug', categories: ['init', 'sync', 'ui', 'data', 'performance'] });
      logger.data('Test data message');
      expect(console.log).toHaveBeenCalled();
    });

    it('should log performance messages when debug level is enabled', () => {
      // Configura il logger per abilitare debug e performance
      logger.configure({ level: 'debug', categories: ['init', 'sync', 'ui', 'data', 'performance'] });
      logger.performance('Test performance message');
      expect(console.log).toHaveBeenCalled();
    });
  });



  describe('Object Logging', () => {
    it('should log objects correctly', () => {
      const testObject = { name: 'test', value: 42 };
      logger.data('Test object', testObject);
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      logger.init('Message', 'arg1', 'arg2', { data: 'test' });
      expect(console.log).toHaveBeenCalled();
    });

    it('should log objects with debug level enabled', () => {
      logger.configure({ level: 'debug', categories: ['init', 'sync', 'ui', 'data', 'performance'] });
      const testObject = { name: 'test', value: 42 };
      logger.data('Test object', testObject);
      expect(console.log).toHaveBeenCalled();
    });
  });
}); 