-- Canada GPU Tracker — initial schema (Postgres / Supabase compatible)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Canonical NVIDIA GPU models
CREATE TABLE gpus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  model_name TEXT NOT NULL,
  series TEXT NOT NULL CHECK (series IN ('50-series', '40-series', '30-series', 'other')),
  chip TEXT NOT NULL,
  vram_gb INTEGER NOT NULL CHECK (vram_gb > 0),
  msrp_cad NUMERIC(10, 2) NOT NULL CHECK (msrp_cad >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gpus_series ON gpus (series);
CREATE INDEX idx_gpus_model_name ON gpus (model_name);

-- Canadian retailers (no scraper sources until ToS/API review)
CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'CA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retailers_name ON retailers (name);

-- A specific SKU / listing at a retailer for a GPU
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id UUID NOT NULL REFERENCES gpus (id) ON DELETE CASCADE,
  retailer_id UUID NOT NULL REFERENCES retailers (id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_url TEXT NOT NULL,
  brand TEXT NOT NULL,
  variant_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (retailer_id, sku)
);

CREATE INDEX idx_listings_gpu_id ON listings (gpu_id);
CREATE INDEX idx_listings_retailer_id ON listings (retailer_id);

-- Price & stock snapshots (history)
CREATE TABLE price_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  price_cad NUMERIC(10, 2) NOT NULL CHECK (price_cad >= 0),
  in_stock BOOLEAN NOT NULL DEFAULT false,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_observations_listing_observed
  ON price_observations (listing_id, observed_at DESC);

CREATE INDEX idx_price_observations_observed_at ON price_observations (observed_at DESC);

-- Convenience: latest observation per listing (materialized in app layer for static build)
CREATE OR REPLACE VIEW listing_latest_observation AS
SELECT DISTINCT ON (listing_id)
  listing_id,
  id AS observation_id,
  price_cad,
  in_stock,
  observed_at
FROM price_observations
ORDER BY listing_id, observed_at DESC;