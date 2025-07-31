# Missione del Progetto:

Agisci come Architetto Software e Lead Product Designer. Il tuo compito è generare la base di un'applicazione di livello produttivo (production-grade) e visivamente coerente per iOS, Android e Web, utilizzando React Native ed Expo. L'output non deve essere solo funzionante, ma anche scalabile, performante, testabile, sicuro e aderente a specifiche di design precise.

## 1. Pilastri Architettonici (Requisiti Non Funzionali)

Il codice generato deve essere progettato per soddisfare i seguenti pilastri:

- **Piattaforma-Agnostica**: Il codice deve essere scritto con un approccio "write once, run anywhere". Utilizza API di Expo e React Native che siano compatibili su iOS, Android e Web. Per le inevitabili differenze, utilizza Platform.select() in modo pulito e isolato.

- **Performance**: Utilizza React.memo, useCallback, e useMemo per prevenire re-render non necessari. Le liste devono usare FlatList. Le animazioni devono usare il useNativeDriver (dove applicabile su mobile).

- **Manutenibilità e Qualità**: TypeScript strict, ESLint + Prettier, commenti JSDoc per tutta la logica di business e i componenti complessi.

- **Testabilità**: Architettura basata su custom hooks e componenti di presentazione, testata con Jest e React Native Testing Library.

- **Robustezza e Gestione Errori**: Gestione esplicita degli stati di loading/error e Error Boundaries a livello radice.

## 2. Stack Tecnologico e Configurazione

- **Piattaforma**: Expo SDK (Managed Workflow), configurato per supportare iOS, Android e Web (expo-router è una scelta eccellente per la navigazione file-based cross-platform).

- **Linguaggio**: TypeScript (con strict: true).

- **UI Framework**: React Native & React Native for Web.

- **Backend & Database**: Firebase (Firestore, Auth, Storage).

- **Gestione Stato Globale**: Zustand.

- **Navigazione**: Expo Router.

- **Gestione Form**: React Hook Form.

- **Librerie Chiave**: react-native-calendars, @react-native-firebase/app, zustand, react-hook-form, xlsx, react-native-popper (per i tooltip), jest, @testing-library/react-native.

## 3. Sistema di Design UI/UX e Specifiche Grafiche

Il design deve essere pulito, funzionale e professionale. Tutti i componenti devono essere riutilizzabili e basati su queste specifiche. Crea una cartella src/constants per i valori di design (colori, spacing, ecc.).

### 3.1. Palette Colori (src/constants/Colors.ts)

- **primary**: '#007AFF' (Blu vibrante per elementi interattivi)
- **secondary**: '#F2F2F7' (Grigio chiaro per sfondi)
- **textPrimary**: '#1C1C1E' (Nero quasi puro per il testo principale)
- **textSecondary**: '#8A8A8E' (Grigio medio per testo secondario e placeholder)
- **border**: '#E0E0E0' (Grigio chiaro per bordi e separatori)
- **accentSuccess**: '#34C759' (Verde per conferme)
- **accentError**: '#D93B3B' (Rosso acceso per errori e problemi)
- **tagPersonnel**: '#A284FF' (Viola per tag persone)
- **tagAction**: '#FF9F0A' (Arancione per tag azioni)

### 3.2. Tipografia e Spaziatura

- **Font**: Utilizza i font di sistema (San Francisco su iOS, Roboto su Android, system-ui su web) per un aspetto nativo.
- **Spacing**: Usa un'unità di base di 8px. spacing.small = 8px, spacing.medium = 16px, spacing.large = 24px. 