import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  TrackerStore,
  Card,
  Retailer,
  Store,
  Offer,
  PriceObservation,
  ChangeEvent,
} from "../types/db";
import type {
  NormalizedObservationInput,
  NormalizedChangeEventInput,
} from "./source";
import { PlaceholderSource } from "./sources/placeholder";
import {
  CLEARED_CANADA_COMPUTERS_STORES,
  runClearedRetailers,
} from "./sources/retailer-source";
import { parseCanadaComputersProduct } from "./parsers/canada-computers";
import { parsePcCanadaProduct } from "./parsers/pc-canada";
import { parseMikesProduct } from "./parsers/mikes-computer-shop";
import {
  PLACEHOLDER_CHANGE_EVENTS,
  PLACEHOLDER_OBSERVATIONS,
} from "./sources/placeholder-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "data", "store.json");

const PLACEHOLDER_RETAILER_SLUGS = new Set([
  "best-buy-ca",
  "memory-express",
  "newegg-ca",
  "amazon-ca",
  "visions",
  "staples-ca",
  "walmart-ca",
  "ebay-ca",
]);

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
  storeBySlug: Map<string, Store>,
  isPlaceholder: boolean
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
      isPlaceholder,
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

function mergeCards(base: Card[], extra: Map<string, Card>): Card[] {
  const bySlug = new Map(base.map((c) => [c.slug, c]));
  for (const [slug, card] of extra) {
    if (!bySlug.has(slug)) bySlug.set(slug, card);
  }
  return [...bySlug.values()];
}

function mergeRetailers(base: Retailer[], extra: Retailer[]): Retailer[] {
  const bySlug = new Map(base.map((r) => [r.slug, r]));
  for (const r of extra) {
    if (!bySlug.has(r.slug)) bySlug.set(r.slug, r);
  }
  return [...bySlug.values()];
}

function mergeStores(base: Store[], extra: Store[]): Store[] {
  const bySlug = new Map(base.map((s) => [s.slug, s]));
  for (const s of extra) {
    if (!bySlug.has(s.slug)) bySlug.set(s.slug, s);
  }
  return [...bySlug.values()];
}

async function loadPreviousStore(): Promise<TrackerStore | null> {
  try {
    const raw = await readFile(OUT_PATH, "utf8");
    return JSON.parse(raw) as TrackerStore;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const ingestLive = process.env.INGEST_LIVE === "1";
  const dryRun = process.env.INGEST_DRY_RUN === "1";
  const skuLimit = dryRun ? 2 : undefined;

  const placeholder = await new PlaceholderSource().fetch();
  const gpus = placeholder.gpus ?? [];
  const cardMap = new Map((placeholder.cards ?? []).map((c) => [c.slug, c]));

  const placeholderObs = (placeholder.observations ?? PLACEHOLDER_OBSERVATIONS).filter(
    (o) => PLACEHOLDER_RETAILER_SLUGS.has(o.retailerSlug)
  );

  let liveObs: NormalizedObservationInput[] = [];
  let clearedRetailers: Retailer[] = [];
  let clearedStores: Store[] = [];
  let ingestLogs: TrackerStore["ingestLogs"];

  if (ingestLive) {
    const result = await runClearedRetailers({
      gpus,
      cards: cardMap,
      parsers: {
        pcCanada: parsePcCanadaProduct,
        mikes: parseMikesProduct,
        canadaComputers: parseCanadaComputersProduct,
      },
      skuLimitPerRetailer: skuLimit,
    });
    liveObs = result.observations;
    clearedRetailers = result.retailers;
    clearedStores = result.stores;
    ingestLogs = result.logs;
    console.log("Ingest logs:", JSON.stringify(result.logs, null, 2));
  } else {
    const prev = await loadPreviousStore();
    if (prev) {
      const liveOfferIds = new Set(
        prev.offers.filter((o) => !o.isPlaceholder).map((o) => o.id)
      );
      const latestByOffer = new Map<string, (typeof prev.priceObservations)[0]>();
      for (const obs of prev.priceObservations) {
        if (!liveOfferIds.has(obs.offerId)) continue;
        const old = latestByOffer.get(obs.offerId);
        if (!old || obs.observedAt > old.observedAt) latestByOffer.set(obs.offerId, obs);
      }
      for (const offer of prev.offers.filter((o) => !o.isPlaceholder)) {
        const card = prev.cards.find((c) => c.id === offer.cardId);
        const retailer = prev.retailers.find((r) => r.id === offer.retailerId);
        const store = offer.storeId
          ? prev.stores.find((s) => s.id === offer.storeId)
          : undefined;
        if (!card || !retailer) continue;
        const latest = latestByOffer.get(offer.id);
        if (!latest) continue;
        liveObs.push({
          cardSlug: card.slug,
          retailerSlug: retailer.slug,
          storeSlug: store?.slug,
          sku: offer.sku,
          productUrl: offer.productUrl,
          condition: offer.condition,
          priceCad: latest.priceCad,
          inStock: latest.inStock,
          observedAt: latest.observedAt,
        });
        if (!cardMap.has(card.slug)) cardMap.set(card.slug, card);
      }
      ingestLogs = prev.ingestLogs;
    }
  }

  const cards = mergeCards(placeholder.cards ?? [], cardMap);
  const retailers = mergeRetailers(placeholder.retailers ?? [], clearedRetailers);
  const stores = mergeStores(
    placeholder.stores ?? [],
    mergeStores(CLEARED_CANADA_COMPUTERS_STORES, clearedStores)
  );

  const allObservations = [...liveObs, ...placeholderObs];
  const cardBySlug = new Map(cards.map((c) => [c.slug, c]));
  const retailerBySlug = new Map(retailers.map((r) => [r.slug, r]));
  const storeBySlug = new Map(stores.map((s) => [s.slug, s]));

  const liveOffersMap = buildOffers(
    liveObs,
    cardBySlug,
    retailerBySlug,
    storeBySlug,
    false
  );
  const placeholderOffersMap = buildOffers(
    placeholderObs,
    cardBySlug,
    retailerBySlug,
    storeBySlug,
    true
  );
  const offersMap = new Map<string, Offer>([
    ...placeholderOffersMap,
    ...liveOffersMap,
  ]);

  const priceObservations = buildPriceObservations(allObservations, offersMap);
  const changeEvents = buildChangeEvents(
    placeholder.changeEvents ?? PLACEHOLDER_CHANGE_EVENTS,
    cardBySlug,
    offersMap,
    storeBySlug
  );

  const liveOfferCount = [...offersMap.values()].filter(
    (o) => !o.isPlaceholder
  ).length;

  const store: TrackerStore = {
    version: 2,
    placeholder: liveOfferCount === 0,
    liveOfferCount,
    generatedAt: new Date().toISOString(),
    gpus,
    retailers,
    stores,
    cards,
    offers: [...offersMap.values()],
    priceObservations,
    changeEvents,
    provinceTaxes: placeholder.provinceTaxes ?? [],
    ingestLogs,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
  console.log(
    `Wrote ${OUT_PATH} (${store.cards.length} cards, ${store.offers.length} offers, ${liveOfferCount} live offers)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});