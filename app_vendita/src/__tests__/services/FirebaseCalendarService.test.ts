import { FirebaseCalendarService } from '../../services/FirebaseCalendarService';
import { CalendarEntry } from '../../data/models/CalendarEntry';

// Mock del repository Firebase
jest.mock('../../data/repositories/firebaseCalendarRepository', () => ({
  FirebaseCalendarRepository: jest.fn().mockImplementation(() => ({
    getEntries: jest.fn(),
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    subscribeToEntries: jest.fn(),
    batchUpdateEntries: jest.fn(),
    getUsers: jest.fn(),
    getSalesPoints: jest.fn(),
  })),
}));

// Mock dello store
jest.mock('../../stores/calendarStore', () => ({
  useCalendarStore: {
    getState: jest.fn(() => ({
      setEntries: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
      setUsers: jest.fn(),
      setSalesPoints: jest.fn(),
      setLastSyncTimestamp: jest.fn(),
      setError: jest.fn(),
    })),
  },
}));

describe('FirebaseCalendarService', () => {
  let service: FirebaseCalendarService;
  let mockRepository: any;
  let mockStore: any;

  beforeEach(() => {
    service = new FirebaseCalendarService();
    mockRepository = (service as any).repository;
    mockStore = require('../../stores/calendarStore').useCalendarStore.getState();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncCalendarData', () => {
    it('should sync calendar data successfully', async () => {
      const mockEntries = [
        {
          id: '1',
          date: new Date(),
          userId: 'user1',
          notes: 'Test entry',
        } as CalendarEntry,
      ];
      const mockUsers = [{ id: 'user1', name: 'Test User' }];
      const mockSalesPoints = [{ id: 'sp1', name: 'Test Store' }];

      mockRepository.getEntries.mockResolvedValue(mockEntries);
      mockRepository.getUsers.mockResolvedValue(mockUsers);
      mockRepository.getSalesPoints.mockResolvedValue(mockSalesPoints);

      await service.syncCalendarData('user1');

      expect(mockRepository.getEntries).toHaveBeenCalledWith({ userId: 'user1' });
      expect(mockRepository.getUsers).toHaveBeenCalled();
      expect(mockRepository.getSalesPoints).toHaveBeenCalled();
      expect(mockStore.setEntries).toHaveBeenCalledWith(mockEntries);
      expect(mockStore.setUsers).toHaveBeenCalledWith(mockUsers);
      expect(mockStore.setSalesPoints).toHaveBeenCalledWith(mockSalesPoints);
      expect(mockStore.setLastSyncTimestamp).toHaveBeenCalled();
      expect(mockStore.setError).toHaveBeenCalledWith(null);
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      mockRepository.getEntries.mockRejectedValue(error);

      await expect(service.syncCalendarData('user1')).rejects.toThrow('Sync failed');
      expect(mockStore.setError).toHaveBeenCalledWith('Errore di sincronizzazione con Firebase');
    });
  });

  describe('addEntry', () => {
    it('should add entry successfully', async () => {
      const entry = {
        date: new Date(),
        userId: 'user1',
        notes: 'Test entry',
      } as Omit<CalendarEntry, 'id'>;

      const mockEntryId = 'new-entry-id';
      mockRepository.addEntry.mockResolvedValue(mockEntryId);

      const result = await service.addEntry(entry);

      expect(mockRepository.addEntry).toHaveBeenCalledWith(entry);
      expect(mockStore.addEntry).toHaveBeenCalledWith({
        ...entry,
        id: mockEntryId,
      });
      expect(result).toBe(mockEntryId);
    });

    it('should handle add entry errors', async () => {
      const entry = {
        date: new Date(),
        userId: 'user1',
        notes: 'Test entry',
      } as Omit<CalendarEntry, 'id'>;

      const error = new Error('Add failed');
      mockRepository.addEntry.mockRejectedValue(error);

      await expect(service.addEntry(entry)).rejects.toThrow('Add failed');
      expect(mockStore.setError).toHaveBeenCalledWith('Errore nell\'aggiunta dell\'entry');
    });
  });

  describe('updateEntry', () => {
    it('should update entry successfully', async () => {
      const entry = {
        id: 'entry1',
        date: new Date(),
        userId: 'user1',
        notes: 'Updated entry',
      } as CalendarEntry;

      mockRepository.updateEntry.mockResolvedValue(undefined);

      await service.updateEntry(entry);

      expect(mockRepository.updateEntry).toHaveBeenCalledWith(entry);
      expect(mockStore.updateEntry).toHaveBeenCalledWith(entry);
    });

    it('should handle update entry errors', async () => {
      const entry = {
        id: 'entry1',
        date: new Date(),
        userId: 'user1',
        notes: 'Updated entry',
      } as CalendarEntry;

      const error = new Error('Update failed');
      mockRepository.updateEntry.mockRejectedValue(error);

      await expect(service.updateEntry(entry)).rejects.toThrow('Update failed');
      expect(mockStore.setError).toHaveBeenCalledWith('Errore nell\'aggiornamento dell\'entry');
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry successfully', async () => {
      const entryId = 'entry1';
      mockRepository.deleteEntry.mockResolvedValue(undefined);

      await service.deleteEntry(entryId);

      expect(mockRepository.deleteEntry).toHaveBeenCalledWith(entryId);
      expect(mockStore.deleteEntry).toHaveBeenCalledWith(entryId);
    });

    it('should handle delete entry errors', async () => {
      const entryId = 'entry1';
      const error = new Error('Delete failed');
      mockRepository.deleteEntry.mockRejectedValue(error);

      await expect(service.deleteEntry(entryId)).rejects.toThrow('Delete failed');
      expect(mockStore.setError).toHaveBeenCalledWith('Errore nell\'eliminazione dell\'entry');
    });
  });

  describe('subscribeToEntries', () => {
    it('should subscribe to entries successfully', () => {
      const userId = 'user1';
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockRepository.subscribeToEntries.mockReturnValue(mockUnsubscribe);

      service.subscribeToEntries(userId);

      expect(mockRepository.subscribeToEntries).toHaveBeenCalledWith(
        expect.any(Function),
        { userId }
      );
    });

    it('should handle subscription errors', () => {
      const userId = 'user1';
      const error = new Error('Subscription failed');
      mockRepository.subscribeToEntries.mockImplementation(() => {
        throw error;
      });

      service.subscribeToEntries(userId);

      expect(mockStore.setError).toHaveBeenCalledWith(
        'Errore nell\'attivazione del listener real-time'
      );
    });
  });

  describe('unsubscribeFromEntries', () => {
    it('should unsubscribe successfully', () => {
      const mockUnsubscribe = jest.fn();
      (service as any).unsubscribe = mockUnsubscribe;

      service.unsubscribeFromEntries();

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect((service as any).unsubscribe).toBeNull();
    });

    it('should handle when no subscription exists', () => {
      (service as any).unsubscribe = null;

      expect(() => service.unsubscribeFromEntries()).not.toThrow();
    });
  });

  describe('batchUpdateEntries', () => {
    it('should update multiple entries successfully', async () => {
      const entries = [
        { id: '1', notes: 'Updated 1' } as CalendarEntry,
        { id: '2', notes: 'Updated 2' } as CalendarEntry,
      ];

      mockRepository.batchUpdateEntries.mockResolvedValue(undefined);

      await service.batchUpdateEntries(entries);

      expect(mockRepository.batchUpdateEntries).toHaveBeenCalledWith(entries);
      expect(mockStore.updateEntry).toHaveBeenCalledTimes(2);
    });

    it('should handle batch update errors', async () => {
      const entries = [
        { id: '1', notes: 'Updated 1' } as CalendarEntry,
      ];

      const error = new Error('Batch update failed');
      mockRepository.batchUpdateEntries.mockRejectedValue(error);

      await expect(service.batchUpdateEntries(entries)).rejects.toThrow('Batch update failed');
      expect(mockStore.setError).toHaveBeenCalledWith('Errore nell\'aggiornamento batch');
    });
  });

  describe('checkConnection', () => {
    it('should return true when connection is successful', async () => {
      mockRepository.getEntries.mockResolvedValue([]);

      const result = await service.checkConnection();

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockRepository.getEntries.mockRejectedValue(new Error('Connection failed'));

      const result = await service.checkConnection();

      expect(result).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should unsubscribe from entries', () => {
      const mockUnsubscribe = jest.fn();
      (service as any).unsubscribe = mockUnsubscribe;

      service.dispose();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
}); 