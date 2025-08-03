const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch } = require('firebase/firestore');

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

async function deleteSalesPoints() {
  try {
    console.log('🔍 Contando i dati salesPoints attuali...');
    
    // Conta i documenti attuali
    const existingDocs = await getDocs(collection(db, 'salesPoints'));
    console.log(`📊 Dati salesPoints attuali: ${existingDocs.size} documenti`);
    
    if (existingDocs.size === 0) {
      console.log('✅ Nessun documento salesPoints da eliminare');
      return;
    }
    
    // Mostra alcuni esempi
    console.log('📋 Primi 3 documenti:');
    existingDocs.docs.slice(0, 3).forEach((doc, index) => {
      console.log(`  ${index + 1}. ID: ${doc.id}`);
      console.log(`     Dati:`, doc.data());
    });
    
    // Conferma prima di procedere
    console.log('\n⚠️  ATTENZIONE: Questo eliminerà tutti i dati salesPoints!');
    console.log('   Dati da eliminare:', existingDocs.size, 'documenti');
    
    console.log('\n✅ Procedendo con la cancellazione...');
    
    // Elimina tutti i documenti
    const batch = writeBatch(db);
    
    existingDocs.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Esegui il batch
    await batch.commit();
    
    console.log('✅ Cancellazione completata!');
    console.log(`   ✅ Eliminati: ${existingDocs.size} documenti salesPoints`);
    
  } catch (error) {
    console.error('❌ Errore nella cancellazione:', error);
  }
}

deleteSalesPoints(); 