# Context7 MCP Setup - AppVendita

## ✅ Configurazione Completata

Context7 MCP è ora configurato e funzionante nel progetto AppVendita.

### 📁 File di Configurazione

**`mcp-config.json`**:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp", "--transport", "stdio"],
      "env": {}
    }
  }
}
```

### 🧪 Test di Verifica

**Test di base**: `node test-context7-stdio.js`
- ✅ Inizializzazione MCP
- ✅ Protocol version: 2024-11-05
- ✅ Server: Context7 v1.0.14

**Test completo**: `node test-context7-tools.js`
- ✅ Lista strumenti disponibili
- ✅ Risoluzione librerie
- ✅ Funzionalità documentazione

### 🛠️ Strumenti Disponibili

1. **`resolve-library-id`**
   - Risolve nomi librerie in ID Context7
   - Esempio: "react" → "/facebook/react"

2. **`get-library-docs`**
   - Ottiene documentazione aggiornata
   - Supporta topic specifici
   - Configurabile numero di token

### 🎯 Come Usare

#### In Cursor/VS Code:
1. Apri le impostazioni MCP
2. Aggiungi la configurazione di `mcp-config.json`
3. Riavvia l'editor
4. Usa: "use context7" nei prompt

#### In altri client MCP:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp", "--transport", "stdio"]
    }
  }
}
```

### 📚 Esempi di Uso

```bash
# Ottenere documentazione React
use context7
implementa un componente React con hooks

# Ottenere documentazione specifica
use context7
mostrami esempi di useState e useEffect
```

### 🔧 Troubleshooting

**Problema**: Errore spawn
**Soluzione**: Usa `--transport stdio` e `shell: true`

**Problema**: Errore 404 documentazione
**Soluzione**: Normale per alcune librerie, prova con ID diversi

### 📈 Benefici

- ✅ **Documentazione aggiornata** in tempo reale
- ✅ **Esempi di codice** specifici
- ✅ **Supporto per 1000+ librerie**
- ✅ **Integrazione nativa** con AI coding assistants

### 🚀 Prossimi Passi

1. **Test in Cursor**: Verifica integrazione
2. **Documentazione progetto**: Usa Context7 per migliorare docs
3. **Sviluppo**: Sfrutta per nuove funzionalità

---

**Status**: ✅ **FUNZIONANTE**
**Versione**: Context7 v1.0.14
**Transport**: stdio
**Configurazione**: Completata 