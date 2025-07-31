import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configurazione Firebase
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

// Inizializza i servizi Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Configurazione per sviluppo locale
if (__DEV__ && false) { // Disabilitato temporaneamente per usare Firebase Production
  try {
    // Connetti agli emulatori Firebase per sviluppo locale
    connectFirestoreEmulator(db, 'localhost', 8081);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔥 Firebase: Connesso agli emulatori locali');
  } catch {
    console.log('🔥 Firebase: Emulatori già connessi o non disponibili');
  }
} else {
  console.log('🔥 Firebase: Connesso a Firebase Production');
}

export default app; 