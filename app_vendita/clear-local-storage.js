// Script per pulire completamente il localStorage locale
// Mantiene solo: excel-storage (listino e agenti/clienti)
// Cancella tutto il resto

console.log('🧹 Iniziando pulizia completa localStorage locale...');

function clearLocalStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      // Salva solo i dati essenziali
      const excelData = localStorage.getItem('excel-storage');
      
      // Cancella TUTTO
      localStorage.clear();
      
      // Ripristina solo i dati essenziali
      if (excelData) {
        localStorage.setItem('excel-storage', excelData);
        console.log('✅ Mantenuti dati essenziali (listino e agenti/clienti)');
      }
      
      console.log('🧹 localStorage locale pulito completamente!');
      console.log('📊 Spazio liberato per nuovi dati');
    } else {
      console.log('❌ localStorage non disponibile');
    }
  } catch (error) {
    console.log('❌ Errore durante la pulizia:', error);
  }
}

// Esegui pulizia
clearLocalStorage();

console.log('✅ Pulizia localStorage completata!'); 