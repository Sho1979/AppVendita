# ARCHITECTURE.md - Prompt Legge per React Native

## **AppVendita - Gestione Vendite Multi-Piattaforma**

### **Obiettivo del Progetto**

Creare un'applicazione **production-grade** per la gestione delle vendite con calendario interattivo, utilizzando **React Native + Expo** per massima compatibilità e performance.

### **Stack Tecnologico**

- **React Native 0.76.3** - Framework multi-piattaforma
- **Expo SDK 52** - Piattaforma di sviluppo
- **TypeScript** - Type safety e sviluppo professionale
- **React Navigation 6** - Navigazione nativa
- **react-native-calendars** - Calendario professionale e malleabile
- **AsyncStorage** - Persistenza dati locale
- **Vector Icons** - Icone native
- **XLSX** - Importazione dati Excel

### **Architettura del Progetto**

#### **Struttura delle Cartelle**

```
src/
├── data/
│   ├── models/           # Modelli dati TypeScript
│   └── repositories/     # Repository pattern
├── domain/
│   ├── entities/         # Entità di business
│   └── usecases/         # Casi d'uso
├── presentation/
│   ├── components/       # Componenti riutilizzabili
│   ├── pages/           # Pagine principali
│   └── providers/       # Context e stati
└── core/
    ├── services/         # Servizi core
    └── utils/           # Utility
```

### **Modelli Dati (TypeScript)**

#### **User Model**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'manager';
  salesPoints: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### **SalesPoint Model**

