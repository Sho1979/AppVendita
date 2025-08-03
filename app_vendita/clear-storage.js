// Script per pulire lo storage mantenendo solo dati essenziali
// Mantiene: excel-storage (listino e agenti/clienti)
// Cancella: calendar-storage, filters-storage

console.log('🧹 Iniziando pulizia storage...');

// Funzione per pulire storage specifico
function clearStorage(storageName) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(storageName);
      console.log(`✅ Pulito: ${storageName}`);
    }
  } catch (error) {
    console.log(`❌ Errore pulendo ${storageName}:`, error);
  }
}

// Funzione per mantenere solo dati essenziali
function preserveEssentialData() {
  try {
    if (typeof localStorage !== 'undefined') {
      // Mantieni solo excel-storage (listino e agenti/clienti)
      const excelData = localStorage.getItem('excel-storage');
      
      // Cancella tutto
      localStorage.clear();
      
      // Ripristina solo i dati essenziali
      if (excelData) {
        localStorage.setItem('excel-storage', excelData);
        console.log('✅ Mantenuti dati essenziali (listino e agenti/clienti)');
      }
      
      console.log('🧹 Storage pulito con successo!');
    }
  } catch (error) {
    console.log('❌ Errore durante la pulizia:', error);
  }
}

// Esegui pulizia
preserveEssentialData();

console.log('✅ Pulizia completata!'); 