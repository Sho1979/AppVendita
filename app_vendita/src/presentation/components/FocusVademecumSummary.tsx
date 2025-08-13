import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { vademecumRepository } from '../../data/repositories/vademecumRepository';
import { VademecumTask, RawVademecumRow } from '../../data/models/VademecumTask';
import { NamResolver } from '../../services/NamResolver';

function getNextMonthRange(from: Date) {
  const start = new Date(from.getFullYear(), from.getMonth() + 1, 1, 0, 0, 0, 0);
  const end = new Date(from.getFullYear(), from.getMonth() + 2, 0, 23, 59, 59, 999);
  return { start, end };
}

function inRange(d: Date | null | undefined, start: Date, end: Date): boolean {
  if (!d) return false;
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

interface Props {
  hidden?: boolean;
  defaultTab?: 'FOOD'|'DIY';
  onClose?: () => void;
}

export default function FocusVademecumSummary({ hidden, defaultTab = 'FOOD', onClose }: Props) {
  if (hidden) return null;
  const [food, setFood] = useState<VademecumTask[]>([]);
  const [diy, setDiy] = useState<VademecumTask[]>([]);
  const [activeTab, setActiveTab] = useState<'FOOD'|'DIY'>(defaultTab);
  const [rawFood, setRawFood] = useState<RawVademecumRow[]>([]);
  const [rawDiy, setRawDiy] = useState<RawVademecumRow[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [f, d, rf, rd] = await Promise.all([
        vademecumRepository.getTasks('FOOD'),
        vademecumRepository.getTasks('DIY'),
        vademecumRepository.getLatestRawRows('FOOD'),
        vademecumRepository.getLatestRawRows('DIY'),
      ]);
      if (!mounted) return;
      setFood(f);
      setDiy(d);
      setRawFood(rf);
      setRawDiy(rd);
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Sincronizza il tab attivo quando cambia il default
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const now = new Date();
  const next = getNextMonthRange(now);
  // Se il dataset è di Agosto (richiesta utente): mostra Agosto come mese di riferimento
  const showAugust = true; // per MVP, mostriamo Agosto
  const start = showAugust ? new Date(now.getFullYear(), 7, 1, 0, 0, 0, 0) : next.start;
  const end = showAugust ? new Date(now.getFullYear(), 8, 0, 23, 59, 59, 999) : next.end;
  const monthLabel = start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const foodNext = useMemo(() => food.filter(t => inRange(t.windowStart || t.windowEnd, start, end)), [food, start, end]);
  const diyNext = useMemo(() => diy.filter(t => inRange(t.windowStart || t.windowEnd, start, end)), [diy, start, end]);

  const urgent = (t: VademecumTask) => {
    if (!t.windowEnd) return false;
    const diff = t.windowEnd.getTime() - Date.now();
    return diff <= 7 * 24 * 60 * 60 * 1000; // 7 giorni
  };

  const top3 = (list: VademecumTask[]) =>
    [...list].sort((a, b) => (b.priorityHint || 0) - (a.priorityHint || 0)).slice(0, 3);

  function formatDateShort(iso?: string | null) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const day = d.getDate();
    const months = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];
    return `${day} ${months[d.getMonth()]}`;
  }

  const renderRawList = (rows: RawVademecumRow[]) => {
    // Target: struttura PDF per Insegna → lista azioni (con badge date/brand)
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');
    const groups: Record<string, RawVademecumRow[]> = {};
    const focusBrandMap: Record<string, RawVademecumRow[]> = {};
    const normalizeRetailer = (name: string) => {
      const t = name.toLowerCase();
      if (t.includes('carrefour')) return 'CARREFOUR';
      if (t.includes('vege')) return 'VEGE RETAIL';
      if (t.includes("maury")) return "MAURY'S";
      if (t.includes('unicom')) return 'UNICOMM';
      if (t.includes('spazio conad')) return 'SPAZIO CONAD';
      if (t === 'conad') return 'CONAD';
      if (t === 'brico') return 'CARREFOUR'; // evita gruppo reparto errato
      return name.toUpperCase();
    };

    const BLACKLIST = new Set([
      'INSEGNA', 'INSEGNE', 'INSEGNA ORSI', 'INSEGNE ORSI',
      'INSEGNE DELL’AGLIO', 'INSEGNE DELL\’AGLIO', 'INSEGNA DE BLASI',
      'FOCUS BRAND', 'BRAND', 'FOCUS Q3', 'FOOD: FOCUS'
    ]);
    const BRAND_KEYS = ['loctite', 'pritt', 'pattex', 'ariasana', 'super attak', 'millechiodi', 'smuffer', 'minifresh'];

    const normalizeText = (s: string) =>
      s.replace(/Cat\s+alogo/gi, 'Catalogo').replace(/\s+/g, ' ').trim();

    rows.forEach(r => {
      const rawRetailer = normalize(String(r.retailer || ''));
      const hasRetailer = rawRetailer.length > 0 && !BLACKLIST.has(rawRetailer.toUpperCase());
      const brands = typeof r.brands === 'string'
        ? r.brands.split(',').map(s => normalize(s)).filter(Boolean)
        : Array.isArray(r.brands) ? r.brands.map(s => normalize(String(s))).filter(Boolean) : [];
      const isBrandFocus = !hasRetailer && brands.length > 0;
      const text = normalizeText(String(r.action||''));

      if (isBrandFocus || BRAND_KEYS.some(k => text.toLowerCase().includes(k))) {
        const key = (brands[0] || 'ALTRO').toUpperCase();
        if (!focusBrandMap[key]) focusBrandMap[key] = [];
        const exists = focusBrandMap[key].some(x => normalizeText(String(x.action||'')).toLowerCase() === text.toLowerCase());
        if (!exists) focusBrandMap[key].push(r);
        return;
      }

      if (hasRetailer) {
        const retailer = normalizeRetailer(rawRetailer);
        if (!groups[retailer]) groups[retailer] = [];
        const exists = groups[retailer].some(x => normalizeText(String(x.action||'')).toLowerCase() === text.toLowerCase());
        if (!exists) groups[retailer].push(r);
      }
    });

    const retailers = Object.keys(groups).sort();
    const left: string[] = [];
    const right: string[] = [];
    retailers.forEach((k, i) => (i % 2 === 0 ? left : right).push(k));

    const renderRetailerSection = (ret: string) => (
      <View key={ret} style={[styles.card, { borderColor: Colors.warmBorder }]}> 
        <Text style={styles.retailerHeading}>
          {ret}
          {(() => { const n = NamResolver.resolve(ret); return n?.namName ? ` — NAM: ${n.namName}` : ''; })()}
        </Text>
        {/* ordina: prima chi ha date (per OUT crescente), poi testo */}
        {groups[ret]
          .slice()
          .sort((a, b) => {
            const aOut = a.window_end ? new Date(a.window_end).getTime() : Infinity;
            const bOut = b.window_end ? new Date(b.window_end).getTime() : Infinity;
            if (aOut !== bOut) return aOut - bOut;
            return normalizeText(String(a.action||'')).localeCompare(normalizeText(String(b.action||'')));
          })
          .map((r, idx, arr) => {
          const inLabel = formatDateShort(r.window_start);
          const outLabel = formatDateShort(r.window_end);
          const brands = typeof r.brands === 'string'
            ? r.brands.split(',').map(s => normalize(s)).filter(Boolean)
            : Array.isArray(r.brands) ? r.brands.map(s => normalize(String(s))).filter(Boolean) : [];
          const text = normalizeText(r.action || '');
          // unisci righe puramente di nota (iniziano con Nb:) o solo brand come sotto-bullet del precedente
          const isNote = /^nb\s*[:\-]/i.test(text);
          const isSoloBrand = brands.length === 1 && text.toLowerCase() === brands[0].toLowerCase();
          if ((isNote || isSoloBrand) && idx > 0) {
            const prev = arr[idx-1] as any;
            prev.__extraNotes = prev.__extraNotes || [];
            prev.__extraNotes.push(text);
            return null;
          }
          const extraNotes: string[] = (r as any).__extraNotes || [];
          return (
            <View key={`${ret}-${idx}`} style={styles.rowItem}>
              <View style={styles.tagsRow}>
                {!!inLabel && (<View style={[styles.tag, styles.tagIn]}><Text style={styles.tagText}>IN {inLabel}</Text></View>)}
                {!!outLabel && (<View style={[styles.tag, styles.tagOut]}><Text style={styles.tagText}>OUT {outLabel}</Text></View>)}
                {brands.slice(0, 3).map((b, i) => (
                  <View key={`${i}`} style={[styles.tag, styles.tagBrand]}><Text style={styles.tagText}>{b}</Text></View>
                ))}
              </View>
              <Text style={styles.item}>• {text}</Text>
              {extraNotes.map((n, i) => (
                <Text key={`n-${i}`} style={styles.subItem}>{n}</Text>
              ))}
            </View>
          );
        })}
      </View>
    );

    const brandKeys = Object.keys(focusBrandMap).sort();

    return (
      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 4 }}>
        <View style={styles.pdfGrid}>
          <View style={styles.pdfColumnLeft}>{left.map(renderRetailerSection)}</View>
          <View style={styles.pdfColumnRight}>{right.map(renderRetailerSection)}</View>
        </View>

        {brandKeys.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.retailerHeading, { marginBottom: 6 }]}>FOCUS BRAND</Text>
            <View style={styles.pdfGrid}>
              <View style={styles.pdfColumnLeft}>
                {brandKeys.filter((_, i) => i % 2 === 0).map(key => (
                  <View key={key} style={[styles.card, { borderColor: Colors.warmBorder }]}> 
                    <Text style={styles.cardTitle}>{key}</Text>
                    {focusBrandMap[key].map((r, idx) => (
                      <Text key={`${key}-${idx}`} style={styles.item}>• {(r.action || '').trim()}</Text>
                    ))}
                  </View>
                ))}
              </View>
              <View style={styles.pdfColumnRight}>
                {brandKeys.filter((_, i) => i % 2 === 1).map(key => (
                  <View key={key} style={[styles.card, { borderColor: Colors.warmBorder }]}> 
                    <Text style={styles.cardTitle}>{key}</Text>
                    {focusBrandMap[key].map((r, idx) => (
                      <Text key={`${key}-${idx}`} style={styles.item}>• {(r.action || '').trim()}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={styles.title}>Vademecum — {monthLabel}</Text>
        {onClose ? (
          <TouchableOpacity onPress={onClose} style={styles.closePill} accessibilityLabel="Chiudi Vademecum">
            <Text style={styles.closePillText}>Chiudi</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, activeTab==='FOOD' && styles.tabActive]} onPress={() => setActiveTab('FOOD')}>
          <Text style={[styles.tabText, activeTab==='FOOD' && styles.tabTextActive]}>FOOD</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab==='DIY' && styles.tabActive]} onPress={() => setActiveTab('DIY')}>
          <Text style={[styles.tabText, activeTab==='DIY' && styles.tabTextActive]}>DIY</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'FOOD' && renderRawList(rawFood)}
      {activeTab === 'DIY' && renderRawList(rawDiy)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.warmBorder,
    padding: Spacing.small,
    ...Platform.select({ web: { maxHeight: 360 }, default: {} }),
  },
  closePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.warmBackground,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  closePillText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    maxHeight: 300,
  },
  pdfGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  pdfColumnLeft: {
    flex: 1,
    gap: 8,
  },
  pdfColumnRight: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.warmBackground,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
  },
  tabActive: {
    backgroundColor: '#e7f0ff',
    borderColor: '#5b9bff',
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.small,
  },
  card: {
    backgroundColor: Colors.warmBackground,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.xs,
    marginBottom: 8,
  },
  retailerHeading: {
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontWeight: '800',
    marginBottom: 4,
    color: Colors.textPrimary,
  },
  metric: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
  },
  item: {
    fontSize: 11,
    color: Colors.textPrimary,
  },
  rowItem: {
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#eef2f6',
  },
  tagIn: {
    backgroundColor: '#E6F4EA',
    borderColor: '#9AD1AE',
  },
  tagOut: {
    backgroundColor: '#FCE8E6',
    borderColor: '#F5A8A1',
  },
  tagBrand: {
    backgroundColor: '#F0F4FF',
  },
  tagText: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: Spacing.xs,
  },
  caption: {
    fontSize: 10,
    color: Colors.warmTextSecondary,
  },
});


