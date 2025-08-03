import { useState, useEffect, useCallback } from 'react';
import { AsyncStorageCalendarRepository } from '../data/repositories/CalendarRepository';
import { firebaseCalendarService } from '../services/FirebaseCalendarService';
import { PriceReference } from '../data/models/PriceReference';

export const useFocusReferences = () => {
  const [focusReferences, setFocusReferences] = useState<PriceReference[]>([]);
  const [focusNetPrices, setFocusNetPrices] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const repository = new AsyncStorageCalendarRepository();

  const loadFocusReferences = async () => {
    try {
      setLoading(true);
      
      // Carica le referenze attive da Firebase (fonte principale)
      const activeReferences = await firebaseCalendarService.getActiveReferences();
      
      // Utilizza tutte le referenze attive come focus references
      // Il limite è determinato da Firebase, non dal sistema locale
      setFocusReferences(activeReferences);
      
      // Carica i prezzi netti salvati localmente
      const savedNetPrices = await repository.getFocusNetPrices();
      
      // Mappa i prezzi netti agli ID delle referenze attive
      const mappedNetPrices: { [key: string]: string } = {};
      
      activeReferences.forEach(ref => {
        // Cerca il prezzo netto per questo ID di referenza
        if (savedNetPrices[ref.id]) {
          mappedNetPrices[ref.id] = savedNetPrices[ref.id];
        } else {
          // Se non c'è un prezzo salvato, usa il prezzo netto dalla referenza Firebase
          mappedNetPrices[ref.id] = ref.netPrice ? ref.netPrice.toString() : '0';
        }
      });
      
      setFocusNetPrices(mappedNetPrices);
      
    } catch (error) {
      console.error('❌ useFocusReferences: Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNetPrice = async (referenceId: string, netPrice: string) => {
    try {
      const newNetPrices = {
        ...focusNetPrices,
        [referenceId]: netPrice
      };
      setFocusNetPrices(newNetPrices);
      await repository.saveFocusNetPrices(newNetPrices);
    } catch (error) {
      console.error('❌ useFocusReferences: Errore nell\'aggiornamento prezzo:', error);
    }
  };

  const getFocusReferenceById = (id: string): PriceReference | undefined => {
    return focusReferences.find(ref => ref.id === id);
  };

  const getNetPrice = useCallback((referenceId: string): string => {
    const netPrice = focusNetPrices[referenceId];
    return netPrice || '0';
  }, [focusNetPrices]);

  useEffect(() => {
    loadFocusReferences();
  }, []);

  return {
    focusReferences,
    focusNetPrices,
    loading,
    loadFocusReferences,
    updateNetPrice,
    getFocusReferenceById,
    getNetPrice,
  };
}; 