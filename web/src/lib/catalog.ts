import type { Card, Gpu, Offer } from "../../../types/db";
import {
  getStore,
  getCardMap,
  getGpuMap,
  getRetailerMap,
  getStoreMap,
  getPriceHistoryForCard,
} from "./store";

function latestByOffer() {
  const latest = new Map<string, import("../../../types/db").PriceObservation>();
  for (const obs of getStore().priceObservations) {
    const prev = latest.get(obs.offerId);
    if (!prev || obs.observedAt > prev.observedAt) latest.set(obs.offerId, obs);
  }
  return latest;
}

export interface CardRow {
  card: Card;
  gpu: Gpu;
  lowest: number | null;
  inStock: boolean;
  pctMsrp: number | null;
  pricePerGb: number | null;
  sparkline: number[];
  offerCount: number;
}

export function buildCardRows(): CardRow[] {
  const store = getStore();
  const latest = latestByOffer();
  const gpuMap = getGpuMap();

  return store.cards.map((card) => {
    const gpu = gpuMap.get(card.gpuId)!;
    const offers = store.offers.filter((o) => o.cardId === card.id);
    let lowest: number | null = null;
    let inStock = false;
    for (const o of offers) {
      const obs = latest.get(o.id);
      if (!obs?.inStock) continue;
      inStock = true;
      if (lowest == null || obs.priceCad < lowest) lowest = obs.priceCad;
    }
    const pct =
      lowest != null
        ? Math.round(((lowest - gpu.launchMsrpCad) / gpu.launchMsrpCad) * 100)
        : null;
    const pricePerGb =
      lowest != null ? Math.round((lowest / card.vramGb) * 100) / 100 : null;
    const hist = getPriceHistoryForCard(card.id).flatMap((s) =>
      s.points.map((p) => p.price)
    );
    return {
      card,
      gpu,
      lowest,
      inStock,
      pctMsrp: pct,
      pricePerGb,
      sparkline: hist.length ? hist : lowest != null ? [lowest] : [],
      offerCount: offers.length,
    };
  });
}

export function sortCardRows(rows: CardRow[], sort: string): CardRow[] {
  const copy = [...rows];
  switch (sort) {
    case "price":
      return copy.sort((a, b) => (a.lowest ?? 1e9) - (b.lowest ?? 1e9));
    case "-price":
    case "price_desc":
      return copy.sort((a, b) => (b.lowest ?? 0) - (a.lowest ?? 0));
    case "msrp":
      return copy.sort((a, b) => (a.pctMsrp ?? 1e9) - (b.pctMsrp ?? 1e9));
    case "price_per_gb":
      return copy.sort((a, b) => (a.pricePerGb ?? 1e9) - (b.pricePerGb ?? 1e9));
    case "name":
      return copy.sort((a, b) => a.card.modelName.localeCompare(b.card.modelName));
    default:
      return copy.sort((a, b) => (a.lowest ?? 1e9) - (b.lowest ?? 1e9));
  }
}

export function filterCardRows(
  rows: CardRow[],
  opts: { q?: string; avail?: string; brand?: string; maxLen?: number }
): CardRow[] {
  return rows.filter((row) => {
    if (opts.avail === "stock" && !row.inStock) return false;
    if (opts.brand && row.card.brand.toLowerCase() !== opts.brand.toLowerCase()) {
      return false;
    }
    if (opts.maxLen && row.card.lengthMm && row.card.lengthMm > opts.maxLen) {
      return false;
    }
    if (opts.q) {
      const hay = `${row.card.brand} ${row.card.modelName} ${row.gpu.modelName}`.toLowerCase();
      if (!hay.includes(opts.q.toLowerCase())) return false;
    }
    return true;
  });
}