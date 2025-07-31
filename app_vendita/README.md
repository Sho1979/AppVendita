# App Vendita - Calendario Vendite

## 🚀 Avvio Rapido

### Metodo 1: Script Batch (Windows)

```bash
# Doppio click su start-app.bat
# oppure da terminale:
start-app.bat
```

### Metodo 2: Comando NPM

```bash
# Host locale fisso
npm run web-host

# Host LAN (accessibile da altri dispositivi)
npm run web-lan
```

### Metodo 3: Comando diretto

```bash
npx expo start --web --host localhost
```

## 📱 Accesso all'App

Una volta avviata, l'app sarà disponibile su:

- **Locale**: http://localhost:8081
- **LAN**: http://[IP-DISPOSITIVO]:8081

## 🔄 Refresh Automatico

L'app supporta il refresh automatico. Basta:

1. Salvare le modifiche ai file
2. L'app si ricaricherà automaticamente
3. Non serve riavviare il server

## 📋 Funzionalità Implementate

### ✅ Calendario

- **Vista Settimanale**: Celle grandi con sviluppo orizzontale
- **Vista Mensile**: Griglia compatta con indicatori
- **Navigazione**: Settimana/Mese con controlli
- **Indicatori**: Vendite (€), Azioni, Problemi (⚠)
- **Personalizzazione Avanzata**: Dati vendita, tooltip, indicatori problemi
- **Sistema Progressivo**: Calcoli automatici e visualizzazione in tempo reale

### ✅ Filtri Progressivi (Nuovo)

- **Filtri Cumulativi**: Selezione multipla che filtra progressivamente
- **Rilevamento Automatico**: Trova automaticamente l'agente associato al punto vendita
- **Visualizzazione Intelligente**: Mostra solo agente e punto vendita quando rilevati
- **Contatori Dinamici**: Aggiorna in tempo reale il numero di agenti e punti vendita filtrati
- **Sezione "Filtri Attivi"**: Mostra filtri selezionati con icone e contatori

### ✅ Importazione Excel (Nuovo)

- **Parsing Avanzato**: Gestione completa file Excel (.xlsx, .xls)
- **Conversione Dati**: Trasformazione automatica in modelli TypeScript
- **Persistenza**: Salvataggio dati in AsyncStorage
- **Integrazione Filtri**: Dati Excel immediatamente disponibili nei filtri
- **Gestione Errori**: Validazione e gestione errori importazione

### ✅ Filtri

- **Agenti**: Filtro per persona
- **Punti Vendita**: Filtro per location
- **Chip visivi**: Mostrano filtri attivi
- **Modal**: Pannello filtri completo
- **Filtri Progressivi**: Selezione multipla con filtraggio cumulativo

### ✅ Impostazioni

- **Importazione Excel**: Persone e Punti Vendita
- **Importazione Prezzi**: Sistema prezzi di riferimento
- **Gestione Focus References**: Configurazione referenze focus
- **Esportazione**: Excel/CSV
- **Backup/Ripristino**: Gestione dati
- **Configurazioni**: Notifiche, tema, sync

### ✅ UI/UX

- **Design moderno**: Colori e stili uniformi
- **Responsive**: Adattabile a tutti i dispositivi
- **Performance**: Ottimizzata per fluidità
- **Accessibilità**: Controlli intuitivi
- **Filtri Intuitivi**: Sistema progressivo user-friendly
- **Form Avanzati**: EntryFormModal con sistema ordini/vendite/stock
- **Tooltip Informativi**: Informazioni dettagliate al hover
- **Animazioni**: Transizioni fluide e feedback visivo

## 🏗️ Architettura e Logica

### 🎯 Pattern Architetturali Implementati

#### **Clean Architecture**
- **Data Layer**: Repository pattern con AsyncStorage
- **Domain Layer**: Entità e casi d'uso di business
- **Presentation Layer**: Componenti React Native con MVVM

#### **Repository Pattern**
```typescript
// Esempio: CalendarRepository
interface CalendarRepository {
  getEntries(filters: FilterCriteria): Promise<CalendarEntry[]>;
  saveEntry(entry: CalendarEntry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
}
```

