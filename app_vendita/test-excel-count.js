const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function countExcelData() {
  try {
    console.log('🔍 Contando i dati Excel attuali...');
    
    const querySnapshot = await getDocs(collection(db, 'excelData'));
    
    console.log(`📊 Dati Excel attuali: ${querySnapshot.size} documenti`);
    
    if (querySnapshot.size > 0) {
      console.log('📋 Primi 3 documenti:');
      querySnapshot.docs.slice(0, 3).forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}`);
        console.log(`     Dati:`, doc.data());
      });
    }
    
  } catch (error) {
    console.error('❌ Errore nel conteggio:', error);
  }
}

countExcelData(); 