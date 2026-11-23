import type {
  TrackerStore,
  Gpu,
  Retailer,
  Store,
  Card,
  Offer,
  PriceObservation,
  ChangeEvent,
  OfferCondition,
} from "../../../types/db";
import storeJson from "../../../data/store.json";
import { formatOfferLocation } from "./format";

const store = storeJson as TrackerStore;

export function getStore(): TrackerStore {
  return store;
}

function latestByOffer(): Map<string, PriceObservation> {
  const latest = new Map<string, PriceObservation>();
  for (const obs of store.priceObservations) {
    const prev = latest.get(obs.offerId);
    if (!prev || obs.observedAt > prev.observedAt) latest.set(obs.offerId, obs);
  }
  return latest;
}

export function isLiveOffer(o: Offer): boolean {
  return o.isPlaceholder === false;
}

export function getGpuMap() {
  return new Map(store.gpus.map((g) => [g.id, g]));
}

export function getCardMap() {
  return new Map(store.cards.map((c) => [c.id, c]));
}

export function getRetailerMap() {
  return new Map(store.retailers.map((r) => [r.id, r]));
}

export function getStoreMap() {
  return new Map(store.stores.map((s) => [s.id, s]));
}

export function getAllGpus(): Gpu[] {
  return [...store.gpus];
}

export function getGeForce50Gpus(): Gpu[] {
  return store.gpus.filter(
    (g) => g.series === "50-series" && g.productLine === "geforce"
  );
}

export function getGpuBySlug(slug: string): Gpu | undefined {
  return store.gpus.find((g) => g.slug === slug);
}

export function getCardBySlug(slug: string): Card | undefined {
  return store.cards.find((c) => c.slug === slug);
}

export function getAllCards(): Card[] {
  return [...store.cards];
}

export interface SiteStats {
  cardsTracked: number;
  stores: number;
  offersInStock: number;
  retailers: number;
}

export function getSiteStats(): SiteStats {
  const latest = latestByOffer();
  let offersInStock = 0;
  const retailerIds = new Set<string>();
  const storeIds = new Set<string>();
  const cardIds = new Set<string>();

  for (const o of store.offers) {
    if (!isLiveOffer(o)) continue;
    const obs = latest.get(o.id);
    if (!obs?.inStock) continue;
    offersInStock++;
    retailerIds.add(o.retailerId);
    if (o.storeId) storeIds.add(o.storeId);
    cardIds.add(o.cardId);
  }

  return {
    cardsTracked: cardIds.size,
    stores: storeIds.size,
    offersInStock,
    retailers: retailerIds.size,
  };
}

