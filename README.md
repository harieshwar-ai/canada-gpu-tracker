# canada-gpu-tracker

Canada-first NVIDIA GPU price tracker: CAD prices, stock status, and price history across Canadian retailers (inspired by rtx.live).

**Current status:** placeholder data only — no retailer scraping, crawlers, or live feeds until sources pass ToS/robots review.

## Quick start (zero env vars)

```bash
npm install
npm run build    # runs placeholder ingester, then static Astro build
npm run preview  # serve web/dist
```

## Database schema

Migration: [`db/migrations/001_init.sql`](db/migrations/001_init.sql) (Postgres / Supabase compatible).

| Table | Purpose |
|-------|---------|
| `gpus` | Canonical models (slug, series, chip, VRAM, MSRP CAD) |
| `retailers` | Canadian retailers (name, site URL) |
| `listings` | SKU-level offer at a retailer (URL, AIB brand/variant) |
| `price_observations` | Historical snapshots: `price_cad`, `in_stock`, `observed_at` |

TypeScript mirrors: [`types/db.ts`](types/db.ts).

Indexes cover GPU series, listing foreign keys, and `(listing_id, observed_at DESC)` for latest/history queries.

## Data ingestion

Sources implement the `Source` adapter in [`ingester/source.ts`](ingester/source.ts):

1. `fetch()` → normalized observations (`gpuSlug`, `retailerSlug`, `sku`, price, stock, timestamp).
2. Runner [`ingester/run.ts`](ingester/run.ts) merges into [`data/store.json`](data/store.json) for the static site build.

Today only [`PlaceholderSource`](ingester/sources/placeholder.ts) is registered — fabricated example listings.

### Adding a new source

1. Add `ingester/sources/<name>.ts` implementing `Source`.
2. Register it in `ingester/run.ts` (or a future multi-source orchestrator).
3. Document the legal basis in the PR (official API, affiliate feed, written permission, etc.).

**Policy:** Only add sources explicitly cleared by retailer Terms of Service and robots.txt review. Prefer official APIs and partner feeds over HTML scraping. Do not ship scrapers in this repo until compliance is documented.

## Frontend

Static [Astro](https://astro.build/) app in `web/`:

- Home: GPU table, lowest CAD price, retailer, stock badges, client-side filters (series / in-stock).
- `/gpu/<slug>/`: listings + SVG price history chart.
- Visible **placeholder data** banner while using example data.

Build output: `web/dist/` (suitable for Vercel static hosting).

## CI

[`.github/workflows/build.yml`](.github/workflows/build.yml) runs `npm run build` on pull requests and pushes to `main`.