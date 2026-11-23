-- Canada GPU Tracker — stores, cards, conditions, events, alerts

ALTER TABLE gpus
  ADD COLUMN IF NOT EXISTS product_line TEXT NOT NULL DEFAULT 'geforce'
    CHECK (product_line IN ('geforce', 'rtx_pro', 'other')),
  ADD COLUMN IF NOT EXISTS launch_msrp_cad NUMERIC(10, 2);

UPDATE gpus SET launch_msrp_cad = msrp_cad WHERE launch_msrp_cad IS NULL;

ALTER TABLE gpus
  ALTER COLUMN launch_msrp_cad SET NOT NULL;

CREATE TABLE IF NOT EXISTS stores (
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

CREATE INDEX IF NOT EXISTS idx_stores_retailer ON stores (retailer_id);
CREATE INDEX IF NOT EXISTS idx_stores_city_province ON stores (city, province_code);

CREATE TABLE IF NOT EXISTS cards (
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

CREATE INDEX IF NOT EXISTS idx_cards_gpu ON cards (gpu_id);
CREATE INDEX IF NOT EXISTS idx_cards_specs ON cards (length_mm, cooling, power_connector);

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES cards (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'new'
    CHECK (condition IN ('new', 'open_box', 'refurb'));

CREATE INDEX IF NOT EXISTS idx_listings_card ON listings (card_id);
CREATE INDEX IF NOT EXISTS idx_listings_store ON listings (store_id);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings (condition);

CREATE TABLE IF NOT EXISTS change_events (
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

CREATE INDEX IF NOT EXISTS idx_change_events_occurred ON change_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_events_type ON change_events (event_type);

CREATE TABLE IF NOT EXISTS price_alerts (
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

CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts (active) WHERE active;

CREATE TABLE IF NOT EXISTS province_taxes (
  province_code CHAR(2) PRIMARY KEY,
  province_name TEXT NOT NULL,
  tax_label TEXT NOT NULL,
  tax_rate NUMERIC(5, 4) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 1)
);