import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { getCameraConfig } from '../utils/cameraConfig';

/**
 * Servizio per compressione e ottimizzazione immagini
 */
export class ImageCompressionService {
  
  /**
   * Comprimi un'immagine per Firestore
   */
  static async compressForFirestore(
    asset: ImagePicker.ImagePickerAsset
  ): Promise<{
    base64Data: string;
    thumbnail: string;
    compressedSize: number;
    width: number;
    height: number;
  }> {
    try {
      console.log('🗜️ ImageCompressionService: Inizio compressione...');
      
      const config = getCameraConfig();
      
      // Ridimensiona e comprimi l'immagine principale
      const compressed = await manipulateAsync(
        asset.uri,
        [
          // Ridimensiona mantenendo proporzioni (max 800px sul lato più lungo)
          { resize: this.calculateResize(asset.width, asset.height, 800) }
        ],
        {
          compress: config.COMPRESS_QUALITY,
          format: SaveFormat.JPEG,
          base64: true
        }
      );

      // Crea thumbnail 60x60
      const thumbnail = await manipulateAsync(
        asset.uri,
        [
          { resize: { width: 60, height: 60 } }
        ],
        {
          compress: 0.6,
          format: SaveFormat.JPEG,
          base64: true
        }
      );

      if (!compressed.base64 || !thumbnail.base64) {
        throw new Error('Errore generazione base64');
      }

      const base64Data = `data:image/jpeg;base64,${compressed.base64}`;
      const thumbnailData = `data:image/jpeg;base64,${thumbnail.base64}`;
      
      // Calcola dimensione compressa (approssimativa)
      const compressedSize = Math.floor(compressed.base64.length * 0.75);

      console.log('✅ ImageCompressionService: Compressione completata:', {
        originalSize: asset.fileSize || 0,
        compressedSize,
        compressionRatio: asset.fileSize ? Math.round((compressedSize / asset.fileSize) * 100) : 0,
        dimensions: `${compressed.width}x${compressed.height}`
      });

      return {
        base64Data,
        thumbnail: thumbnailData,
        compressedSize,
        width: compressed.width,
        height: compressed.height
      };

    } catch (error) {
      console.error('❌ ImageCompressionService: Errore compressione:', error);
      throw new Error('Impossibile comprimere l\'immagine');
    }
  }

  /**
   * Calcola le dimensioni per il ridimensionamento mantenendo proporzioni
   */
  private static calculateResize(
    originalWidth: number, 
    originalHeight: number, 
    maxDimension: number
  ): { width?: number; height?: number } {
    if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
      return {}; // Nessun ridimensionamento necessario
    }

    if (originalWidth > originalHeight) {
      // Landscape: limita la larghezza
      return { width: maxDimension };
    } else {
      // Portrait o quadrata: limita l'altezza
      return { height: maxDimension };
    }
  }

  /**
   * Verifica se l'immagine compressa è sotto i limiti Firestore
   */
  static isValidForFirestore(compressedSize: number): boolean {
    // Firestore ha limite di 1MB per documento, lasciamo margine per metadati
    const MAX_SIZE_BYTES = 800 * 1024; // 800KB
    return compressedSize <= MAX_SIZE_BYTES;
  }

  /**
   * Ottieni informazioni sulla compressione
   */
  static getCompressionInfo(originalSize: number, compressedSize: number) {
    const ratio = Math.round((compressedSize / originalSize) * 100);
    const saved = originalSize - compressedSize;
    const savedKB = Math.round(saved / 1024);
    
    return {
      ratio: `${ratio}%`,
      saved: `${savedKB}KB`,
      isGoodCompression: ratio < 50
    };
  }
}