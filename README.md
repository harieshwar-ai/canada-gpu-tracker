# canada-gpu-tracker

Canada-first NVIDIA GPU price tracker (feature parity target: [rtx.live](https://rtx.live/), adapted for CAD, Canadian retailers, cities/provinces, and shelf stock).

**Source of truth:** Supabase Postgres (`blfiydxlbfuusmcwbgvu`, `ca-central-1`). The static site snapshots public RLS reads at build time; uncleared retailers stay placeholder rows until policies allow live ingesters.

## Quick start

```bash
npm install
npm run build          # syncs from Supabase → data/store.json (or fallback)
npm run preview --workspace=web
```

Publishable client (safe in frontend): `sb_publishable_1KDjNKQmpzdgIJ9C_IZjoQ_QtJAS66`  
Project URL: `https://blfiydxlbfuusmcwbgvu.supabase.co`

## Deploy (coordinator bot — apply in order)

### 1. Migrations (`supabase/migrations/`)

| Order | File | Purpose |
|------:|------|---------|
| 1 | `20260123100000_extensions.sql` | `pgcrypto`, `pg_cron`, `pg_net`, `supabase_vault` |
| 2 | `20260123100001_schema.sql` | Tables, views (`v_offers_enriched`, latest price) |
| 3 | `20260123100002_rls.sql` | Public read-only + `create_price_alert` RPC |
| 4 | `20260123100003_seed.sql` | GPU/card catalog, retailers (`is_cleared`), placeholder offers |
| 5 | `20260123100004_vault_cron.sql` | Vault ingest secret + cron → `ingest` function |

After migration 5: read vault secret `ingest_cron_secret` and set Edge Function env **`INGEST_CRON_SECRET`** to the same value (not stored in git).

### 2. Edge Functions

| Function | Path | Auth |
|----------|------|------|
| `ingest` | `supabase/functions/ingest/index.ts` | Header `x-ingest-secret` = `INGEST_CRON_SECRET`; service role inside |
| `create-price-alert` | `supabase/functions/create-price-alert/index.ts` | Public + anon key; calls `create_price_alert` RPC |

Deploy both with JWT verification disabled for `ingest` cron calls (secret header only), or verify per your security model.

### 3. Local / CI verify

```bash
npm test
npm run check:functions    # deno check edge functions
npm run sync:store         # tries Supabase; falls back to data/store.fallback.json
npm run build
```

Legacy Node ingester (`ingester/`) remains for parser unit tests; production ingest runs in Supabase Edge.

## Cleared retailers

| Retailer | Slug | Ingest |
|----------|------|--------|
| PC-Canada | `pc-canada` | Polite crawl; often Cloudflare-challenged from datacenters |
| Mike's Computer Shop | `mikes-computer-shop` | Polite crawl |
| Canada Computers | `canada-computers` | Crawl + store stock; **UI links stay internal** (`/internal/cc/{sku}`) |

Uncleared retailers (Best Buy, Newegg, etc.) are **seed placeholder listings** only.

## Web data layer

- `scripts/sync-store-from-supabase.ts` — build-time snapshot via `@supabase/supabase-js` (anon RLS).
- `web/src/lib/store.ts` — same `TrackerStore` shape as before (minimal UI churn).
- `web/src/lib/supabase/env.ts` — URL + publishable key defaults.

## Schema reference

Historical SQL: `db/migrations/001_init.sql`, `002_extended.sql`  
TypeScript: `types/db.ts`  
Canonical deploy: `supabase/migrations/*`