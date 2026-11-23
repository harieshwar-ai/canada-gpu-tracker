# canada-gpu-tracker

Canada-first NVIDIA GPU price tracker (feature parity target: [rtx.live](https://rtx.live/), adapted for CAD, Canadian retailers, cities/provinces, and shelf stock).

**Placeholder data only** until retailer sources pass ToS / robots review. No scraping or live fetches in this repo.

**UX spec:** [`docs/rtx-live-spec.md`](docs/rtx-live-spec.md) — internal reference screenshots in [`docs/reference/rtx-live/`](docs/reference/rtx-live/) (not shipped to users).

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

`Source` adapter → `ingester/run.ts` → `data/store.json`. Only `PlaceholderSource` today. See README section in prior commits for adding cleared sources.

## Web

Static Astro site: home sections (hero stats, live changes, 50-series MSRP grid, cheapest per GPU, fresh finds tabs, alerts CTA, RTX PRO, FAQ), `/gpu/`, `/card/`, `/alerts/` with localStorage alert stub.