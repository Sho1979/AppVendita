export interface FocusReferenceData {
  referenceId: string;
  orderedPieces: string;
  soldPieces: string;
  stockPieces: string;
  soldVsStockPercentage: string;
  netPrice: string; // Prezzo netto per il calcolo del sell-in
} 