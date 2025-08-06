import { Platform } from 'react-native';
import { IS_WEB, IS_MOBILE } from './platformConfig';

/**
 * Configurazione intelligente per la gestione foto
 * Web: Upload da file system
 * Mobile: Cattura live + upload
 */

export const CAMERA_CONFIG = {
  WEB: {
    SUPPORTS_CAMERA: false,
    SUPPORTS_FILE_UPLOAD: true,
    MAX_PHOTOS_PER_DAY: 4, // Per punto vendita
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    COMPRESS_QUALITY: 0.8,
  },
  MOBILE: {
    SUPPORTS_CAMERA: true,
    SUPPORTS_FILE_UPLOAD: true,
    MAX_PHOTOS_PER_DAY: 4, // Per punto vendita
    MAX_FILE_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png'],
    COMPRESS_QUALITY: 0.7,
    // Opzioni camera
    CAMERA_OPTIONS: {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 1920,
      maxWidth: 1080,
      quality: 0.8,
      allowsEditing: true,
    },
    // Geolocalizzazione
    LOCATION_CONFIG: {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    }
  }
};

/**
 * Ottiene la configurazione camera per la piattaforma corrente
 */
export function getCameraConfig() {
  return IS_WEB ? CAMERA_CONFIG.WEB : CAMERA_CONFIG.MOBILE;
}

/**
 * Verifica se la piattaforma supporta la cattura foto live
 */
export function supportsCameraCapture(): boolean {
  return IS_MOBILE && CAMERA_CONFIG.MOBILE.SUPPORTS_CAMERA;
}

/**
 * Verifica se la piattaforma supporta l'upload da file
 */
export function supportsFileUpload(): boolean {
  const config = getCameraConfig();
  return config.SUPPORTS_FILE_UPLOAD;
}

/**
 * Ottiene le opzioni camera per React Native Image Picker (solo mobile)
 */
export function getCameraOptions() {
  if (!IS_MOBILE) {
    throw new Error('Camera options are only available on mobile platforms');
  }
  return CAMERA_CONFIG.MOBILE.CAMERA_OPTIONS;
}

/**
 * Ottiene la configurazione geolocalizzazione (solo mobile)
 */
export function getLocationConfig() {
  if (!IS_MOBILE) {
    throw new Error('Location config is only available on mobile platforms');
  }
  return CAMERA_CONFIG.MOBILE.LOCATION_CONFIG;
}

/**
 * Verifica se un tipo di file è supportato
 */
export function isFileTypeSupported(mimeType: string): boolean {
  const config = getCameraConfig();
  return config.ALLOWED_TYPES.includes(mimeType);
}

/**
 * Verifica se la dimensione del file è accettabile
 */
export function isFileSizeValid(sizeInBytes: number): boolean {
  const config = getCameraConfig();
  const maxSizeBytes = config.MAX_FILE_SIZE_MB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
}

/**
 * Verifica se è possibile aggiungere più foto per un punto vendita specifico in una data
 */
export function canAddMorePhotosForSalesPoint(
  existingPhotosCount: number, 
  salesPointId: string
): boolean {
  const config = getCameraConfig();
  return existingPhotosCount < config.MAX_PHOTOS_PER_DAY;
}

/**
 * Interfaccia per i metadati delle foto (Firestore + base64)
 */
export interface PhotoMetadata {
  id: string;
  fileName: string;
  dateTaken: Date;
  dateUploaded: Date;
  salesPointId: string;
  salesPointName: string;
  userId: string;
  userName?: string; // Nome dell'utente che ha scattato la foto
  calendarDate: string; // Formato YYYY-MM-DD
  platform: 'web' | 'mobile';
  
  // Dati immagine
  base64Data: string; // Foto compressa in base64
  thumbnail: string; // Miniatura 60x60 in base64
  mimeType: string;
  originalSize: number; // Dimensione originale in bytes
  compressedSize: number; // Dimensione compressa in bytes
  width: number;
  height: number;
  
  // Geolocalizzazione (opzionale)
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
}