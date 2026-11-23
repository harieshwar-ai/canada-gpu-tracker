import type { ParsedProduct } from "./types.ts";
import { detectOpenBox, parseCadPrice } from "./types.ts";
import { extractBrand, matchGpuFromText } from "../gpu.ts";

export function parseMikesProduct(html: string, url: string): ParsedProduct | null {
  const title =
    html.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ??
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ??
    "";

  const textBlob = `${title} ${html.replace(/<[^>]+>/g, " ")}`;
  const gpu = matchGpuFromText(textBlob);
  if (!gpu) return null;

  const brand = extractBrand(textBlob) ?? "NVIDIA";

  const priceCad =
    parseCadPrice(
      html.match(/itemprop="price"[^>]+content="([^"]+)"/i)?.[1] ?? ""
    ) ??
    parseCadPrice(html.match(/class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i)?.[1] ?? "");

  const inStock =
    /itemprop="availability"[^>]+href="[^"]*InStock"/i.test(html) ||
    (/\bIn Stock\b/i.test(html) && !/\bOut of Stock\b/i.test(html.slice(0, 5000)));

  const sku =
    html.match(/SKU[^:]*:\s*([A-Z0-9\-]+)/i)?.[1] ??
    html.match(/data-product-id="(\d+)"/i)?.[1] ??
    url.match(/\/(\d+)\/?$/)?.[1] ??
    "unknown";

  const openBox = detectOpenBox(textBlob, url);

  return {
    title: title || "Mike's product",
    brand,
    gpuSlug: gpu.gpuSlug,
    sku,
    priceCad,
    inStockOnline: inStock,
    condition: openBox ? "open_box" : "new",
    variantLabel: title.slice(0, 80),
    openBox,
  };
}