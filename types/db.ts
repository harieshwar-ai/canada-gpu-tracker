/** Mirrors db/migrations/001_init.sql */

export type GpuSeries = "50-series" | "40-series" | "30-series" | "other";

export interface Gpu {
  id: string;
  slug: string;
  modelName: string;
  series: GpuSeries;
  chip: string;
  vramGb: number;
  msrpCad: number;
  createdAt: string;
  updatedAt: string;
}

export interface Retailer {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  countryCode: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  gpuId: string;
  retailerId: string;
  sku: string;
  productUrl: string;
  brand: string;
  variantLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceObservation {
  id: string;
  listingId: string;
  priceCad: number;
  inStock: boolean;
  observedAt: string;
}

export interface ListingLatestObservation {
  listingId: string;
  observationId: string;
  priceCad: number;
  inStock: boolean;
  observedAt: string;
}

/** JSON store written by ingester (placeholder until DB is wired up). */
export interface TrackerStore {
  version: 1;
  placeholder: boolean;
  generatedAt: string;
  gpus: Gpu[];
  retailers: Retailer[];
  listings: Listing[];
  priceObservations: PriceObservation[];
}