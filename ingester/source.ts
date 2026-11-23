import type { PriceObservation, Listing, Gpu, Retailer } from "../types/db";

/** Raw row from a cleared source before IDs are assigned. */
export interface NormalizedObservationInput {
  gpuSlug: string;
  retailerSlug: string;
  sku: string;
  productUrl: string;
  brand: string;
  variantLabel?: string;
  priceCad: number;
  inStock: boolean;
  observedAt: string;
}

export interface NormalizedFetchResult {
  gpus?: Gpu[];
  retailers?: Retailer[];
  listings?: Listing[];
  observations: NormalizedObservationInput[];
}

/**
 * Adapter for a price data source (official API, approved feed, etc.).
 * Implementations must comply with retailer ToS and robots policy review.
 */
export interface Source {
  readonly id: string;
  readonly displayName: string;
  fetch(): Promise<NormalizedFetchResult>;
}