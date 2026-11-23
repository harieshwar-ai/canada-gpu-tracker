import type {
  Gpu,
  Retailer,
  Store,
  Card,
  ProvinceTax,
  ChangeEvent,
} from "../../types/db";
import type {
  NormalizedObservationInput,
  NormalizedChangeEventInput,
} from "../source";

const T0 = "2026-01-01T00:00:00.000Z";

export const PLACEHOLDER_GPUS: Gpu[] = [
  { id: "gpu-rtx-5090", slug: "rtx-5090", modelName: "GeForce RTX 5090", series: "50-series", productLine: "geforce", chip: "Blackwell GB202", vramGb: 32, msrpCad: 2899.99, launchMsrpCad: 2899.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-5080", slug: "rtx-5080", modelName: "GeForce RTX 5080", series: "50-series", productLine: "geforce", chip: "Blackwell GB203", vramGb: 16, msrpCad: 1599.99, launchMsrpCad: 1599.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-5070-ti", slug: "rtx-5070-ti", modelName: "GeForce RTX 5070 Ti", series: "50-series", productLine: "geforce", chip: "Blackwell GB203", vramGb: 16, msrpCad: 1099.99, launchMsrpCad: 1099.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-5070", slug: "rtx-5070", modelName: "GeForce RTX 5070", series: "50-series", productLine: "geforce", chip: "Blackwell GB205", vramGb: 12, msrpCad: 799.99, launchMsrpCad: 799.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-5060-ti-16", slug: "rtx-5060-ti-16gb", modelName: "GeForce RTX 5060 Ti 16GB", series: "50-series", productLine: "geforce", chip: "Blackwell GB206", vramGb: 16, msrpCad: 629.99, launchMsrpCad: 629.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-5060-ti-8", slug: "rtx-5060-ti-8gb", modelName: "GeForce RTX 5060 Ti 8GB", series: "50-series", productLine: "geforce", chip: "Blackwell GB206", vramGb: 8, msrpCad: 549.99, launchMsrpCad: 549.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-5060", slug: "rtx-5060", modelName: "GeForce RTX 5060", series: "50-series", productLine: "geforce", chip: "Blackwell GB206", vramGb: 8, msrpCad: 449.99, launchMsrpCad: 449.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-5050", slug: "rtx-5050", modelName: "GeForce RTX 5050", series: "50-series", productLine: "geforce", chip: "Blackwell GB207", vramGb: 8, msrpCad: 379.99, launchMsrpCad: 379.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-pro-5000", slug: "rtx-pro-5000", modelName: "NVIDIA RTX PRO 5000", series: "other", productLine: "rtx_pro", chip: "Blackwell", vramGb: 48, msrpCad: 12499.99, launchMsrpCad: 12499.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-pro-4000", slug: "rtx-pro-4000", modelName: "NVIDIA RTX PRO 4000", series: "other", productLine: "rtx_pro", chip: "Blackwell", vramGb: 24, msrpCad: 4199.99, launchMsrpCad: 4199.99, createdAt: T0, updatedAt: T0 },
  { id: "gpu-rtx-4060", slug: "rtx-4060", modelName: "GeForce RTX 4060", series: "40-series", productLine: "geforce", chip: "Ada AD107", vramGb: 8, msrpCad: 399.99, launchMsrpCad: 399.99, createdAt: T0, updatedAt: T0 },
];

export const PLACEHOLDER_RETAILERS: Retailer[] = [
  { id: "ret-pc-canada", slug: "pc-canada", name: "PC-Canada", websiteUrl: "https://www.pc-canada.com", countryCode: "CA", hasPhysicalStores: false, createdAt: T0 },
  { id: "ret-mikes-computer-shop", slug: "mikes-computer-shop", name: "Mike's Computer Shop", websiteUrl: "https://www.mikescomputershop.com", countryCode: "CA", hasPhysicalStores: false, createdAt: T0 },
  { id: "ret-best-buy-ca", slug: "best-buy-ca", name: "Best Buy Canada", websiteUrl: "https://www.bestbuy.ca", countryCode: "CA", hasPhysicalStores: true, createdAt: T0 },
  { id: "ret-canada-computers", slug: "canada-computers", name: "Canada Computers", websiteUrl: "https://www.canadacomputers.com", countryCode: "CA", hasPhysicalStores: true, createdAt: T0 },
  { id: "ret-memory-express", slug: "memory-express", name: "Memory Express", websiteUrl: "https://www.memoryexpress.com", countryCode: "CA", hasPhysicalStores: true, createdAt: T0 },
  { id: "ret-newegg-ca", slug: "newegg-ca", name: "Newegg.ca", websiteUrl: "https://www.newegg.ca", countryCode: "CA", hasPhysicalStores: false, createdAt: T0 },
  { id: "ret-amazon-ca", slug: "amazon-ca", name: "Amazon.ca", websiteUrl: "https://www.amazon.ca", countryCode: "CA", hasPhysicalStores: false, createdAt: T0 },
  { id: "ret-visions", slug: "visions", name: "Visions Electronics", websiteUrl: "https://www.visions.ca", countryCode: "CA", hasPhysicalStores: true, createdAt: T0 },
  { id: "ret-staples", slug: "staples-ca", name: "Staples Canada", websiteUrl: "https://www.staples.ca", countryCode: "CA", hasPhysicalStores: true, createdAt: T0 },
  { id: "ret-walmart-ca", slug: "walmart-ca", name: "Walmart.ca", websiteUrl: "https://www.walmart.ca", countryCode: "CA", hasPhysicalStores: true, createdAt: T0 },
  { id: "ret-ebay-ca", slug: "ebay-ca", name: "eBay.ca", websiteUrl: "https://www.ebay.ca", countryCode: "CA", hasPhysicalStores: false, createdAt: T0 },
];

export const PLACEHOLDER_STORES: Store[] = [
  { id: "store-cc-markham", retailerId: "ret-canada-computers", slug: "cc-markham", name: "Canada Computers Markham", city: "Markham", provinceCode: "ON", countryCode: "CA", latitude: 43.8563, longitude: -79.337, createdAt: T0 },
  { id: "store-cc-vancouver", retailerId: "ret-canada-computers", slug: "cc-vancouver", name: "Canada Computers Vancouver", city: "Vancouver", provinceCode: "BC", countryCode: "CA", latitude: 49.2634, longitude: -123.137, createdAt: T0 },
  { id: "store-me-calgary", retailerId: "ret-memory-express", slug: "me-calgary", name: "Memory Express Calgary", city: "Calgary", provinceCode: "AB", countryCode: "CA", latitude: 51.0447, longitude: -114.0719, createdAt: T0 },
  { id: "store-me-edmonton", retailerId: "ret-memory-express", slug: "me-edmonton", name: "Memory Express Edmonton", city: "Edmonton", provinceCode: "AB", countryCode: "CA", latitude: 53.5461, longitude: -113.4938, createdAt: T0 },
  { id: "store-bb-toronto", retailerId: "ret-best-buy-ca", slug: "bb-yonge", name: "Best Buy Toronto Eaton", city: "Toronto", provinceCode: "ON", countryCode: "CA", latitude: 43.6544, longitude: -79.3807, createdAt: T0 },
  { id: "store-bb-vancouver", retailerId: "ret-best-buy-ca", slug: "bb-vancouver", name: "Best Buy Vancouver Downtown", city: "Vancouver", provinceCode: "BC", countryCode: "CA", latitude: 49.2838, longitude: -123.1089, createdAt: T0 },
];

export const PLACEHOLDER_PROVINCE_TAXES: ProvinceTax[] = [
  { provinceCode: "ON", provinceName: "Ontario", taxLabel: "HST 13%", taxRate: 0.13 },
  { provinceCode: "BC", provinceName: "British Columbia", taxLabel: "GST+PST 12%", taxRate: 0.12 },
  { provinceCode: "AB", provinceName: "Alberta", taxLabel: "GST 5%", taxRate: 0.05 },
  { provinceCode: "QC", provinceName: "Quebec", taxLabel: "GST+QST ~14.98%", taxRate: 0.1498 },
];

function card(
  slug: string,
  gpuId: string,
  brand: string,
  modelName: string,
  vramGb: number,
  specs: Partial<Pick<Card, "lengthMm" | "slotWidth" | "cooling" | "psuWatts" | "powerConnector">>
): Card {
  return {
    id: `card-${slug}`,
    gpuId,
    slug,
    brand,
    modelName,
    vramGb,
    lengthMm: specs.lengthMm ?? null,
    slotWidth: specs.slotWidth ?? null,
    cooling: specs.cooling ?? null,
    psuWatts: specs.psuWatts ?? null,
    powerConnector: specs.powerConnector ?? null,
    createdAt: T0,
    updatedAt: T0,
  };
}

export const PLACEHOLDER_CARDS: Card[] = [
  card("nvidia-5090-fe", "gpu-rtx-5090", "NVIDIA", "Founders Edition 32GB", 32, { lengthMm: 342, slotWidth: 3.5, cooling: "triple", psuWatts: 1000, powerConnector: "12V-2x6" }),
  card("asus-5090-tuf", "gpu-rtx-5090", "ASUS", "TUF Gaming OC", 32, { lengthMm: 348, slotWidth: 3.5, cooling: "triple", psuWatts: 1000, powerConnector: "12V-2x6" }),
  card("msi-5080-ventus", "gpu-rtx-5080", "MSI", "VENTUS 3X OC", 16, { lengthMm: 306, slotWidth: 2.5, cooling: "triple", psuWatts: 750, powerConnector: "12V-2x6" }),
  card("gigabyte-5080-windforce", "gpu-rtx-5080", "Gigabyte", "WINDFORCE OC", 16, { lengthMm: 301, slotWidth: 2.5, cooling: "triple", psuWatts: 750, powerConnector: "12V-2x6" }),
  card("pny-5070ti-xlr8", "gpu-rtx-5070-ti", "PNY", "XLR8 Gaming VERTO OC", 16, { lengthMm: 294, slotWidth: 2.5, cooling: "triple", psuWatts: 750, powerConnector: "12V-2x6" }),
  card("msi-5070ti-ventus", "gpu-rtx-5070-ti", "MSI", "VENTUS 2X OC", 16, { lengthMm: 242, slotWidth: 2, cooling: "dual", psuWatts: 650, powerConnector: "12V-2x6" }),
  card("zotac-5070-twin", "gpu-rtx-5070", "ZOTAC", "Twin Edge OC", 12, { lengthMm: 224, slotWidth: 2, cooling: "dual", psuWatts: 650, powerConnector: "8-pin" }),
  card("pny-5070-slim", "gpu-rtx-5070", "PNY", "Slim OC Dual-Fan", 12, { lengthMm: 290, slotWidth: 2, cooling: "dual", psuWatts: 650, powerConnector: "12V-2x6" }),
  card("asus-5060ti16-dual", "gpu-rtx-5060-ti-16", "ASUS", "Dual OC 16GB", 16, { lengthMm: 227, slotWidth: 2, cooling: "dual", psuWatts: 550, powerConnector: "8-pin" }),
  card("msi-5060ti8-ventus", "gpu-rtx-5060-ti-8", "MSI", "VENTUS 2X OC 8GB", 8, { lengthMm: 205, slotWidth: 2, cooling: "dual", psuWatts: 500, powerConnector: "8-pin" }),
  card("asus-5060-tuf", "gpu-rtx-5060", "ASUS", "TUF Gaming OC", 8, { lengthMm: 221, slotWidth: 2, cooling: "triple", psuWatts: 550, powerConnector: "8-pin" }),
  card("palit-5050-storm", "gpu-rtx-5050", "Palit", "StormX", 8, { lengthMm: 170, slotWidth: 2, cooling: "single", psuWatts: 450, powerConnector: "8-pin" }),
  card("pny-pro-5000", "gpu-rtx-pro-5000", "PNY", "RTX PRO 5000", 48, { lengthMm: 267, slotWidth: 2, cooling: "blower", psuWatts: 650, powerConnector: "12V-2x6" }),
  card("nvidia-pro-4000", "gpu-rtx-pro-4000", "NVIDIA", "RTX PRO 4000", 24, { lengthMm: 267, slotWidth: 2, cooling: "blower", psuWatts: 550, powerConnector: "12V-2x6" }),
  card("asus-4060-dual", "gpu-rtx-4060", "ASUS", "Dual OC", 8, { lengthMm: 202, slotWidth: 2, cooling: "dual", psuWatts: 450, powerConnector: "8-pin" }),
];

export const PLACEHOLDER_OBSERVATIONS: NormalizedObservationInput[] = [
  { cardSlug: "zotac-5070-twin", retailerSlug: "best-buy-ca", storeSlug: "bb-yonge", sku: "EX-BB-5070-ZT", productUrl: "https://example.invalid/bb/5070", priceCad: 829.99, inStock: true, observedAt: "2026-11-23T08:00:00.000Z" },
  { cardSlug: "zotac-5070-twin", retailerSlug: "best-buy-ca", storeSlug: "bb-yonge", sku: "EX-BB-5070-ZT", productUrl: "https://example.invalid/bb/5070", priceCad: 849.99, inStock: true, observedAt: "2026-11-10T18:00:00.000Z" },
  { cardSlug: "zotac-5070-twin", retailerSlug: "best-buy-ca", storeSlug: "bb-yonge", sku: "EX-BB-5070-ZT", productUrl: "https://example.invalid/bb/5070", priceCad: 839.99, inStock: false, observedAt: "2026-11-15T18:00:00.000Z" },
  { cardSlug: "pny-5070-slim", retailerSlug: "memory-express", storeSlug: "me-calgary", sku: "EX-ME-5070-SLIM", productUrl: "https://example.invalid/me/5070", priceCad: 870.0, inStock: true, observedAt: "2026-11-23T09:00:00.000Z" },
  { cardSlug: "pny-5070ti-xlr8", retailerSlug: "newegg-ca", sku: "EX-NE-5070TI", productUrl: "https://example.invalid/ne/5070ti", priceCad: 1440.0, inStock: true, observedAt: "2026-11-23T07:00:00.000Z" },
  { cardSlug: "pny-5070ti-xlr8", retailerSlug: "newegg-ca", sku: "EX-NE-5070TI", productUrl: "https://example.invalid/ne/5070ti", priceCad: 1461.0, inStock: true, observedAt: "2026-11-20T12:00:00.000Z" },
  { cardSlug: "msi-5080-ventus", retailerSlug: "canada-computers", storeSlug: "cc-markham", sku: "EX-CC-5080", productUrl: "https://example.invalid/cc/5080", priceCad: 2000.0, inStock: true, observedAt: "2026-11-22T15:00:00.000Z" },
  { cardSlug: "msi-5080-ventus", retailerSlug: "amazon-ca", sku: "EX-AMZ-5080", productUrl: "https://example.invalid/amz/5080", priceCad: 2348.0, inStock: true, observedAt: "2026-11-23T06:00:00.000Z" },
  { cardSlug: "nvidia-5090-fe", retailerSlug: "newegg-ca", sku: "EX-NE-5090", productUrl: "https://example.invalid/ne/5090", priceCad: 6450.0, inStock: true, observedAt: "2026-11-23T05:00:00.000Z" },
  { cardSlug: "asus-5090-tuf", retailerSlug: "ebay-ca", sku: "EX-EB-5090", productUrl: "https://example.invalid/ebay/5090", priceCad: 6500.0, inStock: true, observedAt: "2026-11-22T20:00:00.000Z" },
  { cardSlug: "asus-5060-tuf", retailerSlug: "memory-express", storeSlug: "me-edmonton", sku: "EX-ME-5060", productUrl: "https://example.invalid/me/5060", priceCad: 490.0, inStock: true, observedAt: "2026-11-23T04:00:00.000Z" },
  { cardSlug: "msi-5060ti8-ventus", retailerSlug: "walmart-ca", sku: "EX-WM-5060TI8", productUrl: "https://example.invalid/wm/5060ti", priceCad: 490.0, inStock: true, observedAt: "2026-11-21T14:00:00.000Z" },
  { cardSlug: "palit-5050-storm", retailerSlug: "staples-ca", sku: "EX-ST-5050", productUrl: "https://example.invalid/st/5050", priceCad: 390.0, inStock: true, observedAt: "2026-11-22T11:00:00.000Z" },
  { cardSlug: "msi-5070ti-ventus", retailerSlug: "canada-computers", storeSlug: "cc-vancouver", sku: "EX-CC-5070TI", productUrl: "https://example.invalid/cc/5070ti", priceCad: 1300.0, inStock: true, observedAt: "2026-11-23T03:00:00.000Z" },
  { cardSlug: "asus-4060-dual", retailerSlug: "visions", sku: "EX-VI-4060", productUrl: "https://example.invalid/vi/4060", priceCad: 400.0, inStock: true, observedAt: "2026-11-19T16:00:00.000Z" },
  { cardSlug: "pny-pro-5000", retailerSlug: "newegg-ca", sku: "EX-NE-PRO5K", productUrl: "https://example.invalid/ne/pro5000", priceCad: 7900.0, inStock: true, observedAt: "2026-11-18T10:00:00.000Z" },
  { cardSlug: "nvidia-pro-4000", retailerSlug: "memory-express", storeSlug: "me-calgary", sku: "EX-ME-PRO4K", productUrl: "https://example.invalid/me/pro4000", priceCad: 2200.0, inStock: true, observedAt: "2026-11-17T09:00:00.000Z" },
  { cardSlug: "asus-5060ti16-dual", retailerSlug: "canada-computers", storeSlug: "cc-markham", sku: "EX-CC-5060TI16-OB", productUrl: "https://example.invalid/cc/5060ti-ob", condition: "open_box", priceCad: 720.0, inStock: true, observedAt: "2026-11-22T18:00:00.000Z" },
  { cardSlug: "gigabyte-5080-windforce", retailerSlug: "best-buy-ca", storeSlug: "bb-vancouver", sku: "EX-BB-5080-OB", productUrl: "https://example.invalid/bb/5080-ob", condition: "open_box", priceCad: 1849.0, inStock: true, observedAt: "2026-11-21T13:00:00.000Z" },
];

export const PLACEHOLDER_CHANGE_EVENTS: NormalizedChangeEventInput[] = [
  { eventType: "price_drop", cardSlug: "pny-5070ti-xlr8", retailerSlug: "newegg-ca", offerSku: "EX-NE-5070TI", priceCad: 1440, previousPriceCad: 1461, occurredAt: "2026-11-23T07:00:00.000Z" },
  { eventType: "in_stock", cardSlug: "msi-5080-ventus", retailerSlug: "canada-computers", storeSlug: "cc-markham", priceCad: 2000, inStock: true, occurredAt: "2026-11-22T15:00:00.000Z" },
  { eventType: "in_stock", cardSlug: "asus-5060-tuf", retailerSlug: "memory-express", storeSlug: "me-edmonton", priceCad: 490, inStock: true, occurredAt: "2026-11-23T04:00:00.000Z" },
  { eventType: "sold_out", cardSlug: "pny-5070-slim", retailerSlug: "memory-express", storeSlug: "me-calgary", priceCad: 870, inStock: false, occurredAt: "2026-11-22T20:00:00.000Z" },
  { eventType: "sold_out", cardSlug: "asus-5090-tuf", retailerSlug: "ebay-ca", priceCad: 6500, inStock: false, occurredAt: "2026-11-22T19:00:00.000Z" },
  { eventType: "price_drop", cardSlug: "nvidia-pro-4000", retailerSlug: "memory-express", storeSlug: "me-calgary", priceCad: 2200, previousPriceCad: 3000, occurredAt: "2026-11-17T09:00:00.000Z" },
  { eventType: "in_stock", cardSlug: "msi-5070ti-ventus", retailerSlug: "canada-computers", storeSlug: "cc-vancouver", priceCad: 1300, inStock: true, occurredAt: "2026-11-23T03:00:00.000Z" },
];