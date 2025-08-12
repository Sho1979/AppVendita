// Adapter per convertire dati tra CalendarEntry e ProgressiveCalculationService
import { CalendarEntry } from '../data/models/CalendarEntry';
import { ProductEntry } from '../data/models/ProgressiveData';

export class DataAdapter {
  /**
   * Converte i dati di CalendarEntry in ProductEntry per il sistema progressivo
   */
  static calendarEntryToProductEntries(entry: CalendarEntry): ProductEntry[] {
    if (!entry.focusReferencesData || entry.focusReferencesData.length === 0) {
      return [];
    }

    const productEntries = entry.focusReferencesData.map(focusData => {
      // Gestisce i dati esistenti che potrebbero non avere netPrice
      let netPrice = 0;
      if (focusData.netPrice) {
        netPrice = parseFloat(focusData.netPrice) || 0;
      } else {
        // Prezzo di default per i dati esistenti (€2 come mostrato nel form)
        netPrice = 2.0;

      }

      return {
        productId: focusData.referenceId,
        vendite: parseFloat(focusData.soldPieces) || 0,
        scorte: parseFloat(focusData.stockPieces) || 0,
        ordinati: parseFloat(focusData.orderedPieces) || 0,
        prezzoNetto: netPrice,
        categoria: 'Prodotto', // Default category
        colore: 'green', // Default color
        tooltip: `V: ${focusData.soldPieces}, S: ${focusData.stockPieces}, O: ${focusData.orderedPieces}`
      };
    });



    return productEntries;
  }

  /**
   * Converte i dati progressivi di nuovo in formato CalendarEntry
   */
  static productEntriesToFocusReferencesData(productEntries: ProductEntry[]) {
    return productEntries.map(product => ({
      referenceId: product.productId,
      orderedPieces: product.ordinati.toString(),
      soldPieces: product.vendite.toString(),
      stockPieces: product.scorte.toString(),
      netPrice: product.prezzoNetto.toString(), // Aggiungi il prezzo netto
      soldVsStockPercentage: product.scorte > 0 ? 
        ((product.vendite / product.scorte) * 100).toFixed(1) : '0.0'
    }));
  }

  /**
   * Ottiene la data in formato stringa per il sistema progressivo
   */
  static getDateString(entry: CalendarEntry): string {
    // Normalizza in chiave DATA LOCALE (YYYY-MM-DD), coerente con WeekCalendar/CustomCalendarCell
    const toLocalKey = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (entry.date instanceof Date) {
      return toLocalKey(entry.date);
    }
    if (typeof entry.date === 'string') {
      // Se è già in formato YYYY-MM-DD restituisci com'è; altrimenti prova a parse locale
      if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return entry.date;
      const parsed = new Date(entry.date);
      if (!isNaN(parsed.getTime())) return toLocalKey(parsed);
    }
    // Fallback sicuro: data corrente locale
    console.warn('⚠️ Data non riconosciuta, uso data locale corrente:', entry.date);
    return toLocalKey(new Date());
  }

  /**
   * Verifica se un entry ha dati focus references
   */
  static hasFocusData(entry: CalendarEntry): boolean {
    return entry.focusReferencesData && entry.focusReferencesData.length > 0;
  }
} 