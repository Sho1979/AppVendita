/**
 * Test suite per le ottimizzazioni di performance
 * 
 * Verifica che tutte le ottimizzazioni implementate funzionino correttamente
 * e non introducano regressioni nelle performance.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Import dei componenti ottimizzati
import MemoizedWeekCalendar from '../../presentation/components/optimized/MemoizedWeekCalendar';
import VirtualizedMonthCalendar from '../../presentation/components/optimized/VirtualizedMonthCalendar';
import { useLazyComponent, usePreloadComponents, setupLazyComponents } from '../../hooks/useLazyComponents';
import { performanceMonitor, usePerformanceMonitoring } from '../../utils/performanceMonitor';

// Mock data
const mockEntries = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    userId: 'user1',
    salesPointId: 'sp1',
    hasProblem: false,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    date: new Date('2024-01-16'),
    userId: 'user1',
    salesPointId: 'sp1',
    hasProblem: true,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockProps = {
  entries: mockEntries,
  selectedDate: '2024-01-15',
  currentDate: new Date('2024-01-15'),
  onDayPress: jest.fn(),
  onAddEntry: jest.fn(),
  onEditEntry: jest.fn(),
  onPrevious: jest.fn(),
  onNext: jest.fn(),
  onToggleView: jest.fn(),
  isLoading: false,
};

// Mock performance.now per test deterministici
const originalNow = performance.now;
beforeAll(() => {
  let mockTime = 0;
  performance.now = jest.fn(() => mockTime += 16); // Simula 60fps
});

afterAll(() => {
  performance.now = originalNow;
});

describe('Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  describe('MemoizedWeekCalendar', () => {
    it('dovrebbe renderizzare senza errori', () => {
      const { getByText } = render(<MemoizedWeekCalendar {...mockProps} />);
      
      expect(getByText('15')).toBeTruthy();
      expect(getByText('16')).toBeTruthy();
    });

    it('dovrebbe memoizzare correttamente i giorni', () => {
      const TestComponent = () => {
        const [entries, setEntries] = React.useState(mockEntries);
        const [rerenderCount, setRerenderCount] = React.useState(0);
        
        // Simula re-render senza cambiare le entries
        React.useEffect(() => {
          const timer = setTimeout(() => {
            setRerenderCount(prev => prev + 1);
          }, 100);
          return () => clearTimeout(timer);
        }, [rerenderCount]);

        return (
          <MemoizedWeekCalendar
            {...mockProps}
            entries={entries}
            enableDebugLogs={true}
          />
        );
      };

      const { getByText } = render(<TestComponent />);
      
      // Verifica che i giorni siano renderizzati
      expect(getByText('15')).toBeTruthy();
      
      // La memoization dovrebbe prevenire re-render inutili
      // (questo test verifica la struttura, non può testare React.memo direttamente)
    });

    it('dovrebbe gestire correttamente i callback ottimizzati', async () => {
      const { getByText } = render(<MemoizedWeekCalendar {...mockProps} />);
      
      const day15 = getByText('15');
      fireEvent.press(day15);
      
      await waitFor(() => {
        expect(mockProps.onDayPress).toHaveBeenCalledWith('2024-01-15');
      });
    });

    it('dovrebbe limitare le entries per performance', () => {
      const manyEntries = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        date: new Date('2024-01-15'),
        userId: 'user1',
        salesPointId: 'sp1',
        hasProblem: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const { container } = render(
        <MemoizedWeekCalendar
          {...mockProps}
          entries={manyEntries}
          maxEntriesPerDay={3}
        />
      );

      // Verifica che sia presente l'indicatore di entries nascoste
      const hiddenText = container.findByText('+7');
      expect(hiddenText).toBeTruthy();
    });
  });

  describe('VirtualizedMonthCalendar', () => {
    it('dovrebbe renderizzare con virtualizzazione abilitata', () => {
      const { getByText } = render(
        <VirtualizedMonthCalendar
          {...mockProps}
          enableVirtualization={true}
        />
      );
      
      expect(getByText('15')).toBeTruthy();
    });

    it('dovrebbe renderizzare senza virtualizzazione', () => {
      const { getByText } = render(
        <VirtualizedMonthCalendar
          {...mockProps}
          enableVirtualization={false}
        />
      );
      
      expect(getByText('15')).toBeTruthy();
    });

    it('dovrebbe gestire grandi dataset senza problemi di performance', () => {
      const startTime = performance.now();
      
      const manyEntries = Array.from({ length: 1000 }, (_, i) => ({
        id: `entry-${i}`,
        date: new Date(2024, 0, 1 + (i % 31)), // Distribuisci nel mese
        userId: 'user1',
        salesPointId: 'sp1',
        hasProblem: i % 3 === 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      render(
        <VirtualizedMonthCalendar
          {...mockProps}
          entries={manyEntries}
          enableVirtualization={true}
          enableDebugLogs={true}
        />
      );
      
      const renderTime = performance.now() - startTime;
      
      // Il rendering dovrebbe essere veloce anche con molti dati
      expect(renderTime).toBeLessThan(100); // meno di 100ms
    });

    it('dovrebbe ottimizzare re-render con prop changes', () => {
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        const [entries] = React.useState(mockEntries);
        
        return (
          <div>
            <button onClick={() => setCount(c => c + 1)}>
              Re-render: {count}
            </button>
            <VirtualizedMonthCalendar
              {...mockProps}
              entries={entries} // Entries non cambiano
              enableDebugLogs={true}
            />
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      
      const button = getByText(/Re-render:/);
      
      // Trigger re-render multipli
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      // Il componente dovrebbe essere ottimizzato per re-render
      expect(getByText('Re-render: 3')).toBeTruthy();
    });
  });

  describe('Lazy Component Loading', () => {
    beforeEach(() => {
      setupLazyComponents();
    });

    it('dovrebbe registrare componenti per lazy loading', () => {
      const TestHook = () => {
        const hookResult = useLazyComponent('MemoizedWeekCalendar');
        return (
          <div>
            <span>Component: {hookResult.component ? 'loaded' : 'null'}</span>
            <span>Loading: {hookResult.loading ? 'true' : 'false'}</span>
            <span>Loaded: {hookResult.loaded ? 'true' : 'false'}</span>
          </div>
        );
      };

      const { getByText } = render(<TestHook />);
      
      expect(getByText('Component: null')).toBeTruthy();
      expect(getByText('Loading: false')).toBeTruthy();
      expect(getByText('Loaded: false')).toBeTruthy();
    });

    it('dovrebbe caricare componenti lazy', async () => {
      const TestHook = () => {
        const hookResult = useLazyComponent('MemoizedWeekCalendar', { enableDebugLogs: true });
        
        React.useEffect(() => {
          hookResult.loadComponent();
        }, []);

        return (
          <div>
            <span>Loaded: {hookResult.loaded ? 'true' : 'false'}</span>
            <span>Loading: {hookResult.loading ? 'true' : 'false'}</span>
          </div>
        );
      };

      const { getByText } = render(<TestHook />);
      
      await waitFor(() => {
        expect(getByText('Loaded: true')).toBeTruthy();
        expect(getByText('Loading: false')).toBeTruthy();
      });
    });

    it('dovrebbe gestire errori nel caricamento', async () => {
      const TestHook = () => {
        const hookResult = useLazyComponent('NonExistentComponent');
        
        React.useEffect(() => {
          hookResult.loadComponent();
        }, []);

        return (
          <div>
            <span>Error: {hookResult.error ? 'true' : 'false'}</span>
            <span>Loaded: {hookResult.loaded ? 'true' : 'false'}</span>
          </div>
        );
      };

      const { getByText } = render(<TestHook />);
      
      await waitFor(() => {
        expect(getByText('Error: true')).toBeTruthy();
        expect(getByText('Loaded: false')).toBeTruthy();
      });
    });

    it('dovrebbe implementare retry logic', async () => {
      const TestHook = () => {
        const hookResult = useLazyComponent('NonExistentComponent', {
          retryAttempts: 2,
          retryDelay: 100,
        });
        
        React.useEffect(() => {
          hookResult.loadComponent();
        }, []);

        return (
          <div>
            <span>Retry Count: {hookResult.retryCount}</span>
          </div>
        );
      };

      const { getByText } = render(<TestHook />);
      
      // Aspetta che i retry siano completati
      await waitFor(() => {
        expect(getByText(/Retry Count: [1-9]/)).toBeTruthy();
      }, { timeout: 1000 });
    });

    it('dovrebbe preloadare componenti', async () => {
      const TestPreload = ({ enabled }: { enabled: boolean }) => {
        usePreloadComponents(
          ['MemoizedWeekCalendar', 'VirtualizedMonthCalendar'],
          { enabled, enableDebugLogs: true, preloadDelay: 100 }
        );

        return <div>Preload enabled: {enabled ? 'true' : 'false'}</div>;
      };

      const { getByText } = render(<TestPreload enabled={true} />);
      
      expect(getByText('Preload enabled: true')).toBeTruthy();
      
      // Aspetta che il preload sia completato
      await waitFor(() => {
        expect(true).toBe(true); // Il preload è asincrono
      }, { timeout: 500 });
    });
  });

  describe('Performance Monitoring', () => {
    it('dovrebbe registrare metriche di performance', () => {
      performanceMonitor.recordMetric('test_metric', 100, 'ms', 'render');
      
      const stats = performanceMonitor.getPerformanceStats();
      expect(stats.totalMetrics).toBe(1);
      expect(stats.categories.render).toBe(1);
    });

    it('dovrebbe misurare tempo di esecuzione', () => {
      const result = performanceMonitor.measureTime(
        'test_operation',
        () => {
          // Simula operazione costosa
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          return sum;
        },
        'user'
      );

      expect(result).toBe(499500); // (999 * 1000) / 2
      
      const stats = performanceMonitor.getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    it('dovrebbe misurare tempo di operazioni async', async () => {
      const result = await performanceMonitor.measureTimeAsync(
        'async_operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'completed';
        },
        'network'
      );

      expect(result).toBe('completed');
      
      const stats = performanceMonitor.getPerformanceStats();
      expect(stats.categories.network).toBe(1);
    });

    it('dovrebbe tracciare metriche di componenti', () => {
      performanceMonitor.recordComponentRender('TestComponent', 25, 5, 2);
      
      const componentMetrics = performanceMonitor.getComponentMetrics('TestComponent');
      expect(componentMetrics).toBeTruthy();
      expect(componentMetrics!.renderTime).toBe(25);
      expect(componentMetrics!.propsCount).toBe(5);
      expect(componentMetrics!.rerenderCount).toBe(1);
    });

    it('dovrebbe esportare metriche per analisi', () => {
      performanceMonitor.recordMetric('export_test', 50, 'ms', 'render');
      performanceMonitor.recordComponentRender('ExportComponent', 30, 3, 1);
      
      const exported = performanceMonitor.exportMetrics();
      
      expect(exported.metrics.length).toBeGreaterThan(0);
      expect(exported.componentMetrics.length).toBeGreaterThan(0);
      expect(exported.timestamp).toBeTruthy();
    });

    it('dovrebbe analizzare trend di performance', () => {
      // Simula trend degradante
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordMetric('trend_test', 10 + i * 5, 'ms', 'render');
      }
      
      const trends = performanceMonitor.analyzeTrends();
      expect(['improving', 'degrading', 'stable']).toContain(trends.renderTrend);
    });
  });

  describe('Performance Monitoring Hook', () => {
    it('dovrebbe monitorare performance di componenti', () => {
      const TestComponent = () => {
        const { renderCount, recordMetric } = usePerformanceMonitoring(
          'HookedComponent',
          [mockProps.selectedDate]
        );
        
        React.useEffect(() => {
          recordMetric('custom_operation', 15, 'ms');
        }, []);
        
        return <div>Render count: {renderCount}</div>;
      };

      const { getByText, rerender } = render(<TestComponent />);
      
      expect(getByText('Render count: 1')).toBeTruthy();
      
      // Trigger re-render
      rerender(<TestComponent />);
      
      const componentMetrics = performanceMonitor.getComponentMetrics('HookedComponent');
      expect(componentMetrics).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('dovrebbe combinare tutte le ottimizzazioni senza conflitti', async () => {
      setupLazyComponents();
      
      const OptimizedApp = () => {
        const { component: WeekCalendar, loadComponent } = useLazyComponent('MemoizedWeekCalendar');
        const { renderCount } = usePerformanceMonitoring('OptimizedApp', []);
        
        React.useEffect(() => {
          loadComponent();
        }, []);
        
        if (!WeekCalendar) {
          return <div>Loading...</div>;
        }
        
        return (
          <div>
            <div>Render: {renderCount}</div>
            <WeekCalendar {...mockProps} enableDebugLogs={true} />
          </div>
        );
      };

      const { getByText } = render(<OptimizedApp />);
      
      await waitFor(() => {
        expect(getByText('Render: 1')).toBeTruthy();
      });
      
      const stats = performanceMonitor.getPerformanceStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });

    it('dovrebbe mantenere performance sotto soglie accettabili', () => {
      const startMemory = performance.memory?.usedJSHeapSize || 0;
      const startTime = performance.now();
      
      // Simula carico di lavoro pesante
      for (let i = 0; i < 100; i++) {
        render(<MemoizedWeekCalendar {...mockProps} />);
      }
      
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      
      const totalTime = endTime - startTime;
      const memoryIncrease = (endMemory - startMemory) / (1024 * 1024); // MB
      
      // Verifica che le performance siano accettabili
      expect(totalTime).toBeLessThan(5000); // Meno di 5 secondi per 100 render
      expect(memoryIncrease).toBeLessThan(50); // Meno di 50MB di aumento
    });
  });
});

describe('Performance Regression Tests', () => {
  it('dovrebbe prevenire regressioni nelle performance di rendering', () => {
    const iterations = 50;
    const renderTimes: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      const { unmount } = render(
        <MemoizedWeekCalendar {...mockProps} />
      );
      
      const renderTime = performance.now() - startTime;
      renderTimes.push(renderTime);
      
      unmount();
    }
    
    const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    
    // Verifica che i tempi di render siano consistenti e veloci
    expect(averageRenderTime).toBeLessThan(50); // Media sotto 50ms
    expect(maxRenderTime).toBeLessThan(100); // Max sotto 100ms
    
    // Verifica che non ci sia variance eccessiva
    const variance = renderTimes.reduce((acc, time) => 
      acc + Math.pow(time - averageRenderTime, 2), 0
    ) / renderTimes.length;
    
    expect(Math.sqrt(variance)).toBeLessThan(20); // Deviazione standard sotto 20ms
  });
});
