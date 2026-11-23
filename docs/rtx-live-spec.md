# rtx.live UX specification (reference for Canada GPU Tracker)

> **Purpose:** Phase-1 reference derived from a Playwright walkthrough of https://rtx.live (Nov 2026).  
> **Usage:** Canada GPU Tracker implementation must match layout, IA, interactions, and density **without** copying branding, assets, or verbatim copy.  
> **Implementation status:** Checkboxes updated in Phase 2 (`[ ]` = not done, `[x]` = done, `[~]` = stubbed + reason).

**Screenshot index:** `docs/reference/rtx-live/` (see [README](./reference/rtx-live/README.md)).

---

## 0. Global visual tokens (observed)

| Token | rtx.live (approx.) | Canada translation notes |
|-------|-------------------|---------------------------|
| Default theme | **Dark** UI; header offers “Switch to light theme” | Default dark; optional light toggle |
| Page background | Near-black `#060808`–`#0c1016` | Same treatment |
| Surfaces / cards | `#111`–`#1a1f26`, 1px subtle border | Same |
| Primary accent | NVIDIA lime / yellow-green for CTAs, live state | Canada GPU Tracker green (`#9cf525` / `#76b900`) |
| Body text | Light gray-white ~15px | IBM Plex Sans or system UI, 15px |
| Muted text | Mid gray for meta, chips | Same hierarchy |
| Monospace specs | Tabular specs (`342mm · 3.5s · 16-pin`) | Same pattern with CAD |
| Radius | ~8–12px cards, pill tabs | Match |
| Max content width | ~1280px centered | Match |
| Density | Tight vertical rhythm; stat figures large | Match |
| Icons | Icon font glyphs (stock/drop/out) in live feed | Use CSS badges, not their font |

**Responsive breakpoints (observed):**

- **Desktop:** ≥1024px — full top search, horizontal main nav, two-column hero (copy left / live changes right).
- **Tablet:** nav scrolls horizontally; grids reflow 2–3 columns.
- **Mobile ~390px:** compact header; search may collapse; hamburger for overflow nav (see `mobile-header-mobile-390.png`).

---

## 1. Global chrome (all pages)

| # | Component | Layout / fields | Interactions & state | URL | Screenshot(s) | Canada translation | Impl |
|---|-----------|-----------------|----------------------|-----|---------------|-------------------|------|
| 1.1 | **Skip link** | Visually hidden → `#main` | Focus reveals link | — | home-* | Same | [ ] |
| 1.2 | **Top bar** | Logo, “Other trackers” menu, YouTube Live link, **Search** (`/` shortcut), Preferences, **Location (ZIP)**, theme toggle, Sign in / Create account | Search typing filters/navigates to cards; location modal sets ZIP; theme toggles light/dark | `/preferences`, `/auth/*` | `home-desktop-1440.png`, `home-theme-light-desktop-1440.png` | Logo **Canada GPU Tracker**; Live link optional stub; **Postal code** not ZIP; Preferences → `/preferences`; no account required for browse | [ ] |
| 1.3 | **Main nav** | GPUs ▾, Brands ▾, All cards, In stock now, Build a PC (external), Deals, Finder, Compare, Stores; trailing meta “Live prices · N stores · N retailers” | GPU/Brand buttons open **dropdown panels** (grid of links); links navigate | See §4–§12 | `nav-gpu-dropdown-desktop-1440.png`, `nav-brand-dropdown-desktop-1440.png` | Replace MC/BB/CC with **Canada Computers, Memory Express, Best Buy CA**; drop rigs.live or link stub; same nav labels | [ ] |
| 1.4 | **Mobile nav** | Hamburger / condensed header | Opens drawer or stacked nav | — | `mobile-header-mobile-390.png` | Same pattern | [ ] |
| 1.5 | **Footer** | “Follow the finds” (Telegram, YouTube, Discord), site stats, multi-column links (Shop, GPUs, Resources), legal | All links outbound or internal | `/price-drops`, `/open-box`, `/near`, etc. | home full-page | Contact **harieshwar.dev@gmail.com**; Canadian social TBD; footer links to our routes | [ ] |
| 1.6 | **Breadcrumbs** | Home → section → entity | On GPU, card, preferences, store pages | — | `gpu-5070-desktop-1440.png`, `preferences-desktop-1440.png` | Home → GPUs → series → model | [ ] |

