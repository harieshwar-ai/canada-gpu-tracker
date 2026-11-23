import { copyFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import type {
  TrackerStore,
  Gpu,
  Retailer,
  Store,
  Card,
  Offer,
  PriceObservation,
  ChangeEvent,
  ProvinceTax,
  OfferCondition,
} from "../types/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "store.json");
const FALLBACK = path.join(ROOT, "data", "store.fallback.json");

const SUPABASE_URL =
  process.env.PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "https://blfiydxlbfuusmcwbgvu.supabase.co";
const SUPABASE_KEY =
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "sb_publishable_1KDjNKQmpzdgIJ9C_IZjoQ_QtJAS66G";

function mapGpu(row: Record<string, unknown>): Gpu {
  return {
    id: String(row.id),
    slug: String(row.slug),
    modelName: String(row.model_name),
    series: row.series as Gpu["series"],
    productLine: row.product_line as Gpu["productLine"],
    chip: String(row.chip),
    vramGb: Number(row.vram_gb),
    msrpCad: Number(row.msrp_cad),
    launchMsrpCad: Number(row.launch_msrp_cad),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapRetailer(row: Record<string, unknown>): Retailer {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    websiteUrl: String(row.website_url),
    countryCode: String(row.country_code),
    hasPhysicalStores: Boolean(row.has_physical_stores),
    createdAt: String(row.created_at),
  };
}

function mapStore(row: Record<string, unknown>): Store {
  return {
    id: String(row.id),
    retailerId: String(row.retailer_id),
    slug: String(row.slug),
    name: String(row.name),
    city: String(row.city),
    provinceCode: String(row.province_code),
    countryCode: String(row.country_code),
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    createdAt: String(row.created_at),
  };
}

function mapCard(row: Record<string, unknown>): Card {
  return {
    id: String(row.id),
    gpuId: String(row.gpu_id),
    slug: String(row.slug),
    brand: String(row.brand),
    modelName: String(row.model_name),
    vramGb: Number(row.vram_gb),
    lengthMm: row.length_mm != null ? Number(row.length_mm) : null,
    slotWidth: row.slot_width != null ? Number(row.slot_width) : null,
    cooling: row.cooling != null ? String(row.cooling) : null,
    psuWatts: row.psu_watts != null ? Number(row.psu_watts) : null,
    powerConnector: row.power_connector != null ? String(row.power_connector) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });
}

async function fetchTrackerStore(): Promise<TrackerStore | null> {
  let supabase;
  try {
    supabase = createSupabaseClient();
  } catch (err) {
    console.warn("Supabase client init failed:", err);
    return null;
  }
  try {
  const [
    gpusRes,
    retailersRes,
    storesRes,
    cardsRes,
    listingsRes,
    obsRes,
    eventsRes,
    taxesRes,
  ] = await Promise.all([
    supabase.from("gpus").select("*"),
    supabase.from("retailers").select("*"),
    supabase.from("stores").select("*"),
    supabase.from("cards").select("*"),
    supabase.from("listings").select("*"),
    supabase.from("price_observations").select("*").order("observed_at", { ascending: true }),
    supabase.from("change_events").select("*"),
    supabase.from("province_taxes").select("*"),
  ]);

  if (
    gpusRes.error ||
    !gpusRes.data?.length ||
    retailersRes.error ||
    cardsRes.error ||
    listingsRes.error
  ) {
    console.warn("Supabase fetch incomplete:", gpusRes.error ?? retailersRes.error);
    return null;
  }

  const gpus = gpusRes.data.map(mapGpu);
  const retailers = retailersRes.data!.map(mapRetailer);
  const stores = (storesRes.data ?? []).map(mapStore);
  const cards = cardsRes.data!.map(mapCard);
  const offers: Offer[] = listingsRes.data!.map((l) => ({
    id: String(l.id),
    gpuId: String(l.gpu_id),
    cardId: String(l.card_id),
    retailerId: String(l.retailer_id),
    storeId: l.store_id ? String(l.store_id) : null,
    sku: String(l.sku),
    productUrl: String(l.product_url),
    brand: String(l.brand),
    variantLabel: l.variant_label ? String(l.variant_label) : null,
    condition: l.condition as OfferCondition,
    isPlaceholder: Boolean(l.is_placeholder),
    createdAt: String(l.created_at),
    updatedAt: String(l.updated_at),
  }));

  const priceObservations: PriceObservation[] = (obsRes.data ?? []).map((o, i) => ({
    id: `obs-${o.id ?? i}`,
    offerId: String(o.listing_id),
    priceCad: Number(o.price_cad),
    inStock: Boolean(o.in_stock),
    observedAt: String(o.observed_at),
  }));

  const changeEvents: ChangeEvent[] = (eventsRes.data ?? []).map((e, i) => ({
    id: String(e.id ?? `chg-${i}`),
    eventType: e.event_type as ChangeEvent["eventType"],
    offerId: e.listing_id ? String(e.listing_id) : null,
    cardId: String(e.card_id),
    storeId: e.store_id ? String(e.store_id) : null,
    priceCad: e.price_cad != null ? Number(e.price_cad) : null,
    previousPriceCad: e.previous_price_cad != null ? Number(e.previous_price_cad) : null,
    inStock: e.in_stock != null ? Boolean(e.in_stock) : null,
    city: e.city != null ? String(e.city) : null,
    provinceCode: e.province_code != null ? String(e.province_code) : null,
    occurredAt: String(e.occurred_at),
  }));

  const provinceTaxes: ProvinceTax[] = (taxesRes.data ?? []).map((t) => ({
    provinceCode: String(t.province_code),
    provinceName: String(t.province_name),
    taxLabel: String(t.tax_label),
    taxRate: Number(t.tax_rate),
  }));

  const liveOfferCount = offers.filter((o) => !o.isPlaceholder).length;

  return {
    version: 2,
    placeholder: liveOfferCount === 0,
    liveOfferCount,
    generatedAt: new Date().toISOString(),
    gpus,
    retailers,
    stores,
    cards,
    offers,
    priceObservations,
    changeEvents,
    provinceTaxes,
  };
  } catch (err) {
    console.warn("Supabase fetch failed:", err);
    return null;
  }
}

async function main(): Promise<void> {
  await mkdir(path.dirname(OUT), { recursive: true });
  const live = await fetchTrackerStore();
  if (live) {
    await writeFile(OUT, JSON.stringify(live, null, 2) + "\n", "utf8");
    console.log(
      `Wrote ${OUT} from Supabase (${live.cards.length} cards, ${live.liveOfferCount} live offers)`
    );
    return;
  }
  await copyFile(FALLBACK, OUT);
  console.warn(`Supabase empty/unreachable; using fallback ${FALLBACK}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});