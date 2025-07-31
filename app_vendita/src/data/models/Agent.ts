export interface Agent {
  id: string;
  name: string;
  code: string; // Agente COD (MV13, MM16)
  salesPointId: string;
  salesPointName: string;
  salesPointCode: string; // Sold T (199507, 2712587, etc.)
  region: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  amCode: string; // AM Code (AM Di9)
  namCode: string; // NAM Code (NAM Be8, NAM Bo10)
  line: string; // Linea (LIV 1 - LINEA 2 - MODERN FOOD)
  level4: string; // Lev 4 (LIV 4 - SINTESI, etc.)
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentImportData {
  name: string;
  code: string;
  salesPointName: string;
  salesPointCode: string;
  region: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  amCode: string;
  namCode: string;
  line: string;
  level4: string;
}

export interface ExcelRowData {
  'Linea': string;
  'AM Code': string;
  'NAM Code': string;
  'Agente CODE': string;
  'Insegna Cliente': string;
  'Codice Cliente': string;
  'Cliente': string;
  [key: string]: any; // Per colonne aggiuntive
} 