export const USER_AGENT =
  "CanadaGPUTrackerBot/0.1 (+https://github.com/harieshwar-ai/canada-gpu-tracker)";

/** Minimum delay between requests to the same host (ms). */
export const MIN_HOST_INTERVAL_MS = 7_000;

/** Per-SKU daily fetch cap (curated list; polite crawl budget). */
export const MAX_SKU_FETCHES_PER_DAY = 4;