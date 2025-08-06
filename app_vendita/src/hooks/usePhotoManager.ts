import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PhotoService } from '../services/PhotoService';
import { FirebasePhotoService } from '../services/FirebasePhotoService';
import { PhotoMetadata, getCameraConfig } from '../utils/cameraConfig';
import { IS_WEB, IS_MOBILE } from '../utils/platformConfig';

interface PhotoData extends PhotoMetadata {
  firestoreId: string;
}

interface UsePhotoManagerProps {
  calendarDate: string;
  salesPointId: string;
  salesPointName: string;
  userId: string;
  userName?: string;
  autoLoad?: boolean; // Nuovo flag per controllare il caricamento automatico
}

interface UsePhotoManagerReturn {
  photos: PhotoData[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  canAddMore: boolean;
  maxPhotos: number;
  currentCount: number;
  // Actions
  loadPhotos: () => Promise<void>;
  takePhoto: () => Promise<void>;
  selectPhoto: () => Promise<void>;
  deletePhoto: (firestoreId: string) => Promise<void>;
  showPhotoSource: () => Promise<void>;
}

// Cache globale per evitare ricaricamenti multipli per la stessa data/salespoint
const photoCache = new Map<string, { photos: PhotoData[], timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Hook intelligente per gestire foto con adattamento automatico alla piattaforma
 * - Web: Solo upload da file system
 * - Mobile: Cattura live + geolocalizzazione + upload
 */
export function usePhotoManager({
  calendarDate,
  salesPointId,
  salesPointName,
  userId,
  userName = 'Utente',
  autoLoad = true, // Default: carica automaticamente
}: UsePhotoManagerProps): UsePhotoManagerReturn {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const config = getCameraConfig();
  const maxPhotos = config.MAX_PHOTOS_PER_DAY;
  const currentCount = photos.length;
  const canAddMore = currentCount < maxPhotos;

  /**
   * Carica le foto esistenti per la data
   */
  const loadPhotos = useCallback(async () => {
    if (!salesPointId) return;

    // Chiave cache unica per data e punto vendita
    const cacheKey = `${calendarDate}_${salesPointId}`;
    
    // Verifica cache
    const cached = photoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📱 usePhotoManager: Uso cache per', cacheKey);
      setPhotos(cached.photos);
      return;
    }

    setIsLoading(true);
    try {
      console.log('📥 usePhotoManager: Caricamento foto per', calendarDate, salesPointId);
      const loadedPhotos = await FirebasePhotoService.getPhotosForDate(calendarDate, salesPointId);
      
      // Salva in cache
      photoCache.set(cacheKey, {
        photos: loadedPhotos,
        timestamp: Date.now(),
      });
      
      setPhotos(loadedPhotos);
      console.log('✅ usePhotoManager: Caricate', loadedPhotos.length, 'foto');
    } catch (error) {
      console.error('❌ usePhotoManager: Errore caricamento foto:', error);
      Alert.alert('Errore', 'Impossibile caricare le foto');
    } finally {
      setIsLoading(false);
    }
  }, [calendarDate, salesPointId]);

  /**
   * Processa e salva una foto su Firestore
   */
  const processAndUploadPhoto = useCallback(async (result: ImagePicker.ImagePickerResult) => {
    if (!result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
    console.log('📷 usePhotoManager: Processing foto:', asset.fileName);

    // Valida la foto
    const validation = PhotoService.validatePhoto(asset);
    if (!validation.valid) {
      Alert.alert('Errore', validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Crea metadati completi con compressione
      const metadata = await PhotoService.createPhotoMetadata(
        asset,
        salesPointId,
        salesPointName,
        userId,
        userName,
        calendarDate
      );

      console.log('💾 usePhotoManager: Salvataggio foto compressa:', {
        fileName: metadata.fileName,
        compressedSize: Math.round(metadata.compressedSize / 1024) + 'KB',
        location: metadata.location?.address,
        platform: metadata.platform,
      });

      // Simula progresso per UX
      setUploadProgress(50);

      // Salva su Firestore
      const firestoreId = await FirebasePhotoService.savePhoto(metadata);

      setUploadProgress(100);

      // Aggiorna lista locale
      const newPhoto: PhotoData = {
        ...metadata,
        firestoreId,
      };

      setPhotos(prev => [newPhoto, ...prev]);
      
      // Invalida cache per forzare reload
      const cacheKey = `${calendarDate}_${salesPointId}`;
      photoCache.delete(cacheKey);
      
      Alert.alert(
        'Successo!', 
        IS_MOBILE && metadata.location 
          ? `Foto salvata con posizione: ${metadata.location.address || 'Coordinate disponibili'}`
          : 'Foto salvata con successo'
      );

    } catch (error) {
      console.error('❌ usePhotoManager: Errore salvataggio:', error);
      Alert.alert('Errore', 'Impossibile salvare la foto');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [salesPointId, salesPointName, userId, userName, calendarDate]);

  /**
   * Cattura foto dalla camera (solo mobile)
   */
  const takePhoto = useCallback(async () => {
    if (!canAddMore) {
      Alert.alert('Limite raggiunto', `Puoi caricare massimo ${maxPhotos} foto al giorno`);
      return;
    }

    console.log('📷 usePhotoManager: Cattura foto');
    const result = await PhotoService.capturePhoto();
    if (result) {
      await processAndUploadPhoto(result);
    }
  }, [canAddMore, maxPhotos, processAndUploadPhoto]);

  /**
   * Seleziona foto dalla galleria
   */
  const selectPhoto = useCallback(async () => {
    if (!canAddMore) {
      Alert.alert('Limite raggiunto', `Puoi caricare massimo ${maxPhotos} foto al giorno`);
      return;
    }

    console.log('🖼️ usePhotoManager: Selezione foto');
    const result = await PhotoService.selectPhoto();
    if (result) {
      await processAndUploadPhoto(result);
    }
  }, [canAddMore, maxPhotos, processAndUploadPhoto]);

  /**
   * Mostra picker sorgente foto (mobile) o seleziona direttamente (web)
   */
  const showPhotoSource = useCallback(async () => {
    if (IS_WEB) {
      // Su web solo selezione da file
      await selectPhoto();
      return;
    }

    // Su mobile mostra opzioni
    const source = await PhotoService.showPhotoSourcePicker();
    if (source === 'camera') {
      await takePhoto();
    } else if (source === 'gallery') {
      await selectPhoto();
    }
  }, [selectPhoto, takePhoto]);

  /**
   * Elimina una foto da Firestore
   */
  const deletePhoto = useCallback(async (firestoreId: string) => {
    Alert.alert(
      'Elimina Foto',
      'Sei sicuro di voler eliminare questa foto?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ usePhotoManager: Eliminazione foto:', firestoreId);
              
              await FirebasePhotoService.deletePhoto(firestoreId);
              setPhotos(prev => prev.filter(p => p.firestoreId !== firestoreId));
              
              // Invalida cache per forzare reload
              const cacheKey = `${calendarDate}_${salesPointId}`;
              photoCache.delete(cacheKey);
              
              Alert.alert('Successo', 'Foto eliminata');
            } catch (error) {
              console.error('❌ usePhotoManager: Errore eliminazione:', error);
              Alert.alert('Errore', 'Impossibile eliminare la foto');
            }
          }
        }
      ]
    );
  }, []);

  // Carica foto all'avvio solo se autoLoad è true e c'è un punto vendita valido
  useEffect(() => {
    // Non caricare per salesPointId 'default' o se mancano dati essenziali
    if (autoLoad && salesPointId && salesPointId !== 'default' && calendarDate) {
      loadPhotos();
    }
  }, [autoLoad, loadPhotos, salesPointId, calendarDate]);

  return {
    photos,
    isLoading,
    isUploading,
    uploadProgress,
    canAddMore,
    maxPhotos,
    currentCount,
    loadPhotos,
    takePhoto,
    selectPhoto,
    deletePhoto,
    showPhotoSource,
  };
}