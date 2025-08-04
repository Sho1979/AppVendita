const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Configurazione Firebase - usa la stessa configurazione dell'app
const firebaseConfig = {
  apiKey: "AIzaSyDeYjHqD7eDBWakaO0TJ8yalU9TPGzVCeE",
  authDomain: "app-vendita.firebaseapp.com",
  projectId: "app-vendita",
  storageBucket: "app-vendita.firebasestorage.app",
  messagingSenderId: "188147445527",
  appId: "1:188147445527:web:c7c0441ae91de210165152",
  measurementId: "G-WLF5DHT15H"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllCalendarEntries() {
  try {
    console.log('🗑️ Inizio cancellazione di tutte le calendar entries...');
    
    // Recupera tutte le calendar entries
    const calendarEntriesRef = collection(db, 'calendarEntries');
    const querySnapshot = await getDocs(calendarEntriesRef);
    
    console.log(`📊 Trovate ${querySnapshot.size} calendar entries da eliminare`);
    
    if (querySnapshot.size === 0) {
      console.log('✅ Nessuna calendar entry trovata nel database');
      return;
    }
    
    // Elimina tutte le entries
    const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
      const docRef = doc(db, 'calendarEntries', docSnapshot.id);
      await deleteDoc(docRef);
      console.log(`🗑️ Eliminata entry: ${docSnapshot.id}`);
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ Tutte le calendar entries sono state eliminate con successo!');
    console.log(`📊 Eliminate ${querySnapshot.size} entries totali`);
    
  } catch (error) {
    console.error('❌ Errore durante la cancellazione delle calendar entries:', error);
    throw error;
  }
}

// Esegui lo script
deleteAllCalendarEntries()
  .then(() => {
    console.log('🎉 Script completato con successo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Errore fatale:', error);
    process.exit(1);
  }); 