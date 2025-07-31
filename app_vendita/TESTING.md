# 🧪 Testing - AppVendita

## 📋 **Panoramica**

Il sistema di testing è stato implementato per garantire la qualità e l'affidabilità del codice. Utilizziamo **Jest** come framework di testing principale.

## 🏗️ **Configurazione**

### **Dipendenze Installate**
```bash
npm install --save-dev jest @types/jest @testing-library/react-native @testing-library/jest-native react-test-renderer@18.3.1 @types/react-test-renderer jest-environment-jsdom babel-plugin-module-resolver --legacy-peer-deps
```

### **File di Configurazione**
- **`jest.config.js`**: Configurazione principale Jest
- **`babel.config.js`**: Configurazione Babel per TypeScript
- **`src/__tests__/setup.ts`**: Setup globale per i test

## 📁 **Struttura Testing**

```
src/__tests__/
├── setup.ts                    # Setup globale
├── simple.test.ts             # Test di base
├── components/                 # Test componenti React
│   └── CustomCalendarCell.test.tsx
├── services/                   # Test servizi
│   ├── ExcelImportService.test.ts
│   └── ProgressiveCalculationService.test.ts
├── stores/                     # Test Zustand stores
│   └── calendarStore.test.ts
└── utils/                      # Test utilities
    └── logger.test.ts
```

## 🎯 **Tipi di Test**

### **1. Unit Tests**
Test per singole funzioni e componenti isolati.

**Esempio:**
```typescript
describe('Logger', () => {
  it('should log init messages', () => {
    logger.init('Test init message');
    expect(console.log).toHaveBeenCalled();
  });
});
```

### **2. Integration Tests**
Test per l'integrazione tra diversi servizi.

**Esempio:**
```typescript
describe('ExcelImportService', () => {
  it('should successfully import Excel file', async () => {
    const result = await service.importExcelFile();
    expect(result.success).toBe(true);
  });
});
```

### **3. Store Tests**
Test per gli store Zustand.

**Esempio:**
```typescript
describe('calendarStore', () => {
  it('should add entry correctly', () => {
    const { result } = renderHook(() => useCalendarStore());
    act(() => {
      result.current.addEntry(mockEntry);
    });
    expect(result.current.entries).toHaveLength(1);
  });
});
```

## 🚀 **Comandi Testing**

### **Esecuzione Test**
```bash
# Tutti i test
npm test

# Test in modalità watch
npm run test:watch

# Test con coverage
npm run test:coverage

# Test specifici
npm test -- --testPathPatterns=logger.test.ts
```

### **Script Disponibili**
- `npm test`: Esegue tutti i test
- `npm run test:watch`: Esegue test in modalità watch
- `npm run test:coverage`: Esegue test con report coverage
- `npm run test:ci`: Esegue test per CI/CD

## 📊 **Coverage**

Il sistema è configurato per richiedere almeno **70%** di coverage su:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🔧 **Mock e Setup**

### **Mock Globali**
- **AsyncStorage**: Mock completo per storage
- **React Native**: Mock per componenti nativi
- **Expo**: Mock per servizi Expo
- **Console**: Mock per logging

### **Setup per Test**
```typescript
// Mock per __DEV__
global.__DEV__ = true;

// Mock per console
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

## 📝 **Best Practices**

### **1. Naming Convention**
- File di test: `*.test.ts` o `*.test.tsx`
- Descrizioni chiare e specifiche
- Organizzazione in `describe` blocks

### **2. Test Structure**
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### **3. Mock Strategy**
- Mock solo le dipendenze esterne
- Usa `jest.fn()` per funzioni
- Usa `jest.mock()` per moduli

## 🎯 **Test Implementati**

### ✅ **Completati**
1. **Logger Utility**: Test completi per sistema di logging
2. **Simple Tests**: Test di base per verificare configurazione
3. **Setup**: Configurazione Jest e Babel

### 🔄 **In Sviluppo**
1. **Component Tests**: Test per componenti React
2. **Service Tests**: Test per servizi business logic
3. **Store Tests**: Test per Zustand stores

### 📋 **Pianificati**
1. **E2E Tests**: Test end-to-end
2. **Performance Tests**: Test di performance
3. **Accessibility Tests**: Test di accessibilità

## 🐛 **Risoluzione Problemi**

### **Errori Comuni**

#### **1. Jest Environment**
```bash
# Errore: jest-environment-jsdom cannot be found
npm install --save-dev jest-environment-jsdom
```

#### **2. Babel Configuration**
```bash
# Errore: Unexpected token
# Verifica babel.config.js e jest.config.js
```

#### **3. React Native Mock**
```bash
# Errore: TurboModuleRegistry
# Usa testEnvironment: 'node' invece di 'jsdom'
```

### **Debug Test**
```bash
# Verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="should log"
```

## 📈 **Metriche**

### **Stato Attuale**
- ✅ **Setup**: Completato
- ✅ **Logger Tests**: 9/9 passati
- ✅ **Simple Tests**: 4/4 passati
- 🔄 **Component Tests**: In sviluppo
- 🔄 **Service Tests**: In sviluppo

### **Obiettivi**
- [ ] 80% coverage totale
- [ ] Test per tutti i componenti critici
- [ ] Test per tutti i servizi
- [ ] Test per tutti gli store

## 🔗 **Riferimenti**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing](https://callstack.github.io/react-native-testing-library/)
- [Zustand Testing](https://github.com/pmndrs/zustand#testing) 