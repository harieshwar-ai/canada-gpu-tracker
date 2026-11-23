import type {
  Gpu,
  Retailer,
  Store,
  Card,
  Offer,
  ChangeEvent,
  ProvinceTax,
  OfferCondition,
  ChangeEventType,
} from "../types/db";

/** Raw row from a cleared source before IDs are assigned. */
export interface NormalizedObservationInput {
  cardSlug: string;
  retailerSlug: string;
  storeSlug?: string;
  sku: string;
  productUrl: string;
  condition?: OfferCondition;
  priceCad: number;
  inStock: boolean;
  observedAt: string;
}

export interface NormalizedChangeEventInput {
  eventType: ChangeEventType;
  cardSlug: string;
  retailerSlug?: string;
  storeSlug?: string;
  offerSku?: string;
  priceCad?: number;
  previousPriceCad?: number;
  inStock?: boolean;
  occurredAt: string;
}

export interface NormalizedFetchResult {
  gpus?: Gpu[];
  retailers?: Retailer[];
  stores?: Store[];
  cards?: Card[];
  offers?: Offer[];
  provinceTaxes?: ProvinceTax[];
  observations: NormalizedObservationInput[];
  changeEvents?: NormalizedChangeEventInput[];
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