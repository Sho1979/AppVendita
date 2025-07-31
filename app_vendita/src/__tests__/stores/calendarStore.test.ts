import { renderHook, act } from '@testing-library/react-native';
import { useCalendarStore } from '../../stores/calendarStore';
import { CalendarEntry } from '../../data/models/CalendarEntry';

// Mock per AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('calendarStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset dello store prima di ogni test
    const { result } = renderHook(() => useCalendarStore());
    act(() => {
      result.current.clearAll();
    });
  });

  describe('Actions', () => {
    it('should add entry correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.addEntry(mockEntry);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].id).toBe('test-entry-1');
    });

    it('should update entry correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Original entry',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Aggiungi entry
      act(() => {
        result.current.addEntry(mockEntry);
      });

      // Aggiorna entry
      const updatedEntry = { ...mockEntry, notes: 'Updated entry' };
      act(() => {
        result.current.updateEntry(updatedEntry);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].notes).toBe('Updated entry');
    });

    it('should delete entry correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Aggiungi entry
      act(() => {
        result.current.addEntry(mockEntry);
      });

      expect(result.current.entries).toHaveLength(1);

      // Elimina entry
      act(() => {
        result.current.deleteEntry('test-entry-1');
      });

      expect(result.current.entries).toHaveLength(0);
    });

    it('should set loading state correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set error state correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const errorMessage = 'Test error message';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Selectors', () => {
    it('should get entry by id correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.addEntry(mockEntry);
      });

      const foundEntry = result.current.getEntryById('test-entry-1');
      expect(foundEntry).toBeDefined();
      expect(foundEntry?.id).toBe('test-entry-1');
    });

    it('should get entries by date correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry1: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry 1',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntry2: CalendarEntry = {
        id: 'test-entry-2',
        date: new Date('2025-07-31'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry 2',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.addEntry(mockEntry1);
        result.current.addEntry(mockEntry2);
      });

      const entriesForDate = result.current.getEntriesByDate('2025-07-30');
      expect(entriesForDate).toHaveLength(1);
      expect(entriesForDate[0].id).toBe('test-entry-1');
    });

    it('should get filtered entries correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry1: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry 1',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockEntry2: CalendarEntry = {
        id: 'test-entry-2',
        date: new Date('2025-07-30'),
        userId: 'user-2',
        salesPointId: 'salespoint-2',
        notes: 'Test entry 2',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.addEntry(mockEntry1);
        result.current.addEntry(mockEntry2);
      });

      const filteredEntries = result.current.getFilteredEntries({
        userId: 'user-1',
      });

      expect(filteredEntries).toHaveLength(1);
      expect(filteredEntries[0].userId).toBe('user-1');
    });

    it('should get entries count correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.addEntry(mockEntry);
      });

      expect(result.current.getEntriesCount()).toBe(1);
    });
  });

  describe('Utility Actions', () => {
    it('should clear all data correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      const mockEntry: CalendarEntry = {
        id: 'test-entry-1',
        date: new Date('2025-07-30'),
        userId: 'user-1',
        salesPointId: 'salespoint-1',
        notes: 'Test entry',
        sales: [],
        actions: [],
        hasProblem: false,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.addEntry(mockEntry);
        result.current.setUsers([{ id: 'user-1', name: 'User 1' }]);
        result.current.setSalesPoints([{ id: 'sp-1', name: 'SP 1' }]);
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.users).toHaveLength(1);
      expect(result.current.salesPoints).toHaveLength(1);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.entries).toHaveLength(0);
      expect(result.current.users).toHaveLength(0);
      expect(result.current.salesPoints).toHaveLength(0);
    });
  });
}); 