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

export class ProgressiveCalculationService {
  private state: ProgressiveState;
  private performanceMetrics: PerformanceMetrics;

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
    date: string,
    dailyTotals: DailyTotals,
    previousDayTotals?: DailyTotals
  ): DailyTotals {
    if (!previousDayTotals) {
      return dailyTotals;
    }

    return {
      venditeTotali: previousDayTotals.venditeTotali + dailyTotals.venditeTotali,
      scorteTotali: previousDayTotals.scorteTotali + dailyTotals.scorteTotali,
      ordinatiTotali: previousDayTotals.ordinatiTotali + dailyTotals.ordinatiTotali,
      sellIn: previousDayTotals.sellIn + dailyTotals.sellIn
    };
  }

  /**
   * Ottiene i totali del giorno precedente
   */
  private getPreviousDayTotals(date: string): DailyTotals | undefined {
    const currentDate = new Date(date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    
    const previousDateString = previousDate.toISOString().split('T')[0];
    return this.state.progressiveTotals.get(previousDateString);
  }

  /**
   * Aggiorna una cella e ricalcola TUTTO dal primo giorno con dati
   * Gestisce correttamente le modifiche retroattive
   */
  public updateCellAndRecalculate(
    date: string,
    newEntries: ProductEntry[]
  ): ProgressiveCalculationResult {
    const startTime = performance.now();

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
   * Salva i dati di una cella senza ricalcoli
   */
  private saveCellData(date: string, newEntries: ProductEntry[]): void {
    const dailyTotals = this.calculateDailyTotals(newEntries);
    
    const progressiveEntry: ProgressiveEntry = {
      date,
      entries: newEntries,
      dailyTotals,
      progressiveTotals: dailyTotals, // Temporaneo, sarà ricalcolato
      previousDayTotals: undefined
    };

    this.state.entries.set(date, progressiveEntry);
  }

  /**
   * Trova il primo giorno con dati
   */
  private findFirstDateWithData(): string | undefined {
    const dates = Array.from(this.state.entries.keys()).sort();
    return dates[0] || undefined;
  }

  /**
   * Ricalcola tutti i totali progressivi da una data specifica
   */
  private recalculateFromDate(startDate: string): void {
    const dates = Array.from(this.state.entries.keys())
      .filter(date => date >= startDate)
      .sort();

    let previousTotals: DailyTotals | undefined;
    
    for (const date of dates) {
      const entry = this.state.entries.get(date);
      if (entry) {
        // Ricalcola totali progressivi
        const newProgressiveTotals = this.calculateProgressiveTotals(
          date,
          entry.dailyTotals,
          previousTotals
        );
        
        // Aggiorna entry
        entry.progressiveTotals = newProgressiveTotals;
        if (previousTotals) {
          entry.previousDayTotals = previousTotals;
        }
        
        // Salva
        this.state.entries.set(date, entry);
        this.state.progressiveTotals.set(date, newProgressiveTotals);
        
        // Prepara per il giorno successivo
        previousTotals = newProgressiveTotals;
      }
    }
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
   * Esporta lo stato corrente
   */
  public exportState(): ProgressiveState {
    return {
      entries: new Map(this.state.entries),
      progressiveTotals: new Map(this.state.progressiveTotals),
      calculationConfig: { ...this.state.calculationConfig },
      lastUpdated: this.state.lastUpdated,
      firstDateWithData: this.state.firstDateWithData
    };
  }

  /**
   * Importa uno stato
   */
  public importState(state: ProgressiveState): void {
    this.state = {
      entries: new Map(state.entries),
      progressiveTotals: new Map(state.progressiveTotals),
      calculationConfig: { ...state.calculationConfig },
      lastUpdated: state.lastUpdated,
      firstDateWithData: state.firstDateWithData
    };
  }

  /**
   * Carica i dati focusReferencesData nel sistema progressivo
   */
  public loadFocusReferencesData(date: string, focusReferencesData: any[]): void {
    if (!focusReferencesData || focusReferencesData.length === 0) {
      return;
    }

    // Converti FocusReferenceData in ProductEntry[]
    const productEntries: ProductEntry[] = focusReferencesData.map(focusData => ({
      productId: focusData.referenceId,
      productName: `Reference ${focusData.referenceId}`, // Placeholder
      vendite: parseFloat(focusData.soldPieces) || 0,
      scorte: parseFloat(focusData.stockPieces) || 0,
      ordinati: parseFloat(focusData.orderedPieces) || 0,
      prezzoNetto: parseFloat(focusData.netPrice) || 0, // Usa il prezzo netto dalla referenza
      categoria: 'focus', // Categoria per le referenze focus
      colore: '#007bff', // Colore blu per le referenze focus
      sellIn: 0 // Sarà calcolato dal sistema
    }));

    // Salva i dati nel sistema progressivo
    this.saveCellData(date, productEntries);
    
    // Aggiorna il primo giorno con dati
    this.updateFirstDateWithData();
    
    // Ricalcola se necessario
    const firstDateWithData = this.findFirstDateWithData();
    if (firstDateWithData) {
      this.recalculateFromDate(firstDateWithData);
    }
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

    const isFirstDay = date === this.state.firstDateWithData;
    
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
    const firstDate = this.state.firstDateWithData;
    if (!firstDate) return [];

    
    const dates = Array.from(this.state.entries.keys())
      .filter(d => d >= firstDate && d <= date)
      .sort();

    // Raccoglie tutti i prodotti da tutte le date
    const allProducts = new Map<string, ProductEntry>();

    for (const d of dates) {
      const entry = this.state.entries.get(d);
      if (entry) {
        for (const product of entry.entries) {
          const existing = allProducts.get(product.productId);
          if (existing) {
            // Accumula i valori
            existing.vendite += product.vendite;
            existing.scorte += product.scorte;
            existing.ordinati += product.ordinati;
          } else {
            // Prima volta che vediamo questo prodotto
            allProducts.set(product.productId, { ...product });
          }
        }
      }
    }

    return Array.from(allProducts.values());
  }

  /**
   * Calcola il sell-in totale del sistema progressivo
   */
  public getTotalSellIn(): number {
    let totalSellIn = 0;
    const entriesCount = this.state.entries.size;
    
    for (const [date, entry] of this.state.entries) {
      if (entry.progressiveTotals) {
        totalSellIn += entry.progressiveTotals.sellIn;
      }
    }
    
    return totalSellIn;
  }

  /**
   * Calcola il sell-in mensile per un mese specifico
   */
  public getMonthlySellIn(year: number, month: number): number {
    let monthlySellIn = 0;
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    // Calcola solo il sell-in delle entries del mese specifico
    for (const [date, entry] of this.state.entries) {
      if (date >= startDate && date <= endDate) {
        // Calcola il sell-in giornaliero per questa entry
        const dailySellIn = entry.entries.reduce((total, product) => {
          return total + (product.ordinati * product.prezzoNetto);
        }, 0);
        monthlySellIn += dailySellIn;
      }
    }
    
    return monthlySellIn;
  }

  /**
   * Aggiorna il primo giorno con dati
   */
  private updateFirstDateWithData(): void {
    const firstDate = this.findFirstDateWithData();
    this.state.firstDateWithData = firstDate;
  }
} 