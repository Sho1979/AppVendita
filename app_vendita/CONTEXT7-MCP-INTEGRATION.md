# Context 7 - Integrazione MCP per Documentazione Codice

## 🎯 Scopo dell'Integrazione

Context7 è un **server MCP per documentazione aggiornata del codice** che fornisce:

- **Documentazione in tempo reale** per qualsiasi libreria
- **Esempi di codice** sempre aggiornati
- **Integrazione diretta** con AI coding assistants
- **Supporto per React Native, Expo, TypeScript** e molte altre librerie

## 🔧 Configurazione MCP

### 1. File di Configurazione MCP

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    }
  }
}
```

### 2. Strumenti Disponibili

Context7 MCP fornisce i seguenti strumenti:

#### `resolve-library-id`

Risolve un nome generico di libreria in un ID Context7 compatibile.

- **Parametri**: `libraryName` (richiesto)

#### `get-library-docs`

Recupera documentazione per una libreria usando un ID Context7 compatibile.

- **Parametri**:
  - `context7CompatibleLibraryID` (richiesto): ID esatto Context7 (es. `/mongodb/docs`, `/vercel/next.js`)
  - `topic` (opzionale): Argomento specifico (es. "routing", "hooks")
  - `tokens` (opzionale, default 10000): Numero massimo di token

## 🚀 Come Utilizzare

### 1. Integrazione con AI Assistant

Context7 si integra automaticamente con l'AI assistant tramite MCP per:

- **Documentazione aggiornata** durante lo sviluppo
- **Esempi di codice** sempre al passo con le versioni
- **Setup e configurazione** step-by-step
- **Best practices** per ogni libreria

### 2. Esempi di Utilizzo

#### Ricerca Libreria

```
"Risolvi l'ID per React Native"
→ Context7 trova: `/facebook/react-native`
```

#### Documentazione Specifica

```
"Mostra documentazione per Expo Router"
→ Context7 fornisce: documentazione aggiornata + esempi
```

#### Topic Specifico

```
"Come implementare autenticazione con Firebase"
→ Context7 fornisce: guide + esempi + best practices
```

## 📊 Librerie Supportate

Context7 supporta migliaia di librerie, incluse:

### React Native & Expo

- ✅ React Native
- ✅ Expo SDK
- ✅ React Navigation
- ✅ React Native Elements
- ✅ React Native Paper

### Backend & Database

- ✅ Firebase
- ✅ Supabase
- ✅ MongoDB
- ✅ PostgreSQL
- ✅ Prisma

### UI & Styling

- ✅ Tailwind CSS
- ✅ Material-UI
- ✅ Chakra UI
- ✅ Styled Components

## 🎯 Vantaggi dell'Integrazione

1. **Documentazione Sempre Aggiornata**: Non più esempi obsoleti
2. **Esempi di Codice Reali**: Codice funzionante e testato
3. **Setup Automatico**: Guide step-by-step per ogni libreria
4. **Best Practices**: Suggerimenti per codice production-ready
5. **Integrazione MCP**: Comunicazione diretta con l'AI assistant

## 🔄 Workflow di Sviluppo

1. **Domanda**: Chiedi all'AI assistant come implementare una funzionalità
2. **Context7**: L'AI usa Context7 per ottenere documentazione aggiornata
3. **Implementazione**: Ricevi esempi di codice funzionanti
4. **Verifica**: Il codice è sempre al passo con le versioni più recenti

## 🛠️ Configurazione Avanzata

### Regole Automatiche

Aggiungi questa regola per invocare automaticamente Context7:

```json
{
  "calls": [
    {
      "match": "when the user requests code examples, setup or configuration steps, or library/API documentation",
      "tool": "context7"
    }
  ]
}
```

### Uso Diretto con ID Libreria

Se conosci già la libreria, usa l'ID diretto:

```
"implement basic authentication with supabase. use library /supabase/supabase for api and docs"
```

## 🚨 Troubleshooting

### Errori Comuni

#### Module Not Found

```json
{
  "mcpServers": {
    "context7": {
      "command": "bunx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

#### ESM Resolution Issues

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "--node-options=--experimental-vm-modules",
        "@upstash/context7-mcp@1.0.6"
      ]
    }
  }
}
```

#### TLS/Certificate Issues

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "--node-options=--experimental-fetch",
        "@upstash/context7-mcp"
      ]
    }
  }
}
```

## 🎉 Pronto per l'Uso!

Context7 è ora integrato con MCP e pronto per migliorare il tuo sviluppo!

### Prossimi Passi:

1. ✅ Configurazione MCP completata
2. ✅ Server Context7 installato
3. ✅ Integrazione con AI assistant attiva
4. 🚀 Inizia a ricevere documentazione aggiornata automaticamente

---

**Nota**: Context7 fornisce documentazione aggiornata per migliaia di librerie. L'integrazione avviene tramite MCP, permettendo all'AI assistant di accedere a documentazione sempre aggiornata durante lo sviluppo.
