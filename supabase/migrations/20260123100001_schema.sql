-- Core catalog and pricing schema (aligned with types/db.ts + db/migrations)

CREATE TABLE gpus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  model_name TEXT NOT NULL,
  series TEXT NOT NULL CHECK (series IN ('50-series', '40-series', '30-series', 'other')),
  product_line TEXT NOT NULL DEFAULT 'geforce'
    CHECK (product_line IN ('geforce', 'rtx_pro', 'other')),
  chip TEXT NOT NULL,
  vram_gb INTEGER NOT NULL CHECK (vram_gb > 0),
  msrp_cad NUMERIC(10, 2) NOT NULL CHECK (msrp_cad >= 0),
  launch_msrp_cad NUMERIC(10, 2) NOT NULL CHECK (launch_msrp_cad >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gpus_series ON gpus (series);
CREATE INDEX idx_gpus_product_line ON gpus (product_line);

CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'CA',
  has_physical_stores BOOLEAN NOT NULL DEFAULT false,
  is_cleared BOOLEAN NOT NULL DEFAULT false,
  is_placeholder BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID NOT NULL REFERENCES retailers (id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  province_code CHAR(2) NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'CA',
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_retailer ON stores (retailer_id);
CREATE INDEX idx_stores_city_province ON stores (city, province_code);

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model_name TEXT NOT NULL,
  vram_gb INTEGER NOT NULL CHECK (vram_gb > 0),
  length_mm INTEGER,
  slot_width NUMERIC(3, 1),
  cooling TEXT,
  psu_watts INTEGER,
  power_connector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_gpu ON cards (gpu_id);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards (id) ON DELETE SET NULL,
  retailer_id UUID NOT NULL REFERENCES retailers (id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores (id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  product_url TEXT NOT NULL,
  brand TEXT NOT NULL,
  variant_label TEXT,
  condition TEXT NOT NULL DEFAULT 'new'
    CHECK (condition IN ('new', 'open_box', 'refurb')),
  is_placeholder BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (retailer_id, store_id, sku, condition)
);

CREATE UNIQUE INDEX listings_online_sku_unique
  ON listings (retailer_id, sku, condition)
  WHERE store_id IS NULL;

CREATE INDEX idx_listings_gpu ON listings (gpu_id);
CREATE INDEX idx_listings_card ON listings (card_id);
CREATE INDEX idx_listings_retailer ON listings (retailer_id);
CREATE INDEX idx_listings_placeholder ON listings (is_placeholder);

CREATE TABLE price_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  price_cad NUMERIC(10, 2) NOT NULL CHECK (price_cad >= 0),
  in_stock BOOLEAN NOT NULL DEFAULT false,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_obs_listing_time
  ON price_observations (listing_id, observed_at DESC);

CREATE TABLE change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('price_drop', 'in_stock', 'sold_out')),
  listing_id UUID REFERENCES listings (id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards (id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores (id) ON DELETE SET NULL,
  price_cad NUMERIC(10, 2),
  previous_price_cad NUMERIC(10, 2),
  in_stock BOOLEAN,
  city TEXT,
  province_code CHAR(2),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_change_events_occurred ON change_events (occurred_at DESC);

CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_scope TEXT NOT NULL CHECK (alert_scope IN ('card', 'gpu', 'product_line')),
  card_id UUID REFERENCES cards (id) ON DELETE CASCADE,
  gpu_id UUID REFERENCES gpus (id) ON DELETE CASCADE,
  product_line TEXT,
  target_price_cad NUMERIC(10, 2) NOT NULL,
  max_distance_km NUMERIC(8, 2),
  postal_code TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  contact_email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_alerts_active ON price_alerts (active) WHERE active;

CREATE TABLE province_taxes (
  province_code CHAR(2) PRIMARY KEY,
  province_name TEXT NOT NULL,
  tax_label TEXT NOT NULL,
  tax_rate NUMERIC(5, 4) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 1)
);

-- Ingest bookkeeping (service role only; no public RLS)
CREATE TABLE ingest_sku_budget (
  sku_key TEXT NOT NULL,
  day DATE NOT NULL,
  fetch_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (sku_key, day)
);

CREATE TABLE ingest_run_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_slug TEXT NOT NULL,
  fetched INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  challenged BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE VIEW listing_latest_observation AS
SELECT DISTINCT ON (listing_id)
  listing_id,
  id AS observation_id,
  price_cad,
  in_stock,
  observed_at
FROM price_observations
ORDER BY listing_id, observed_at DESC;

CREATE VIEW v_offers_enriched AS
SELECT
  l.id AS listing_id,
  l.sku,
  l.product_url,
  l.condition,
  l.is_placeholder,
  l.brand,
  l.variant_label,
  l.gpu_id,
  l.card_id,
  l.retailer_id,
  l.store_id,
  g.slug AS gpu_slug,
  g.model_name AS gpu_model_name,
  g.series,
  g.product_line,
  g.launch_msrp_cad,
  c.slug AS card_slug,
  c.model_name AS card_model_name,
  r.slug AS retailer_slug,
  r.name AS retailer_name,
  r.is_cleared,
  s.slug AS store_slug,
  s.city,
  s.province_code,
  lo.price_cad,
  lo.in_stock,
  lo.observed_at
FROM listings l
JOIN gpus g ON g.id = l.gpu_id
LEFT JOIN cards c ON c.id = l.card_id
JOIN retailers r ON r.id = l.retailer_id
LEFT JOIN stores s ON s.id = l.store_id
LEFT JOIN listing_latest_observation lo ON lo.listing_id = l.id;