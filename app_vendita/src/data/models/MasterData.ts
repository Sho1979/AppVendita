export interface MasterDataRow {
  id: string;
  linea: string;
  codiceAreaManager: string;
  codiceNam: string;
  codiceAgente: string;
  nomeAgente: string;
  mailAgente: string;
  cellAgente: string;
  insegna: string;
  codiceCliente: string;
  cliente: string;
  cap: string;
  indirizzo: string;
  provincia: string;
  codiceProvincia: string;
  latitudine: number;
  longitudine: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMasterDataRowRequest {
  linea: string;
  codiceAreaManager: string;
  codiceNam: string;
  codiceAgente: string;
  nomeAgente: string;
  mailAgente: string;
  cellAgente: string;
  insegna: string;
  codiceCliente: string;
  cliente: string;
  cap: string;
  indirizzo: string;
  provincia: string;
  codiceProvincia: string;
  latitudine: number;
  longitudine: number;
}

export interface UpdateMasterDataRowRequest {
  linea?: string;
  codiceAreaManager?: string;
  codiceNam?: string;
  codiceAgente?: string;
  nomeAgente?: string;
  mailAgente?: string;
  cellAgente?: string;
  insegna?: string;
  codiceCliente?: string;
  cliente?: string;
  cap?: string;
  indirizzo?: string;
  provincia?: string;
  codiceProvincia?: string;
  latitudine?: number;
  longitudine?: number;
}

// Interfacce per i dati aggregati per i filtri
export interface MasterDataFilters {
  linee: string[];
  areaManagers: { codice: string; nome: string }[];
  namCodes: { codice: string; nome: string }[];
  agents: { codice: string; nome: string; mail: string; cell: string }[];
  salesPoints: { codice: string; nome: string; indirizzo: string; provincia: string }[];
}

// Interfaccia per il risultato dell'importazione
export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errors: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
  message: string;
} 