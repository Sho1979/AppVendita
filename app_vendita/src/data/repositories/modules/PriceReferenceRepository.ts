/**
 * Repository dedicato alla gestione delle PriceReference
 * 
 * Estrae le responsabilità delle PriceReference dal repository principale
 * per una migliore separazione delle concerns.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceReference, CreatePriceReferenceRequest, UpdatePriceReferenceRequest } from '../../models/PriceReference';
import { logger } from '../../../utils/logger';

export class PriceReferenceRepository {
  private readonly PRICE_REFERENCES_KEY = 'price_references';

  /**
   * Recupera tutte le referenze prezzo
   */
  async getPriceReferences(): Promise<PriceReference[]> {
    try {
      const data = await AsyncStorage.getItem(this.PRICE_REFERENCES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel recupero referenze prezzo', error);
      return [];
    }
  }

  /**
   * Recupera una singola referenza per ID
   */
  async getPriceReference(id: string): Promise<PriceReference | null> {
    try {
      const references = await this.getPriceReferences();
      return references.find(ref => ref.id === id) || null;
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel recupero referenza', error);
      return null;
    }
  }

  /**
   * Crea una nuova referenza prezzo
   */
  async savePriceReference(reference: CreatePriceReferenceRequest): Promise<PriceReference> {
    try {
      const references = await this.getPriceReferences();
      const newReference: PriceReference = {
        ...reference,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      references.push(newReference);
      await this.saveAllReferences(references);
      
      logger.info('PriceReferenceRepository', 'Referenza creata', { refId: newReference.id });
      return newReference;
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nella creazione referenza', error);
      throw error;
    }
  }

  /**
   * Aggiorna una referenza esistente
   */
  async updatePriceReference(id: string, updates: UpdatePriceReferenceRequest): Promise<PriceReference> {
    try {
      const references = await this.getPriceReferences();
      const refIndex = references.findIndex(ref => ref.id === id);

      if (refIndex === -1) {
        throw new Error(`Referenza con ID ${id} non trovata`);
      }

      const updatedReference = {
        ...references[refIndex],
        ...updates,
        updatedAt: new Date(),
      };

      references[refIndex] = updatedReference;
      await this.saveAllReferences(references);
      
      logger.info('PriceReferenceRepository', 'Referenza aggiornata', { refId: id });
      return updatedReference;
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nell\'aggiornamento referenza', error);
      throw error;
    }
  }

  /**
   * Elimina una referenza
   */
  async deletePriceReference(id: string): Promise<void> {
    try {
      const references = await this.getPriceReferences();
      const filteredReferences = references.filter(ref => ref.id !== id);

      await this.saveAllReferences(filteredReferences);
      logger.info('PriceReferenceRepository', 'Referenza eliminata', { refId: id });
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nell\'eliminazione referenza', error);
      throw error;
    }
  }

  /**
   * Salva tutte le referenze in batch
   */
  async savePriceReferences(references: PriceReference[]): Promise<void> {
    try {
      await this.saveAllReferences(references);
      logger.info('PriceReferenceRepository', 'Referenze salvate in batch', { count: references.length });
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel salvataggio batch referenze', error);
      throw error;
    }
  }

  /**
   * Pulisce tutte le referenze
   */
  async clearPriceReferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PRICE_REFERENCES_KEY);
      logger.info('PriceReferenceRepository', 'Referenze pulite');
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nella pulizia referenze', error);
      throw error;
    }
  }

  /**
   * Recupera solo le referenze attive
   */
  async getActivePriceReferences(): Promise<PriceReference[]> {
    try {
      const references = await this.getPriceReferences();
      return references.filter(ref => ref.isActive);
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel recupero referenze attive', error);
      return [];
    }
  }

  /**
   * Attiva/disattiva una referenza
   */
  async togglePriceReferenceActive(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updatePriceReference(id, { isActive });
      logger.info('PriceReferenceRepository', 'Referenza toggle active', { refId: id, isActive });
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel toggle active referenza', error);
      throw error;
    }
  }

  /**
   * Metodi privati di supporto
   */
  private async saveAllReferences(references: PriceReference[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PRICE_REFERENCES_KEY, JSON.stringify(references));
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel salvataggio tutte le referenze', error);
      throw error;
    }
  }

  /**
   * Statistiche e utility
   */
  async getReferencesCount(): Promise<number> {
    try {
      const references = await this.getPriceReferences();
      return references.length;
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel conteggio referenze', error);
      return 0;
    }
  }

  async getActiveReferencesCount(): Promise<number> {
    try {
      const activeRefs = await this.getActivePriceReferences();
      return activeRefs.length;
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nel conteggio referenze attive', error);
      return 0;
    }
  }

  /**
   * Ricerca referenze per nome o codice
   */
  async searchPriceReferences(query: string): Promise<PriceReference[]> {
    try {
      const references = await this.getPriceReferences();
      const lowerQuery = query.toLowerCase();
      
      return references.filter(ref => 
        ref.name?.toLowerCase().includes(lowerQuery) ||
        ref.code?.toLowerCase().includes(lowerQuery) ||
        ref.description?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      logger.error('PriceReferenceRepository', 'Errore nella ricerca referenze', error);
      return [];
    }
  }
}
