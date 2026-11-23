import type {
  TrackerStore,
  Gpu,
  Retailer,
  Listing,
  PriceObservation,
} from "../../../types/db";
import storeJson from "../../../data/store.json";

const store = storeJson as TrackerStore;

export function getStore(): TrackerStore {
  return store;
}

export function getAllGpus(): Gpu[] {
  return [...store.gpus].sort((a, b) => a.modelName.localeCompare(b.modelName));
}

export function getGpuBySlug(slug: string): Gpu | undefined {
  return store.gpus.find((g) => g.slug === slug);
}

export function getRetailerMap(): Map<string, Retailer> {
  return new Map(store.retailers.map((r) => [r.id, r]));
}

export function getLatestObservationByListing(): Map<string, PriceObservation> {
  const latest = new Map<string, PriceObservation>();
  for (const obs of store.priceObservations) {
    const prev = latest.get(obs.listingId);
    if (!prev || obs.observedAt > prev.observedAt) {
      latest.set(obs.listingId, obs);
    }
  }
  return latest;
}

export interface GpuSummary {
  gpu: Gpu;
  lowestPriceCad: number | null;
  lowestRetailerName: string | null;
  inStockAnywhere: boolean;
  listingCount: number;
}

export function summarizeGpus(
  seriesFilter?: string,
  inStockOnly?: boolean
): GpuSummary[] {
  const retailerMap = getRetailerMap();
  const latest = getLatestObservationByListing();
  const listingsByGpu = new Map<string, Listing[]>();

  for (const listing of store.listings) {
    const list = listingsByGpu.get(listing.gpuId) ?? [];
    list.push(listing);
    listingsByGpu.set(listing.gpuId, list);
  }

  return getAllGpus()
    .filter((gpu) => !seriesFilter || gpu.series === seriesFilter)
    .map((gpu) => {
      const listings = listingsByGpu.get(gpu.id) ?? [];
      let lowest: { price: number; retailerName: string; inStock: boolean } | null =
        null;
      let inStockAnywhere = false;

      for (const listing of listings) {
        const obs = latest.get(listing.id);
        if (!obs) continue;
        if (obs.inStock) inStockAnywhere = true;
        if (inStockOnly && !obs.inStock) continue;
        if (!lowest || obs.priceCad < lowest.price) {
          lowest = {
            price: obs.priceCad,
            retailerName: retailerMap.get(listing.retailerId)?.name ?? "Unknown",
            inStock: obs.inStock,
          };
        }
      }

      return {
        gpu,
        lowestPriceCad: lowest?.price ?? null,
        lowestRetailerName: lowest?.retailerName ?? null,
        inStockAnywhere,
        listingCount: listings.length,
      };
    })
    .filter((row) => !inStockOnly || row.lowestPriceCad !== null);
}

export interface ListingWithLatest {
  listing: Listing;
  retailer: Retailer;
  latest: PriceObservation | null;
}

export function getListingsForGpu(slug: string): ListingWithLatest[] {
  const gpu = getGpuBySlug(slug);
  if (!gpu) return [];
  const retailerMap = getRetailerMap();
  const latest = getLatestObservationByListing();

  return store.listings
    .filter((l) => l.gpuId === gpu.id)
    .map((listing) => ({
      listing,
      retailer: retailerMap.get(listing.retailerId)!,
      latest: latest.get(listing.id) ?? null,
    }))
    .sort((a, b) => {
      const pa = a.latest?.priceCad ?? Infinity;
      const pb = b.latest?.priceCad ?? Infinity;
      return pa - pb;
    });
}

export function getPriceHistoryForGpu(slug: string): {
  listingId: string;
  label: string;
  points: { t: string; price: number }[];
}[] {
  const gpu = getGpuBySlug(slug);
  if (!gpu) return [];
  const retailerMap = getRetailerMap();

  const listings = store.listings.filter((l) => l.gpuId === gpu.id);
  const byListing = new Map<string, PriceObservation[]>();

  for (const obs of store.priceObservations) {
    const list = byListing.get(obs.listingId) ?? [];
    list.push(obs);
    byListing.set(obs.listingId, list);
  }

  return listings.map((listing) => {
    const retailer = retailerMap.get(listing.retailerId);
    const label = `${retailer?.name ?? "?"} · ${listing.brand} ${listing.variantLabel ?? ""}`.trim();
    const points = (byListing.get(listing.id) ?? [])
      .slice()
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
      .map((o) => ({ t: o.observedAt, price: o.priceCad }));
    return { listingId: listing.id, label, points };
  });
}