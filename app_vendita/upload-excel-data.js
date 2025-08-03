const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc, serverTimestamp } = require('firebase/firestore');
const XLSX = require('xlsx');

// Configurazione Firebase del progetto app-vendita
const firebaseConfig = {
  apiKey: "AIzaSyDeYjHqD7eDBWakaO0TJ8yalU9TPGzVCeE",
  authDomain: "app-vendita.firebaseapp.com",
  projectId: "app-vendita",
  storageBucket: "app-vendita.firebasestorage.app",
  messagingSenderId: "188147445527",
  appId: "1:188147445527:web:c7c0441ae91de210165152",
  measurementId: "G-WLF5DHT15H"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadExcelData(filePath) {
  try {
    console.log('📊 Caricamento dati Excel da:', filePath);
    
    // Leggi il file Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converti in JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Dati Excel letti: ${data.length} righe`);
    console.log('📋 Struttura dati (primi 3 record):');
    data.slice(0, 3).forEach((row, index) => {
      console.log(`  ${index + 1}.`, Object.keys(row));
    });
    
    // Conta i dati attuali
    console.log('🔍 Contando i dati attuali...');
    const existingDocs = await getDocs(collection(db, 'excelData'));
    console.log(`📊 Dati attuali: ${existingDocs.size} documenti`);
    
    // Conferma prima di procedere
    console.log('\n⚠️  ATTENZIONE: Questo eliminerà tutti i dati Excel esistenti!');
    console.log('   Dati da eliminare:', existingDocs.size, 'documenti');
    console.log('   Dati da caricare:', data.length, 'righe');
    
    // Chiedi conferma (in un ambiente reale, potresti voler usare readline)
    console.log('\n✅ Procedendo con il caricamento...');
    
    // Elimina dati esistenti e carica nuovi dati
    const batch = writeBatch(db);
    
    // Elimina tutti i documenti esistenti
    existingDocs.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Aggiungi nuovi dati
    data.forEach((item, index) => {
      const docRef = doc(collection(db, 'excelData'));
      batch.set(docRef, {
        ...item,
        createdAt: serverTimestamp(),
        rowIndex: index + 1 // Aggiungi indice per riferimento
      });
    });
    
    // Esegui il batch
    await batch.commit();
    
    console.log('✅ Caricamento completato!');
    console.log(`   ✅ Eliminati: ${existingDocs.size} documenti`);
    console.log(`   ✅ Caricati: ${data.length} documenti`);
    
  } catch (error) {
    console.error('❌ Errore nel caricamento:', error);
  }
}

// Uso dello script
const filePath = './agenti_clienti_luglio25_completo_mail_cell.xlsx'; // Percorso del tuo file
uploadExcelData(filePath); 