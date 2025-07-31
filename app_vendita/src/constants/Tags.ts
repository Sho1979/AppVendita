/**
 * Sistema di Tag - Configurazione
 * Definizione dei tag per persone e azioni con colori e acronimi
 */

export interface TagConfig {
  id: string;
  label: string;
  acronym: string;
  color: string;
  backgroundColor: string;
  type: 'person' | 'action';
}

export const Tags = {
  // Tag Persone (Cerchi)
  AGENTE: {
    id: 'agente',
    label: 'Agente',
    acronym: 'A',
    color: '#FFFFFF',
    backgroundColor: '#4A90E2',
    type: 'person'
  },
  PROMOTER: {
    id: 'promoter',
    label: 'Promoter',
    acronym: 'P',
    color: '#FFFFFF',
    backgroundColor: '#FFB74D',
    type: 'person'
  },
  MERCHANDISER: {
    id: 'merchandiser',
    label: 'Merchandiser',
    acronym: 'M',
    color: '#FFFFFF',
    backgroundColor: '#81C784',
    type: 'person'
  },
  TM: {
    id: 'tm',
    label: 'TM',
    acronym: 'TM',
    color: '#FFFFFF',
    backgroundColor: '#BA68C8',
    type: 'person'
  },
  AM: {
    id: 'am',
    label: 'AM',
    acronym: 'AM',
    color: '#FFFFFF',
    backgroundColor: '#F06292',
    type: 'person'
  },
  NAM: {
    id: 'nam',
    label: 'Nam',
    acronym: 'Nam',
    color: '#FFFFFF',
    backgroundColor: '#A1887F',
    type: 'person'
  },

  // Tag Azioni (Quadrati) - Colori Pastello
  CONSEGNA: {
    id: 'consegna',
    label: 'Consegna',
    acronym: 'C',
    color: '#FFFFFF',
    backgroundColor: '#A5D6A7', // Verde pastello
    type: 'action'
  },
  ALLESTIMENTO: {
    id: 'allestimento',
    label: 'Allestimento',
    acronym: 'A',
    color: '#FFFFFF',
    backgroundColor: '#FFCC80', // Arancione pastello
    type: 'action'
  },
  SELL_IN: {
    id: 'sell_in',
    label: 'Sell in',
    acronym: 'SI',
    color: '#FFFFFF',
    backgroundColor: '#90CAF9', // Blu pastello
    type: 'action'
  },
  SELLOUT: {
    id: 'sellout',
    label: 'Sellout',
    acronym: 'SO',
    color: '#FFFFFF',
    backgroundColor: '#CE93D8', // Viola pastello
    type: 'action'
  },
  CHECK: {
    id: 'check',
    label: 'Check',
    acronym: '✓',
    color: '#FFFFFF',
    backgroundColor: '#EF9A9A', // Rosso pastello
    type: 'action'
  }
} as const;

export type TagId = keyof typeof Tags;

export const getTagById = (id: string): TagConfig | undefined => {
  return Object.values(Tags).find(tag => tag.id === id);
};

export const getTagsByType = (type: 'person' | 'action'): TagConfig[] => {
  return Object.values(Tags).filter(tag => tag.type === type);
};

export const getAllTags = (): TagConfig[] => {
  return Object.values(Tags);
}; 