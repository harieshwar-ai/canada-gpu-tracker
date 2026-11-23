# Phase 2 implementation status (vs rtx-live-spec.md)

Spec: [`rtx-live-spec.md`](./rtx-live-spec.md) · Reference shots: `reference/rtx-live/` · Side-by-side: `compare/`

| Area | Status | Notes |
|------|--------|-------|
| Global chrome 1.1–1.6 | [x] | Dark theme, search `/`, nav dropdowns, footer; mobile drawer [~] |
| Home 2.1–2.9 | [x] | Hero split, live feed, MSRP grid + meter, fresh tabs, FAQ `<details>` |
| GPUs / series | [x] | `/gpus/`, `/gpus/geforce-rtx-*` |
| GPU detail | [x] | Stats row, sortable table, sparklines, $/GB + % MSRP |
| Card detail | [x] | Offers, tax hint, chart, alert stub link |
| All cards | [x] | `/cards/` filters + sorts incl. $/GB |
| Deals / drops / open box / near | [x] | Dedicated routes |
| Stores | [x] | Index + `/stores/{slug}` |
| Brands | [x] | `/brands/{brand}` |
| Finder / compare | [~] | Functional stub, not full rtx wizard |
| Preferences | [x] | localStorage stub, km + postal |
| Alerts | [~] | `/alerts/` stub, no auth signup |
| Search | [x] | GET `/cards/?q=` |
| Theme toggle | [x] | localStorage |
| 404 | [x] | `/404.html` |
| Data / ingester | [x] | `TrackerStore` v2 unchanged |