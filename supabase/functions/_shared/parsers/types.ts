export type OfferCondition = "new" | "open_box" | "refurb";

export interface ParsedStoreStock {
  storeKey: string;
  city: string;
  provinceCode: string;
  quantity: number;
}

export interface ParsedProduct {
  title: string;
  brand: string;
  gpuSlug: string;
  sku: string;
  mpn?: string;
  priceCad: number | null;
  inStockOnline: boolean;
  condition: OfferCondition;
  variantLabel: string;
  storeStock?: ParsedStoreStock[];
  openBox?: boolean;
}

export function parseCadPrice(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(/,/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function stockFromAvailability(availability: string | undefined): boolean {
  if (!availability) return false;
  const a = availability.toLowerCase();
  return a.includes("instock") || a.includes("in_stock");
}

export function detectOpenBox(text: string, url?: string): boolean {
  const t = text.toLowerCase();
  if (t.includes("open box") || t.includes("open-box")) return true;
  if (url?.toLowerCase().includes("openbox")) return true;
  return false;
}