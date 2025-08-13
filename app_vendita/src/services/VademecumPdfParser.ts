import { RawVademecumRow, VademecumChannel } from '../data/models/VademecumTask';
import { ProductCatalogResolver } from './ProductCatalogResolver';

function toIso(dateStr: string): string | null {
  // Supporta formati: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const trimmed = dateStr.trim();
  const ymd = /^([0-9]{4})[-/]([0-9]{2})[-/]([0-9]{2})$/;
  const dmy = /^([0-9]{1,2})[-/]([0-9]{1,2})[-/]([0-9]{2,4})$/;
  if (ymd.test(trimmed)) {
    const m = trimmed.match(ymd)!;
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  if (dmy.test(trimmed)) {
    const m = trimmed.match(dmy)!;
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${mo}-${d}`;
  }
  return null;
}

const BRAND_KEYWORDS = [
  'loctite', 'pritt', 'pattex', 'ariasana', 'super attak', 'millechiodi', 'minifresh', 'smuffer', 'bostik'
];

const RETAILER_KEYWORDS = [
  'carrefour', 'leroy merlin', 'conad', 'spazio conad', 'coop', 'esselunga', 'obi', 'brico io', 'bricofer', 'bricoman', 'bricolife', 'bricocenter', 'brico ok', 'ciesseci', 'unicom', 'unicomm', 'galassia', 'iper', 'finiper', 'vege', 'vege retail', 'drugitalia', 'maury', "maury's", 'maxi di', 'iper famila', 'carrefour iper', 'carrefour market', 'obi', 'obi italia'
];

const ACTION_KEYWORDS = [
  'promo', 'implementazione', 'verifica', 'testata', 'volantino', 'hostess', 'catalogo', 'bts', 'expositor', 'esposizione', 'monitorare', 'gestione', 'recupero'
];
// Heading detection helpers
const RETAILER_HEADING_TOKENS = [
  'carrefour', 'conad', 'spazio conad', 'unicomm', 'maxi di', 'vege', 'vege retail', 'iper', 'finiper', 'coop', 'esselunga',
  'galassia', 'iper famila', 'drugitalia', 'bricocenter', 'bricofer', 'bricoman', 'brico io', 'obi', 'bricolife', 'brico ok', 'iper la grande i'
];
const DISALLOWED_HEADINGS = [
  'brico', 'drug', 'focus brand', 'loctite', 'pritt', 'pattex', 'ariasana', 'super attak', 'millechiodi', 'bts'
];

function isRetailerHeading(raw: string): boolean {
  const t = raw.trim().toLowerCase().replace(/:$/, '');
  if (DISALLOWED_HEADINGS.some(x => t === x || t.includes(x))) return false;
  // Richiede almeno un token retailer noto
  return RETAILER_HEADING_TOKENS.some(tok => t.includes(tok));
}

function computePriority(line: string): number {
  let s = 1;
  const l = line.toLowerCase();
  if (/(obbl\.|entro|fino al)/.test(l)) s += 2;
  if (/(promo|volantino|bts)/.test(l)) s += 2;
  if (/(implementazione|testata)/.test(l)) s += 1;
  return Math.min(5, s);
}

function normalizeRetailerName(name: string): string {
  // Uniforma varianti comuni: Carrefour (Iper/Market) → Carrefour
  const t = name.toLowerCase();
  if (t.includes('carrefour')) return 'Carrefour';
  if (t.includes('vege')) return 'Vege Retail';
  if (t.includes("maury")) return "Maury's";
  if (t.includes('iper ') || t === 'iper') return 'Iper';
  return name.replace(/\b\w/g, c => c.toUpperCase());
}

function detectRetailer(line: string): string | undefined {
  const l = line.toLowerCase();
  for (const r of RETAILER_KEYWORDS) {
    if (l.includes(r)) return normalizeRetailerName(r);
  }
  return undefined;
}

function detectBrands(line: string): string[] {
  const l = line.toLowerCase();
  const brands = new Set<string>();
  for (const b of BRAND_KEYWORDS) {
    if (l.includes(b)) brands.add(b.replace(/\b\w/g, c => c.toUpperCase()));
  }
  return Array.from(brands);
}

// Deduplica e normalizza i brand (Title Case), ignorando stringhe vuote
function uniqueBrands(list: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const v = String(raw ?? '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v.replace(/\b\w/g, c => c.toUpperCase()));
    }
  }
  return out;
}

const IT_MONTHS: Record<string, number> = {
  'gennaio': 1, 'gen': 1,
  'febbraio': 2, 'feb': 2,
  'marzo': 3, 'mar': 3,
  'aprile': 4, 'apr': 4,
  'maggio': 5, 'mag': 5,
  'giugno': 6, 'giu': 6,
  'luglio': 7, 'lug': 7,
  'agosto': 8, 'ago': 8,
  'settembre': 9, 'sett': 9, 'set': 9,
  'ottobre': 10, 'ott': 10,
  'novembre': 11, 'nov': 11,
  'dicembre': 12, 'dic': 12,
};

function toIsoFromItalian(day: string, monthName: string, refYear: number): string | null {
  const d = parseInt(day.trim(), 10);
  const m = IT_MONTHS[monthName.toLowerCase()];
  if (!m || isNaN(d)) return null;
  const dd = String(Math.min(Math.max(d, 1), 31)).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${refYear}-${mm}-${dd}`;
}

function extractItalianDates(text: string, refYear: number): { start?: string | null; end?: string | null } {
  const t = text.replace(/\s+/g, ' ').toLowerCase();
  // dd/mm - dd/mm (es. 25/7 - 07/8)
  const numRange = t.match(/(\d{1,2})\/(\d{1,2})\s*[–—-]\s*(\d{1,2})\/(\d{1,2})/);
  if (numRange) {
    const sd = numRange[1].padStart(2, '0');
    const sm = numRange[2].padStart(2, '0');
    const ed = numRange[3].padStart(2, '0');
    const em = numRange[4].padStart(2, '0');
    return { start: `${refYear}-${sm}-${sd}`, end: `${refYear}-${em}-${ed}` };
  }
  // dd/mm (fino al 31/8, dal 25/7)
  const numSingle = t.match(/(fino\s+al|entro\s+il|dal|da)\s*(\d{1,2})\/(\d{1,2})/);
  if (numSingle) {
    const d = numSingle[2].padStart(2, '0');
    const m = numSingle[3].padStart(2, '0');
    if (numSingle[1].startsWith('dal') || numSingle[1] === 'da') {
      return { start: `${refYear}-${m}-${d}` };
    }
    return { end: `${refYear}-${m}-${d}` };
  }
  // range tipo: 25 agosto – 7 ottobre | 25 agosto-7 ottobre | 25 agosto 7 ottobre
  const range = t.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)\s*[–—-]\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)/i);
  if (range) {
    const startIso = toIsoFromItalian(range[1], range[2], refYear);
    const endIso = toIsoFromItalian(range[3], range[4], refYear);
    return { start: startIso, end: endIso };
  }
  // dd/dd mese (es. 22/31 ago)
  const dayDayMonth = t.match(/(\d{1,2})\/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)/i);
  if (dayDayMonth) {
    const sd = dayDayMonth[1].padStart(2, '0');
    const ed = dayDayMonth[2].padStart(2, '0');
    const mm = String(IT_MONTHS[dayDayMonth[3].toLowerCase()]).padStart(2, '0');
    return { start: `${refYear}-${mm}-${sd}`, end: `${refYear}-${mm}-${ed}` };
  }
  // fino al 7 ottobre
  const fino = t.match(/fino\s+al\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)/i);
  if (fino) {
    const endIso = toIsoFromItalian(fino[1], fino[2], refYear);
    return { end: endIso };
  }
  // da 25 luglio a 25 settembre
  const daA = t.match(/da\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)\s+a\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)/i);
  if (daA) {
    const startIso = toIsoFromItalian(daA[1], daA[2], refYear);
    const endIso = toIsoFromItalian(daA[3], daA[4], refYear);
    return { start: startIso, end: endIso };
  }
  // mese-mese senza giorni (es. lug/ago, luglio-agosto, luglio agosto)
  const monthToMonth = t.match(/(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)\s*[\/\- ]\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)/i);
  if (monthToMonth) {
    const m1 = IT_MONTHS[monthToMonth[1].toLowerCase()];
    const m2 = IT_MONTHS[monthToMonth[2].toLowerCase()];
    if (m1 && m2) {
      const startIso = `${refYear}-${String(m1).padStart(2,'0')}-01`;
      const endDate = new Date(refYear, m2, 0);
      const endIso = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
      return { start: startIso, end: endIso };
    }
  }
  // dal 25 agosto
  const dal = t.match(/dal\s*(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)/i);
  if (dal) {
    const startIso = toIsoFromItalian(dal[1], dal[2], refYear);
    return { start: startIso };
  }
  // singola data 25 agosto (es. sell in25 agosto | 25 Agosto)
  const single = t.match(/(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|sett|ott|nov|dic)/i);
  if (single) {
    const iso = toIsoFromItalian(single[1], single[2], refYear);
    return { start: iso };
  }
  return {};
}

