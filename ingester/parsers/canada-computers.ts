import type { ParsedProduct, ParsedStoreStock } from "./types";
import {
  detectOpenBox,
  parseCadPrice,
  stockFromAvailability,
} from "./types";
import {
  buildCardSlug,
  extractBrand,
  matchGpuFromText,
} from "../match/gpu";
import { lookupCanadaComputersStore } from "./cc-store-map";

function extractJsonLdProduct(html: string): Record<string, unknown> | null {
  const re =
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1]!) as Record<string, unknown>;
      if (data["@type"] === "Product") return data;
    } catch {
      /* skip */
    }
  }
  return null;
}

function parseStoreStock(html: string): ParsedStoreStock[] {
  const stocks: ParsedStoreStock[] = [];
  const blockRe =
    /<span class="col-3[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>[\s\S]*?shop-online-box[^>]*>\s*(\d+)\s*<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(html))) {
    const label = m[1]!.trim();
    const qty = Number.parseInt(m[2]!, 10);
    const mapped = lookupCanadaComputersStore(label);
    if (!mapped) continue;
    stocks.push({
      storeKey: mapped.slug,
      city: mapped.city,
      provinceCode: mapped.provinceCode,
      quantity: Number.isFinite(qty) ? qty : 0,
    });
  }
  return stocks;
}

/** Online ship stock from the Delivery panel — not store pickup counts. */
function parseOnlineStockFromHtml(
  html: string,
  schemaAvailability: string | undefined
): boolean {
  const deliveryMatch = html.match(/id="delivery-text"[^>]*>\s*([^<]+)/i);
  if (deliveryMatch) {
    const text = deliveryMatch[1]!.trim().toLowerCase();
    if (/sold\s+out\s+online/.test(text)) return false;
    if (
      /in\s+stock\s+online|available\s+online|ships\s+in|ready\s+to\s+ship/.test(
        text
      )
    ) {
      return true;
    }
  }
  let inStockOnline = stockFromAvailability(schemaAvailability);
  if (!inStockOnline && /product-available-for-order":true/.test(html)) {
    inStockOnline = !/SoldOut/i.test(schemaAvailability ?? "");
  }
  return inStockOnline;
}

export function parseCanadaComputersProduct(
  html: string,
  url: string
): ParsedProduct | null {
  if (/page_name":"pagenotfound"/i.test(html) || /"page_name":"pagenotfound"/.test(html)) {
    return null;
  }

  const product = extractJsonLdProduct(html);
  const title =
    (product?.name as string | undefined) ??
    html.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ??
    "";

  if (!title) return null;

  const gpu = matchGpuFromText(title);
  if (!gpu) return null;

  const brand =
    extractBrand(title) ??
  ((product?.brand as { name?: string } | undefined)?.name ?? "NVIDIA");

  const offers = product?.offers as
    | { price?: number; availability?: string }
    | undefined;
  const priceCad =
    typeof offers?.price === "number"
      ? offers.price
      : parseCadPrice(
          html.match(/current-price-value[^>]*>([^<]+)</i)?.[1] ??
            html.match(/\$[\d,]+\.?\d*/)?.[0] ??
            ""
        );

  const availability = offers?.availability as string | undefined;
  const inStockOnline = parseOnlineStockFromHtml(html, availability);

  const sku =
    (product?.sku as string | undefined) ??
    html.match(/"product-id-(\d+)"/)?.[1] ??
    url.match(/\/(\d+)\/[^/]+\.html/)?.[1] ??
    "unknown";

  const openBox = detectOpenBox(title, url);
  const condition = openBox ? "open_box" : "new";

  const storeStock = parseStoreStock(html);

  const variantLabel = title
    .replace(/\b(msi|asus|zotac|gigabyte|pny|palit|nvidia)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return {
    title,
    brand,
    gpuSlug: gpu.gpuSlug,
    sku,
    mpn: product?.mpn as string | undefined,
    priceCad,
    inStockOnline,
    condition,
    variantLabel: variantLabel || title,
    storeStock,
    openBox,
  };
}

/** Internal listing URL — never links to canadacomputers.com in the UI. */
export function canadaComputersInternalUrl(sku: string): string {
  return `/internal/cc/${encodeURIComponent(sku)}`;
}

export function cardSlugForParsed(
  parsed: ParsedProduct,
  retailerSlug: string
): string {
  return buildCardSlug(
    parsed.brand,
    parsed.gpuSlug,
    retailerSlug,
    parsed.sku
  );
}