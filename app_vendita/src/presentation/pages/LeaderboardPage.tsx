import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useCalendarStore } from '../../stores/calendarStore';
import { useFirebaseExcelData } from '../../hooks/useFirebaseExcelData';
import { useRepository } from '../../hooks/useRepository';

type Metric = 'ordered' | 'sold';
type Period = 'current' | 'previous';

interface LeaderboardRow {
  salesPointId: string;
  salesPointName: string;
  value: number;
}

export default function LeaderboardPage() {
  const entries = useCalendarStore((s) => s.entries);
  const refreshToken = useCalendarStore((s) => s.leaderboardRefreshToken);
  const lastSync = useCalendarStore((s) => s.lastSyncTimestamp);
  const salesPoints = useCalendarStore((s) => s.salesPoints);
  const { excelData: excelRows } = useFirebaseExcelData();
  const repository = useRepository();

  const [metric, setMetric] = useState<Metric>('ordered');
  const [period, setPeriod] = useState<Period>('current');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(20);

  const now = new Date();
  const base = new Date(now);
  if (period === 'previous') {
    base.setMonth(base.getMonth() - 1);
  }
  const currentYear = base.getFullYear();
  const currentMonth = base.getMonth() + 1;

  // Stato locale per classifica calcolata dal repository (mese corrente)
  const [repoRows, setRepoRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const year = currentYear;
        const month = currentMonth;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        const entriesAll = await repository.getCalendarEntries(start, end);
        const byClient = new Map<string, number>();
        for (const e of entriesAll) {
          const clientId = e.salesPointId;
          if (!clientId) continue;
          let add = 0;
          if (metric === 'ordered') {
            add = e.focusReferencesData?.reduce((s: number, ref: any) => {
              const ordered = parseFloat(String(ref?.orderedPieces || '0')) || 0;
              const price = parseFloat(String(ref?.netPrice || '0')) || 0;
              return s + ordered * price;
            }, 0) || 0;
          } else {
            add = e.focusReferencesData?.reduce((s: number, ref: any) => {
              const sold = parseFloat(String(ref?.soldPieces || '0')) || 0;
              const price = parseFloat(String(ref?.netPrice || '0')) || 0;
              return s + sold * price;
            }, 0) || 0;
          }
          if (add > 0) {
            byClient.set(clientId, (byClient.get(clientId) || 0) + add);
          }
        }
        const built: LeaderboardRow[] = Array.from(byClient.entries()).map(([salesPointId, value]) => {
          let name = salesPoints.find((sp) => sp.id === salesPointId)?.name;
          if (!name || name.toLowerCase().includes('default')) {
            const match = (excelRows as any[])?.find((r) => r.codiceCliente === salesPointId || r['insegnaCliente'] === salesPointId);
            name = match?.cliente || match?.['insegnaCliente'] || name;
          }
          name = name || salesPointId;
          return { salesPointId, salesPointName: name, value };
        });
        if (mounted) setRepoRows(built);
      } catch (e) {
        if (mounted) setRepoRows([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, [repository, currentYear, currentMonth, metric, salesPoints, excelRows, refreshToken, lastSync]);

  const rows = useMemo<LeaderboardRow[]>(() => {
    // Se non abbiamo ancora caricato dal repository, mostra fallback locale (se coerente)
    if (repoRows === null) {
      if (!entries || entries.length === 0) return [];
      const byClient = new Map<string, number>();
      for (const e of entries) {
        const d = e.date instanceof Date ? e.date : new Date(e.date);
        if (d.getFullYear() !== currentYear || d.getMonth() + 1 !== currentMonth) continue;
        const clientId = e.salesPointId; if (!clientId) continue;
        let add = 0;
        if (metric === 'ordered') {
          add = e.focusReferencesData?.reduce((s, ref) => {
            const ordered = parseFloat(String(ref?.orderedPieces || '0')) || 0;
            const price = parseFloat(String(ref?.netPrice || '0')) || 0;
            return s + ordered * price;
          }, 0) || 0;
        } else {
          add = e.focusReferencesData?.reduce((s, ref) => {
            const sold = parseFloat(String(ref?.soldPieces || '0')) || 0;
            const price = parseFloat(String(ref?.netPrice || '0')) || 0;
            return s + sold * price;
          }, 0) || 0;
        }
        if (add > 0) {
          byClient.set(clientId, (byClient.get(clientId) || 0) + add);
        }
      }
      const built: LeaderboardRow[] = Array.from(byClient.entries()).map(([salesPointId, value]) => {
        let name = salesPoints.find((sp) => sp.id === salesPointId)?.name;
        if (!name || name.toLowerCase().includes('default')) {
          const match = (excelRows as any[])?.find((r) => r.codiceCliente === salesPointId || r['insegnaCliente'] === salesPointId);
          name = match?.cliente || match?.['insegnaCliente'] || name;
        }
        name = name || salesPointId;
        return { salesPointId, salesPointName: name, value };
      });
      return built.sort((a, b) => b.value - a.value).slice(0, limit);
    }

    const rows = repoRows;

    let result = rows.filter((r) => r.value > 0);

    // Ricerca per nome/id
    const q = query.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter((r) =>
        r.salesPointName.toLowerCase().includes(q) || r.salesPointId.toLowerCase().includes(q)
      );
    }

    // Ordina e applica limite dinamico
    return result.sort((a, b) => b.value - a.value).slice(0, limit);
  }, [entries, repoRows, salesPoints, metric, currentYear, currentMonth, query, limit]);

  const total = useMemo(() => rows.reduce((s, r) => s + r.value, 0), [rows]);

  const renderItem = ({ item, index }: { item: LeaderboardRow; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>{index + 1}</Text>
      <View style={styles.clientCell}>
        <Text style={styles.clientName}>{item.salesPointName}</Text>
        <Text style={styles.clientId}>{item.salesPointId}</Text>
      </View>
      <Text style={styles.value}>€{Math.round(item.value)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Classifica Clienti</Text>
        <View style={styles.controlsRow}>
          <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, metric === 'ordered' && styles.toggleBtnActive]}
            onPress={() => setMetric('ordered')}
          >
            <Text style={[styles.toggleText, metric === 'ordered' && styles.toggleTextActive]}>Ordinato</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, metric === 'sold' && styles.toggleBtnActive]}
            onPress={() => setMetric('sold')}
          >
            <Text style={[styles.toggleText, metric === 'sold' && styles.toggleTextActive]}>Venduto</Text>
          </TouchableOpacity>
          </View>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, period === 'current' && styles.toggleBtnActive]}
              onPress={() => { setPeriod('current'); setLimit(20); }}
            >
              <Text style={[styles.toggleText, period === 'current' && styles.toggleTextActive]}>Mese</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, period === 'previous' && styles.toggleBtnActive]}
              onPress={() => { setPeriod('previous'); setLimit(20); }}
            >
              <Text style={[styles.toggleText, period === 'previous' && styles.toggleTextActive]}>Prec.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}> 
        <TextInput
          placeholder="Cerca cliente..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.salesPointId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}> 
            <Text style={styles.emptyText}>Nessun cliente con dati nel mese corrente</Text>
          </View>
        }
        ListFooterComponent={rows.length >= limit ? (
          <View style={styles.footerBtnWrap}>
            <TouchableOpacity style={styles.moreBtn} onPress={() => setLimit((v) => v + 20)}>
              <Text style={styles.moreBtnText}>Mostra altri</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />

      <View style={styles.footer}> 
        <Text style={styles.footerText}>Totale {metric === 'ordered' ? 'ordinato' : 'venduto'} mese: €{Math.round(total)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 4 },
  header: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: '#2d4150' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: { flexDirection: 'row', gap: 6 },
  toggleBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleBtnActive: { backgroundColor: '#e3f2fd', borderColor: '#90caf9' },
  toggleText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  toggleTextActive: { color: '#1976d2' },
  searchBar: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#334155' },
  list: { padding: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafb', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 6 },
  rank: { width: 22, textAlign: 'center', fontWeight: '800', color: '#1976d2' },
  clientCell: { flex: 1 },
  clientName: { fontSize: 13, fontWeight: '700', color: '#334155' },
  clientId: { fontSize: 10, color: '#94a3b8' },
  value: { width: 80, textAlign: 'right', fontSize: 13, fontWeight: '800', color: '#1976d2' },
  empty: { padding: 16, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 12 },
  footerBtnWrap: { alignItems: 'center', paddingVertical: 8 },
  moreBtn: { backgroundColor: '#e3f2fd', borderColor: '#90caf9', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  moreBtnText: { color: '#1976d2', fontWeight: '700', fontSize: 12 },
  footer: { padding: 8, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#334155', fontWeight: '700' },
});


