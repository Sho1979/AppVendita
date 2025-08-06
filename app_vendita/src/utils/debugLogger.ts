/**
 * Debug logger che wrappa console.log per controllo centralizzato
 * - In produzione: disabilitato di default
 * - In sviluppo: abilitato
 * - Può essere attivato temporaneamente con localStorage/AsyncStorage
 */

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

class DebugLogger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDevelopment;
  }

  log(...args: any[]) {
    if (this.enabled) {
      console.log(...args);
    }
  }

  warn(...args: any[]) {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  error(...args: any[]) {
    // Gli errori sono sempre loggati
    console.error(...args);
  }

  info(...args: any[]) {
    if (this.enabled) {
      console.info(...args);
    }
  }

  debug(...args: any[]) {
    if (this.enabled) {
      console.debug(...args);
    }
  }

  // Abilita/disabilita temporaneamente il logging
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

export const debugLog = new DebugLogger();