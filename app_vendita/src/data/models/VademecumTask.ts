export type VademecumChannel = 'FOOD' | 'DIY';

export interface VademecumTask {
  id?: string;
  channel: VademecumChannel;
  retailer: string | null;
  actionText: string;
  brandTags: string[];
  windowStart: Date | null;
  windowEnd: Date | null;
  priorityHint: number;
  actionCategory?: 'sell_in' | 'sell_out' | 'raccolta_ordini' | 'volantino' | 'implementazione' | 'verifica' | 'focus_brand' | 'altro';
  isFocusBrand?: boolean;
  sourcePage?: number | null;
  sourceDocId?: string | null; // nome file PDF o uploadId
  status?: 'pending' | 'doing' | 'done' | 'blocked';
  isEstimated?: boolean; // true se le date sono state stimate (fallback)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RawVademecumRow {
  channel?: string;
  retailer?: string;
  action?: string;
  window_start?: string | null;
  window_end?: string | null;
  brands?: string | string[] | null;
  priority_hint?: number | string | null;
  source_page?: number | string | null;
  action_category?: 'sell_in' | 'sell_out' | 'raccolta_ordini' | 'volantino' | 'implementazione' | 'verifica' | 'focus_brand' | 'altro';
  is_focus_brand?: boolean;
}