#### **MVVM Pattern**
- **Model**: Modelli dati TypeScript (`User`, `SalesPoint`, `CalendarEntry`)
- **View**: Componenti React Native (`CalendarCell`, `FilterComponents`)
- **ViewModel**: Context API e custom hooks (`useCalendar`, `usePerformance`)

### 🔄 Flusso dei Dati

#### **Scenario 1: App Open**
1. **Init**: `MainCalendarPage` si costruisce
2. **Lettura Stato**: `CalendarContext` legge filtri attivi
3. **Richiesta Dati**: `CalendarRepository` esegue query con filtri
4. **Stato di Caricamento**: UI mostra `ActivityIndicator`
5. **Ricezione Dati**: Context espone dati, UI si ricostruisce
6. **Rendering Celle**: Ogni `CalendarCell` riceve i suoi dati specifici

#### **Scenario 2: Filter Change (Filtri Progressivi)**
1. **Azione Utente**: Selezione filtri multipli
2. **Aggiornamento Stato**: `selectedFilterItems` si aggiorna
3. **Filtro Progressivo**: `getFilteredData()` applica filtri cumulativi
4. **Rilevamento Automatico**: Sistema trova agente associato al punto vendita
5. **Aggiornamento UI**: Sezione "Filtri Attivi" mostra agente e punto vendita
6. **Reazione a Catena**: Repository si invalida e riesegue
7. **Nuovo Ciclo**: Processo riparte dal punto 4 dello Scenario 1

#### **Scenario 3: Excel Import**
1. **Azione Utente**: Utente importa file Excel
2. **Processamento**: `ExcelImportService` parsa il file
3. **Conversione Dati**: Dati convertiti in modelli TypeScript
4. **Salvataggio**: Dati salvati in AsyncStorage tramite Repository
5. **Aggiornamento UI**: Filtri si aggiornano con nuovi dati
6. **Riavvio Filtri**: Sistema ricarica dati Excel per filtri

#### **Scenario 3: Cell Click & Save**
1. **Azione Utente**: Click su `CalendarCell`
2. **Apertura Form**: Si apre modal di inserimento
3. **Modifica e Salvataggio**: Utente compila e salva
4. **Scrittura Dati**: Dati salvati tramite Repository
5. **Aggiornamento UI**: Cella si ricostruisce con nuovi dati

### 🚀 Performance e Ottimizzazioni

#### **React Performance**
- **React.memo**: Ottimizzazione re-render componenti
- **useCallback**: Memoizzazione callback functions
- **useMemo**: Memoizzazione calcoli costosi
- **Lazy Loading**: Caricamento componenti on-demand

#### **Custom Hooks Performance**
```typescript
// usePerformance.ts
export function useDebounce<T>(callback: T, delay: number): T;
export function useMemoizedValue<T>(value: T, deps: any[]): T;
export function useOptimizedCallback<T>(callback: T, deps: any[]): T;
export function useStableCallback<T>(callback: T): T;
```

#### **Error Handling**
- **Error Boundary**: Gestione errori a livello componente
- **Try-Catch**: Gestione errori asincroni
- **Fallback UI**: Interfacce di recupero errori

### 🔒 Sicurezza e Validazione

#### **Data Sanitization**
- **Input Validation**: Validazione input utente
- **Type Safety**: TypeScript per prevenire errori runtime
- **Zod Schema**: Validazione schema dati

#### **Error Resilience**
- **Retry Pattern**: Riprova automatica operazioni fallite
- **Circuit Breaker**: Prevenzione cascata errori
- **Graceful Degradation**: Degradazione elegante funzionalità

### 📊 State Management

#### **Context API Pattern**
```typescript
// CalendarContext.tsx
interface CalendarState {
  entries: CalendarEntry[];
  users: User[];
  salesPoints: SalesPoint[];
  isLoading: boolean;
  error: string | null;
  activeFilters: FilterCriteria;
}
```

#### **Reducer Pattern**
- **Unidirectional Data Flow**: Flusso dati unidirezionale
- **Predictable State**: Stato prevedibile e testabile
- **Action Types**: Azioni tipizzate per modifiche stato

