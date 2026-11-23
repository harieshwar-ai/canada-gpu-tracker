# canada-gpu-tracker

Canada-first NVIDIA GPU price tracker (feature parity target: [rtx.live](https://rtx.live/), adapted for CAD, Canadian retailers, cities/provinces, and shelf stock).

**Cleared live ingesters** (PC-Canada, Mike's Computer Shop, Canada Computers) run when `INGEST_LIVE=1`; other retailers remain clearly flagged placeholder rows.

## Quick start

```bash
npm install
npm run build
npm run preview --workspace=web
```

## Schema

- `db/migrations/001_init.sql` — core tables
- `db/migrations/002_extended.sql` — stores, cards, conditions, change events, alerts, province taxes

TypeScript: `types/db.ts` · JSON store v2: `data/store.json` (built by `npm run ingest`).

## Ingestion

`Source` adapter → `ingester/run.ts` → `data/store.json`.

- `npm run ingest` — rebuild store from placeholder retailers + last committed live observations.
- `npm run ingest:live` — polite crawl of cleared retailers (`ingester/config/cleared-skus.json`), obeying robots.txt with `CanadaGPUTrackerBot/0.1`.
- `npm run ingest:dry-run` — live crawl capped at **2 SKUs per retailer** for verification.

Supabase path stays in `db/migrations/`; production can swap JSON store for Postgres without changing the web schema.

### Cleared retailers

| Retailer | Slug | Notes |
|----------|------|-------|
| PC-Canada | `pc-canada` | Product `/item/…` pages; Cloudflare may challenge datacenter IPs |
| Mike's Computer Shop | `mikes-computer-shop` | `Allow: /` in robots.txt |
| Canada Computers | `canada-computers` | **No outbound product links** in the UI — internal `/internal/cc/{sku}` only |

## Web

Static Astro site: home sections (hero stats, live changes, 50-series MSRP grid, cheapest per GPU, fresh finds tabs, alerts CTA, RTX PRO, FAQ), `/gpu/`, `/card/`, `/alerts/` with localStorage alert stub.