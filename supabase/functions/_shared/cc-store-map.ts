import storesData from "./canada-computers-stores.json" with { type: "json" };

export interface CcStoreRecord {
  pageLabel: string;
  slug: string;
  name: string;
  city: string;
  provinceCode: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  address: string;
}

export const CANADA_COMPUTERS_STORES: CcStoreRecord[] = storesData.stores;

export function normalizeCcStoreLabel(label: string): string {
  return label
    .replace(/&amp;/g, "&")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const BY_LABEL = new Map<string, CcStoreRecord>();
for (const store of CANADA_COMPUTERS_STORES) {
  BY_LABEL.set(normalizeCcStoreLabel(store.pageLabel), store);
}

export function lookupCanadaComputersStore(rawLabel: string): CcStoreRecord | null {
  return BY_LABEL.get(normalizeCcStoreLabel(rawLabel)) ?? null;
}