export interface FilterConfig {
  id: string;
  name: string;
  description: string;
  selectedColumns: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterConfigState {
  configs: FilterConfig[];
  activeConfig: FilterConfig | null;
  isLoading: boolean;
  error: string | null;
} 