---

## 2. Home (`/`)

| # | Section | Layout / data fields | Interactions | URL / query | Screenshot(s) | Canada translation | Impl |
|---|---------|----------------------|--------------|-------------|---------------|-------------------|------|
| 2.1 | **Hero (left)** | “Live · updated {time}”; H1 “NVIDIA RTX prices & in-store stock.”; lead paragraph listing retailers; CTAs: In stock now, Browse all cards, Build a PC | CTAs link to `/cards?avail=stock`, `/cards`, external | `/` | `home-desktop-1440.png` | CAD / Canadian retailers in lead; CTAs unchanged | [ ] |
| 2.2 | **Hero stats** | 4 counters: cards tracked, stores, offers in stock, retailers | Static numbers (hydrate from API) | — | same | Same fields from placeholder store | [ ] |
| 2.3 | **Live changes (right panel)** | H2 + optional YouTube link; list rows: icon (drop / in stock / sold out), card title, meta (delta or status · retailer logo · city · time ago), right-aligned price | Each row links to **card page** | — | same | Cities **Canadian**; prices **CAD**; retailer names | [ ] |
| 2.4 | **Retailer strip** | Pills/logos per retailer (MC, BB, …) | Links to `/cards?sold_at={retailer}` | `?sold_at=` | same | CC, ME, BB, Newegg.ca, Amazon.ca, etc. | [ ] |
| 2.5 | **GeForce 50 vs launch** | Section head + “All GPUs”; grid of GPU tiles: name, VRAM · MSRP, store count badge, lowest price, **% vs MSRP**, **MSRP meter bar** (0–2.5×), “N/M cards in stock” | Tile → `/gpus/{slug}` | `/gpus` | same | **Launch MSRP CAD** (NVIDIA CA); meter uses CAD | [ ] |
| 2.6 | **Cheapest in stock, per GPU** | Section + “See all”; **ZIP prompt row** (icon, copy, input, Set); feed of **offer cards**: eyebrow (GPU · variant line), card name, spec line, price + retailer, % vs MSRP, **retailer price chips**, optional sparkline | ZIP submit sets location preference; chips link or informational | `/cards?avail=stock` | same | **Postal code + km**; chips show Canadian retailers | [ ] |
| 2.7 | **Fresh finds** | H2; **tabs:** This week, All price drops, Open box, In stock by city; list items with was/now, %; **brand count grid** below | Tab switches list (client or route) | — | `home-tab-*-desktop-1440.png` | Same tabs; cities Canadian | [ ] |
| 2.8 | **Alerts CTA** | H2 “Get pinged…”; copy; button → signup | Links `/auth/signup` (real site) | — | home | Our `/alerts/` stub (no signup gate) | [ ] |
| 2.9 | **FAQ** | H2 “Questions buyers ask”; **accordion groups** (disclosure); chevron rotates | Click expands one answer | — | `home-faq-expanded-desktop-1440.png` | Canadian copy (MSRP CAD, stores, km) | [ ] |

---

## 3. GPUs index (`/gpus`)

| # | Content | Notes | Screenshot | Canada | Impl |
|---|---------|-------|------------|--------|------|
| 3.1 | List/grid of all GPU families | Links to `/gpus/{slug}` | `gpus-index-desktop-1440.png` | Include 40-series, RTX PRO | [ ] |
| 3.2 | Series hub | e.g. `/gpus/series/geforce-50` | `series-50-desktop-1440.png` | GeForce 50 + 40 series pages | [ ] |

---

## 4. GPU detail (`/gpus/geforce-rtx-5070`)

