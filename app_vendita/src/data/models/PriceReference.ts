export interface PriceReference {
  id: string;
  brand: string;
  subBrand: string;
  typology: string;
  ean: string;
  code: string;
  description: string;
  piecesPerCarton: number;
  unitPrice: number;
  netPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePriceReferenceRequest {
  brand: string;
  subBrand: string;
  typology: string;
  ean: string;
  code: string;
  description: string;
  piecesPerCarton: number;
  unitPrice: number;
  netPrice: number;
  isActive?: boolean;
}

export interface UpdatePriceReferenceRequest {
  brand?: string;
  subBrand?: string;
  typology?: string;
  ean?: string;
  code?: string;
  description?: string;
  piecesPerCarton?: number;
  unitPrice?: number;
  netPrice?: number;
  isActive?: boolean;
} 