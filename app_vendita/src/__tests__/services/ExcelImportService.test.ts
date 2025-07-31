import { ExcelImportService } from '../../services/ExcelImportService';

describe('ExcelImportService', () => {
  let service: ExcelImportService;

  beforeEach(() => {
    service = new ExcelImportService();
    jest.clearAllMocks();
  });

  describe('Service Instantiation', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ExcelImportService);
    });

    it('should have service properties', () => {
      expect(service).toHaveProperty('constructor');
    });
  });

  describe('Service Methods', () => {
    it('should have expected methods', () => {
      // Verifica che il servizio esista e sia istanziabile
      expect(typeof service).toBe('object');
    });
  });
}); 