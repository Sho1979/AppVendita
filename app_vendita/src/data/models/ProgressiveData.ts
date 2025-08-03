// Modelli per il sistema di calcolo progressivo
// Mantiene compatibilità con i modelli esistenti

export interface ProductEntry {
  productId: string; // PBCO, PUT2, PUB2, PSU2, etc.
  vendite: number;
  scorte: number;
  ordinati: number;
  prezzoNetto: number; // Prezzo netto per il calcolo del sell-in
  categoria: string;
  colore: string;
  tooltip?: string;
}

export interface DailyTotals {
  venditeTotali: number;
  scorteTotali: number;
  ordinatiTotali: number;
  sellIn: number;
}

export interface ProgressiveEntry {
  date: string; // YYYY-MM-DD
  entries: ProductEntry[];
  dailyTotals: DailyTotals;
  progressiveTotals: DailyTotals; // Accumulo progressivo
  previousDayTotals?: DailyTotals; // Per calcolo progressivo
}

export interface ProgressiveCalculationResult {
  dailyData: ProgressiveEntry;
  updatedProgressiveTotals: DailyTotals;
  sellInCalculated: number;
}

// Configurazione per calcoli
export interface CalculationConfig {
  prezzoUnitario: number;
  tassaVendita: number;
  scontoPercentuale: number;
}

// Stato per gestione progressiva
export interface ProgressiveState {
  entries: Map<string, ProgressiveEntry>;
  progressiveTotals: Map<string, DailyTotals>;
  calculationConfig: CalculationConfig;
  lastUpdated: string;
  firstDateWithData?: string; // Primo giorno con dati
}

// Tipi per validazione
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Tipi per performance tracking
export interface PerformanceMetrics {
  calculationTime: number;
  entriesProcessed: number;
  cacheHits: number;
  cacheMisses: number;
}

// Nuovi modelli per visualizzazione differenziata
export interface CellDisplayData {
  // Dati originali inseriti nel form
  originalEntries: ProductEntry[];
  // Dati progressivi calcolati
  progressiveEntries: ProductEntry[];
  // Modalità di visualizzazione
  displayMode: 'original' | 'progressive';
  // Se è il primo giorno con dati
  isFirstDay: boolean;
  // Totali per visualizzazione
  displayTotals: DailyTotals;
}

export interface CellVisualizationResult {
  // Dati da mostrare nella cella
  displayData: CellDisplayData;
  // Totali progressivi per calcoli successivi
  progressiveTotals: DailyTotals;
  // Sell-in progressivo
  sellInProgressivo: number;
} 