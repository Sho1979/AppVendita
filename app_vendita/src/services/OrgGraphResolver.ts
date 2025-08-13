import { ExcelDataRow } from '../hooks/useFirebaseExcelData';

export type OrgRetailerNode = {
	retailer: string;
	namCodes: Set<string>;
	namNames: Set<string>;
	agentCodes: Set<string>;
	agentNames: Set<string>;
	storeIds: Set<string>;
};

export type OrgStoreNode = {
	storeId: string;
	storeName?: string;
	retailer?: string;
	agentCode?: string;
	agentName?: string;
	namCode?: string;
	namName?: string;
	amCode?: string;
};

class _OrgGraphResolver {
	private retailerNodes: Map<string, OrgRetailerNode> = new Map();
	private storeNodes: Map<string, OrgStoreNode> = new Map();
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
		const retailers = new Map<string, OrgRetailerNode>();
		const stores = new Map<string, OrgStoreNode>();

		for (const r of rows) {
			const retailerKey = this.normalizeRetailer(r.insegna || r.insegnaCliente || '');
			if (!retailerKey) continue;

			const node: OrgRetailerNode = retailers.get(retailerKey) || {
				retailer: retailerKey,
				namCodes: new Set<string>(),
				namNames: new Set<string>(),
				agentCodes: new Set<string>(),
				agentNames: new Set<string>(),
				storeIds: new Set<string>(),
			};
			if (r.namCode) node.namCodes.add(String(r.namCode));
			if (r.nomeAgente) node.namNames.add(String(r.nomeAgente));
			if (r.agenteCode) node.agentCodes.add(String(r.agenteCode));
			if (r.nomeAgente) node.agentNames.add(String(r.nomeAgente));
			if (r.codiceCliente) node.storeIds.add(String(r.codiceCliente));
			retailers.set(retailerKey, node);

			if (r.codiceCliente) {
				const sid = String(r.codiceCliente);
				const s: OrgStoreNode = stores.get(sid) || { storeId: sid };
				s.retailer = retailerKey;
				s.storeName = r.cliente || s.storeName;
				s.agentCode = r.agenteCode || s.agentCode;
				s.agentName = r.nomeAgente || s.agentName;
				s.namCode = r.namCode || s.namCode;
				// Se disponi del nome NAM in file, puoi mapparlo qui; per ora usiamo nomeAgente come fallback
				s.namName = s.namName || undefined;
				stores.set(sid, s);
			}
		}

		this.retailerNodes = retailers;
		this.storeNodes = stores;
		this.version++;
	}

	public getVersion(): number { return this.version; }

	public getRetailer(retailer?: string | null): OrgRetailerNode | undefined {
		if (!retailer) return undefined;
		const key = this.normalizeRetailer(retailer);
		return this.retailerNodes.get(key);
	}

	public getStore(storeId: string): OrgStoreNode | undefined {
		return this.storeNodes.get(storeId);
	}
}

export const OrgGraphResolver = new _OrgGraphResolver();


