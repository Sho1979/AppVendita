/**
 * Sistema di monitoraggio performance per AppVendita
 * 
 * Traccia metriche di performance, render times, memory usage
 * e fornisce insights per ottimizzazioni continue.
 */

import React from 'react';
import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'mb' | 'count' | '%';
  timestamp: number;
  category: 'render' | 'network' | 'memory' | 'user' | 'bundle';
  details?: Record<string, any>;
}

export interface ComponentRenderMetric {
  componentName: string;
  renderTime: number;
  propsCount: number;
  childrenCount: number;
  rerenderCount: number;
  lastRenderTimestamp: number;
}

export interface MemoryMetric {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private componentMetrics = new Map<string, ComponentRenderMetric>();
  private isEnabled: boolean = __DEV__;
  private maxMetrics = 1000; // Limita memoria utilizzata
  private memoryCheckInterval?: NodeJS.Timeout;
  
  constructor() {
    this.setupMemoryMonitoring();
  }

  /**
   * Abilita/disabilita il monitoraggio
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.setupMemoryMonitoring();
      logger.performance('Performance monitoring abilitato');
    } else {
      this.teardownMemoryMonitoring();
      logger.performance('Performance monitoring disabilitato');
    }
  }

  /**
   * Registra una metrica di performance
   */
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    category: PerformanceMetric['category'],
    details?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      category,
      timestamp: Date.now(),
      details,
    };

    this.metrics.push(metric);

    // Mantieni solo le metriche più recenti
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log per debug se necessario
    if (__DEV__ && this.shouldLogMetric(metric)) {
      logger.performance(`Metrica: ${name}`, {
        value: `${value}${unit}`,
        category,
        details,
      });
    }
  }

  /**
   * Misura il tempo di esecuzione di una funzione
   */
  measureTime<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'user',
    details?: Record<string, any>
  ): T {
    if (!this.isEnabled) return fn();

    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.recordMetric(name, duration, 'ms', category, details);

    return result;
  }

  /**
   * Misura il tempo di esecuzione di una funzione asincrona
   */
  async measureTimeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'user',
    details?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) return fn();

    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.recordMetric(name, duration, 'ms', category, details);

    return result;
  }

  /**
   * Registra metriche di render di un componente React
   */
  recordComponentRender(
    componentName: string,
    renderTime: number,
    propsCount: number = 0,
    childrenCount: number = 0
  ): void {
    if (!this.isEnabled) return;

    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderTime = renderTime;
      existing.propsCount = propsCount;
      existing.childrenCount = childrenCount;
      existing.rerenderCount += 1;
      existing.lastRenderTimestamp = Date.now();
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderTime,
        propsCount,
        childrenCount,
        rerenderCount: 1,
        lastRenderTimestamp: Date.now(),
      });
    }

    // Registra anche come metrica generale
    this.recordMetric(
      `${componentName}_render`,
      renderTime,
      'ms',
      'render',
      { propsCount, childrenCount }
    );
  }

  /**
   * Setup monitoraggio memoria automatico
   */
  private setupMemoryMonitoring(): void {
    if (!this.isEnabled || this.memoryCheckInterval) return;

    // Controlla memoria ogni 30 secondi
    this.memoryCheckInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);

    // Registrazione iniziale
    this.recordMemoryUsage();
  }

  /**
   * Teardown monitoraggio memoria
   */
  private teardownMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }

  /**
   * Registra l'uso corrente della memoria
   */
  recordMemoryUsage(): void {
    if (!this.isEnabled) return;

    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        this.recordMetric(
          'memory_used_js_heap',
          Math.round(memory.usedJSHeapSize / (1024 * 1024)),
          'mb',
          'memory',
          {
            totalJSHeapSize: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
            jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
          }
        );
      }
    } catch (error) {
      // Memoria non disponibile su questa piattaforma
    }
  }

  /**
   * Ottieni statistiche di performance
   */
  getPerformanceStats(): {
    totalMetrics: number;
    categories: Record<string, number>;
    averageRenderTime: number;
    worstPerformingComponents: ComponentRenderMetric[];
    recentMetrics: PerformanceMetric[];
  } {
    const categories: Record<string, number> = {};
    
    this.metrics.forEach(metric => {
      categories[metric.category] = (categories[metric.category] || 0) + 1;
    });

    const renderMetrics = this.metrics.filter(m => m.category === 'render');
    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    const worstPerformingComponents = Array.from(this.componentMetrics.values())
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10);

    const recentMetrics = this.metrics
      .filter(m => Date.now() - m.timestamp < 60000) // Ultimi 60 secondi
      .slice(-20);

    return {
      totalMetrics: this.metrics.length,
      categories,
      averageRenderTime,
      worstPerformingComponents,
      recentMetrics,
    };
  }

  /**
   * Ottieni metriche di un componente specifico
   */
  getComponentMetrics(componentName: string): ComponentRenderMetric | null {
    return this.componentMetrics.get(componentName) || null;
  }

  /**
   * Ottieni tutte le metriche di componenti
   */
  getAllComponentMetrics(): ComponentRenderMetric[] {
    return Array.from(this.componentMetrics.values());
  }

  /**
   * Esporta tutte le metriche per analisi
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    componentMetrics: ComponentRenderMetric[];
    timestamp: number;
  } {
    return {
      metrics: [...this.metrics],
      componentMetrics: Array.from(this.componentMetrics.values()),
      timestamp: Date.now(),
    };
  }

  /**
   * Pulisce tutte le metriche
   */
  clearMetrics(): void {
    this.metrics = [];
    this.componentMetrics.clear();
    logger.performance('Metriche di performance pulite');
  }

  /**
   * Determina se una metrica dovrebbe essere loggata
   */
  private shouldLogMetric(metric: PerformanceMetric): boolean {
    // Log solo metriche significative per evitare spam
    switch (metric.category) {
      case 'render':
        return metric.value > 16; // Solo render > 16ms (sotto 60fps)
      case 'network':
        return metric.value > 1000; // Solo richieste > 1s
      case 'memory':
        return metric.value > 100; // Solo se memoria > 100MB
      default:
        return metric.value > 100; // Default threshold
    }
  }

  /**
   * Analizza trend di performance
   */
  analyzeTrends(): {
    renderTrend: 'improving' | 'degrading' | 'stable';
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    problematicComponents: string[];
  } {
    const recentRenderMetrics = this.metrics
      .filter(m => m.category === 'render' && Date.now() - m.timestamp < 300000) // Ultimi 5 minuti
      .map(m => m.value);

    const recentMemoryMetrics = this.metrics
      .filter(m => m.name === 'memory_used_js_heap' && Date.now() - m.timestamp < 300000)
      .map(m => m.value);

    const renderTrend = this.calculateTrend(recentRenderMetrics);
    const memoryTrend = this.calculateTrend(recentMemoryMetrics);

    const problematicComponents = Array.from(this.componentMetrics.values())
      .filter(c => c.renderTime > 50 || c.rerenderCount > 10)
      .map(c => c.componentName);

    return {
      renderTrend,
      memoryTrend,
      problematicComponents,
    };
  }

  /**
   * Calcola trend da una serie di valori
   */
  private calculateTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 3) return 'stable';

    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 10) return 'degrading';
    if (change < -10) return 'improving';
    return 'stable';
  }
}

// Istanza singleton del monitor
export const performanceMonitor = new PerformanceMonitor();

/**
 * HOC per monitorare performance di componenti React
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const MonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent';
    
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const renderTime = performance.now() - startTime;
        performanceMonitor.recordComponentRender(
          name,
          renderTime,
          Object.keys(props).length,
          React.Children.count((props as any).children)
        );
      };
    });

    return <WrappedComponent {...props} ref={ref} />;
  });

  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName || 'Component'})`;
  
  return MonitoredComponent;
};

/**
 * Hook per monitorare performance di un componente
 */
export const usePerformanceMonitoring = (componentName: string, dependencies: any[] = []) => {
  const renderCount = React.useRef(0);
  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;
    
    performanceMonitor.recordComponentRender(
      componentName,
      renderTime,
      dependencies.length
    );
    
    startTime.current = performance.now();
  }, dependencies);

  return {
    renderCount: renderCount.current,
    recordMetric: (name: string, value: number, unit: PerformanceMetric['unit']) => {
      performanceMonitor.recordMetric(name, value, unit, 'user', { component: componentName });
    },
  };
};

export default performanceMonitor;
