/**
 * Build-time data: `npm run sync:store` pulls from Supabase (anon RLS read).
 * Falls back to `data/store.fallback.json` when the project is empty/unreachable.
 * Runtime browser reads use the baked snapshot in `store.ts` for static Astro pages.
 */
export { getStore, getSiteStats } from "./store";
export { SUPABASE_URL, SUPABASE_FUNCTION_BASE } from "./supabase/env";