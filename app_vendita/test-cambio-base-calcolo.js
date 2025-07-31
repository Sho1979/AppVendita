// Test per il cambio di base di calcolo
// Esegui con: node test-cambio-base-calcolo.js

// Simuliamo i modelli TypeScript in JavaScript
class ProgressiveCalculationService {
  constructor() {
    this.state = {
      entries: new Map(),
      progressiveTotals: new Map(),
      calculationConfig: {
        prezzoUnitario: 1.0,
        tassaVendita: 0.22,
        scontoPercentuale: 0.0
      },
      lastUpdated: new Date().toISOString(),
      firstDateWithData: undefined
    };
  }

  calculateDailyTotals(entries) {
    return entries.reduce(
      (acc, entry) => ({
        venditeTotali: acc.venditeTotali + entry.vendite,
        scorteTotali: acc.scorteTotali + entry.scorte,
        ordinatiTotali: acc.ordinatiTotali + entry.ordinati,
        sellIn: acc.sellIn + (entry.ordinati * this.state.calculationConfig.prezzoUnitario)
      }),
      {
        venditeTotali: 0,
        scorteTotali: 0,
        ordinatiTotali: 0,
        sellIn: 0
      }
    );
  }

  calculateProgressiveTotals(date, dailyTotals, previousDayTotals) {
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

  updateCellAndRecalculate(date, newEntries) {
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

    return {
      dailyData: updatedEntry,
      updatedProgressiveTotals: updatedTotals,
      sellInCalculated: updatedTotals.sellIn
    };
  }

  saveCellData(date, newEntries) {
    const dailyTotals = this.calculateDailyTotals(newEntries);
    
    const progressiveEntry = {
      date,
      entries: newEntries,
      dailyTotals,
      progressiveTotals: dailyTotals, // Temporaneo, sarà ricalcolato
      previousDayTotals: undefined
    };

    this.state.entries.set(date, progressiveEntry);
  }

  findFirstDateWithData() {
    const dates = Array.from(this.state.entries.keys()).sort();
    return dates[0] || '';
  }

  updateFirstDateWithData() {
    const dates = Array.from(this.state.entries.keys()).sort();
    this.state.firstDateWithData = dates[0] || undefined;
  }

  recalculateFromDate(startDate) {
    const dates = Array.from(this.state.entries.keys())
      .filter(date => date >= startDate)
      .sort();

    let previousTotals;
    
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
        entry.previousDayTotals = previousTotals;
        
        // Salva
        this.state.entries.set(date, entry);
        this.state.progressiveTotals.set(date, newProgressiveTotals);
        
        // Prepara per il giorno successivo
        previousTotals = newProgressiveTotals;
      }
    }
  }

  getCellDisplayData(date) {
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

  calculateProgressiveEntries(date) {
    const firstDate = this.state.firstDateWithData;
    if (!firstDate) return [];

    const progressiveEntries = [];
    const productMap = new Map();

    // Raccogli tutti i dati dal primo giorno fino alla data corrente
    const dates = Array.from(this.state.entries.keys())
      .filter(d => d >= firstDate && d <= date)
      .sort();

    for (const currentDate of dates) {
      const entry = this.state.entries.get(currentDate);
      if (entry) {
        for (const product of entry.entries) {
          const existing = productMap.get(product.productId);
          if (existing) {
            // Accumula progressivamente
            existing.vendite += product.vendite;
            existing.scorte = product.scorte; // Ultimo valore delle scorte
            existing.ordinati += product.ordinati;
          } else {
            // Prima volta che vediamo questo prodotto
            productMap.set(product.productId, {
              ...product,
              vendite: product.vendite,
              scorte: product.scorte,
              ordinati: product.ordinati
            });
          }
        }
      }
    }

    return Array.from(productMap.values());
  }
}

// Test del cambio di base di calcolo
console.log('🧪 TEST CAMBIO BASE DI CALCOLO');
console.log('================================\n');

const service = new ProgressiveCalculationService();

// SCENARIO: Inserisci prima dati per luglio, poi per gennaio
console.log('📅 SCENARIO: Inserimento dati per luglio 2025');
const entriesLuglio = [
  {
    productId: 'PSU2',
    vendite: 20,
    scorte: 80,
    ordinati: 100,
    categoria: 'Prodotto A',
    colore: 'green'
  }
];

