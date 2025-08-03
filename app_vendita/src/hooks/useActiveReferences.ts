import { useState, useEffect } from 'react';
import { firebaseCalendarService } from '../services/FirebaseCalendarService';
import { PriceReference } from '../data/models/PriceReference';

export const useActiveReferences = () => {
  const [activeReferences, setActiveReferences] = useState<PriceReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveReferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 useActiveReferences: Caricamento referenze attive da Firebase...');
      
      const references = await firebaseCalendarService.getActiveReferences();
      setActiveReferences(references);
      
      console.log('✅ useActiveReferences: Referenze attive caricate:', references.length);
    } catch (error) {
      console.error('❌ useActiveReferences: Errore nel caricamento:', error);
      setError('Errore nel caricamento delle referenze attive');
    } finally {
      setLoading(false);
    }
  };

  const addActiveReference = async (reference: Omit<PriceReference, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('➕ useActiveReferences: Aggiunta referenza attiva:', reference);
      
      const referenceId = await firebaseCalendarService.saveActiveReference(reference);
      
      // Aggiungi la nuova referenza allo stato locale
      const newReference: PriceReference = {
        ...reference,
        id: referenceId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setActiveReferences(prev => [...prev, newReference]);
      
      console.log('✅ useActiveReferences: Referenza attiva aggiunta con ID:', referenceId);
    } catch (error) {
      console.error('❌ useActiveReferences: Errore nell\'aggiunta referenza:', error);
      setError('Errore nell\'aggiunta della referenza attiva');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateActiveReference = async (id: string, updates: Partial<PriceReference>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('✏️ useActiveReferences: Aggiornamento referenza attiva:', id);
      
      await firebaseCalendarService.updateActiveReference(id, updates);
      
      // Aggiorna la referenza nello stato locale
      setActiveReferences(prev => 
        prev.map(ref => 
          ref.id === id 
            ? { ...ref, ...updates, updatedAt: new Date() }
            : ref
        )
      );
      
      console.log('✅ useActiveReferences: Referenza attiva aggiornata:', id);
    } catch (error) {
      console.error('❌ useActiveReferences: Errore nell\'aggiornamento referenza:', error);
      setError('Errore nell\'aggiornamento della referenza attiva');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteActiveReference = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ useActiveReferences: Eliminazione referenza attiva:', id);
      
      await firebaseCalendarService.deleteActiveReference(id);
      
      // Rimuovi la referenza dallo stato locale
      setActiveReferences(prev => prev.filter(ref => ref.id !== id));
      
      console.log('✅ useActiveReferences: Referenza attiva eliminata:', id);
    } catch (error) {
      console.error('❌ useActiveReferences: Errore nell\'eliminazione referenza:', error);
      setError('Errore nell\'eliminazione della referenza attiva');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getActiveReferenceById = (id: string): PriceReference | undefined => {
    return activeReferences.find(ref => ref.id === id);
  };

  const getActiveReferencesByBrand = (brand: string): PriceReference[] => {
    return activeReferences.filter(ref => ref.brand === brand);
  };

  const getActiveReferencesBySubBrand = (subBrand: string): PriceReference[] => {
    return activeReferences.filter(ref => ref.subBrand === subBrand);
  };

  useEffect(() => {
    loadActiveReferences();
  }, []);

  return {
    activeReferences,
    loading,
    error,
    loadActiveReferences,
    addActiveReference,
    updateActiveReference,
    deleteActiveReference,
    getActiveReferenceById,
    getActiveReferencesByBrand,
    getActiveReferencesBySubBrand,
  };
}; 