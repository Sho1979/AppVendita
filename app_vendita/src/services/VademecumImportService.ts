import { vademecumRepository } from '../data/repositories/vademecumRepository';
import { RawVademecumRow, VademecumChannel, VademecumTask } from '../data/models/VademecumTask';

function toDateOrNull(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeBrands(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(s => String(s).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function toChannel(raw?: string): VademecumChannel {
  const v = (raw || '').toUpperCase();
  return v === 'DIY' ? 'DIY' : 'FOOD';
}

export class VademecumImportService {
  async importRows(rows: RawVademecumRow[], defaultSourceDocId?: string, opts?: { fallbackMonth?: number; fallbackYear?: number }): Promise<number> {
    let count = 0;
    for (const r of rows) {
      const channel = toChannel(r.channel || 'FOOD');
      // Calcolo date con fallback
      let start = r.window_start ? new Date(r.window_start) : null;
      let end = r.window_end ? new Date(r.window_end) : null;
      let isEstimated = false;
      if (!start && !end && opts?.fallbackMonth && opts?.fallbackYear) {
        // Se non ci sono date, usa l'intero mese indicato (1..ultimo)
        const y = opts.fallbackYear;
        const m = opts.fallbackMonth - 1; // JS 0-based
        start = new Date(y, m, 1);
        end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        isEstimated = true;
      }
      // Normalizzazione retailer per dedup (Carrefour Iper/Market → Carrefour, ecc.)
      const normalizeRetailer = (name?: string | null): string | null => {
        if (!name) return null;
        const t = name.toLowerCase();
        if (t.includes('carrefour')) return 'Carrefour';
        if (t.includes('vege')) return 'Vege Retail';
        if (t.includes("maury")) return "Maury's";
        if (t.includes('iper ') || t === 'iper') return 'Iper';
        return name.trim();
      };

      const task: Omit<VademecumTask, 'id'> = {
        channel,
        retailer: normalizeRetailer(r.retailer) || null,
        actionText: (r.action || '').trim(),
        brandTags: normalizeBrands(r.brands),
        windowStart: start,
        windowEnd: end,
        priorityHint: Number(r.priority_hint ?? 0) || 0,
        actionCategory: (r.action_category as any) || 'altro',
        isFocusBrand: !!r.is_focus_brand,
        sourcePage: r.source_page ? Number(r.source_page) : null,
        sourceDocId: defaultSourceDocId || null,
        status: 'pending',
        isEstimated,
      };

      await vademecumRepository.addTask(channel, task);
      count++;
    }
    return count;
  }

  async saveRawForAudit(rows: RawVademecumRow[], monthKey: string, sourceDocId?: string) {
    // Divide i rows per canale e salva in subcollection uploads
    const byChannel: Record<string, RawVademecumRow[]> = { FOOD: [], DIY: [] } as any;
    for (const r of rows) {
      const ch = toChannel(r.channel || 'FOOD');
      byChannel[ch].push(r);
    }
    if (byChannel['FOOD'].length > 0) {
      await vademecumRepository.saveRawUpload('FOOD', monthKey, byChannel['FOOD'], sourceDocId || null);
    }
    if (byChannel['DIY'].length > 0) {
      await vademecumRepository.saveRawUpload('DIY', monthKey, byChannel['DIY'], sourceDocId || null);
    }
  }
}

export const vademecumImportService = new VademecumImportService();


