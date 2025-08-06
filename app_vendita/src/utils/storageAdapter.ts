import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Storage adapter che funziona sia su web che mobile
 * Gestisce gracefully i casi in cui AsyncStorage non è disponibile
 */
export const createStorageAdapter = (): StateStorage => {
  // Verifica se siamo su web e AsyncStorage non è disponibile
  const isStorageAvailable = () => {
    try {
      return AsyncStorage && typeof AsyncStorage.getItem === 'function';
    } catch {
      return false;
    }
  };

  // Fallback storage in memoria per web quando AsyncStorage non è disponibile
  const memoryStorage: { [key: string]: string } = {};

  return {
    getItem: async (name: string): Promise<string | null> => {
      if (isStorageAvailable()) {
        try {
          return await AsyncStorage.getItem(name);
        } catch (error) {
          console.warn('Storage getItem error:', error);
          return null;
        }
      }
      return memoryStorage[name] || null;
    },
    
    setItem: async (name: string, value: string): Promise<void> => {
      // Assicurati che il valore sia una stringa
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (isStorageAvailable()) {
        try {
          await AsyncStorage.setItem(name, stringValue);
        } catch (error) {
          console.warn('Storage setItem error:', error);
          // Salva in memoria come fallback
          memoryStorage[name] = stringValue;
        }
      } else {
        // Usa solo memoria
        memoryStorage[name] = stringValue;
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      if (isStorageAvailable()) {
        try {
          await AsyncStorage.removeItem(name);
        } catch (error) {
          console.warn('Storage removeItem error:', error);
        }
      }
      delete memoryStorage[name];
    },
  };
};