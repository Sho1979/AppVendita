import {
  ProductEntry,
  DailyTotals,
  ProgressiveEntry,
  ProgressiveCalculationResult,
  CalculationConfig,
  ProgressiveState,
  ValidationResult,
      PerformanceMetrics,
  CellVisualizationResult
} from '../data/models/ProgressiveData';
import { CalendarEntry } from '../data/models/CalendarEntry';

export class ProgressiveCalculationService {
  private state: ProgressiveState;
  private performanceMetrics: PerformanceMetrics;
  
  // 🚀 CHIRURGIA: Smart Cache System
  private calculationCache: Map<string, DailyTotals>;
  private sortedDatesCache: string[] | null;
  private cacheInvalidationFlags: Set<string>;
  private lastCacheUpdate: number;
  private readonly CACHE_TTL = 300000; // 5 minuti cache TTL

  constructor() {
    this.state = {
      entries: new Map(),
      progressiveTotals: new Map(),
      calculationConfig: {
        prezzoUnitario: 1.0,
        tassaVendita: 0.22, // 22% IVA
        scontoPercentuale: 0.0
      },
      lastUpdated: new Date().toISOString()
    };

    this.performanceMetrics = {
      calculationTime: 0,
      entriesProcessed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // 🎯 INIZIALIZZAZIONE CACHE CHIRURGICA
    this.calculationCache = new Map();
    this.sortedDatesCache = null;
    this.cacheInvalidationFlags = new Set();
    this.lastCacheUpdate = Date.now();
  }

  /**
   * Ottiene il timestamp dell'ultimo aggiornamento
   */
  public getLastUpdated(): string {
    return this.state.lastUpdated;
  }

  /**
   * Calcola i totali giornalieri per un set di entries
   */
  private calculateDailyTotals(entries: ProductEntry[]): DailyTotals {
    const startTime = performance.now();
    
    const totals = entries.reduce(
      (acc, entry) => ({
        venditeTotali: acc.venditeTotali + entry.vendite,
        scorteTotali: acc.scorteTotali + entry.scorte,
        ordinatiTotali: acc.ordinatiTotali + entry.ordinati,
        sellIn: acc.sellIn + (entry.ordinati * entry.prezzoNetto) // Usa il prezzo netto specifico del prodotto
      }),
      {
        venditeTotali: 0,
        scorteTotali: 0,
        ordinatiTotali: 0,
        sellIn: 0
      }
    );

    this.performanceMetrics.calculationTime += performance.now() - startTime;
    this.performanceMetrics.entriesProcessed += entries.length;

    return totals;
  }

  /**
   * Calcola i totali progressivi accumulando con i giorni precedenti
   */
  private calculateProgressiveTotals(
    dailyTotals: DailyTotals,
    previousDayTotals?: DailyTotals
  ): DailyTotals {
    // Se non esistono totali precedenti, il progressivo del primo giorno
    // è dato da vendite/ordinati del giorno e lo stock iniziale calcolato
    // come (ordinati - vendite) del giorno
    if (!previousDayTotals) {
      return {
        venditeTotali: dailyTotals.venditeTotali,
        ordinatiTotali: dailyTotals.ordinatiTotali,
        scorteTotali: dailyTotals.ordinatiTotali - dailyTotals.venditeTotali,
        sellIn: dailyTotals.sellIn
      };
    }

    // Progressivo: somma vendite e ordinati; lo stock è quello del giorno
    // precedente più (ordinati - vendite) del giorno corrente
    return {
      venditeTotali: previousDayTotals.venditeTotali + dailyTotals.venditeTotali,
      ordinatiTotali: previousDayTotals.ordinatiTotali + dailyTotals.ordinatiTotali,
      scorteTotali: previousDayTotals.scorteTotali + (dailyTotals.ordinatiTotali - dailyTotals.venditeTotali),
      sellIn: previousDayTotals.sellIn + dailyTotals.sellIn
    };
  }

  // Rimosso helper legacy getPreviousDayTotals: non utilizzato nell'algoritmo attuale

  /**
   * Aggiorna una cella e ricalcola TUTTO dal primo giorno con dati
   * Gestisce correttamente le modifiche retroattive
   */
  public updateCellAndRecalculate(
    date: string,
    newEntries: ProductEntry[]
  ): ProgressiveCalculationResult {
    // Validazione input
    const validation = this.validateEntries(newEntries);
    if (!validation.isValid) {
      console.error('❌ Validazione fallita:', validation.errors);
      throw new Error(`Validazione fallita: ${validation.errors.join(', ')}`);
    }

    // Salva la modifica
    this.saveCellData(date, newEntries);

    // Aggiorna il primo giorno con dati
    this.updateFirstDateWithData();

    // Trova il primo giorno con dati
    const firstDateWithData = this.findFirstDateWithData();
    
    if (firstDateWithData) {
      // Ricalcola TUTTO dal primo giorno
      this.recalculateFromDate(firstDateWithData);
    }

    // Aggiorna il timestamp dell'ultimo aggiornamento
    this.state.lastUpdated = new Date().toISOString();

    // Ottieni i risultati aggiornati
    const updatedEntry = this.state.entries.get(date);
    const updatedTotals = this.state.progressiveTotals.get(date);

    if (!updatedEntry || !updatedTotals) {
      throw new Error(`Dati non trovati per la data ${date}`);
    }

    return {
      dailyData: updatedEntry,
      updatedProgressiveTotals: updatedTotals,
      sellInCalculated: updatedTotals.sellIn
    };
  }

  /**
   * 🚀 CHIRURGIA: Salva i dati di una cella con cache invalidation
   */
  private saveCellData(date: string, newEntries: ProductEntry[]): void {
    const dailyTotals = this.calculateDailyTotals(newEntries);
    
    const progressiveEntry: ProgressiveEntry = {
      date,
      entries: newEntries,
      dailyTotals,
      progressiveTotals: dailyTotals, // Temporaneo, sarà ricalcolato
    };

    this.state.entries.set(date, progressiveEntry);
    
    // 🎯 CHIRURGIA: Invalida cache per questa data e successive
    this.invalidateCache(date);
  }

  /**
   * 🚀 CHIRURGIA: Trova il primo giorno con dati (CACHED)
   */
  private findFirstDateWithData(): string | undefined {
    // Usa cache per evitare sorting ripetuto
    const sortedDates = this.getSortedDatesOptimized();
    return sortedDates[0] || undefined;
  }

  /**
   * 🎯 CHIRURGIA: Ottieni date ordinate con cache intelligente
   */
  private getSortedDatesOptimized(): string[] {
    const now = Date.now();
    
    // Cache hit con TTL check
    if (this.sortedDatesCache && 
        (now - this.lastCacheUpdate) < this.CACHE_TTL &&
        this.cacheInvalidationFlags.size === 0) {
      this.performanceMetrics.cacheHits++;
      return this.sortedDatesCache;
    }

    // Cache miss - ricalcola
    this.performanceMetrics.cacheMisses++;
    this.sortedDatesCache = Array.from(this.state.entries.keys()).sort();
    this.lastCacheUpdate = now;
    this.cacheInvalidationFlags.clear();
    
    return this.sortedDatesCache;
  }

  /**
   * 🔥 CHIRURGIA: Cache invalidation intelligente
   */
  private invalidateCache(affectedDate?: string): void {
    if (affectedDate) {
      this.cacheInvalidationFlags.add(affectedDate);
      // Invalida anche le date successive per calcolo progressivo
      const sortedDates = this.sortedDatesCache || Array.from(this.state.entries.keys()).sort();
      const affectedIndex = sortedDates.indexOf(affectedDate);
      if (affectedIndex >= 0) {
        for (let i = affectedIndex; i < sortedDates.length; i++) {
          const dateToInvalidate = sortedDates[i];
          if (dateToInvalidate) {
            this.cacheInvalidationFlags.add(dateToInvalidate);
          }
        }
      }
    } else {
      // Invalidazione completa
      this.sortedDatesCache = null;
      this.calculationCache.clear();
      this.cacheInvalidationFlags.clear();
    }
  }

  /**
   * 🚀 CHIRURGIA COMPLETA: Ricalcolo incrementale ottimizzato
   * Riduce complessità da O(n²) a O(k) dove k = affected dates
   */
  private recalculateFromDate(startDate: string): void {
    const startTime = performance.now();
    
    // 🎯 OTTIMIZZAZIONE 1: Use cached sorted dates
    const sortedDates = this.getSortedDatesOptimized();
    const startIndex = sortedDates.indexOf(startDate);
    
    if (startIndex === -1) {
      console.warn(`🚨 CHIRURGIA: Data di partenza ${startDate} non trovata`);
      return;
    }

    // 🎯 OTTIMIZZAZIONE 2: Ottieni totali precedenti dalla cache o calcolo
    let previousTotals = this.getPreviousDayTotalsOptimized(startDate);
    
    // 🎯 OTTIMIZZAZIONE 3: Processa solo date invalidate o successive
    const datesToProcess = sortedDates.slice(startIndex).filter(date => 
      this.cacheInvalidationFlags.has(date) || 
      !this.calculationCache.has(date)
    );

    console.log(`🔬 CHIRURGIA: Processando ${datesToProcess.length}/${sortedDates.length - startIndex} date`);
    
    for (const date of datesToProcess) {
      
      const entry = this.state.entries.get(date);
      if (entry) {
        // 🎯 OTTIMIZZAZIONE 4: Check cache prima di calcolare
        let newProgressiveTotals = this.calculationCache.get(date);
        
        if (!newProgressiveTotals || this.cacheInvalidationFlags.has(date)) {
          // Cache miss - calcola e salva
          newProgressiveTotals = this.calculateProgressiveTotals(
            entry.dailyTotals,
            previousTotals
          );
          
          // 🚀 SALVA IN CACHE
          this.calculationCache.set(date, newProgressiveTotals);
          this.performanceMetrics.cacheMisses++;
        } else {
          this.performanceMetrics.cacheHits++;
        }
        
        // Aggiorna entry con batch optimization
        entry.progressiveTotals = newProgressiveTotals;
        if (previousTotals) {
          entry.previousDayTotals = previousTotals;
        }
        
        // 🎯 OTTIMIZZAZIONE 5: Batch write operations
        this.batchUpdateEntry(date, entry, newProgressiveTotals);
        
        // Prepara per il giorno successivo
        previousTotals = newProgressiveTotals;
        this.performanceMetrics.entriesProcessed++;
      }
    }

    // 🎯 CLEAN UP: Rimuovi flags invalidazione processati
    datesToProcess.forEach(date => this.cacheInvalidationFlags.delete(date));
    
    // 📊 METRICHE PERFORMANCE
    const elapsedTime = performance.now() - startTime;
    this.performanceMetrics.calculationTime += elapsedTime;
    
    console.log(`⚡ CHIRURGIA COMPLETATA: ${elapsedTime.toFixed(2)}ms, ${datesToProcess.length} date processate`);
  }

  /**
   * 🎯 CHIRURGIA: Ottieni totali giorno precedente con cache
   */
  private getPreviousDayTotalsOptimized(date: string): DailyTotals | undefined {
    const sortedDates = this.getSortedDatesOptimized();
    const currentIndex = sortedDates.indexOf(date);
    
    if (currentIndex <= 0) return undefined;
    
    const previousDate = sortedDates[currentIndex - 1];
    if (!previousDate) return undefined;
    
    // Try cache first
    let previousTotals = this.calculationCache.get(previousDate);
    if (previousTotals) {
      this.performanceMetrics.cacheHits++;
      return previousTotals;
    }
    
    // Fallback to state
    const previousEntry = this.state.entries.get(previousDate);
    if (previousEntry?.progressiveTotals) {
      // Update cache
      this.calculationCache.set(previousDate, previousEntry.progressiveTotals);
      this.performanceMetrics.cacheMisses++;
      return previousEntry.progressiveTotals;
    }
    
    return undefined;
  }

  /**
   * 🚀 CHIRURGIA: Batch update ottimizzato
   */
  private batchUpdateEntry(date: string, entry: ProgressiveEntry, totals: DailyTotals): void {
    // Single atomic operation invece di multiple writes
    this.state.entries.set(date, entry);
    this.state.progressiveTotals.set(date, totals);
  }



  /**
   * Ottiene i dati progressivi per una data specifica
   */
  public getProgressiveData(date: string): ProgressiveEntry | null {
    return this.state.entries.get(date) || null;
  }

  /**
   * Ottiene tutti i dati progressivi in un range di date
   */
  public getProgressiveHistory(startDate: string, endDate: string): ProgressiveEntry[] {
    const entries: ProgressiveEntry[] = [];
    
    for (const [date, entry] of this.state.entries) {
      if (date >= startDate && date <= endDate) {
        entries.push(entry);
      }
    }

    return entries.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Parsing sicuro di valori numerici con validazione
   */
  private parseValidNumber(value: string | number | undefined, defaultValue: number = 0): number {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    
    // Controlli di validità
    if (isNaN(parsed) || !isFinite(parsed)) {
      console.warn(`⚠️ ProgressiveCalculationService: Valore non valido "${value}", uso default ${defaultValue}`);
      return defaultValue;
    }
    
    // Non permettere valori negativi per vendite/scorte (ma prezzi possono essere negativi per sconti)
    if (parsed < 0 && defaultValue >= 0) {
      console.warn(`⚠️ ProgressiveCalculationService: Valore negativo "${parsed}" convertito a 0`);
      return 0;
    }
    
    return parsed;
  }

  /**
   * Valida le entries prima del calcolo
   */
  private validateEntries(entries: ProductEntry[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const entry of entries) {
      // Validazioni obbligatorie
      if (!entry.productId) {
        errors.push(`ProductId mancante per entry`);
      }
      if (entry.vendite < 0) {
        errors.push(`Vendite negative non permesse per ${entry.productId}`);
      }
      if (entry.scorte < 0) {
        errors.push(`Scorte negative non permesse per ${entry.productId}`);
      }

      // Warning per valori sospetti
      if (entry.vendite > 1000) {
        warnings.push(`Vendite molto alte per ${entry.productId}: ${entry.vendite}`);
      }
      if (entry.scorte > 10000) {
        warnings.push(`Scorte molto alte per ${entry.productId}: ${entry.scorte}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Aggiorna la configurazione di calcolo
   */
  public updateCalculationConfig(config: Partial<CalculationConfig>): void {
    this.state.calculationConfig = {
      ...this.state.calculationConfig,
      ...config
    };
  }

  /**
   * Ottiene le metriche di performance
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Resetta le metriche di performance
   */
  public resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      calculationTime: 0,
      entriesProcessed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * 🚀 CHIRURGIA: Reset sistema con pulizia cache completa
   */
  public resetSystem(): void {
    this.state = {
      entries: new Map(),
      progressiveTotals: new Map(),
      calculationConfig: { ...this.state.calculationConfig },
      lastUpdated: new Date().toISOString(),
    };
    
    // 🎯 CHIRURGIA: Pulizia cache completa
    this.calculationCache.clear();
    this.sortedDatesCache = null;
    this.cacheInvalidationFlags.clear();
    this.lastCacheUpdate = Date.now();
    
    this.resetPerformanceMetrics();
    console.log('🔄 CHIRURGIA: Sistema progressivo completamente resettato con cache cleanup');
  }

  /**
   * 🚀 CHIRURGIA: Esporta lo stato corrente con firstDateWithData dinamico
   */
  public exportState(): ProgressiveState {
    const firstDate = this.findFirstDateWithData();
    return {
      entries: new Map(this.state.entries),
      progressiveTotals: new Map(this.state.progressiveTotals),
      calculationConfig: { ...this.state.calculationConfig },
      lastUpdated: this.state.lastUpdated,
      ...(firstDate && { firstDateWithData: firstDate })
    };
  }

  /**
   * 🚀 CHIRURGIA: Importa uno stato con cache cleanup
   */
  public importState(state: ProgressiveState): void {
    this.state = {
      entries: new Map(state.entries),
      progressiveTotals: new Map(state.progressiveTotals),
      calculationConfig: { ...state.calculationConfig },
      lastUpdated: state.lastUpdated,
    };
    
    // 🎯 CHIRURGIA: Reset cache dopo import
    this.invalidateCache();
  }

  /**
   * Carica i dati focusReferencesData nel sistema progressivo
   */
  public loadFocusReferencesData(date: string, focusReferencesData: any[]): void {
    if (!focusReferencesData || focusReferencesData.length === 0) {
      return;
    }

    // Converti FocusReferenceData in ProductEntry[]
    const productEntries: ProductEntry[] = focusReferencesData.map(focusData => {
      // Validazione sicura dei valori numerici
      const vendite = this.parseValidNumber(focusData.soldPieces, 0);
      const scorte = this.parseValidNumber(focusData.stockPieces, 0); 
      const ordinati = this.parseValidNumber(focusData.orderedPieces, 0);
      const prezzoNetto = this.parseValidNumber(focusData.netPrice, 0);

      return {
        productId: focusData.referenceId,
        productName: `Reference ${focusData.referenceId}`, // Placeholder
        vendite,
        scorte,
        ordinati,
        prezzoNetto,
        categoria: 'focus', // Categoria per le referenze focus
        colore: '#007bff', // Colore blu per le referenze focus
        sellIn: 0 // Sarà calcolato dal sistema
      };
    });

    // Salva i dati nel sistema progressivo
    // Normalizza la chiave data a YYYY-MM-DD locale (evita offset di timezone)
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    this.saveCellData(key, productEntries);
    
    // Aggiorna il primo giorno con dati
    this.updateFirstDateWithData();
    
    // Ricalcola se necessario
    const firstDateWithData = this.findFirstDateWithData();
    if (firstDateWithData) {
      this.recalculateFromDate(firstDateWithData);
    }

    // Aggiorna il timestamp per notificare la UI e forzare il refresh live
    this.state.lastUpdated = new Date().toISOString();
  }

  /**
   * Ottiene i dati di visualizzazione per una cella
   * Gestisce la differenziazione tra primo giorno e giorni progressivi
   */
  public getCellDisplayData(date: string): CellVisualizationResult {
    const entry = this.state.entries.get(date);
    
    if (!entry) {
      return {
        displayData: {
          originalEntries: [],
          progressiveEntries: [],
          displayMode: 'original',
          isFirstDay: false,
          displayTotals: {
            venditeTotali: 0,
            scorteTotali: 0,
            ordinatiTotali: 0,
            sellIn: 0
          }
        },
        progressiveTotals: {
          venditeTotali: 0,
          scorteTotali: 0,
          ordinatiTotali: 0,
          sellIn: 0
        },
        sellInProgressivo: 0
      };
    }

    const isFirstDay = date === this.findFirstDateWithData();
    
    if (isFirstDay) {
      // Primo giorno: mostra dati originali inseriti nel form
      return {
        displayData: {
          originalEntries: entry.entries,
          progressiveEntries: entry.entries, // Stessi dati per primo giorno
          displayMode: 'original',
          isFirstDay: true,
          displayTotals: entry.dailyTotals
        },
        progressiveTotals: entry.progressiveTotals,
        sellInProgressivo: entry.progressiveTotals.sellIn
      };
    } else {
      // Giorni successivi: mostra dati progressivi
      const progressiveEntries = this.calculateProgressiveEntries(date);
      
      return {
        displayData: {
          originalEntries: entry.entries,
          progressiveEntries: progressiveEntries,
          displayMode: 'progressive',
          isFirstDay: false,
          displayTotals: entry.progressiveTotals
        },
        progressiveTotals: entry.progressiveTotals,
        sellInProgressivo: entry.progressiveTotals.sellIn
      };
    }
  }

  /**
   * Calcola le entries progressivi per un giorno specifico
   */
  private calculateProgressiveEntries(date: string): ProductEntry[] {
    const firstDate = this.findFirstDateWithData();
    if (!firstDate) return [];

    // Limita l'accumulo al mese corrente (Mese-To-Date)
    const target = new Date(date);
    const monthStart = new Date(target.getFullYear(), target.getMonth(), 1);
    const startKey = (monthStart.toISOString().split('T')[0]) || date;

    const dates = Array.from(this.state.entries.keys())
      .filter(d => d >= startKey && d <= date)
      .sort();

    // Stato progressivo per prodotto
    type Agg = { vendite: number; ordinati: number; scorte: number; prezzoNetto: number; product: ProductEntry };
    const byProduct = new Map<string, Agg>();

    for (const d of dates) {
      const entry = this.state.entries.get(d);
      if (!entry) continue;
      for (const p of entry.entries) {
        const cur = byProduct.get(p.productId) || {
          vendite: 0,
          ordinati: 0,
          scorte: 0,
          prezzoNetto: p.prezzoNetto,
          product: { ...p }
        };
        cur.vendite += p.vendite;
        cur.ordinati += p.ordinati;
        // stock progressivo: scorta_precedente + ordinati - vendite
        cur.scorte = cur.scorte + p.ordinati - p.vendite;
        cur.prezzoNetto = p.prezzoNetto || cur.prezzoNetto;
        cur.product = { ...p };
        byProduct.set(p.productId, cur);
      }
    }

    // Converte in ProductEntry per la visualizzazione progressiva del giorno target
    return Array.from(byProduct.entries()).map(([productId, a]) => ({
      productId,
      categoria: a.product.categoria,
      colore: a.product.colore,
      vendite: a.vendite,
      ordinati: a.ordinati,
      scorte: a.scorte < 0 ? 0 : a.scorte,
      prezzoNetto: a.prezzoNetto,
      ...(a.product.tooltip ? { tooltip: a.product.tooltip } : {})
    }));
  }

  /**
   * Calcola il sell-in totale del sistema progressivo
   */
  public getTotalSellIn(activeEntries?: CalendarEntry[]): number {
    let totalSellIn = 0;
    
    if (activeEntries) {
      // Usa solo le entries attive dal database
      for (const calendarEntry of activeEntries) {
        const dateStr = typeof calendarEntry.date === 'string' 
          ? calendarEntry.date 
          : calendarEntry.date.toISOString().split('T')[0];
        if (dateStr) {
          const entry = this.state.entries.get(dateStr);
          if (entry) {
            // Calcola il sell-in giornaliero per questa entry (come getMonthlySellIn)
            const dailySellIn = entry.entries.reduce((total, product) => {
              return total + (product.ordinati * product.prezzoNetto);
            }, 0);
            totalSellIn += dailySellIn;
          }
        }
      }
    } else {
      // Fallback: usa tutte le entries del service (per compatibilità)
      for (const [, entry] of this.state.entries) {
        // Calcola il sell-in giornaliero per questa entry
        const dailySellIn = entry.entries.reduce((total, product) => {
          return total + (product.ordinati * product.prezzoNetto);
        }, 0);
        totalSellIn += dailySellIn;
      }
    }
    
    return totalSellIn;
  }

  /**
   * Calcola il sell-in mensile per un mese specifico
   */
  public getMonthlySellIn(year: number, month: number, activeEntries?: CalendarEntry[]): number {
    let monthlySellIn = 0;
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    if (activeEntries) {
      // Usa solo le entries attive del mese specifico
      for (const calendarEntry of activeEntries) {
        const dateStr = typeof calendarEntry.date === 'string' 
          ? calendarEntry.date 
          : calendarEntry.date.toISOString().split('T')[0];
        if (dateStr && dateStr >= startDate && dateStr <= endDate) {
          const entry = this.state.entries.get(dateStr);
          if (entry) {
            // Calcola il sell-in giornaliero per questa entry
            const dailySellIn = entry.entries.reduce((total, product) => {
              return total + (product.ordinati * product.prezzoNetto);
            }, 0);
            monthlySellIn += dailySellIn;
          }
        }
      }
    } else {
      // Fallback: usa tutte le entries del service (per compatibilità)
      for (const [dateStr, entry] of this.state.entries) {
        if (dateStr >= startDate && dateStr <= endDate) {
          // Calcola il sell-in giornaliero per questa entry
          const dailySellIn = entry.entries.reduce((total, product) => {
            return total + (product.ordinati * product.prezzoNetto);
          }, 0);
          monthlySellIn += dailySellIn;
        }
      }
    }
    
    return monthlySellIn;
  }

  /**
   * 🚀 CHIRURGIA: Aggiorna il primo giorno con dati (ora dinamico)
   */
  private updateFirstDateWithData(): void {
    // Non più necessario - firstDateWithData è ora calcolato dinamicamente
    // via findFirstDateWithData() che usa la cache ottimizzata
  }
} 