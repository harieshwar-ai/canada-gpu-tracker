# canada-gpu-tracker

Canada-first NVIDIA GPU price tracker (feature parity target: [rtx.live](https://rtx.live/), adapted for CAD, Canadian retailers, cities/provinces, and shelf stock).

**Placeholder data only** until retailer sources pass ToS / robots review. No scraping or live fetches in this repo.

**UX spec:** [`docs/rtx-live-spec.md`](docs/rtx-live-spec.md) (numbered checklists per section) · **Phase 2 status:** [`docs/rtx-live-spec-impl-status.md`](docs/rtx-live-spec-impl-status.md) · **rtx vs ours screenshots:** [`docs/compare/`](docs/compare/) · internal rtx reference: [`docs/reference/rtx-live/`](docs/reference/rtx-live/).

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

Static Astro site aligned to the spec: `/`, `/gpus/*`, `/cards/*`, deals/discovery routes, stores, preferences, `/alerts/` localStorage stub. Legacy `/gpu/*` and `/card/*` redirect to new paths.