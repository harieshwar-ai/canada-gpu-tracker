import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Card, Gpu, Retailer, Store } from "../../types/db";
import type {
  NormalizedFetchResult,
  NormalizedObservationInput,
  Source,
} from "../source";
import { politeFetch, CrawlStoppedError } from "../crawl/fetch";
import {
  canFetchSku,
  loadSkuFetchState,
  recordSkuFetch,
  saveSkuFetchState,
} from "../crawl/sku-budget";
import type { ParsedProduct } from "../parsers/types";
import { cardSlugForParsed, canadaComputersInternalUrl } from "../parsers/canada-computers";
import { buildCardSlug } from "../match/gpu";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "..", "config", "cleared-skus.json");

const T0 = "2026-01-01T00:00:00.000Z";

export interface ClearedSkuConfig {
  pcCanada: { url: string; note?: string }[];
  mikesComputerShop: { url: string; note?: string }[];
  canadaComputers: { url: string; note?: string }[];
}

export interface SourceRunLog {
  retailerId: string;
  fetched: number;
  skipped: number;
  challenged: boolean;
  message?: string;
}

type ParserFn = (html: string, url: string) => ParsedProduct | null;

interface RetailerSourceDef {
  id: string;
  displayName: string;
  retailerSlug: string;
  websiteUrl: string;
  hasPhysicalStores: boolean;
  configKey: keyof ClearedSkuConfig;
  parser: ParserFn;
  productUrl: (sku: string, liveUrl: string) => string;
}

function ensureCard(
  cards: Map<string, Card>,
  gpus: Map<string, Gpu>,
  parsed: ParsedProduct,
  retailerSlug: string,
  cardSlug?: string
): Card {
  const slug =
    cardSlug ??
    buildCardSlug(parsed.brand, parsed.gpuSlug, retailerSlug, parsed.sku);
  const existing = cards.get(slug);
  if (existing) return existing;

  const gpu = gpus.get(parsed.gpuSlug);
  const gpuId = gpu?.id ?? `gpu-${parsed.gpuSlug}`;
  const card: Card = {
    id: `card-${slug}`,
    gpuId,
    slug,
    brand: parsed.brand,
    modelName: parsed.variantLabel,
    vramGb: gpu?.vramGb ?? 12,
    lengthMm: null,
    slotWidth: null,
    cooling: null,
    psuWatts: null,
    powerConnector: null,
    createdAt: T0,
    updatedAt: new Date().toISOString(),
  };
  cards.set(slug, card);
  return card;
}

function observationFromParsed(
  parsed: ParsedProduct,
  cardSlug: string,
  retailerSlug: string,
  productUrl: string,
  storeSlug?: string,
  inStock?: boolean
): NormalizedObservationInput {
  return {
    cardSlug,
    retailerSlug,
    storeSlug,
    sku: parsed.sku,
    productUrl,
    condition: parsed.condition,
    priceCad: parsed.priceCad ?? 0,
    inStock: inStock ?? parsed.inStockOnline,
    observedAt: new Date().toISOString(),
  };
}

async function runRetailerSource(
  def: RetailerSourceDef,
  gpus: Gpu[],
  cards: Map<string, Card>,
  skuLimit?: number
): Promise<{ observations: NormalizedObservationInput[]; log: SourceRunLog }> {
  const config = JSON.parse(
    await readFile(CONFIG_PATH, "utf8")
  ) as ClearedSkuConfig;
  const urls = config[def.configKey];
  const state = await loadSkuFetchState();
  const observations: NormalizedObservationInput[] = [];
  const gpuMap = new Map(gpus.map((g) => [g.slug, g]));
  let fetched = 0;
  let skipped = 0;

  const list = skuLimit != null ? urls.slice(0, skuLimit) : urls;

  for (const entry of list) {
    const skuKey = `${def.retailerSlug}::${entry.url}`;
    if (!canFetchSku(state, skuKey)) {
      skipped++;
      continue;
    }

    try {
      const { html } = await politeFetch(entry.url);
      recordSkuFetch(state, skuKey);
      const parsed = def.parser(html, entry.url);
      if (!parsed || parsed.priceCad == null) {
        skipped++;
        continue;
      }

      const cardSlug =
        def.retailerSlug === "canada-computers"
          ? cardSlugForParsed(parsed, def.retailerSlug)
          : buildCardSlug(parsed.brand, parsed.gpuSlug, def.retailerSlug, parsed.sku);

      ensureCard(cards, gpuMap, parsed, def.retailerSlug, cardSlug);

      const productUrl = def.productUrl(parsed.sku, entry.url);
      observations.push(
        observationFromParsed(parsed, cardSlug, def.retailerSlug, productUrl)
      );

      if (parsed.storeStock) {
        for (const st of parsed.storeStock) {
          if (st.quantity <= 0) continue;
          observations.push(
            observationFromParsed(
              parsed,
              cardSlug,
              def.retailerSlug,
              productUrl,
              st.storeKey,
              true
            )
          );
        }
      }
      fetched++;
    } catch (err) {
      if (err instanceof CrawlStoppedError) {
        await saveSkuFetchState(state);
        return {
          observations,
          log: {
            retailerId: def.id,
            fetched,
            skipped,
            challenged: true,
            message: err.message,
          },
        };
      }
      skipped++;
    }
  }

  await saveSkuFetchState(state);
  return {
    observations,
    log: {
      retailerId: def.id,
      fetched,
      skipped,
      challenged: false,
    },
  };
}