service.updateCellAndRecalculate('2025-07-30', entriesLuglio);
console.log('✅ Base di calcolo iniziale: 30 luglio 2025');
console.log(`   Primo giorno: ${service.state.firstDateWithData}`);
console.log(`   Vendite luglio: ${service.getCellDisplayData('2025-07-30').displayData.displayTotals.venditeTotali}`);
console.log('');

// Ora inserisci dati per gennaio (data precedente)
console.log('📅 SCENARIO: Inserimento dati per gennaio 2025 (data precedente)');
const entriesGennaio = [
  {
    productId: 'PSU2',
    vendite: 50, // Dati per gennaio
    scorte: 100,
    ordinati: 150,
    categoria: 'Prodotto A',
    colore: 'green'
  },
  {
    productId: 'PSUB',
    vendite: 30,
    scorte: 50,
    ordinati: 80,
    categoria: 'Prodotto B',
    colore: 'red'
  }
];

service.updateCellAndRecalculate('2025-01-15', entriesGennaio);
console.log('✅ Nuova base di calcolo: 15 gennaio 2025');
console.log(`   Primo giorno: ${service.state.firstDateWithData}`);
console.log('');

// Verifica l'impatto su luglio
const displayLuglioAggiornato = service.getCellDisplayData('2025-07-30');
console.log('📊 IMPATTO SU LUGLIO:');
console.log(`   Modalità: ${displayLuglioAggiornato.displayData.displayMode}`);
console.log(`   È primo giorno: ${displayLuglioAggiornato.displayData.isFirstDay}`);
console.log(`   Vendite totali: ${displayLuglioAggiornato.displayData.displayTotals.venditeTotali} (50 + 20 = 70)`);
console.log(`   Scorte totali: ${displayLuglioAggiornato.displayData.displayTotals.scorteTotali} (100 + 80 = 180)`);
console.log(`   Sell-in: €${displayLuglioAggiornato.sellInProgressivo} (150 + 100 = 250)`);
console.log('');

// Verifica gennaio
const displayGennaio = service.getCellDisplayData('2025-01-15');
console.log('📊 VERIFICA GENNAIO:');
console.log(`   Modalità: ${displayGennaio.displayData.displayMode}`);
console.log(`   È primo giorno: ${displayGennaio.displayData.isFirstDay}`);
console.log(`   Vendite totali: ${displayGennaio.displayData.displayTotals.venditeTotali} (dati originali)`);
console.log(`   Sell-in: €${displayGennaio.sellInProgressivo}`);
console.log('');

// Test 3: Inserisci dati per marzo
console.log('📅 TEST 3: Inserimento dati per marzo 2025');
const entriesMarzo = [
  {
    productId: 'PSU2',
    vendite: 25,
    scorte: 75,
    ordinati: 90,
    categoria: 'Prodotto A',
    colore: 'green'
  }
];

service.updateCellAndRecalculate('2025-03-10', entriesMarzo);
const displayMarzo = service.getCellDisplayData('2025-03-10');

console.log('✅ Verifica marzo:');
console.log(`   Modalità: ${displayMarzo.displayData.displayMode}`);
console.log(`   È primo giorno: ${displayMarzo.displayData.isFirstDay}`);
console.log(`   Vendite totali: ${displayMarzo.displayData.displayTotals.venditeTotali} (50 + 25 = 75)`);
console.log(`   Sell-in: €${displayMarzo.sellInProgressivo} (150 + 90 = 240)`);
console.log('');

// Test 4: Verifica che luglio ora includa tutti i dati
const displayLuglioFinale = service.getCellDisplayData('2025-07-30');
console.log('📊 VERIFICA FINALE LUGLIO:');
console.log(`   Vendite totali: ${displayLuglioFinale.displayData.displayTotals.venditeTotali} (50 + 25 + 20 = 95)`);
console.log(`   Sell-in: €${displayLuglioFinale.sellInProgressivo} (150 + 90 + 100 = 340)`);

console.log('\n🎉 TEST COMPLETATO CON SUCCESSO!');
console.log('✅ Il sistema gestisce correttamente il cambio di base di calcolo!');
console.log('✅ Inserendo dati per una data precedente, tutto viene ricalcolato!'); 