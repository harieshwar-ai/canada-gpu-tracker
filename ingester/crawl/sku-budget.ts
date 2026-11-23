import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_SKU_FETCHES_PER_DAY } from "./constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, "..", "..", "data", "ingest-state.json");

export interface SkuFetchState {
  byKey: Record<string, { day: string; count: number }>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadSkuFetchState(): Promise<SkuFetchState> {
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    return JSON.parse(raw) as SkuFetchState;
  } catch {
    return { byKey: {} };
  }
}

export async function saveSkuFetchState(state: SkuFetchState): Promise<void> {
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n", "utf8");
}

export function canFetchSku(
  state: SkuFetchState,
  key: string
): boolean {
  const day = todayKey();
  const entry = state.byKey[key];
  if (!entry || entry.day !== day) return true;
  return entry.count < MAX_SKU_FETCHES_PER_DAY;
}

export function recordSkuFetch(state: SkuFetchState, key: string): void {
  const day = todayKey();
  const entry = state.byKey[key];
  if (!entry || entry.day !== day) {
    state.byKey[key] = { day, count: 1 };
  } else {
    entry.count += 1;
  }
}