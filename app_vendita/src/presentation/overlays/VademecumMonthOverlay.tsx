import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { getRetailerColor } from '../../services/RetailerColors';

type OverlayItem = { retailer?: string | null; action: string };
type DayOverlay = { inCount: number; outCount: number; items: OverlayItem[] };

export function renderVademecumMonthOverlay(
  dateStr: string,
  overlay: DayOverlay,
  onPress?: (date: string, items: OverlayItem[]) => void,
) {
  const { width } = Dimensions.get('window');
  const CELL_WIDTH = width / 7;
  const DOT = Math.max(10, Math.min(20, Math.floor(CELL_WIDTH * 0.18)));

  const retailerMap: Record<string, { in: boolean; out: boolean; inBlink: boolean; outBlink: boolean }> = {} as any;
  for (const it of overlay.items || []) {
    const r = (it.retailer || '');
    const text = (it.action || '').toLowerCase();
    const bucket = retailerMap[r] || { in: false, out: false, inBlink: false, outBlink: false };
    if (text.startsWith('[sell in]')) {
      bucket.in = true;
      if ((it as any).blink) bucket.inBlink = true;
    }
    if (text.startsWith('[sell out]')) {
      bucket.out = true;
      if ((it as any).blink) bucket.outBlink = true;
    }
    retailerMap[r] = bucket;
  }
  const entries = Object.entries(retailerMap).slice(0, 4);

  return (
    <View style={{ position: 'absolute', top: 2, right: 2, flexDirection: 'row' }}>
      {entries.map(([ret, v], idx) => (
        <TouchableOpacity
          key={`${ret}-${idx}`}
          activeOpacity={0.8}
          onPress={() => onPress && onPress(dateStr, overlay.items)}
          style={{
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            marginLeft: 4,
            backgroundColor: getRetailerColor(ret),
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: (v as any).inBlink || (v as any).outBlink ? 2 : 0,
            borderColor: '#fff',
            opacity: (v as any).inBlink || (v as any).outBlink ? 0.85 : 0.95,
          }}
        >
          <Text style={{ color: '#fff', fontSize: Math.max(8, Math.min(12, Math.floor(DOT * 0.55))), fontWeight: '800' }}>
            {(v as any).in ? 'I' : (v as any).out ? 'O' : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}