### 🧪 Testing Strategy

#### **Unit Testing**
- **Jest**: Framework testing principale
- **React Testing Library**: Testing componenti
- **Mock Services**: Mock repository e servizi

#### **Integration Testing**
- **User Flows**: Test flussi utente completi
- **Data Flow**: Test integrazione dati
- **Error Scenarios**: Test scenari di errore

### 🛠️ Quality Assurance

#### **Code Quality**
- **ESLint**: Linting codice TypeScript/React
- **Prettier**: Formattazione codice automatica
- **TypeScript Strict**: Configurazione TypeScript rigorosa

#### **Development Workflow**
```bash
# Quality checks
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier formatting
npm run type-check    # TypeScript check
npm run quality       # All quality checks
```

## 🛠️ Sviluppo

### Struttura Progetto

```
src/
├── data/
│   ├── models/           # Modelli TypeScript
│   └── repositories/     # Repository pattern
├── domain/
│   ├── entities/         # Entità di business
│   └── usecases/         # Casi d'uso
├── presentation/
│   ├── components/       # Componenti UI
│   ├── pages/           # Pagine principali
│   ├── providers/       # Context API
│   └── navigation/      # Navigazione
└── core/
    ├── services/         # Servizi core
    └── utils/           # Utility
```

### Tecnologie

- **React Native 0.76.3**
- **Expo SDK 52**
- **TypeScript**
- **React Navigation 6**
- **AsyncStorage**

## 📝 Note

- L'app è configurata per host fisso `localhost:8081`
- Supporta refresh automatico durante lo sviluppo
- Tutti i dati sono salvati localmente con AsyncStorage
- Pronta per integrazione Firebase in futuro
- Implementa pattern architetturali enterprise-grade
- Quality checks automatici per mantenere standard elevati

## 🎯 Roadmap di Sviluppo

### ✅ Fase 1: Fondamenta (Completata)
- [x] Progetto Expo con TypeScript
- [x] Dipendenze core installate
- [x] Struttura cartelle configurata

### ✅ Fase 2: Spina Dorsale (Completata)
- [x] Modelli TypeScript (`User`, `SalesPoint`, `CalendarEntry`)
- [x] Repository pattern con AsyncStorage
- [x] Servizi per gestione dati

### ✅ Fase 3: Logica e Stato (Completata)
- [x] Context API per filtri attivi
- [x] Provider per dati calendario
- [x] Collegamento filtri con dati calendario

### ✅ Fase 4: UI di Base (Completata)
- [x] Layout principale con React Navigation
- [x] `react-native-calendars` configurato
- [x] Componenti filtri implementati

### ✅ Fase 5: Collegamento UI + Stato (Completata)
- [x] Filtri collegati con Context
- [x] Calendario collegato con provider dati
- [x] Stati di caricamento implementati
- [x] Collegare importazione Excel con filtri

### ✅ Fase 6: Filtri Progressivi e Importazione Excel (Completata)
- [x] Implementare filtri progressivi
- [x] Implementare rilevamento automatico agente-punto vendita
- [x] Implementare sezione "Filtri Attivi"
- [x] Implementare importazione Excel completa
- [x] Collegare dati Excel con sistema filtri

### ✅ Fase 7: Interattività (Completata)
- [x] Personalizzazione celle calendario con dati vendita
- [x] Implementazione indicatori problemi (bordo rosso)
- [x] Creazione modal form per inserimento dati
- [x] Sistema ordini/vendite/stock integrato
- [x] Tooltip informativi avanzati

### ✅ Fase 8: Rifinitura (Completata)
- [x] Tooltip e animazioni
- [x] Selettore vista settimanale/mensile
- [x] Testing completo (45 test passanti)
- [x] Refactoring e ottimizzazioni finali
- [x] Performance optimization (React.memo, useCallback, useMemo)

### 🔄 Fase 9: Produzione (In Corso)
- [ ] Integrazione Firebase
- [ ] Deploy su piattaforme
- [ ] Monitoraggio performance
- [ ] Analytics e tracking
