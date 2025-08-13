import { ExcelDataRow, useFirebaseExcelData } from '../hooks/useFirebaseExcelData';

export type NamInfo = { namCode?: string; namName?: string };

// Resolver a sola lettura che costruisce una mappa Insegna normalizzata -> NAM
class _NamResolver {
	private retailerToNam: Map<string, NamInfo> = new Map();
	private version = 0;

	private normalizeRetailer(name: string): string {
		const t = (name || '').trim().toLowerCase();
		if (t.includes('carrefour')) return 'CARREFOUR';
		if (t.includes('spazio conad')) return 'SPAZIO CONAD';
		if (t === 'conad') return 'CONAD';
		if (t.includes('vege')) return 'VEGE RETAIL';
		if (t.includes("maury")) return "MAURY'S";
		if (t.includes('unicom')) return 'UNICOMM';
		if (t.includes('iper famila')) return 'IPER FAMILA';
		if (t.includes('iper')) return 'IPER';
		return (name || '').toUpperCase();
	}

	public build(rows: ExcelDataRow[]): void {
		const map = new Map<string, NamInfo>();
		for (const r of rows) {
			const key = this.normalizeRetailer(r.insegna || r.insegnaCliente || '');
			if (!key) continue;
			const info = map.get(key) || {};
			if (r.namCode && !info.namCode) info.namCode = r.namCode;
			if (r.nomeAgente && !info.namName) info.namName = r.nomeAgente; // fallback se non abbiamo nome NAM separato
			map.set(key, info);
		}
		this.retailerToNam = map;
		this.version++;
	}

	public getVersion(): number { return this.version; }

	public resolve(retailer?: string | null): NamInfo | undefined {
		if (!retailer) return undefined;
		const key = this.normalizeRetailer(retailer);
		return this.retailerToNam.get(key);
	}
}

export const NamResolver = new _NamResolver();


