import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  TrackerStore,
  Gpu,
  Retailer,
  Store,
  Card,
  Offer,
  PriceObservation,
  ChangeEvent,
} from "../types/db";
import type {
  NormalizedObservationInput,
  NormalizedChangeEventInput,
} from "./source";
import { PlaceholderSource } from "./sources/placeholder";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "data", "store.json");

function offerKey(
  retailerSlug: string,
  sku: string,
  storeSlug?: string
): string {
  return `${retailerSlug}::${storeSlug ?? "online"}::${sku}`;
}

function buildOffers(
  observations: NormalizedObservationInput[],
  cardBySlug: Map<string, Card>,
  retailerBySlug: Map<string, Retailer>,
  storeBySlug: Map<string, Store>
): Map<string, Offer> {
  const offers = new Map<string, Offer>();
  for (const obs of observations) {
    const key = offerKey(obs.retailerSlug, obs.sku, obs.storeSlug);
    if (offers.has(key)) continue;
    const card = cardBySlug.get(obs.cardSlug);
    const retailer = retailerBySlug.get(obs.retailerSlug);
    const store = obs.storeSlug ? storeBySlug.get(obs.storeSlug) : undefined;
    if (!card || !retailer) {
      throw new Error(`Unknown card/retailer: ${obs.cardSlug}/${obs.retailerSlug}`);
    }
    if (obs.storeSlug && !store) {
      throw new Error(`Unknown store: ${obs.storeSlug}`);
    }
    offers.set(key, {
      id: `offer-${key.replace(/::/g, "-").toLowerCase()}`,
      gpuId: card.gpuId,
      cardId: card.id,
      retailerId: retailer.id,
      storeId: store?.id ?? null,
      sku: obs.sku,
      productUrl: obs.productUrl,
      brand: card.brand,
      variantLabel: card.modelName,
      condition: obs.condition ?? "new",
      createdAt: obs.observedAt,
      updatedAt: obs.observedAt,
    });
  }
  return offers;
}

function buildPriceObservations(
  observations: NormalizedObservationInput[],
  offers: Map<string, Offer>
): PriceObservation[] {
  return observations.map((obs, index) => {
    const offer = offers.get(
      offerKey(obs.retailerSlug, obs.sku, obs.storeSlug)
    );
    if (!offer) throw new Error(`Missing offer for ${obs.sku}`);
    return {
      id: `obs-${offer.id}-${index}`,
      offerId: offer.id,
      priceCad: obs.priceCad,
      inStock: obs.inStock,
      observedAt: obs.observedAt,
    };
  });
}

function buildChangeEvents(
  events: NormalizedChangeEventInput[],
  cardBySlug: Map<string, Card>,
  offers: Map<string, Offer>,
  storeBySlug: Map<string, Store>
): ChangeEvent[] {
  return events.map((ev, index) => {
    const card = cardBySlug.get(ev.cardSlug);
    if (!card) throw new Error(`Unknown card for event: ${ev.cardSlug}`);
    let offerId: string | null = null;
    if (ev.offerSku) {
      const offer = [...offers.values()].find((o) => o.sku === ev.offerSku);
      offerId = offer?.id ?? null;
    }
    const store = ev.storeSlug ? storeBySlug.get(ev.storeSlug) : undefined;
    return {
      id: `chg-${index}`,
      eventType: ev.eventType,
      offerId,
      cardId: card.id,
      storeId: store?.id ?? null,
      priceCad: ev.priceCad ?? null,
      previousPriceCad: ev.previousPriceCad ?? null,
      inStock: ev.inStock ?? null,
      city: store?.city ?? null,
      provinceCode: store?.provinceCode ?? null,
      occurredAt: ev.occurredAt,
    };
  });
}

async function main(): Promise<void> {
  const source = new PlaceholderSource();
  const result = await source.fetch();

  const gpus = result.gpus ?? [];
  const retailers = result.retailers ?? [];
  const stores = result.stores ?? [];
  const cards = result.cards ?? [];
  const cardBySlug = new Map(cards.map((c) => [c.slug, c]));
  const retailerBySlug = new Map(retailers.map((r) => [r.slug, r]));
  const storeBySlug = new Map(stores.map((s) => [s.slug, s]));

  const offersMap = buildOffers(
    result.observations,
    cardBySlug,
    retailerBySlug,
    storeBySlug
  );
  const priceObservations = buildPriceObservations(
    result.observations,
    offersMap
  );
  const changeEvents = buildChangeEvents(
    result.changeEvents ?? [],
    cardBySlug,
    offersMap,
    storeBySlug
  );

  const store: TrackerStore = {
    version: 2,
    placeholder: true,
    generatedAt: new Date().toISOString(),
    gpus,
    retailers,
    stores,
    cards,
    offers: [...offersMap.values()],
    priceObservations,
    changeEvents,
    provinceTaxes: result.provinceTaxes ?? [],
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
  console.log(
    `Wrote ${OUT_PATH} (${store.cards.length} cards, ${store.offers.length} offers, ${store.priceObservations.length} observations)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});