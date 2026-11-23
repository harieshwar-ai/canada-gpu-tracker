import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  TrackerStore,
  Gpu,
  Retailer,
  Listing,
  PriceObservation,
} from "../types/db";
import type { NormalizedObservationInput } from "./source";
import { PlaceholderSource } from "./sources/placeholder";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "data", "store.json");

function listingKey(retailerSlug: string, sku: string): string {
  return `${retailerSlug}::${sku}`;
}

function buildListings(
  observations: NormalizedObservationInput[],
  gpuBySlug: Map<string, Gpu>,
  retailerBySlug: Map<string, Retailer>
): Map<string, Listing> {
  const listings = new Map<string, Listing>();
  for (const obs of observations) {
    const key = listingKey(obs.retailerSlug, obs.sku);
    if (listings.has(key)) continue;
    const gpu = gpuBySlug.get(obs.gpuSlug);
    const retailer = retailerBySlug.get(obs.retailerSlug);
    if (!gpu || !retailer) {
      throw new Error(`Unknown gpu or retailer for observation: ${obs.gpuSlug}/${obs.retailerSlug}`);
    }
    listings.set(key, {
      id: `listing-${retailer.slug}-${obs.sku.toLowerCase()}`,
      gpuId: gpu.id,
      retailerId: retailer.id,
      sku: obs.sku,
      productUrl: obs.productUrl,
      brand: obs.brand,
      variantLabel: obs.variantLabel ?? null,
      createdAt: obs.observedAt,
      updatedAt: obs.observedAt,
    });
  }
  return listings;
}

function buildPriceObservations(
  observations: NormalizedObservationInput[],
  listings: Map<string, Listing>
): PriceObservation[] {
  return observations.map((obs, index) => {
    const listing = listings.get(listingKey(obs.retailerSlug, obs.sku));
    if (!listing) throw new Error(`Missing listing for ${obs.sku}`);
    return {
      id: `obs-${listing.id}-${index}`,
      listingId: listing.id,
      priceCad: obs.priceCad,
      inStock: obs.inStock,
      observedAt: obs.observedAt,
    };
  });
}

async function main(): Promise<void> {
  const source = new PlaceholderSource();
  const result = await source.fetch();

  const gpus = result.gpus ?? [];
  const retailers = result.retailers ?? [];
  const gpuBySlug = new Map(gpus.map((g) => [g.slug, g]));
  const retailerBySlug = new Map(retailers.map((r) => [r.slug, r]));

  const listingsMap = buildListings(
    result.observations,
    gpuBySlug,
    retailerBySlug
  );
  const priceObservations = buildPriceObservations(
    result.observations,
    listingsMap
  );

  const store: TrackerStore = {
    version: 1,
    placeholder: true,
    generatedAt: new Date().toISOString(),
    gpus,
    retailers,
    listings: [...listingsMap.values()],
    priceObservations,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT_PATH} (${store.listings.length} listings, ${store.priceObservations.length} observations)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});