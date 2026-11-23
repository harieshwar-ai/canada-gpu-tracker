/** Mirrors db/migrations/001_init.sql + 002_extended.sql */

export type GpuSeries = "50-series" | "40-series" | "30-series" | "other";
export type ProductLine = "geforce" | "rtx_pro" | "other";
export type OfferCondition = "new" | "open_box" | "refurb";
export type ChangeEventType = "price_drop" | "in_stock" | "sold_out";
export type AlertScope = "card" | "gpu" | "product_line";

export interface Gpu {
  id: string;
  slug: string;
  modelName: string;
  series: GpuSeries;
  productLine: ProductLine;
  chip: string;
  vramGb: number;
  msrpCad: number;
  launchMsrpCad: number;
  createdAt: string;
  updatedAt: string;
}

export interface Retailer {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  countryCode: string;
  hasPhysicalStores: boolean;
  createdAt: string;
}

export interface Store {
  id: string;
  retailerId: string;
  slug: string;
  name: string;
  city: string;
  provinceCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface Card {
  id: string;
  gpuId: string;
  slug: string;
  brand: string;
  modelName: string;
  vramGb: number;
  lengthMm: number | null;
  slotWidth: number | null;
  cooling: string | null;
  psuWatts: number | null;
  powerConnector: string | null;
  createdAt: string;
  updatedAt: string;
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
export interface TrackerStore {
  version: 2;
  placeholder: boolean;
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