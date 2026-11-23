/** Shared types for Supabase rows and the static JSON store (v2). */

export type ProductLine = "geforce" | "rtx_pro";

export type Series =
  | "50-series"
  | "40-series"
  | "30-series"
  | "pro-5000"
  | "pro-4000";

export type Cooling = "blower" | "dual" | "triple" | "quad";

export type OfferCondition = "new" | "open_box";

export type ChangeEventType = "price_drop" | "in_stock" | "out_of_stock";

export type AlertScope = "card" | "gpu" | "product_line";

export interface Gpu {
  id: string;
  slug: string;
  modelName: string;
  productLine: ProductLine;
  series: Series;
  vramGb: number;
  launchMsrpCad: number;
}

export interface Card {
  id: string;
  slug: string;
  gpuId: string;
  brand: string;
  modelName: string;
  vramGb: number;
  lengthMm: number | null;
  slotWidth: number | null;
  cooling: Cooling | null;
  powerConnector: string | null;
  psuWatts: number | null;
}

export interface Retailer {
  id: string;
  slug: string;
  name: string;
}

export interface Store {
  id: string;
  retailerId: string;
  slug: string;
  name: string;
  city: string;
  provinceCode: string;
  latitude: number | null;
  longitude: number | null;
}

/** Retailer or store shelf / online SKU offer (listings table). */
export interface Offer {
  id: string;
  gpuId: string;
  cardId: string;
  retailerId: string;
  storeId: string | null;
  sku: string;
  productUrl: string;
  brand: string;
  variantLabel: string | null;
  condition: OfferCondition;
  /** False when price/stock comes from a cleared live ingester. */
  isPlaceholder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceObservation {
  id: string;
  offerId: string;
  priceCad: number;
  inStock: boolean;
  observedAt: string;
}

export interface ChangeEvent {
  id: string;
  eventType: ChangeEventType;
  offerId: string | null;
  cardId: string;
  storeId: string | null;
  priceCad: number | null;
  previousPriceCad: number | null;
  inStock: boolean | null;
  city: string | null;
  provinceCode: string | null;
  occurredAt: string;
}

export interface ProvinceTax {
  provinceCode: string;
  provinceName: string;
  taxLabel: string;
  taxRate: number;
}

export interface PriceAlert {
  id: string;
  alertScope: AlertScope;
  cardId: string | null;
  gpuId: string | null;
  productLine: ProductLine | null;
  targetPriceCad: number;
  maxDistanceKm: number | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  contactEmail: string | null;
  active: boolean;
  createdAt: string;
}

/** JSON store written by ingester (placeholder until DB is wired up). */
export interface IngestRunLogEntry {
  retailerId: string;
  fetched: number;
  skipped: number;
  challenged: boolean;
  message?: string;
}

export interface TrackerStore {
  version: 2;
  /** True when any offer still uses placeholder/example pricing. */
  placeholder: boolean;
  liveOfferCount: number;
  generatedAt: string;
  gpus: Gpu[];
  retailers: Retailer[];
  stores: Store[];
  cards: Card[];
  offers: Offer[];
  priceObservations: PriceObservation[];
  changeEvents: ChangeEvent[];
  provinceTaxes: ProvinceTax[];
}