| # | Section | Fields | Interactions | Query params | Screenshot | Canada | Impl |
|---|---------|--------|--------------|--------------|------------|--------|------|
| 4.1 | **Header** | Series · arch; H1 “{GPU} price & stock”; chip specs (VRAM, bus, CUDA, boost, TDP, launch date) | — | — | `gpu-5070-desktop-1440.png` | CAD MSRP block | [ ] |
| 4.2 | **Summary stats** | MSRP, Lowest, In stock fraction, Store count | — | — | same | CAD | [ ] |
| 4.3 | **Product line chips** | Sub-variant links (?line=zotac-solid) with count + price | Filters card list on page | `?line=` | same | Placeholder lines | [ ] |
| 4.4 | **Filters sidebar** | Form “Filters”: Sold at, Brand, Product line, Form factor, Length/Height/Slots comboboxes, Fans, PSU, HDMI, Color, RGB, Refurbished, Warranty; collapsible sections | Multi-select chips; **Sort** combobox | Many `?` params | same | Retailers = CA; km radius if location set | [ ] |
| 4.5 | **Card table** | Columns: Card (image+name), VRAM, Length, Price (sortable), Stock, Sparkline/history, Compare checkbox | Header clicks set `?sort=` | `?sort=name|mem|len|-price|…` | same | **% vs MSRP**, **$/GB** sort (improvement) | [ ] |
| 4.6 | **Availability map / store list** | (if present below fold) | — | — | scroll in screenshot | Canadian cities | [ ] |

---

## 5. Card detail (`/cards/{slug}`)

| # | Section | Fields | Interactions | Screenshot | Canada | Impl |
|---|---------|--------|--------------|------------|--------|------|
| 5.1 | **Hero** | Brand image, GPU eyebrow, card name, spec pills | — | `card-5070-ventus-desktop-1440.png`, `card-detail-viewport-desktop-1440.png` | Same | [ ] |
| 5.2 | **Best price now** | Price, retailer, condition, “checked X ago”, vs historical low | Links to offer | same | CAD + HST hint | [ ] |
| 5.3 | **Alert card** | Explains email alert; “Set a price alert” → signup with `next=` prefilled | Stops before account creation in our build | same | `/alerts/?card=` stub | [ ] |
| 5.4 | **Offers table** | Store/retailer, location, condition, price, stock, link out | Row expand? | same | Store city, province | [ ] |
| 5.5 | **Price history** | Heading “Lowest in-stock price by retailer”; **multi-series chart** (image/ canvas); legend; time range | Hover tooltips on chart (desktop) | same | CAD axis labels | [ ] |
| 5.6 | **Same-series cards** | Cross-links to sibling GPUs | — | same | — | [ ] |
| 5.7 | **Specs table** | Length, slots, power, outputs, etc. | — | same | mm, watts, connector | [ ] |
| 5.8 | **Related builds / PSU** | rigs.live / psu.live links | External | same | Optional stub | [ ] |

---

## 6. All cards (`/cards`)

| # | Feature | Details | Query params | Screenshot | Canada | Impl |
|---|---------|---------|--------------|------------|--------|------|
| 6.1 | Page title + count | “N cards” | — | `cards-all-desktop-1440.png` | — | [ ] |
| 6.2 | Filter panel | Same family as GPU page filters + **Availability** | `?avail=stock` etc. | `cards-in-stock-desktop-1440.png` | — | [ ] |
| 6.3 | Sort combobox | Most popular, Newest, Lowest/Highest price, Closest to MSRP, Most stores in stock, Top rated, Shortest, Most memory, Highest boost, Name | `?sort=` | cards-all | Add **Best $/GB VRAM** | [ ] |
| 6.4 | Results table | Thumbnail, name, specs, price, stock badge, **inline sparkline** | Row → card page | — | CAD | [ ] |
| 6.5 | Empty state | No cards match filters | — | (derive) | Copy + clear filters CTA | [ ] |

---

## 7. Deals & discovery routes

