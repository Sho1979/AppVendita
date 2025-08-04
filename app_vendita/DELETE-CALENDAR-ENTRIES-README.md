# Script per Cancellare Tutte le Calendar Entries

Questo script elimina tutte le calendar entries dal database Firestore per testare l'app da zero senza interferenze.

## ⚠️ ATTENZIONE

**Questo script elimina PERMANENTEMENTE tutte le calendar entries dal database Firestore.**
**L'operazione non può essere annullata.**

## Come Usare lo Script

### Prerequisiti

1. Assicurati di avere Node.js installato
2. Installa le dipendenze Firebase se non sono già installate:
   ```bash
   npm install firebase
   ```

### Esecuzione

1. Apri un terminale nella cartella `app_vendita`
2. Esegui lo script:
   ```bash
   node delete-calendar-entries.js
   ```

### Cosa Fa lo Script

1. Si connette al database Firestore usando la configurazione dell'app
2. Recupera tutte le calendar entries dalla collezione `calendarEntries`
3. Elimina ogni entry una per una
4. Mostra il progresso e il numero totale di entries eliminate

### Output Esempio

```
🗑️ Inizio cancellazione di tutte le calendar entries...
📊 Trovate 15 calendar entries da eliminare
🗑️ Eliminata entry: abc123
🗑️ Eliminata entry: def456
...
✅ Tutte le calendar entries sono state eliminate con successo!
📊 Eliminate 15 entries totali
🎉 Script completato con successo!
```

### Sicurezza

- Lo script elimina SOLO le calendar entries
- NON tocca altri dati (users, sales points, excel data, etc.)
- Usa la stessa configurazione Firebase dell'app
- Include gestione degli errori

### In Caso di Problemi

Se lo script fallisce, controlla:
1. La connessione internet
2. Le regole di sicurezza Firestore
3. I log di errore per dettagli specifici

## Ripristino

Se hai bisogno di ripristinare i dati, dovrai:
1. Avere un backup delle calendar entries
2. Ricreare manualmente le entries attraverso l'app
3. O utilizzare un backup del database Firestore

## Note

- Lo script è progettato per essere eseguito una tantum
- Non modifica il codice dell'app
- È sicuro da eseguire in ambiente di sviluppo
- Può essere eliminato dopo l'uso 