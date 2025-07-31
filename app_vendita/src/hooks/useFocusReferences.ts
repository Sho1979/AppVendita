import { useState, useEffect } from 'react';
import { AsyncStorageCalendarRepository } from '../data/repositories/CalendarRepository';
import { PriceReference } from '../data/models/PriceReference';

export const useFocusReferences = () => {
  const [focusReferences, setFocusReferences] = useState<PriceReference[]>([]);
  const [focusNetPrices, setFocusNetPrices] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const repository = new AsyncStorageCalendarRepository();

  const loadFocusReferences = async () => {
    try {
      setLoading(true);
      
      // Carica gli ID delle referenze focus
      const focusIds = await repository.getFocusReferences();
      
      // Carica tutte le referenze
      const allReferences = await repository.getPriceReferences();
      
      // Filtra solo le referenze focus
      const focusRefs = allReferences.filter(ref => focusIds.includes(ref.id));
      setFocusReferences(focusRefs);
      
      // Carica i prezzi netti salvati
      const savedNetPrices = await repository.getFocusNetPrices();
      setFocusNetPrices(savedNetPrices);
      
      console.log('🎯 useFocusReferences: Referenze focus caricate:', focusRefs.length);
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
      console.log('💾 useFocusReferences: Prezzo netto aggiornato per', referenceId);
    } catch (error) {
      console.error('❌ useFocusReferences: Errore nell\'aggiornamento prezzo:', error);
    }
  };

  const getFocusReferenceById = (id: string): PriceReference | undefined => {
    return focusReferences.find(ref => ref.id === id);
  };

  const getNetPrice = (referenceId: string): string => {
    return focusNetPrices[referenceId] || '0';
  };

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