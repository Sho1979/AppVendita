export interface SalesPoint {
  id: string;
  name: string;
  location: string;
  managerId: string;
  agents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalesPointRequest {
  name: string;
  location: string;
  managerId: string;
  agents: string[];
}

export interface UpdateSalesPointRequest {
  name?: string;
  location?: string;
  managerId?: string;
  agents?: string[];
}