export function getLiveChanges(limit = 8): ChangeEvent[] {
  return store.changeEvents
    .filter((ev) => {
      if (!ev.offerId) return true;
      const offer = store.offers.find((o) => o.id === ev.offerId);
      return offer ? isLiveOffer(offer) : true;
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

export interface LiveActivityItem {
  kind: "change" | "first_seen";
  title: string;
  detail: string;
  href: string;
  occurredAt: string;
}

/** Headline live feed: change events, else first observations for live offers. */
export function getLiveActivity(limit = 8): LiveActivityItem[] {
  const cardMap = getCardMap();
  const retailerMap = getRetailerMap();
  const items: LiveActivityItem[] = [];

  for (const ev of getLiveChanges(limit * 2)) {
    const card = cardMap.get(ev.cardId);
    if (!card) continue;
    let detail = "";
    if (ev.eventType === "price_drop" && ev.priceCad != null) {
      detail = `Price drop · $${ev.priceCad.toFixed(2)} CAD`;
    } else if (ev.eventType === "in_stock") {
      detail = "Back in stock";
    } else {
      detail = "Sold out";
    }
    items.push({
      kind: "change",
      title: `${card.brand} ${card.modelName}`,
      detail,
      href: `/cards/${card.slug}/`,
      occurredAt: ev.occurredAt,
    });
  }

  if (items.length < limit) {
    const latest = latestByOffer();
    const seenOffers = new Set<string>();
    const seenCards = new Set<string>();
    for (const o of store.offers) {
      if (!isLiveOffer(o) || seenOffers.has(o.id) || seenCards.has(o.cardId))
        continue;
      const obs = latest.get(o.id);
      if (!obs) continue;
      const card = cardMap.get(o.cardId);
      const retailer = retailerMap.get(o.retailerId);
      if (!card || !retailer) continue;
      const first = [...store.priceObservations]
        .filter((p) => p.offerId === o.id)
        .sort((a, b) => a.observedAt.localeCompare(b.observedAt))[0];
      if (!first) continue;
      seenOffers.add(o.id);
      seenCards.add(o.cardId);
      items.push({
        kind: "first_seen",
        title: `${card.brand} ${card.modelName}`,
        detail: `First seen · $${first.priceCad.toFixed(2)} CAD · ${retailer.name}`,
        href: `/cards/${card.slug}/`,
        occurredAt: first.observedAt,
      });
    }
    items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

  return items.slice(0, limit);
}

export interface GpuLaunchRow {
  gpu: Gpu;
  cheapestInStock: number | null;
  pctOverMsrp: number | null;
  storesInStock: number;
  cardsInStock: number;
  cardsTotal: number;
}

export function getLaunchPriceGrid(): GpuLaunchRow[] {
  const latest = latestByOffer();

  return getGeForce50Gpus().map((gpu) => {
    const liveOffers = store.offers.filter(
      (o) => o.gpuId === gpu.id && isLiveOffer(o)
    );
    const liveCardIds = new Set(liveOffers.map((o) => o.cardId));
    const inStockOffers = liveOffers.filter(
      (o) => latest.get(o.id)?.inStock && o.condition === "new"
    );
    let cheapest: number | null = null;
    const storeIds = new Set<string>();
    const cardIdsInStock = new Set<string>();
    for (const o of inStockOffers) {
      const p = latest.get(o.id)?.priceCad;
      if (p == null) continue;
      if (cheapest == null || p < cheapest) cheapest = p;
      if (o.storeId) storeIds.add(o.storeId);
      else storeIds.add(`online-${o.retailerId}`);
      cardIdsInStock.add(o.cardId);
    }
    const pctOverMsrp =
      cheapest != null
        ? Math.round(((cheapest - gpu.launchMsrpCad) / gpu.launchMsrpCad) * 100)
        : null;
    return {
      gpu,
      cheapestInStock: cheapest,
      pctOverMsrp,
      storesInStock: storeIds.size,
      cardsInStock: cardIdsInStock.size,
      cardsTotal: liveCardIds.size,
    };
  });
}

export interface RetailerChip {
  retailer: Retailer;
  priceCad: number;
  inStock: boolean;
}

export interface CheapestGpuRow {
  gpu: Gpu;
  cheapestCard: Card | null;
  cheapestPrice: number | null;
  retailer: Retailer | null;
  pctOverMsrp: number | null;
  chips: RetailerChip[];
  specLine: string;
}

export function getCheapestPerGpu(): CheapestGpuRow[] {
  const latest = latestByOffer();
  const cardMap = getCardMap();
  const retailerMap = getRetailerMap();

  return getGeForce50Gpus().map((gpu) => {
    const offers = store.offers.filter(
      (o) => o.gpuId === gpu.id && o.condition === "new" && isLiveOffer(o)
    );
    let best: { card: Card; price: number; retailer: Retailer } | null = null;
    const chips: RetailerChip[] = [];

    for (const o of offers) {
      const obs = latest.get(o.id);
      if (!obs?.inStock) continue;
      const card = cardMap.get(o.cardId);
      const retailer = retailerMap.get(o.retailerId);
      if (!card || !retailer) continue;
      chips.push({ retailer, priceCad: obs.priceCad, inStock: true });
      if (!best || obs.priceCad < best.price) {
        best = { card, price: obs.priceCad, retailer };
      }
    }
    chips.sort((a, b) => a.priceCad - b.priceCad);
    const spec = best?.card;
    const specLine = spec
      ? `${spec.vramGb}GB · ${spec.lengthMm ?? "?"}mm · ${spec.slotWidth ?? "?"}s · ${spec.powerConnector ?? "?"}`
      : `${gpu.vramGb}GB`;
    const pct =
      best != null
        ? Math.round(((best.price - gpu.launchMsrpCad) / gpu.launchMsrpCad) * 100)
        : null;
    return {
      gpu,
      cheapestCard: best?.card ?? null,
      cheapestPrice: best?.price ?? null,
      retailer: best?.retailer ?? null,
      pctOverMsrp: pct,
      chips: chips.slice(0, 4),
      specLine,
    };
  });
}

export type FreshTab = "week" | "drops" | "open_box" | "by_city";

export interface FreshFind {
  card: Card;
  gpu: Gpu;
  retailer: Retailer;
  store: Store | null;
  priceCad: number;
  previousPriceCad: number | null;
  pctChange: number | null;
  condition: OfferCondition;
  city: string | null;
  observedAt: string;
}

export function getFreshFinds(tab: FreshTab): FreshFind[] {
  const latest = latestByOffer();
  const cardMap = getCardMap();
  const gpuMap = getGpuMap();
  const retailerMap = getRetailerMap();
  const storeMap = getStoreMap();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const items: FreshFind[] = [];
  for (const o of store.offers) {
    if (!isLiveOffer(o)) continue;
    const obs = latest.get(o.id);
    if (!obs) continue;
    const card = cardMap.get(o.cardId);
    const gpu = card ? gpuMap.get(card.gpuId) : undefined;
    const retailer = retailerMap.get(o.retailerId);
    const st = o.storeId ? storeMap.get(o.storeId) : null;
    if (!card || !gpu || !retailer) continue;

    const hist = store.priceObservations
      .filter((p) => p.offerId === o.id)
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    const prev = hist.length > 1 ? hist[hist.length - 2] : null;
    const pct =
      prev && obs.priceCad < prev.priceCad
        ? Math.round(((obs.priceCad - prev.priceCad) / prev.priceCad) * 100)
        : null;

    const find: FreshFind = {
      card,
      gpu,
      retailer,
      store: st ?? null,
      priceCad: obs.priceCad,
      previousPriceCad: prev?.priceCad ?? null,
      pctChange: pct,
      condition: o.condition,
      city: st?.city ?? null,
      observedAt: obs.observedAt,
    };

    if (tab === "open_box" && o.condition !== "open_box") continue;
    if (tab === "by_city" && (!st || !obs.inStock)) continue;
    if (tab === "drops" && (pct == null || pct >= 0)) continue;
    if (tab === "week" && new Date(obs.observedAt).getTime() < weekAgo) continue;
    items.push(find);
  }
  return items
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
    .slice(0, 12);
}

export function getBrandCounts(): { brand: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of store.cards) {
    counts.set(c.brand, (counts.get(c.brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);
}

export function filterCards(filters: {
  maxLengthMm?: number;
  cooling?: string;
  connector?: string;
  productLine?: string;
}): Card[] {
  return store.cards.filter((c) => {
    const gpu = getGpuMap().get(c.gpuId);
    if (filters.productLine && gpu?.productLine !== filters.productLine) return false;
    if (filters.maxLengthMm && c.lengthMm && c.lengthMm > filters.maxLengthMm)
      return false;
    if (filters.cooling && c.cooling !== filters.cooling) return false;
    if (filters.connector && c.powerConnector !== filters.connector) return false;
    return true;
  });
}

export interface OfferWithLatest {
  offer: Offer;
  retailer: Retailer;
  store: Store | null;
  latest: PriceObservation | null;
}

export function getOffersForCard(cardId: string): OfferWithLatest[] {
  const latest = latestByOffer();
  const retailerMap = getRetailerMap();
  const storeMap = getStoreMap();
  return store.offers
    .filter((o) => o.cardId === cardId)
    .map((offer) => ({
      offer,
      retailer: retailerMap.get(offer.retailerId)!,
      store: offer.storeId ? storeMap.get(offer.storeId) ?? null : null,
      latest: latest.get(offer.id) ?? null,
    }))
    .sort((a, b) => (a.latest?.priceCad ?? 1e9) - (b.latest?.priceCad ?? 1e9));
}

export function getPriceHistoryForOffer(offerId: string) {
  return store.priceObservations
    .filter((p) => p.offerId === offerId)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((o) => ({ t: o.observedAt, price: o.priceCad }));
}

export function getPriceHistoryForCard(cardId: string) {
  const offers = store.offers.filter((o) => o.cardId === cardId);
  const retailerMap = getRetailerMap();
  const storeMap = getStoreMap();
  return offers.map((offer) => {
    const retailer = retailerMap.get(offer.retailerId);
    const st = offer.storeId ? storeMap.get(offer.storeId) : null;
    const label = st
      ? `${retailer?.name} · ${formatOfferLocation(st)}`
      : retailer?.name ?? "Offer";
    return {
      offerId: offer.id,
      label,
      points: getPriceHistoryForOffer(offer.id),
    };
  });
}

export function getProGpus(): Gpu[] {
  return store.gpus.filter((g) => g.productLine === "rtx_pro");
}