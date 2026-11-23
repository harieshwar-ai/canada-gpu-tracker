// @ts-nocheck — schema types generated after migrations apply
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import clearedSkus from "../_shared/cleared-skus.json" with { type: "json" };
import { politeFetch, CrawlStoppedError } from "../_shared/fetch.ts";
import { MAX_SKU_FETCHES_PER_DAY } from "../_shared/constants.ts";
import { parseCanadaComputersProduct, canadaComputersInternalUrl } from "../_shared/parsers/canada-computers.ts";
import { parsePcCanadaProduct } from "../_shared/parsers/pc-canada.ts";
import { parseMikesProduct } from "../_shared/parsers/mikes.ts";
import { buildCardSlug } from "../_shared/gpu.ts";
import type { ParsedProduct } from "../_shared/parsers/types.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-ingest-secret, content-type",
};

interface RetailerJob {
  slug: string;
  configKey: keyof typeof clearedSkus;
  parser: (html: string, url: string) => ParsedProduct | null;
  productUrl: (sku: string, liveUrl: string) => string;
}

const RETAILERS: RetailerJob[] = [
  {
    slug: "pc-canada",
    configKey: "pcCanada",
    parser: parsePcCanadaProduct,
    productUrl: (_sku, live) => live,
  },
  {
    slug: "mikes-computer-shop",
    configKey: "mikesComputerShop",
    parser: parseMikesProduct,
    productUrl: (_sku, live) => live,
  },
  {
    slug: "canada-computers",
    configKey: "canadaComputers",
    parser: parseCanadaComputersProduct,
    productUrl: (sku) => canadaComputersInternalUrl(sku),
  },
];

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function canFetchSku(
  supabase: ReturnType<typeof createClient>,
  skuKey: string
): Promise<boolean> {
  const day = todayUtc();
  const { data } = await supabase
    .from("ingest_sku_budget")
    .select("fetch_count")
    .eq("sku_key", skuKey)
    .eq("day", day)
    .maybeSingle();
  if (!data) return true;
  return data.fetch_count < MAX_SKU_FETCHES_PER_DAY;
}

async function recordSkuFetch(
  supabase: ReturnType<typeof createClient>,
  skuKey: string
): Promise<void> {
  const day = todayUtc();
  const { data } = await supabase
    .from("ingest_sku_budget")
    .select("fetch_count")
    .eq("sku_key", skuKey)
    .eq("day", day)
    .maybeSingle();
  if (!data) {
    await supabase.from("ingest_sku_budget").insert({
      sku_key: skuKey,
      day,
      fetch_count: 1,
    });
  } else {
    await supabase
      .from("ingest_sku_budget")
      .update({ fetch_count: data.fetch_count + 1 })
      .eq("sku_key", skuKey)
      .eq("day", day);
  }
}

async function resolveGpuId(supabase: ReturnType<typeof createClient>, gpuSlug: string) {
  const { data } = await supabase.from("gpus").select("id, vram_gb").eq("slug", gpuSlug).single();
  return data;
}

async function upsertCard(
  supabase: ReturnType<typeof createClient>,
  parsed: ParsedProduct,
  retailerSlug: string
) {
  const cardSlug = buildCardSlug(parsed.brand, parsed.gpuSlug, retailerSlug, parsed.sku);
  const gpu = await resolveGpuId(supabase, parsed.gpuSlug);
  if (!gpu) return null;

  const { data: existing } = await supabase.from("cards").select("id").eq("slug", cardSlug).maybeSingle();
  if (existing) return { id: existing.id, slug: cardSlug, vram_gb: gpu.vram_gb };

  const { data, error } = await supabase
    .from("cards")
    .insert({
      gpu_id: gpu.id,
      slug: cardSlug,
      brand: parsed.brand,
      model_name: parsed.variantLabel,
      vram_gb: gpu.vram_gb,
    })
    .select("id")
    .single();
  if (error) return null;
  return { id: data.id, slug: cardSlug, vram_gb: gpu.vram_gb };
}

async function resolveRetailer(supabase: ReturnType<typeof createClient>, slug: string) {
  const { data } = await supabase.from("retailers").select("id, slug").eq("slug", slug).single();
  return data;
}

async function resolveStoreId(supabase: ReturnType<typeof createClient>, storeSlug?: string) {
  if (!storeSlug) return null;
  const { data } = await supabase.from("stores").select("id, city, province_code").eq("slug", storeSlug).maybeSingle();
  return data;
}

