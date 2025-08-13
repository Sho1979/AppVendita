import { 
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../core/services/firebase';
import { VademecumTask, VademecumChannel, RawVademecumRow } from '../models/VademecumTask';

const BASE_PATH = 'channels';
const TASKS_COLLECTION = 'vademecumTasks';

export class VademecumRepository {
  private colPath(channel: VademecumChannel) {
    return `${BASE_PATH}/${channel}/${TASKS_COLLECTION}`;
  }

  private uploadsPath(channel: VademecumChannel) {
    return `${BASE_PATH}/${channel}/vademecumUploads`;
  }

  async addTask(channel: VademecumChannel, task: Omit<VademecumTask, 'id'>): Promise<string> {
    const ref = collection(db, this.colPath(channel));
    const clean: any = { ...task };
    Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
    const res = await addDoc(ref, {
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return res.id;
  }

  async getTasks(channel: VademecumChannel): Promise<VademecumTask[]> {
    const snap = await getDocs(collection(db, this.colPath(channel)));
    return snap.docs.map(d => {
      const data: any = d.data();
      return {
        id: d.id,
        channel,
        retailer: data.retailer ?? null,
        actionText: data.actionText ?? '',
        brandTags: Array.isArray(data.brandTags) ? data.brandTags : [],
        windowStart: data.windowStart?.toDate?.() ?? null,
        windowEnd: data.windowEnd?.toDate?.() ?? null,
        priorityHint: Number(data.priorityHint ?? 0),
        sourcePage: data.sourcePage ?? null,
        sourceDocId: data.sourceDocId ?? null,
        status: data.status ?? 'pending',
        createdAt: data.createdAt?.toDate?.() ?? undefined,
        updatedAt: data.updatedAt?.toDate?.() ?? undefined,
      } as VademecumTask;
    });
  }

  async getTask(channel: VademecumChannel, id: string): Promise<VademecumTask | null> {
    const d = await getDoc(doc(db, this.colPath(channel), id));
    if (!d.exists()) return null;
    const data: any = d.data();
    return {
      id: d.id,
      channel,
      retailer: data.retailer ?? null,
      actionText: data.actionText ?? '',
      brandTags: Array.isArray(data.brandTags) ? data.brandTags : [],
      windowStart: data.windowStart?.toDate?.() ?? null,
      windowEnd: data.windowEnd?.toDate?.() ?? null,
      priorityHint: Number(data.priorityHint ?? 0),
      sourcePage: data.sourcePage ?? null,
      sourceDocId: data.sourceDocId ?? null,
      status: data.status ?? 'pending',
      createdAt: data.createdAt?.toDate?.() ?? undefined,
      updatedAt: data.updatedAt?.toDate?.() ?? undefined,
    } as VademecumTask;
  }

  async updateTask(channel: VademecumChannel, id: string, updates: Partial<VademecumTask>): Promise<void> {
    const ref = doc(db, this.colPath(channel), id);
    const clean: any = { ...updates };
    Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
    await updateDoc(ref, {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  }

  async saveRawUpload(
    channel: VademecumChannel,
    monthKey: string,
    rows: any[],
    sourceDocId?: string | null,
  ): Promise<void> {
    // Spezza in chunk per evitare limite 1MB per doc
    const chunkSize = 300; // conservativo
    const totalRows = rows.length;
    let chunkIndex = 0;
    for (let i = 0; i < totalRows; i += chunkSize) {
      const slice = rows.slice(i, i + chunkSize);
      // Firestore non accetta undefined: pulizia profonda delle righe
      const cleaned = slice.map((row: any) => {
        const obj: any = { ...row };
        Object.keys(obj).forEach((k) => {
          if (obj[k] === undefined) delete obj[k];
        });
        return obj;
      });
      await addDoc(collection(db, this.uploadsPath(channel)), {
        monthKey,
        sourceDocId: sourceDocId ?? null,
        chunkIndex,
        chunkSize: cleaned.length,
        totalRows,
        rows: cleaned,
        createdAt: serverTimestamp(),
      });
      chunkIndex++;
    }
  }

  async getLatestRawRows(
    channel: VademecumChannel,
    monthKey?: string,
  ): Promise<RawVademecumRow[]> {
    const snap = await getDocs(collection(db, this.uploadsPath(channel)));
    if (snap.empty) return [];
    // Raggruppa per monthKey
    const groups: Record<string, any[]> = {};
    snap.docs.forEach(d => {
      const data: any = d.data();
      const key = String(data.monthKey || '');
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        chunkIndex: Number(data.chunkIndex ?? 0),
        rows: Array.isArray(data.rows) ? data.rows : [],
      });
    });
    const targetKey = monthKey || Object.keys(groups).sort().pop() || '';
    const chunks = groups[targetKey] || [];
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const merged: RawVademecumRow[] = [];
    for (const ch of chunks) {
      for (const r of ch.rows) {
        // tipizza in RawVademecumRow mantenendo i campi noti
        const row: RawVademecumRow = {
          channel: r.channel,
          retailer: r.retailer,
          action: r.action,
          window_start: r.window_start,
          window_end: r.window_end,
          brands: r.brands,
          priority_hint: r.priority_hint,
          source_page: r.source_page,
        };
        merged.push(row);
      }
    }
    return merged;
  }
}

export const vademecumRepository = new VademecumRepository();


