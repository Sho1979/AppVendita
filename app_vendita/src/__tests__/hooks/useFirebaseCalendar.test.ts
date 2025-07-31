import { renderHook, act } from '@testing-library/react-native';
import { useFirebaseCalendar } from '../../hooks/useFirebaseCalendar';

// Mock del servizio Firebase
jest.mock('../../services/FirebaseCalendarService', () => ({
  firebaseCalendarService: {
    syncCalendarData: jest.fn(),
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    subscribeToEntries: jest.fn(),
    unsubscribeFromEntries: jest.fn(),
    checkConnection: jest.fn(),
  },
}));

// Mock dello store
jest.mock('../../stores/calendarStore', () => ({
  useCalendarStore: jest.fn(() => ({
    subscribe: jest.fn(() => jest.fn()),
    setError: jest.fn(),
  })),
}));

describe('useFirebaseCalendar', () => {
  let mockService: any;
  let mockStore: any;

  beforeEach(() => {
    mockService = require('../../services/FirebaseCalendarService').firebaseCalendarService;
    mockStore = require('../../stores/calendarStore').useCalendarStore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      mockService.checkConnection.mockResolvedValue(true);

      const { result } = renderHook(() => useFirebaseCalendar());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isConnected).toBe(false); // Initially false until checkConnection resolves
    });

    it('should check connection on mount', () => {
      mockService.checkConnection.mockResolvedValue(true);

      renderHook(() => useFirebaseCalendar());

      expect(mockService.checkConnection).toHaveBeenCalled();
    });
  });

  describe('checkConnection', () => {
    it('should return true when connection is successful', async () => {
      mockService.checkConnection.mockResolvedValue(true);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        const connected = await result.current.checkConnection();
        expect(connected).toBe(true);
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockService.checkConnection.mockResolvedValue(false);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        const connected = await result.current.checkConnection();
        expect(connected).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockService.checkConnection.mockRejectedValue(error);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        const connected = await result.current.checkConnection();
        expect(connected).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('syncData', () => {
    it('should sync data successfully', async () => {
      mockService.syncCalendarData.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await result.current.syncData('user1');
      });

      expect(mockService.syncCalendarData).toHaveBeenCalledWith('user1');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      mockService.syncCalendarData.mockRejectedValue(error);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await result.current.syncData('user1');
      });

      expect(result.current.error).toBe('Errore di sincronizzazione');
      expect(result.current.isLoading).toBe(false);
    });

    it('should not sync without userId', async () => {
      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await result.current.syncData('');
      });

      expect(result.current.error).toBe('ID utente richiesto per la sincronizzazione');
      expect(mockService.syncCalendarData).not.toHaveBeenCalled();
    });
  });

  describe('addEntry', () => {
    it('should add entry successfully', async () => {
      const entry = {
        date: new Date(),
        userId: 'user1',
        notes: 'Test entry',
      };

      const mockEntryId = 'new-entry-id';
      mockService.addEntry.mockResolvedValue(mockEntryId);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        const entryId = await result.current.addEntry(entry);
        expect(entryId).toBe(mockEntryId);
      });

      expect(mockService.addEntry).toHaveBeenCalledWith(entry);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle add entry errors', async () => {
      const entry = {
        date: new Date(),
        userId: 'user1',
        notes: 'Test entry',
      };

      const error = new Error('Add failed');
      mockService.addEntry.mockRejectedValue(error);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await expect(result.current.addEntry(entry)).rejects.toThrow('Add failed');
      });

      expect(result.current.error).toBe('Errore nell\'aggiunta dell\'entry');
      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when not connected', async () => {
      const entry = {
        date: new Date(),
        userId: 'user1',
        notes: 'Test entry',
      };

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await expect(result.current.addEntry(entry)).rejects.toThrow('Nessuna connessione con Firebase');
      });

      expect(mockService.addEntry).not.toHaveBeenCalled();
    });
  });

  describe('updateEntry', () => {
    it('should update entry successfully', async () => {
      const entry = {
        id: 'entry1',
        date: new Date(),
        userId: 'user1',
        notes: 'Updated entry',
      };

      mockService.updateEntry.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await result.current.updateEntry(entry);
      });

      expect(mockService.updateEntry).toHaveBeenCalledWith(entry);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle update entry errors', async () => {
      const entry = {
        id: 'entry1',
        date: new Date(),
        userId: 'user1',
        notes: 'Updated entry',
      };

      const error = new Error('Update failed');
      mockService.updateEntry.mockRejectedValue(error);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await expect(result.current.updateEntry(entry)).rejects.toThrow('Update failed');
      });

      expect(result.current.error).toBe('Errore nell\'aggiornamento dell\'entry');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry successfully', async () => {
      const entryId = 'entry1';
      mockService.deleteEntry.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await result.current.deleteEntry(entryId);
      });

      expect(mockService.deleteEntry).toHaveBeenCalledWith(entryId);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle delete entry errors', async () => {
      const entryId = 'entry1';
      const error = new Error('Delete failed');
      mockService.deleteEntry.mockRejectedValue(error);

      const { result } = renderHook(() => useFirebaseCalendar());

      await act(async () => {
        await expect(result.current.deleteEntry(entryId)).rejects.toThrow('Delete failed');
      });

      expect(result.current.error).toBe('Errore nell\'eliminazione dell\'entry');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('real-time sync', () => {
    it('should start real-time sync successfully', () => {
      const { result } = renderHook(() => useFirebaseCalendar());

      act(() => {
        result.current.startRealTimeSync('user1');
      });

      expect(mockService.subscribeToEntries).toHaveBeenCalledWith('user1');
    });

    it('should handle real-time sync errors', () => {
      const error = new Error('Subscription failed');
      mockService.subscribeToEntries.mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useFirebaseCalendar());

      act(() => {
        result.current.startRealTimeSync('user1');
      });

      expect(result.current.error).toBe('Errore nell\'attivazione della sincronizzazione real-time');
    });

    it('should stop real-time sync', () => {
      const { result } = renderHook(() => useFirebaseCalendar());

      act(() => {
        result.current.stopRealTimeSync();
      });

      expect(mockService.unsubscribeFromEntries).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useFirebaseCalendar());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(mockStore.setError).toHaveBeenCalledWith(null);
    });
  });
}); 