| Route | Purpose | Screenshot | Canada | Impl |
|-------|---------|------------|--------|------|
| `/deals` | Curated deals feed | `deals-desktop-1440.png` | CAD drops | [ ] |
| `/price-drops` | Weekly drops (footer link) | `price-drops-desktop-1440.png` | Same | [ ] |
| `/open-box` | Open-box inventory | `open-box-desktop-1440.png` | In-store open box at CC/ME/BB | [ ] |
| `/near` | In stock by city | `near-city-desktop-1440.png` | Canadian metros | [ ] |
| `/finder` | Wizard: case fit / PSU | `finder-desktop-1440.png` | mm, wattage, connector | [ ] |
| `/compare` | Side-by-side cards | `compare-desktop-1440.png` | CAD columns | [ ] |

---

## 8. Stores (`/stores`, `/stores/{retailer}/{city}`)

| # | Page | Content | Screenshot | Canada | Impl |
|---|------|---------|------------|--------|------|
| 8.1 | Index | Retailer groups, store counts, map links | `stores-desktop-1440.png` | BB, CC, ME, Visions | [ ] |
| 8.2 | Store detail | Store name, address, shelf stock list, “Make this my store” | `store-detail-desktop-1440.png` | Province + postal | [ ] |

---

## 9. Brands (`/brands/{brand}`)

| # | Content | Screenshot | Canada | Impl |
|---|---------|------------|--------|------|
| 9.1 | Brand hero + card grid filtered to brand | `brand-msi-desktop-1440.png` | Same AIB brands | [ ] |

---

## 10. Preferences / location (`/preferences`)

| # | Section | Controls | Persists | Screenshot | Canada | Impl |
|---|---------|----------|----------|------------|--------|------|
| 10.1 | Where you buy | Radio: stores+online / near me / online only | Session/account | `preferences-desktop-1440.png` | km not miles | [ ] |
| 10.2 | Location | Postal + Within combobox (10–200 mi) | — | same | **10–200 km** | [ ] |
| 10.3 | My stores | Up to 3 pinned stores | — | same | CC/ME/BB stores | [ ] |
| 10.4 | Condition | Checkboxes: New, Open box, Refurbished, Used | Affects “lowest price” | same | Same | [ ] |
| 10.5 | Retailers | Only / Never per retailer | Filters all views | same | Canadian retailer list | [ ] |

---

## 11. Alerts flow (observe only — no real signup)

| Step | rtx.live behavior | Our stub | Screenshot | Impl |
|------|-------------------|----------|------------|------|
| 11.1 | Home CTA → `/auth/signup` | `/alerts/` form | `alerts-signup-desktop-1440.png` | [ ] |
| 11.2 | Card page “Set a price alert” → `/auth/signup?next=/me/alerts/new?card=ID` | Prefill card scope | card detail | [ ] |
| 11.3 | After auth (not executed): alert form with target price, distance, channels | `stubCreateAlert` + localStorage | — | [~] no email |

---

## 12. Search

| # | Behavior | Screenshot | Canada | Impl |
|---|----------|------------|--------|------|
| 12.1 | Header searchbox; type query → card/GPU results overlay or navigates to `/cards?q=` | `search-5070ti-results-desktop-1440.png` | Search Canadian catalog | [ ] |
| 12.2 | Keyboard `/` focuses search | — | Same | [ ] |

---

## 13. Live changes feed (component)

| State | Icon / color | Row content | Tooltip |
|-------|--------------|-------------|---------|
| Price drop | Down arrow, green | −$N · retailer · time | — |
| In stock | Check / green | In stock · retailer · **city** · time | Retailer logo on hover |
| Sold out | X / red | Sold out · … | — |

**Impl:** [ ]

---

## 14. MSRP meter (GPU grid tile)

Horizontal bar showing lowest in-stock price as fraction of launch MSRP (scale ~0–2.5×). Label `+N%` or `−N%` vs MSRP.

**Impl:** [ ]

---

## 15. Sparkline (cards table & offer cards)

Small inline SVG ~120×28px showing 7–30 day price trend per offer/card; links to full chart on card page.

**Impl:** [ ]

---

## 16. Price history chart (card page)

Multi-retailer lines; axes; legend; responsive resize. Hover shows dated price (desktop).

**Impl:** [ ]

---

## 17. Theme toggle

Default dark; toggle switches to light palette (observed inverted backgrounds). Preference stored locally.

**Impl:** [ ]

---

## 18. Error / empty states

