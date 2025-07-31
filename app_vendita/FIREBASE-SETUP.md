# Configurazione Firebase

Questo documento spiega come configurare Firebase per l'app di vendita.

## 1. Setup del Progetto Firebase

### 1.1. Creare un Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca su "Crea un progetto"
3. Inserisci il nome del progetto (es. "app-vendita")
4. Segui la procedura guidata

### 1.2. Abilitare i Servizi

Nel progetto Firebase, abilita i seguenti servizi:

- **Firestore Database**: Database NoSQL per i dati del calendario
- **Authentication**: Autenticazione utenti (opzionale per ora)
- **Storage**: Archiviazione file (per future funzionalità)

### 1.3. Configurare Firestore

1. Vai su "Firestore Database" nel menu laterale
2. Clicca su "Crea database"
3. Scegli "Modalità test" per iniziare
4. Seleziona la regione più vicina (es. europe-west3)

## 2. Configurazione dell'App

### 2.1. Ottenere le Credenziali

1. Nel progetto Firebase, vai su "Impostazioni progetto" (icona ingranaggio)
2. Seleziona la scheda "Generali"
3. Scorri fino a "Le tue app" e clicca su "Web" (</>) 
4. Registra l'app con un nome (es. "app-vendita-web")
5. Copia le credenziali di configurazione

### 2.2. Configurare le Variabili d'Ambiente

Crea un file `.env` nella root del progetto con le seguenti variabili:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Configurazione per sviluppo locale
FIREBASE_USE_EMULATORS=true
```

## 3. Regole Firestore

Le regole Firestore sono già configurate nel file `firestore.rules`. Assicurati che siano:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regole per Calendar Entries
    match /calendarEntries/{entryId} {
      allow read, write: if request.auth != null;
    }
    
    // Regole per Users
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Regole per Sales Points
    match /salesPoints/{salesPointId} {
      allow read, write: if request.auth != null;
    }
    
    // Regole per Excel Data
    match /excelData/{dataId} {
      allow read, write: if request.auth != null;
    }
    
    // Regole per Focus References
    match /focusReferences/{referenceId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Sviluppo Locale con Emulatori

### 4.1. Installare Firebase CLI

```bash
npm install -g firebase-tools
```

### 4.2. Login e Inizializzazione

```bash
firebase login
firebase init
```

### 4.3. Avviare gli Emulatori

```bash
firebase emulators:start
```

Gli emulatori saranno disponibili su:
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Storage: http://localhost:9199
- UI: http://localhost:4000

## 5. Struttura dei Dati

### 5.1. Collezioni Firestore

```
calendarEntries/
  ├── {entryId}/
  │   ├── id: string
  │   ├── date: timestamp
  │   ├── userId: string
  │   ├── salesPointId: string
  │   ├── notes: string
  │   ├── chatNotes: array
  │   ├── sales: array
  │   ├── actions: array
  │   ├── hasProblem: boolean
  │   ├── problemDescription: string
  │   ├── tags: array
  │   ├── repeatSettings: object
  │   ├── focusReferencesData: array
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp

users/
  ├── {userId}/
  │   ├── id: string
  │   ├── name: string
  │   ├── email: string
  │   ├── role: string
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp

salesPoints/
  ├── {salesPointId}/
  │   ├── id: string
  │   ├── name: string
  │   ├── address: string
  │   ├── manager: string
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp

excelData/
  ├── {dataId}/
  │   ├── id: string
  │   ├── data: object
  │   ├── importedAt: timestamp
  │   └── userId: string

focusReferences/
  ├── {referenceId}/
  │   ├── id: string
  │   ├── name: string
  │   ├── category: string
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp
```

## 6. Funzionalità Implementate

### 6.1. Servizi Firebase

- **FirebaseCalendarService**: Gestisce le operazioni CRUD con Firebase
- **useFirebaseCalendar**: Hook React per l'integrazione Firebase
- **FirebaseSyncIndicator**: Componente UI per lo stato di sincronizzazione

### 6.2. Operazioni Supportate

- ✅ Creazione entry del calendario
- ✅ Aggiornamento entry esistenti
- ✅ Eliminazione entry
- ✅ Sincronizzazione real-time
- ✅ Gestione errori di connessione
- ✅ Indicatori di stato visivi

### 6.3. Sicurezza

- Regole Firestore configurate per autenticazione
- Validazione dati lato client
- Gestione errori robusta
- Timeout per operazioni asincrone

## 7. Troubleshooting

### 7.1. Errori Comuni

**Errore: "Firebase: Error (auth/network-request-failed)"**
- Verifica la connessione internet
- Controlla che le credenziali Firebase siano corrette

**Errore: "Firebase: Error (permission-denied)"**
- Verifica le regole Firestore
- Controlla che l'utente sia autenticato

**Errore: "Firebase: Error (unavailable)"**
- Verifica che il servizio Firebase sia disponibile
- Controlla le impostazioni del progetto

### 7.2. Debug

Per abilitare i log di debug Firebase, aggiungi:

```javascript
if (__DEV__) {
  console.log('Firebase config:', firebaseConfig);
}
```

## 8. Prossimi Passi

1. **Autenticazione**: Implementare login/logout utenti
2. **Offline Support**: Aggiungere cache locale per operazioni offline
3. **Push Notifications**: Configurare notifiche per eventi importanti
4. **Analytics**: Integrare Firebase Analytics per metriche
5. **Performance**: Ottimizzare query e indici Firestore 