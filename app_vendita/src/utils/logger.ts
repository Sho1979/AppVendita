/**
 * Sistema di logging configurabile per AppVendita
 * 
 * Fornisce logging strutturato con livelli differenti e controllo dev/prod.
 * Sostituisce tutti i console.log sparsi nel codebase per migliori performance.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class AppLogger {
  private isDevelopment: boolean;
  private currentLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Mantieni solo gli ultimi 1000 log per evitare memory leak

  constructor(isDev: boolean = __DEV__, level: LogLevel = LogLevel.DEBUG) {
    this.isDevelopment = isDev;
    this.currentLevel = isDev ? level : LogLevel.ERROR; // In produzione, solo errori
  }

  /**
   * Configura il logger per l'ambiente di sviluppo
   */
  static configureForDevelopment(): AppLogger {
    return new AppLogger(true, LogLevel.DEBUG);
  }

  /**
   * Configura il logger per l'ambiente di produzione
   */
  static configureForProduction(): AppLogger {
    return new AppLogger(false, LogLevel.ERROR);
  }

  private log(level: LogLevel, category: string, message: string, data?: any): void {
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    // Aggiungi ai log interni
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Rimuovi il più vecchio
    }

    // Output alla console solo in sviluppo
    if (this.isDevelopment) {
      this.outputToConsole(entry);
    }

    // In produzione, gli errori vanno sempre loggati per debugging
    if (level === LogLevel.ERROR && !this.isDevelopment) {
      console.error(`[${entry.category}] ${entry.message}`, data);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString().split('T')[1].slice(0, 8);
    const prefix = `[${timestamp}][${entry.category}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.log(`🐛 ${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(`ℹ️ ${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${prefix} ${entry.message}`, entry.data || '');
        break;
    }
  }

  // ===== API PUBBLICHE =====

  /**
   * Log di debug - solo in sviluppo
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log informativi - solo in sviluppo
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log di warning - sempre visibili
   */
  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log di errore - sempre visibili
   */
  error(category: string, message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, category, message, error);
  }

  // ===== METODI SPECIALIZZATI =====

  /**
   * Log per operazioni UI
   */
  ui(message: string, data?: any): void {
    this.debug('UI', message, data);
  }

  /**
   * Log per operazioni di business logic
   */
  business(message: string, data?: any): void {
    this.info('BUSINESS', message, data);
  }

  /**
   * Log per operazioni di repository/database
   */
  data(message: string, data?: any): void {
    this.debug('DATA', message, data);
  }

  /**
   * Log per performance monitoring
   */
  performance(message: string, data?: any): void {
    this.debug('PERFORMANCE', message, data);
  }

  /**
   * Log per operazioni di rete
   */
  network(message: string, data?: any): void {
    this.debug('NETWORK', message, data);
  }

  // ===== UTILITY =====

  /**
   * Ottieni tutti i log memorizzati
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Pulisci i log memorizzati
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Cambia il livello di log corrente
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Esporta i log come JSON (utile per debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Istanza singleton del logger
export const logger = new AppLogger();

// Helper per setup rapido
export const setupLogger = {
  forDevelopment: () => AppLogger.configureForDevelopment(),
  forProduction: () => AppLogger.configureForProduction(),
};

// Re-export per backward compatibility con il logger esistente
export default logger;