export interface GpuMatch {
  gpuSlug: string;
  productLine: "geforce" | "rtx_pro" | "other";
}

const GPU_PATTERNS: { re: RegExp; slug: string; line: GpuMatch["productLine"] }[] =
  [
    { re: /\bRTX\s*PRO\s*6000\b/i, slug: "rtx-pro-6000", line: "rtx_pro" },
    { re: /\bRTX\s*PRO\s*5000\b/i, slug: "rtx-pro-5000", line: "rtx_pro" },
    { re: /\bRTX\s*PRO\s*4000\b/i, slug: "rtx-pro-4000", line: "rtx_pro" },
    { re: /\bRTX\s*5090\b/i, slug: "rtx-5090", line: "geforce" },
    { re: /\bRTX\s*5080\b/i, slug: "rtx-5080", line: "geforce" },
    { re: /\bRTX\s*5070\s*TI\b/i, slug: "rtx-5070-ti", line: "geforce" },
    { re: /\bRTX\s*5070\b/i, slug: "rtx-5070", line: "geforce" },
    { re: /\bRTX\s*5060\s*TI\b.*\b16\s*G/i, slug: "rtx-5060-ti-16gb", line: "geforce" },
    { re: /\bRTX\s*5060\s*TI\b.*\b8\s*G/i, slug: "rtx-5060-ti-8gb", line: "geforce" },
    { re: /\bRTX\s*5060\s*TI\b/i, slug: "rtx-5060-ti-16gb", line: "geforce" },
    { re: /\bRTX\s*5060\b/i, slug: "rtx-5060", line: "geforce" },
    { re: /\bRTX\s*5050\b/i, slug: "rtx-5050", line: "geforce" },
    { re: /\bRTX\s*4090\b/i, slug: "rtx-4090", line: "geforce" },
    { re: /\bRTX\s*4080\b/i, slug: "rtx-4080", line: "geforce" },
    { re: /\bRTX\s*4070\b/i, slug: "rtx-4070", line: "geforce" },
    { re: /\bRTX\s*4060\s*TI\b/i, slug: "rtx-4060-ti", line: "geforce" },
    { re: /\bRTX\s*4060\b/i, slug: "rtx-4060", line: "geforce" },
  ];

export function matchGpuFromText(text: string): GpuMatch | null {
  for (const { re, slug, line } of GPU_PATTERNS) {
    if (re.test(text)) return { gpuSlug: slug, productLine: line };
  }
  return null;
}

const BRANDS = [
  "NVIDIA",
  "ASUS",
  "MSI",
  "Gigabyte",
  "GIGABYTE",
  "ZOTAC",
  "PNY",
  "Palit",
  "EVGA",
  "Gainward",
  "ASRock",
  "PowerColor",
] as const;

export function extractBrand(text: string): string | null {
  for (const brand of BRANDS) {
    const re = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) {
      return brand === "GIGABYTE" ? "Gigabyte" : brand;
    }
  }
  if (/\bGeForce\b/i.test(text)) return "NVIDIA";
  return null;
}

export function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function buildCardSlug(
  brand: string,
  gpuSlug: string,
  retailerSlug: string,
  sku: string
): string {
  const base = slugifySegment(`${brand}-${gpuSlug}-${sku}`);
  return `${base}-${retailerSlug}`.slice(0, 80);
}