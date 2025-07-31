export interface CalendarEntry {
  id: string;
  date: Date;
  userId: string;
  salesPointId: string;
  actions: {
    type: string;
    count: number;
    notes?: string;
  }[];
  sales: {
    product: string;
    quantity: number;
    value: number;
    notes?: string;
  }[];
  hasProblem: boolean;
  problemDescription?: string;
  notes?: string;
  // Chat di note multiple
  chatNotes?: {
    id: string;
    userId: string;
    userName?: string;
    message: string;
    timestamp: Date;
  }[];
  // Nuovi campi per i tag
  tags: string[]; // Array di ID dei tag selezionati
  repeatSettings?: {
    enabled: boolean;
    weeksCount: number; // Numero di settimane da ripetere
  } | undefined;
  // Dati delle referenze focus
  focusReferencesData?: {
    referenceId: string;
    orderedPieces: string;
    soldPieces: string;
    stockPieces: string;
    soldVsStockPercentage: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalendarEntryRequest {
  date: Date;
  userId: string;
  salesPointId: string;
  actions: {
    type: string;
    count: number;
    notes?: string;
  }[];
  sales: {
    product: string;
    quantity: number;
    value: number;
    notes?: string;
  }[];
  hasProblem: boolean;
  problemDescription?: string;
  notes?: string;
  // Chat di note multiple
  chatNotes?: {
    id: string;
    userId: string;
    userName?: string;
    message: string;
    timestamp: Date;
  }[];
  // Nuovi campi per i tag
  tags: string[];
  repeatSettings?: {
    enabled: boolean;
    weeksCount: number;
  };
  // Dati delle referenze focus
  focusReferencesData?: {
    referenceId: string;
    orderedPieces: string;
    soldPieces: string;
    stockPieces: string;
    soldVsStockPercentage: string;
  }[];
}

export interface UpdateCalendarEntryRequest {
  actions?: {
    type: string;
    count: number;
    notes?: string;
  }[];
  sales?: {
    product: string;
    quantity: number;
    value: number;
    notes?: string;
  }[];
  hasProblem?: boolean;
  problemDescription?: string;
  notes?: string;
  // Chat di note multiple
  chatNotes?: {
    id: string;
    userId: string;
    userName?: string;
    message: string;
    timestamp: Date;
  }[];
  // Nuovi campi per i tag
  tags?: string[];
  repeatSettings?: {
    enabled: boolean;
    weeksCount: number;
  };
  // Dati delle referenze focus
  focusReferencesData?: {
    referenceId: string;
    orderedPieces: string;
    soldPieces: string;
    stockPieces: string;
    soldVsStockPercentage: string;
  }[];
}
