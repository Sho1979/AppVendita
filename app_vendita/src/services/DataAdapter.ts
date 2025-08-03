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
        console.log(`💰 DataAdapter: Usando prezzo di default €${netPrice} per ${focusData.referenceId}`);
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

    console.log(`📊 DataAdapter: Convertiti ${productEntries.length} entries per ${entry.date}:`, 
      productEntries.map(prod => ({
        productId: prod.productId,
        ordinati: prod.ordinati,
        prezzoNetto: prod.prezzoNetto,
        sellIn: prod.ordinati * prod.prezzoNetto
      }))
    );

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
    // Gestisce sia Date che stringhe
    if (entry.date instanceof Date) {
      return entry.date.toISOString().split('T')[0];
    } else if (typeof entry.date === 'string') {
      // Se è già una stringa, prova a estrarre la parte data
      return entry.date.split('T')[0];
    } else {
      // Fallback: usa la data corrente
      console.warn('⚠️ Data non riconosciuta, uso data corrente:', entry.date);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Verifica se un entry ha dati focus references
   */
  static hasFocusData(entry: CalendarEntry): boolean {
    return entry.focusReferencesData && entry.focusReferencesData.length > 0;
  }
} 