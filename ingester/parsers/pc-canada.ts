import type { ParsedProduct } from "./types";
import { detectOpenBox, parseCadPrice } from "./types";
import { extractBrand, matchGpuFromText } from "../match/gpu";

export function parsePcCanadaProduct(html: string, url: string): ParsedProduct | null {
  const title =
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ??
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ??
    "";

  const textBlob = title + " " + html.replace(/<[^>]+>/g, " ");
  const gpu = matchGpuFromText(textBlob);
  if (!gpu) return null;

  const brand = extractBrand(textBlob) ?? "NVIDIA";

  const priceMatch =
    html.match(/Price\s*\(CAD\):\s*\$?([\d,]+\.?\d*)/i) ??
    html.match(/class="[^"]*price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i);
  const priceCad = priceMatch ? parseCadPrice(priceMatch[1]!) : null;

  const inStock =
    /\bIn Stock\b/i.test(html) &&
    !/\bOut Of Stock\b/i.test(html.slice(0, 4000));

  const sku =
    html.match(/Product Model:\s*([A-Z0-9\-]+)/i)?.[1] ??
    html.match(/MFGR #:\s*([A-Z0-9\-]+)/i)?.[1] ??
    url.split("/").pop() ??
    "unknown";

  const openBox = detectOpenBox(textBlob, url);

  return {
    title: title || textBlob.slice(0, 120),
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