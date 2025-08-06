import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../core/services/firebase';
import { PhotoMetadata } from '../utils/cameraConfig';

/**
 * Servizio Firebase per gestire foto con Firestore + base64
 */
export class FirebasePhotoService {
  private static photosCollection = 'photos';

  /**
   * Salva una foto direttamente su Firestore con base64
   */
  static async savePhoto(metadata: PhotoMetadata): Promise<string> {
    try {
      console.log('💾 FirebasePhotoService: Salvataggio foto su Firestore:', metadata.fileName);
      console.log('💾 Dimensioni:', {
        compressed: Math.round(metadata.compressedSize / 1024) + 'KB',
        original: Math.round(metadata.originalSize / 1024) + 'KB'
      });

      // Prepara i dati per Firestore (converte Date in Timestamp)
      const photoData = {
        ...metadata,
        dateTaken: metadata.dateTaken.toISOString(),
        dateUploaded: metadata.dateUploaded.toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Verifica che i dati base64 non siano vuoti
      if (!metadata.base64Data || !metadata.thumbnail) {
        throw new Error('Dati immagine mancanti o non validi');
      }

      // Salva su Firestore
      const docRef = await addDoc(collection(db, this.photosCollection), photoData);
      console.log('✅ FirebasePhotoService: Foto salvata con ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ FirebasePhotoService: Errore salvataggio foto:', error);
      throw error;
    }
  }



  /**
   * Carica le foto per una data specifica
   */
  static async getPhotosForDate(
    calendarDate: string, 
    salesPointId?: string
  ): Promise<(PhotoMetadata & { firestoreId: string })[]> {
    try {
      console.log('📥 FirebasePhotoService: Caricamento foto per data:', calendarDate);

      // Query semplificata per calendarDate
      const q = query(
        collection(db, this.photosCollection),
        where('calendarDate', '==', calendarDate)
      );

      const querySnapshot = await getDocs(q);
      let photos = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          // Converto le date da ISO string a Date
          dateTaken: new Date(data.dateTaken),
          dateUploaded: new Date(data.dateUploaded),
          firestoreId: doc.id,
        } as PhotoMetadata & { firestoreId: string };
      });

      // Filtro per salesPointId lato client se necessario
      if (salesPointId && salesPointId !== 'default') {
        photos = photos.filter(photo => photo.salesPointId === salesPointId);
      }

      // Ordina per data lato client (più recenti prima)
      photos.sort((a, b) => b.dateTaken.getTime() - a.dateTaken.getTime());

      console.log('✅ FirebasePhotoService: Caricate', photos.length, 'foto per', calendarDate);
      return photos;
    } catch (error) {
      console.error('❌ FirebasePhotoService: Errore caricamento foto:', error);
      // Ritorna array vuoto invece di propagare errore per evitare crash
      console.log('🔄 FirebasePhotoService: Ritorno array vuoto per evitare crash');
      return [];
    }
  }

  /**
   * Elimina una foto da Firestore
   */
  static async deletePhoto(firestoreId: string): Promise<void> {
    try {
      console.log('🗑️ FirebasePhotoService: Eliminazione foto:', firestoreId);

      // Elimina da Firestore
      await deleteDoc(doc(db, this.photosCollection, firestoreId));

      console.log('✅ FirebasePhotoService: Foto eliminata con successo');
    } catch (error) {
      console.error('❌ FirebasePhotoService: Errore eliminazione foto:', error);
      throw error;
    }
  }

  /**
   * Conta le foto per una data specifica
   */
  static async countPhotosForDate(
    calendarDate: string, 
    salesPointId?: string
  ): Promise<number> {
    try {
      const photos = await this.getPhotosForDate(calendarDate, salesPointId);
      return photos.length;
    } catch (error) {
      console.error('❌ FirebasePhotoService: Errore conteggio foto:', error);
      return 0;
    }
  }
}