export interface ExcelRow {
  id: string;
  linea: string;
  amCode: string;
  namCode: string;
  agenteCode: string;
  agenteName: string;
  insegnaCliente: string;
  codiceCliente: string;
  cliente: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExcelDataState {
  rows: ExcelRow[];
  isLoading: boolean;
  error: string | null;
} 