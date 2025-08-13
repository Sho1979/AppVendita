import { useFocusReferencesStore, FocusReference } from '../stores/focusReferencesStore';

export type ResolvedEntities = {
	brandsResolved: string[];
	referenceIds: string[]; // equals FocusReference.id (code)
	confidence: number; // 0..1
};

type ProductCatalog = {
	aliasToBrand: Map<string, string>; // normalized alias -> BRAND
	codeToRef: Map<string, FocusReference>; // code/ean -> ref
	refAliasToRefs: Map<string, FocusReference[]>; // alias that identify references (e.g., minifresh, smuffer) -> refs
	nameIndex: Array<{ tokens: string[]; ref: FocusReference }>; // lightweight name tokens for fallback
};

const NORMALIZE_RX = /[^a-z0-9]+/g;
function normalize(input: string): string {
	return (input || '').toLowerCase().replace(NORMALIZE_RX, ' ').trim();
}

function unique<T>(arr: T[]): T[] {
	return Array.from(new Set(arr));
}

class CatalogResolver {
	private catalog: ProductCatalog | null = null;
	private version = 0;

	public isReady(): boolean {
		return !!this.catalog;
	}

	public getVersion(): number { return this.version; }

	public initFromListino(references: FocusReference[]): void {
		const aliasToBrand = new Map<string, string>();
		const codeToRef = new Map<string, FocusReference>();
		const refAliasToRefs = new Map<string, FocusReference[]>();
		const nameIndex: Array<{ tokens: string[]; ref: FocusReference }> = [];

		for (const r of references) {
			// Codes
			if (r.code) codeToRef.set(String(r.code), r);
			if (r.ean) codeToRef.set(String(r.ean), r);

			// Aliases for brand (solo brand-level, non referenze)
			const brand = (r.brand || '').trim();
			const sub = (r.subBrand || '').trim();
			const description = (r.description || '').trim();

			const aliases: string[] = [];
			if (brand) aliases.push(brand);
			if (sub) aliases.push(sub);
			// heuristics: pick key tokens from description that look like brand sub-lines
			// Esempi: "Super Attak", "Millechiodi" (brand/sub-brand). NON usare Minifresh/Smuffer come brand.
			const desc = description.toLowerCase();
			if (/super\s*attak/.test(desc)) aliases.push('Super Attak');
			if (/millechiodi/.test(desc)) aliases.push('Millechiodi');

			// referenza-level aliases (Minifresh/Smuffer) → mappa a referenze, non ai brand
			if (/minifresh/.test(desc)) {
				const key = normalize('Minifresh');
				const arr = refAliasToRefs.get(key) || [];
				arr.push(r);
				refAliasToRefs.set(key, arr);
			}
			if (/smuffer/.test(desc)) {
				const key = normalize('Smuffer');
				const arr = refAliasToRefs.get(key) || [];
				arr.push(r);
				refAliasToRefs.set(key, arr);
			}

			for (const a of unique(aliases)) {
				const key = normalize(a);
				if (key.length >= 3 && !aliasToBrand.has(key)) {
					aliasToBrand.set(key, brand || sub || a);
				}
			}

			// Name index fallback (tokenized)
			const tokens = normalize(description).split(' ').filter(Boolean);
			nameIndex.push({ tokens, ref: r });
		}

		this.catalog = { aliasToBrand, codeToRef, refAliasToRefs, nameIndex };
		this.version++;
	}

	public resolveText(text: string): ResolvedEntities {
		const result: ResolvedEntities = { brandsResolved: [], referenceIds: [], confidence: 0 };
		if (!this.catalog || !text) return result;

		const { aliasToBrand, codeToRef, refAliasToRefs, nameIndex } = this.catalog;
		const raw = text;
		const norm = normalize(text);

		// 1) Exact code/EAN matches
		for (const [code, ref] of codeToRef.entries()) {
			if (!code) continue;
			if (norm.includes(normalize(code))) {
				result.referenceIds.push(ref.id);
				if (ref.brand) result.brandsResolved.push(ref.brand);
			}
		}

		// 2) Alias brand matches (brand-level)
		for (const [aliasKey, brand] of aliasToBrand.entries()) {
			if (norm.includes(aliasKey)) {
				result.brandsResolved.push(brand);
			}
		}

		// 2.5) Reference aliases (es. minifresh, smuffer)
		for (const [aliasKey, refs] of refAliasToRefs.entries()) {
			if (norm.includes(aliasKey)) {
				for (const r of refs) {
					result.referenceIds.push(r.id);
					if (r.brand) result.brandsResolved.push(r.brand);
				}
			}
		}

		// 3) Lightweight fuzzy: share >=2 tokens with a reference name
		if (result.referenceIds.length === 0) {
			const normTokens = norm.split(' ').filter(t => t.length >= 3);
			for (const item of nameIndex) {
				const overlap = item.tokens.filter(t => normTokens.includes(t));
				if (overlap.length >= 2) {
					result.referenceIds.push(item.ref.id);
					if (item.ref.brand) result.brandsResolved.push(item.ref.brand);
				}
			}
		}

		result.brandsResolved = unique(result.brandsResolved);
		result.referenceIds = unique(result.referenceIds);

		// confidence semplice
		const scoreParts = [
			Math.min(result.referenceIds.length, 2) * 0.4,
			Math.min(result.brandsResolved.length, 3) * 0.2,
		];
		result.confidence = Math.max(0, Math.min(1, scoreParts.reduce((a, b) => a + b, 0)));
		return result;
	}
}

export const ProductCatalogResolver = new CatalogResolver();

// Helper da usare in fase di bootstrap UI
export function initializeProductCatalogFromStore(): void {
	try {
		const refs = useFocusReferencesStore.getState().getAllReferences();
		if (refs && refs.length > 0) {
			ProductCatalogResolver.initFromListino(refs);
			if (__DEV__) { console.log('🧠 ProductCatalogResolver: indice costruito', { version: ProductCatalogResolver.getVersion(), refs: refs.length }); }
		}
	} catch (e) {
		if (__DEV__) { console.warn('ProductCatalogResolver: init fallita', e); }
	}
}