export async function extractPdfText(uri: string): Promise<{ pages: string[]; fullText: string }> {
  // Usa build legacy per compatibilità con Metro/Hermes (pdfjs-dist 3.11.174)
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf');
  const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const ab = await fetch(uri).then(r => r.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: ab }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = (tc.items || []).map((it: any) => it.str).join(' ').replace(/\s+/g, ' ').trim();
    pages.push(text);
  }
  return { pages, fullText: pages.join('\n') };
}

export function parseVademecumText(channel: VademecumChannel, pages: string[], sourceDocId?: string): RawVademecumRow[] {
  const rows: RawVademecumRow[] = [];
  const refYear = new Date().getFullYear();
  let currentRetailer: string | undefined = undefined;
  const seen = new Set<string>();
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const lines = page
      .split(/\n|\s{2,}|•|-\s+/)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    for (const line of lines) {
      const l = line.toLowerCase();
      // Heading/retailer detection: line ends with ':' o contiene retailer noto
      const looksLikeHeading = /:$/i.test(line) || /^[A-Z][A-Z\s&.'-]{2,}$/.test(line);
      const retailerFromKeywords = RETAILER_KEYWORDS.find(r => l.includes(r));
      if ((looksLikeHeading && isRetailerHeading(line)) || retailerFromKeywords) {
        // Esempi: "SPAZIO CONAD :", "Carrefour IPER:", "Vege Retail"
        const cleaned = (retailerFromKeywords || line.replace(/:$/,'')).trim();
        // Normalizza capitalizzazione
        currentRetailer = normalizeRetailerName(cleaned.replace(/\s+/g, ' '));
        continue; // passa alle righe successive (bullet)
      }
      const hasAction = ACTION_KEYWORDS.some(k => l.includes(k));
      const brands = detectBrands(line);

      // Estrai date con formati numerici o con mesi in italiano
      let start = null as string | null;
      let end = null as string | null;
      const numericMatches = line.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})/g) || [];
      if (numericMatches.length > 0) {
        start = toIso(numericMatches[0]);
        end = numericMatches[1] ? toIso(numericMatches[1]) : start;
      } else {
        const it = extractItalianDates(line, refYear);
        start = it.start ? it.start : null;
        end = it.end ? it.end : (it.start ? it.start : null);
      }

      // Classificazione azione con priorità
      let action_category: any = 'altro';
      const lc = l;
      const looksFocusBrandSection = /focus\s*brand/.test(lc) || (!start && brands.length > 0 && !hasAction);
      if (looksFocusBrandSection) action_category = 'focus_brand';
      else if (/raccolta\s+ordini?/.test(lc) || /raccolta\s+ordine/.test(lc)) action_category = 'raccolta_ordini';
      else if (/(volantin|catalogo|opuscolo)/.test(lc)) action_category = 'volantino';
      else if (/(implementazione|allestiment|display|testata|isola|gondola|spiaggiata)/.test(lc)) action_category = 'implementazione';
      else if (/(verifica|controllo|audit|check|foto)/.test(lc)) action_category = 'verifica';
      else if (/(sell\s*in|dal\s+\d|da\s+\d)/.test(lc)) action_category = 'sell_in';
      else if (/(sell\s*out|fino\s+al|entro\s+il)/.test(lc)) action_category = 'sell_out';

      // Regola inclusiva: tieni le righe che hanno almeno una data oppure action/brand o focus brand
      if (!start && brands.length === 0 && !hasAction && action_category !== 'focus_brand') continue;

      const retailer = normalizeRetailerName(detectRetailer(line) || currentRetailer || '');
      const priority = computePriority(line);

      const resolved = ProductCatalogResolver.isReady() ? ProductCatalogResolver.resolveText(line) : { brandsResolved: [], referenceIds: [], confidence: 0 };
      const row = {
        channel,
        retailer,
        action: line,
        window_start: start,
        window_end: end,
        brands: uniqueBrands([...brands, ...resolved.brandsResolved]).join(', '),
        priority_hint: priority,
        source_page: pageIndex + 1,
        action_category,
        is_focus_brand: action_category === 'focus_brand',
      } as RawVademecumRow;

      // Dedup aggressivo su (retailer + testo normalizzato)
      const key = `${(row.retailer||'').toUpperCase()}__${line.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        rows.push(row);
        seen.add(key);
      }
    }
  }
  return rows;
}


