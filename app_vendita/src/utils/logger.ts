// Utility per logging condizionale avanzato
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'init' | 'sync' | 'ui' | 'data' | 'performance' | 'general';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  categories: LogCategory[];
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: __DEV__,
      level: 'info',
      categories: ['init', 'sync', 'error'], // Solo categorie essenziali in produzione
    };
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (!this.config.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    if (messageLevelIndex < currentLevelIndex) return false;
    
    return this.config.categories.includes(category);
  }

  private formatMessage(level: LogLevel, category: LogCategory, message: string): string {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];
    
    return `${emoji} [${level.toUpperCase()}] [${category.toUpperCase()}] ${message}`;
  }

  debug(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog('debug', category)) {
      console.log(this.formatMessage('debug', category, message), ...args);
    }
  }

  info(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog('info', category)) {
      console.log(this.formatMessage('info', category, message), ...args);
    }
  }

  warn(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog('warn', category)) {
      console.warn(this.formatMessage('warn', category, message), ...args);
    }
  }

  error(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog('error', category)) {
      console.error(this.formatMessage('error', category, message), ...args);
    }
  }

  // Metodi di convenienza per categorie specifiche
  init(message: string, ...args: any[]) {
    this.info('init', message, ...args);
  }

  sync(message: string, ...args: any[]) {
    this.info('sync', message, ...args);
  }

  ui(message: string, ...args: any[]) {
    this.debug('ui', message, ...args);
  }

  data(message: string, ...args: any[]) {
    this.debug('data', message, ...args);
  }

  performance(message: string, ...args: any[]) {
    this.debug('performance', message, ...args);
  }

  // Metodo per configurare il logger
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export const logger = new Logger();

// Utility per logging condizionale semplice (manteniamo compatibilità)
export const devLog = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args);
  }
}; 