async function recordObservation(
  supabase: ReturnType<typeof createClient>,
  params: {
    parsed: ParsedProduct;
    retailerId: string;
    retailerSlug: string;
    cardId: string;
    gpuId: string;
    productUrl: string;
    storeSlug?: string;
    inStock?: boolean;
  }
) {
  const store = params.storeSlug
    ? await resolveStoreId(supabase, params.storeSlug)
    : null;
  const condition = params.parsed.condition;

  let listingQuery = supabase
    .from("listings")
    .select("id")
    .eq("retailer_id", params.retailerId)
    .eq("sku", params.parsed.sku)
    .eq("condition", condition);
  if (store?.id) listingQuery = listingQuery.eq("store_id", store.id);
  else listingQuery = listingQuery.is("store_id", null);
  const { data: existingListing } = await listingQuery.maybeSingle();

  let listingId = existingListing?.id as string | undefined;
  if (!listingId) {
    const { data: created, error } = await supabase
      .from("listings")
      .insert({
        gpu_id: params.gpuId,
        card_id: params.cardId,
        retailer_id: params.retailerId,
        store_id: store?.id ?? null,
        sku: params.parsed.sku,
        product_url: params.productUrl,
        brand: params.parsed.brand,
        variant_label: params.parsed.variantLabel,
        condition,
        is_placeholder: false,
      })
      .select("id")
      .single();
    if (error || !created) return;
    listingId = created.id;
  }

  const { data: prev } = await supabase
    .from("price_observations")
    .select("price_cad, in_stock")
    .eq("listing_id", listingId)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const priceCad = params.parsed.priceCad ?? 0;
  const inStock = params.inStock ?? params.parsed.inStockOnline;
  const observedAt = new Date().toISOString();

  await supabase.from("price_observations").insert({
    listing_id: listingId,
    price_cad: priceCad,
    in_stock: inStock,
    observed_at: observedAt,
  });

  await supabase.from("listings").update({ updated_at: observedAt }).eq("id", listingId);

  if (prev) {
    const priceDrop = priceCad < Number(prev.price_cad);
    if (priceDrop) {
      await supabase.from("change_events").insert({
        event_type: "price_drop",
        listing_id: listingId,
        card_id: params.cardId,
        store_id: store?.id ?? null,
        price_cad: priceCad,
        previous_price_cad: prev.price_cad,
        city: store?.city ?? null,
        province_code: store?.province_code ?? null,
        occurred_at: observedAt,
      });
    }
    const wasIn = Boolean(prev.in_stock);
    if (!wasIn && inStock) {
      await supabase.from("change_events").insert({
        event_type: "in_stock",
        listing_id: listingId,
        card_id: params.cardId,
        store_id: store?.id ?? null,
        price_cad: priceCad,
        in_stock: true,
        city: store?.city ?? null,
        province_code: store?.province_code ?? null,
        occurred_at: observedAt,
      });
    } else if (wasIn && !inStock) {
      await supabase.from("change_events").insert({
        event_type: "sold_out",
        listing_id: listingId,
        card_id: params.cardId,
        store_id: store?.id ?? null,
        price_cad: priceCad,
        in_stock: false,
        city: store?.city ?? null,
        province_code: store?.province_code ?? null,
        occurred_at: observedAt,
      });
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const secret = req.headers.get("x-ingest-secret");
  const expected = Deno.env.get("INGEST_CRON_SECRET");
  if (!expected || secret !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "missing supabase env" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const mode = body.mode === "stock" ? "stock" : "full";
  const maxPerRetailer =
    typeof body.maxSkusPerRetailer === "number" ? body.maxSkusPerRetailer : mode === "stock" ? 1 : 8;

  const logs: Record<string, unknown>[] = [];

  for (const retailer of RETAILERS) {
    let fetched = 0;
    let skipped = 0;
    let challenged = false;
    let message: string | undefined;
    const entries = clearedSkus[retailer.configKey].slice(0, maxPerRetailer);
    const retailerRow = await resolveRetailer(supabase, retailer.slug);
    if (!retailerRow) {
      logs.push({ retailerId: retailer.slug, error: "retailer_not_seeded" });
      continue;
    }

    for (const entry of entries) {
      const skuKey = `${retailer.slug}::${entry.url}`;
      if (!(await canFetchSku(supabase, skuKey))) {
        skipped++;
        continue;
      }
      try {
        const { html } = await politeFetch(entry.url);
        await recordSkuFetch(supabase, skuKey);
        const parsed = retailer.parser(html, entry.url);
        if (!parsed || parsed.priceCad == null) {
          skipped++;
          continue;
        }
        const card = await upsertCard(supabase, parsed, retailer.slug);
        const gpu = await resolveGpuId(supabase, parsed.gpuSlug);
        if (!card || !gpu) {
          skipped++;
          continue;
        }
        const productUrl = retailer.productUrl(parsed.sku, entry.url);
        await recordObservation(supabase, {
          parsed,
          retailerId: retailerRow.id,
          retailerSlug: retailer.slug,
          cardId: card.id,
          gpuId: gpu.id,
          productUrl,
        });
        if (parsed.storeStock?.length) {
          for (const st of parsed.storeStock) {
            if (st.quantity <= 0) continue;
            await recordObservation(supabase, {
              parsed,
              retailerId: retailerRow.id,
              retailerSlug: retailer.slug,
              cardId: card.id,
              gpuId: gpu.id,
              productUrl,
              storeSlug: st.storeKey,
              inStock: true,
            });
          }
        }
        fetched++;
      } catch (err) {
        if (err instanceof CrawlStoppedError) {
          challenged = true;
          message = err.message;
          break;
        }
        skipped++;
        message = err instanceof Error ? err.message : String(err);
      }
    }

    await supabase.from("ingest_run_log").insert({
      retailer_slug: retailer.slug,
      fetched,
      skipped,
      challenged,
      message: message ?? null,
    });
    logs.push({ retailerId: retailer.slug, fetched, skipped, challenged, message });
  }

  return new Response(JSON.stringify({ ok: true, mode, logs }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});