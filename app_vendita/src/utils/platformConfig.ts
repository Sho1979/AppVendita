import { Platform } from 'react-native';

/**
 * Configurazione automatica basata sulla piattaforma
 * Rileva automaticamente se siamo su mobile o web e applica ottimizzazioni appropriate
 */

// Rilevamento automatico della piattaforma
export const IS_WEB = Platform.OS === 'web';
export const IS_MOBILE = Platform.OS !== 'web';

/**
 * Configurazione per le performance dei filtri
 */
export const FILTER_PERFORMANCE_CONFIG = {
  // Configurazione per Web (mantiene comportamento originale)
  WEB: {
    ENABLE_LAZY_LOADING: false,
    BATCH_SIZE: 0, // Carica tutto insieme
    SEARCH_DEBOUNCE_MS: 300,
    MAX_VISIBLE_ITEMS: 1000,
    ENABLE_VIRTUALIZATION: false,
  },
  
  // Configurazione per Mobile (ottimizzata)
  MOBILE: {
    ENABLE_LAZY_LOADING: true,
    BATCH_SIZE: 50, // Carica 50 elementi alla volta
    SEARCH_DEBOUNCE_MS: 500,
    MAX_VISIBLE_ITEMS: 100,
    ENABLE_VIRTUALIZATION: true,
  }
};

/**
 * Ottiene la configurazione corretta in base alla piattaforma
 */
export function getPlatformFilterConfig() {
  return IS_WEB ? FILTER_PERFORMANCE_CONFIG.WEB : FILTER_PERFORMANCE_CONFIG.MOBILE;
}

/**
 * Configurazione per il caricamento dati Excel
 */
export const EXCEL_DATA_CONFIG = {
  WEB: {
    LOAD_ALL_DATA: true,
    CHUNK_SIZE: 0,
    PROCESSING_DELAY: 0,
  },
  MOBILE: {
    LOAD_ALL_DATA: false,
    CHUNK_SIZE: 100,
    PROCESSING_DELAY: 10, // ms tra un chunk e l'altro
  }
};

/**
 * Ottiene la configurazione per il caricamento dati Excel
 */
export function getPlatformExcelConfig() {
  return IS_WEB ? EXCEL_DATA_CONFIG.WEB : EXCEL_DATA_CONFIG.MOBILE;
}

/**
 * Utility per debug
 */
export function logPlatformInfo() {
  console.log('🔧 Platform Config:', {
    platform: Platform.OS,
    isWeb: IS_WEB,
    isMobile: IS_MOBILE,
    filterConfig: getPlatformFilterConfig(),
    excelConfig: getPlatformExcelConfig(),
  });
}