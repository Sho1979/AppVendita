// Pastel color palette per insegne con fallback deterministico

const KNOWN_COLORS: Record<string, string> = {
  'IPER': '#E57373',
  'FINIPER': '#E57373',
  "MAURY'S": '#F06292',
  'CONAD': '#81C784',
  'SPAZIO CONAD': '#81C784',
  'CARREFOUR': '#64B5F6',
  'VEGE RETAIL': '#FFD54F',
  'UNICOMM': '#BA68C8',
  'GALASSIA': '#4DB6AC',
  'DRUGITALIA': '#A1887F',
  'COOP': '#FF8A65',
  'ESSELUNGA': '#90CAF9',
  'IPER FAMILA': '#AED581',
  'MAXI DI': '#FFB74D',
  'BRICOCENTER': '#9575CD',
  'BRICOMAN': '#4FC3F7',
  'BRICOFER': '#FFF176',
  'BRICO IO': '#CE93D8',
  'OBI': '#A5D6A7',
  'LERoy MERLIN': '#80CBC4',
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getRetailerColor(retailer?: string | null): string {
  const key = (retailer || '').toUpperCase().trim();
  if (KNOWN_COLORS[key]) return KNOWN_COLORS[key];
  // Fallback deterministico in HSL pastello
  const h = hashCode(key || 'default') % 360;
  const s = 45; // percent
  const l = 70; // percent
  return `hsl(${h}, ${s}%, ${l}%)`;
}