```typescript
interface SalesPoint {
  id: string;
  name: string;
  location: string;
  managerId: string;
  agents: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### **CalendarEntry Model**

```typescript
interface CalendarEntry {
  id: string;
  date: Date;
  userId: string;
  salesPointId: string;
  actions: {
    type: string;
    count: number;
    notes?: string;
  }[];
  sales: {
    product: string;
    quantity: number;
    value: number;
    notes?: string;
  }[];
  hasProblem: boolean;
  problemDescription?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **ExcelRow Model (Nuovo)**

```typescript
interface ExcelRow {
  id: string;
  linea: string;
  amCode: string;
  namCode: string;
  agenteCode: string;
  agenteName: string;
  insegnaCliente: string;
  codiceCliente: string;
  cliente: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Agent Model (Nuovo)**

```typescript
interface Agent {
  code: string;
  name: string;
  amCode: string;
  namCode: string;
  line: string;
}
```

### **Logica Applicativa Approfondita (Il Flusso dei Dati)**

#### **Scenario 1: App Open**

1. **Init**: App si avvia, `MainCalendarPage` si costruisce
2. **Lettura Stato Filtri**: Legge `activeFiltersProvider` (valori default)
3. **Caricamento Dati Excel**: `ExcelImportService` carica dati da AsyncStorage
4. **Richiesta Dati**: `calendarDataProvider` esegue query con filtri
5. **Stato di Caricamento**: UI mostra `ActivityIndicator`
6. **Ricezione Dati**: `calendarDataProvider` espone dati, UI si ricostruisce
7. **Rendering Celle**: Ogni `CalendarCell` riceve i suoi dati specifici

#### **Scenario 2: Filter Change (Filtri Progressivi)**

1. **Azione Utente**: Utente seleziona filtri multipli
2. **Aggiornamento Stato**: `selectedFilterItems` si aggiorna
3. **Filtro Progressivo**: `getFilteredData()` applica filtri cumulativi
4. **Rilevamento Automatico**: Sistema trova agente associato al punto vendita
5. **Aggiornamento UI**: Sezione "Filtri Attivi" mostra agente e punto vendita
6. **Reazione a Catena**: `calendarDataProvider` si invalida e riesegue
7. **Nuovo Ciclo**: Processo riparte dal punto 4 dello Scenario 1

#### **Scenario 3: Excel Import**

1. **Azione Utente**: Utente importa file Excel
2. **Processamento**: `ExcelImportService` parsa il file
3. **Conversione Dati**: Dati convertiti in modelli TypeScript
4. **Salvataggio**: Dati salvati in AsyncStorage tramite Repository
5. **Aggiornamento UI**: Filtri si aggiornano con nuovi dati
6. **Riavvio Filtri**: Sistema ricarica dati Excel per filtri

#### **Scenario 4: Cell Click & Save**

1. **Azione Utente**: Click su `CalendarCell`
2. **Apertura Form**: Si apre `FormInserimentoModal`
3. **Modifica e Salvataggio**: Utente compila e salva
4. **Scrittura Dati**: Dati salvati in AsyncStorage
5. **Aggiornamento UI**: Cella si ricostruisce con nuovi dati

### **Sistema di Filtri Progressivi (Nuovo)**

#### **Logica di Filtro Progressivo**

```typescript
// Filtra i dati Excel in base alle selezioni precedenti
const filteredExcelRows = excelRows.filter(row => {
  return selectedItems.every(selectedItem => {
    return (
      row.linea === selectedItem ||
      row.amCode === selectedItem ||
      row.namCode === selectedItem ||
      row.agenteCode === selectedItem ||
      row.insegnaCliente === selectedItem ||
      row.codiceCliente === selectedItem ||
      row.cliente === selectedItem
    );
  });
});
```

#### **Rilevamento Automatico Agente-Punto Vendita**

```typescript
// Se abbiamo selezionato un punto vendita, trova l'agente associato
const selectedSalesPoint = selectedFilterItems.find(item => {
  return filteredExcelRows.some(row => 
    row.insegnaCliente === item ||
    row.codiceCliente === item ||
    row.cliente === item
  );
});

if (selectedSalesPoint) {
  const relatedRow = filteredExcelRows.find(row => 
    row.insegnaCliente === selectedSalesPoint ||
    row.codiceCliente === selectedSalesPoint ||
    row.cliente === selectedSalesPoint
  );

  if (relatedRow) {
    autoDetectedAgent = {
      code: relatedRow.agenteCode,
      name: relatedRow.agenteName,
      amCode: relatedRow.amCode,
      namCode: relatedRow.namCode,
      line: relatedRow.linea,
    };
  }
}
```

### **Ordine di Implementazione Suggerito (Roadmap)**

#### **Fase 0: Fondamenta**

- ✅ Creare progetto Expo con TypeScript
- ✅ Installare dipendenze core
- ✅ Configurare struttura cartelle

#### **Fase 1: La Spina Dorsale - Dati e Servizi**

- ✅ Creare modelli TypeScript (`User`, `SalesPoint`, `CalendarEntry`, `ExcelRow`, `Agent`)
- ✅ Implementare repository pattern con AsyncStorage
- ✅ Creare servizi per gestione dati
- ✅ Implementare `ExcelImportService`

#### **Fase 2: La Logica - Stato e Filtri**

- ✅ Implementare Context API per filtri attivi
- ✅ Creare provider per dati calendario
- ✅ Collegare filtri con dati calendario
- ✅ Implementare filtri progressivi
- ✅ Implementare rilevamento automatico agente-punto vendita

#### **Fase 3: La Scatola Vuota - UI di Base**

- ✅ Creare layout principale con React Navigation
- ✅ Implementare `react-native-calendars` con configurazione base
- ✅ Creare componenti filtri
- ✅ Implementare sezione "Filtri Attivi"

#### **Fase 4: Il Collegamento Vitale - UI + Stato**

- ✅ Collegare filtri con Context
- ✅ Collegare calendario con provider dati
- ✅ Implementare stati di caricamento
- ✅ Collegare importazione Excel con filtri

#### **✅ Fase 5: Il Cuore Interattivo - Cella e Form (Completata)**

- [x] Personalizzare celle calendario con dati vendita
- [x] Implementare indicatori problemi (bordo rosso)
- [x] Creare modal form per inserimento dati
- [x] Sistema ordini/vendite/stock integrato
- [x] Tooltip informativi avanzati

#### **✅ Fase 6: Rifinitura e Funzionalità Secondarie (Completata)**

- [x] Implementare tooltip e animazioni
- [x] Aggiungere selettore vista settimanale/mensile
- [x] Testing completo (45 test passanti)
- [x] Refactoring e ottimizzazioni
- [x] Performance optimization (React.memo, useCallback, useMemo)

#### **🔄 Fase 7: Produzione e Backend (In Corso)**

- [ ] Integrazione Firebase
- [ ] Deploy su piattaforme
- [ ] Monitoraggio performance
- [ ] Analytics e tracking

### **Componenti Chiave**

#### **MainCalendarPage**

- Gestisce filtri e calendario
- Responsive design
- Stati di caricamento
- **Nuovo**: Gestione filtri progressivi
- **Nuovo**: Rilevamento automatico agente-punto vendita

#### **FilterComponents**

- Dropdown per agenti
- Dropdown per punti vendita
- Reset filtri
- **Nuovo**: Filtri progressivi
- **Nuovo**: Selezione multipla
- **Nuovo**: Visualizzazione filtri attivi

#### **ExcelImportService**

- **Nuovo**: Parsing file Excel
- **Nuovo**: Conversione dati in modelli TypeScript
- **Nuovo**: Gestione errori importazione

#### **✅ CustomCalendarCell (Completato)**

- Visualizzazione dati vendita avanzata
- Indicatori problemi (bordo rosso)
- Tooltip informativi dettagliati
- Sistema progressivo integrato
- Interazione touch ottimizzata
- React.memo per performance
- Calcoli automatici sell-in

#### **✅ EntryFormModal (Completato)**

- Form completo per inserimento/modifica dati
- Validazione e sanitizzazione input
- Salvataggio con persistenza
- Integrazione sistema ordini/vendite/stock
- Gestione tag e problemi
- Sistema chat notes integrato

### **Requisiti Non-Funzionali**

- **Scalabilità**: Gestione efficiente di grandi dataset
- **Performance**: UI fluida e reattiva
- **Manutenibilità**: Codice pulito e ben strutturato
- **Testabilità**: Componenti testabili
- **Robustezza**: Gestione errori completa
- **Sicurezza**: Validazione input e sanitizzazione dati
- **Usabilità**: Filtri intuitivi e progressivi

### **Note di Implementazione**

- Utilizzare **TypeScript** per type safety
- Implementare **Error Boundaries** per gestione errori
- Usare **React.memo** per ottimizzazioni
- Implementare **lazy loading** per performance
- Aggiungere **logging** per debug
- Utilizzare **AsyncStorage** per persistenza locale
- **Nuovo**: Implementare filtri progressivi per UX migliore
- **Nuovo**: Rilevamento automatico relazioni agente-punto vendita