export function createRetailerSource(
  def: RetailerSourceDef,
  shared: { gpus: Gpu[]; cards: Map<string, Card> },
  skuLimit?: number
): Source {
  return {
    id: def.id,
    displayName: def.displayName,
    async fetch(): Promise<NormalizedFetchResult> {
      const { observations } = await runRetailerSource(
        def,
        shared.gpus,
        shared.cards,
        skuLimit
      );
      return { observations };
    },
  };
}

export async function runClearedRetailers(options: {
  gpus: Gpu[];
  cards: Map<string, Card>;
  parsers: {
    pcCanada: ParserFn;
    mikes: ParserFn;
    canadaComputers: ParserFn;
  };
  skuLimitPerRetailer?: number;
}): Promise<{
  observations: NormalizedObservationInput[];
  retailers: Retailer[];
  stores: Store[];
  logs: SourceRunLog[];
}> {
  const defs: RetailerSourceDef[] = [
    {
      id: "pc-canada",
      displayName: "PC-Canada",
      retailerSlug: "pc-canada",
      websiteUrl: "https://www.pc-canada.com",
      hasPhysicalStores: false,
      configKey: "pcCanada",
      parser: options.parsers.pcCanada,
      productUrl: (_sku, live) => live,
    },
    {
      id: "mikes-computer-shop",
      displayName: "Mike's Computer Shop",
      retailerSlug: "mikes-computer-shop",
      websiteUrl: "https://www.mikescomputershop.com",
      hasPhysicalStores: false,
      configKey: "mikesComputerShop",
      parser: options.parsers.mikes,
      productUrl: (_sku, live) => live,
    },
    {
      id: "canada-computers-live",
      displayName: "Canada Computers (live crawl)",
      retailerSlug: "canada-computers",
      websiteUrl: "https://www.canadacomputers.com",
      hasPhysicalStores: true,
      configKey: "canadaComputers",
      parser: options.parsers.canadaComputers,
      productUrl: (sku) => canadaComputersInternalUrl(sku),
    },
  ];

  const allObs: NormalizedObservationInput[] = [];
  const logs: SourceRunLog[] = [];

  for (const def of defs) {
    const { observations, log } = await runRetailerSource(
      def,
      options.gpus,
      options.cards,
      options.skuLimitPerRetailer
    );
    allObs.push(...observations);
    logs.push(log);
  }

  const retailers: Retailer[] = defs.map((d) => ({
    id: `ret-${d.retailerSlug}`,
    slug: d.retailerSlug,
    name: d.displayName,
    websiteUrl: d.websiteUrl,
    countryCode: "CA",
    hasPhysicalStores: d.hasPhysicalStores,
    createdAt: T0,
  }));

  const stores = CLEARED_CANADA_COMPUTERS_STORES;

  return { observations: allObs, retailers, stores, logs };
}

export const CLEARED_CANADA_COMPUTERS_STORES: Store[] = [
    {
      id: "store-cc-markham",
      retailerId: "ret-canada-computers",
      slug: "cc-markham",
      name: "Canada Computers Markham",
      city: "Markham",
      provinceCode: "ON",
      countryCode: "CA",
      latitude: 43.8563,
      longitude: -79.337,
      createdAt: T0,
    },
    {
      id: "store-cc-vancouver",
      retailerId: "ret-canada-computers",
      slug: "cc-vancouver",
      name: "Canada Computers Vancouver",
      city: "Vancouver",
      provinceCode: "BC",
      countryCode: "CA",
      latitude: 49.2634,
      longitude: -123.137,
      createdAt: T0,
    },
    {
      id: "store-cc-etobicoke",
      retailerId: "ret-canada-computers",
      slug: "cc-etobicoke",
      name: "Canada Computers Etobicoke",
      city: "Etobicoke",
      provinceCode: "ON",
      countryCode: "CA",
      latitude: 43.6205,
      longitude: -79.5132,
      createdAt: T0,
    },
    {
      id: "store-cc-toronto-dt",
      retailerId: "ret-canada-computers",
      slug: "cc-toronto-dt",
      name: "Canada Computers Toronto Downtown",
      city: "Toronto",
      provinceCode: "ON",
      countryCode: "CA",
      latitude: 43.6544,
      longitude: -79.3807,
      createdAt: T0,
    },
    {
      id: "store-cc-north-york",
      retailerId: "ret-canada-computers",
      slug: "cc-north-york",
      name: "Canada Computers North York Lawrence",
      city: "North York",
      provinceCode: "ON",
      countryCode: "CA",
      latitude: 43.7315,
      longitude: -79.4189,
      createdAt: T0,
    },
    {
      id: "store-cc-calgary",
      retailerId: "ret-canada-computers",
      slug: "cc-calgary",
      name: "Canada Computers Calgary",
      city: "Calgary",
      provinceCode: "AB",
      countryCode: "CA",
      latitude: 51.0447,
      longitude: -114.0719,
      createdAt: T0,
    },
    {
      id: "store-cc-edmonton",
      retailerId: "ret-canada-computers",
      slug: "cc-edmonton",
      name: "Canada Computers Edmonton",
      city: "Edmonton",
      provinceCode: "AB",
      countryCode: "CA",
      latitude: 53.5461,
      longitude: -113.4938,
      createdAt: T0,
    },
  ];