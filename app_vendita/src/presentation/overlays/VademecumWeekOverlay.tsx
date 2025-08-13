import React from 'react';
import { View, Text } from 'react-native';
import { getRetailerColor } from '../../services/RetailerColors';

type OverlayItem = { retailer?: string | null; action: string; channel?: 'FOOD'|'DIY' };
type DayOverlay = { items: OverlayItem[] };

export function renderVademecumWeekOverlay(overlay?: DayOverlay, onPress?: (retailer: string, items: any[]) => void, pulse?: boolean) {
  if (!overlay || !overlay.items || overlay.items.length === 0) return null;

  const items: OverlayItem[] = overlay.items || [];
  const byChannel: Record<'FOOD'|'DIY', OverlayItem[]> = { FOOD: [], DIY: [] } as any;
  for (const it of items) {
    if (it.channel === 'DIY') byChannel.DIY.push(it); else byChannel.FOOD.push(it);
  }

  const buildLabelList = (list: OverlayItem[]) => {
    const map: Record<string, { in: boolean; out: boolean }> = {};
    for (const it of list) {
      const r = (it.retailer || '').toUpperCase();
      const text = (it.action || '').toLowerCase();
      const b = map[r] || { in: false, out: false };
      if (text.startsWith('[sell in]')) b.in = true;
      if (text.startsWith('[sell out]')) b.out = true;
      map[r] = b;
    }
    const left: { text: string; retailer: string }[] = [];  // IN (sinistra)
    const right: { text: string; retailer: string }[] = []; // OUT (destra)
    Object.entries(map).forEach(([ret, v]) => {
      if (!ret) return;
      if (v.in) left.push({ text: ret, retailer: ret });
      if (v.out) right.push({ text: ret, retailer: ret });
    });
    return { left: left.slice(0, 12), right: right.slice(0, 12) };
  };

  const foodLabels = buildLabelList(byChannel.FOOD);
  const diyLabels = buildLabelList(byChannel.DIY);

  // Layout: metà superiore FOOD, metà inferiore DIY, con tag piccoli e distanziati

  const Chip = ({ text, retailer, blink }: { text: string; retailer: string; blink?: boolean }) => (
    <View
      style={{
        backgroundColor: getRetailerColor(retailer),
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
        marginRight: 2,
        marginBottom: 2,
        opacity: blink ? (pulse ? 1 : 0.7) : 0.95,
        borderWidth: blink ? (pulse ? 2 : 1) : 0,
        borderColor: '#fff',
      }}
    >
      <Text numberOfLines={1} style={{ color: '#fff', fontSize: 8, fontWeight: '600' }}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={{ position: 'absolute', top: 2, left: 2, right: 2, bottom: 2 }} pointerEvents="none">
      {/* FOOD top half */}
      <View style={{ position: 'absolute', top: 14, left: 0, right: 0, height: '46%' }}>
        {/* IN a sinistra */}
        <View style={{ position: 'absolute', left: 0, right: '52%', top: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {foodLabels.left.map((l, idx) => (
            <View key={`fL-${idx}-${l.text}`} onStartShouldSetResponder={() => true} onResponderRelease={() => onPress && onPress(l.retailer, overlay.items)}>
              <Chip text={l.text} retailer={l.retailer} blink={overlay.items.some(it => (it.retailer||'').toUpperCase()===l.retailer && (it as any).blink)} />
            </View>
          ))}
        </View>
        {/* OUT a destra */}
        <View style={{ position: 'absolute', right: 0, left: '52%', top: 0, flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {foodLabels.right.map((l, idx) => (
            <View key={`fR-${idx}-${l.text}`} onStartShouldSetResponder={() => true} onResponderRelease={() => onPress && onPress(l.retailer, overlay.items)}>
              <Chip text={l.text} retailer={l.retailer} blink={overlay.items.some(it => (it.retailer||'').toUpperCase()===l.retailer && (it as any).blink)} />
            </View>
          ))}
        </View>
      </View>
      {/* DIY bottom half */}
      <View style={{ position: 'absolute', bottom: 2, left: 0, right: 0, height: '46%' }}>
        {/* IN a sinistra */}
        <View style={{ position: 'absolute', left: 0, right: '52%', bottom: 0, top: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {diyLabels.left.map((l, idx) => (
            <View key={`dL-${idx}-${l.text}`} onStartShouldSetResponder={() => true} onResponderRelease={() => onPress && onPress(l.retailer, overlay.items)}>
              <Chip text={l.text} retailer={l.retailer} blink={overlay.items.some(it => (it.retailer||'').toUpperCase()===l.retailer && (it as any).blink)} />
            </View>
          ))}
        </View>
        {/* OUT a destra */}
        <View style={{ position: 'absolute', right: 0, left: '52%', bottom: 0, top: 0, flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {diyLabels.right.map((l, idx) => (
            <View key={`dR-${idx}-${l.text}`} onStartShouldSetResponder={() => true} onResponderRelease={() => onPress && onPress(l.retailer, overlay.items)}>
              <Chip text={l.text} retailer={l.retailer} blink={overlay.items.some(it => (it.retailer||'').toUpperCase()===l.retailer && (it as any).blink)} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}