| Case | UX | Screenshot | Impl |
|------|-----|------------|------|
| Unknown card slug | 404 “Page not found” + home link | `error-not-found-desktop-1440.png` | [ ] |
| Filters yield 0 | Empty results message | — | [ ] |

---

## 19. URL & query parameter reference (observed)

| Param | Used on | Meaning |
|-------|---------|---------|
| `avail=stock` | `/cards` | In-stock only |
| `sold_at={retailer}` | `/cards` | Retailer filter |
| `sort={field}` | `/cards`, GPU tables | Sort column/key (`-price` desc) |
| `line={variant}` | GPU detail | Product line filter |
| `next=` | `/auth/*`, preferences | Return URL |
| `q=` | search (inferred) | Search query |

**Canada additions (improvements):** `province=ON`, `tax=inc|ex`, `sort=price_per_gb`, `sort=msrp_pct`.

---

## 20. Data layer compatibility (Canada GPU Tracker)

| rtx.live concept | Our `data/store.json` v2 field | Breaking? |
|------------------|-------------------------------|-----------|
| Card | `cards[]` | No |
| Offer/listing | `offers[]` | No |
| GPU | `gpus[]` | No |
| Store | `stores[]` | No |
| Change event | `changeEvents[]` | No |
| Price history | `priceObservations[]` | No |
| User prefs / alerts | Not in JSON (stub localStorage / future API) | No |

**Source interface:** Keep `ingester/source.ts` `NormalizedObservationInput` stable for stacked ingester PR.

---

## 21. Improvements beyond rtx.live (product)

1. **Explicit CAD** everywhere + **provincial tax hint** on card/offer rows (GST/HST/QST).
2. **Per-province filter** on `/near` and store pages.
3. **Sort: best value per GB VRAM** and **% vs MSRP** on `/cards`.
4. **Sparkline on every card row** (home cheapest feed + `/cards` table).
5. **RTX 40-series + RTX PRO** in same nav/GPU dropdowns (data slots even when placeholder sparse).
6. **Bilingual-ready** labels (en-CA default).
7. **Placeholder banner** always visible until live sources ship (rtx.live has no equivalent).

---

## 22. Implementation manifest (Phase 2)

Update each line when building:

```
Global chrome .............. 1.1–1.6
Home ....................... 2.1–2.9
GPUs index/series .......... 3.1–3.2
GPU detail ................. 4.1–4.6
Card detail ................ 5.1–5.8
All cards .................. 6.1–6.5
Deals routes ............... §7
Stores ..................... §8
Brands ..................... §9
Preferences ................ §10
Alerts stub ................ §11
Search ..................... §12
Components ................. §13–§17
Errors ..................... §18
```

---

## 23. Capture log (reference screenshots)

| File | Description |
|------|-------------|
| `home-desktop-1440.png` | Home desktop |
| `home-mobile-390.png` | Home mobile |
| `home-theme-light-desktop-1440.png` | Light theme |
| `home-tab-*-desktop-1440.png` | Fresh find tabs |
| `home-faq-expanded-desktop-1440.png` | FAQ open |
| `search-5070ti-results-desktop-1440.png` | Search |
| `nav-gpu-dropdown-desktop-1440.png` | GPUs menu |
| `nav-brand-dropdown-desktop-1440.png` | Brands menu |
| `gpu-5070-desktop-1440.png` | GPU page |
| `card-5070-ventus-desktop-1440.png` | Card page full |
| `cards-all-desktop-1440.png` | All cards |
| `deals-desktop-1440.png` | Deals |
| `open-box-desktop-1440.png` | Open box |
| `near-city-desktop-1440.png` | Near/city |
| `stores-desktop-1440.png` | Stores index |
| `store-detail-desktop-1440.png` | Store detail |
| `preferences-desktop-1440.png` | Preferences |
| `alerts-signup-desktop-1440.png` | Signup entry |
| `error-not-found-desktop-1440.png` | 404 |
| `*-mobile-390.png` | Mobile variants for key routes |

*(Mobile pairs exist for most routes in `docs/reference/rtx-live/`.)*