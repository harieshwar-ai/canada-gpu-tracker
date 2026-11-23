-- Public read-only catalog; no direct writes from clients

ALTER TABLE gpus ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE province_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_sku_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY gpus_public_select ON gpus
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY retailers_public_select ON retailers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY stores_public_select ON stores
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY cards_public_select ON cards
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY listings_public_select ON listings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY price_obs_public_select ON price_observations
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY change_events_public_select ON change_events
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY province_taxes_public_select ON province_taxes
  FOR SELECT TO anon, authenticated USING (true);

-- price_alerts: no public insert/update/delete (edge function only)

-- Ingest tables: service role only (no anon policies)

CREATE OR REPLACE FUNCTION rpc_site_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT json_build_object(
    'cards_tracked', (SELECT COUNT(*) FROM cards),
    'stores', (SELECT COUNT(*) FROM stores),
    'retailers', (SELECT COUNT(*) FROM retailers),
    'offers_in_stock', (
      SELECT COUNT(*) FROM listing_latest_observation lo
      WHERE lo.in_stock
    ),
    'live_offers', (SELECT COUNT(*) FROM listings WHERE is_placeholder = false)
  );
$$;

REVOKE ALL ON FUNCTION rpc_site_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_site_stats() TO anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_live_changes(p_limit INTEGER DEFAULT 8)
RETURNS SETOF change_events
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM change_events
  ORDER BY occurred_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 50));
$$;

GRANT EXECUTE ON FUNCTION rpc_live_changes(INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION create_price_alert(
  p_alert_scope TEXT,
  p_target_price_cad NUMERIC,
  p_card_id UUID DEFAULT NULL,
  p_gpu_id UUID DEFAULT NULL,
  p_product_line TEXT DEFAULT NULL,
  p_max_distance_km NUMERIC DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  recent_count INTEGER;
BEGIN
  IF p_alert_scope NOT IN ('card', 'gpu', 'product_line') THEN
    RAISE EXCEPTION 'invalid alert_scope';
  END IF;
  IF p_target_price_cad IS NULL OR p_target_price_cad <= 0 THEN
    RAISE EXCEPTION 'invalid target_price_cad';
  END IF;
  IF p_alert_scope = 'card' AND p_card_id IS NULL THEN
    RAISE EXCEPTION 'card_id required';
  END IF;
  IF p_alert_scope = 'gpu' AND p_gpu_id IS NULL THEN
    RAISE EXCEPTION 'gpu_id required';
  END IF;
  IF p_alert_scope = 'product_line' AND p_product_line IS NULL THEN
    RAISE EXCEPTION 'product_line required';
  END IF;
  IF p_contact_email IS NOT NULL AND p_contact_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'invalid email';
  END IF;

  SELECT COUNT(*) INTO recent_count
  FROM price_alerts
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND (
      (p_contact_email IS NOT NULL AND contact_email = p_contact_email)
      OR (p_contact_email IS NULL)
    );
  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  INSERT INTO price_alerts (
    alert_scope, card_id, gpu_id, product_line,
    target_price_cad, max_distance_km, postal_code, contact_email
  ) VALUES (
    p_alert_scope, p_card_id, p_gpu_id, p_product_line,
    p_target_price_cad, p_max_distance_km, p_postal_code, p_contact_email
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION create_price_alert(TEXT, NUMERIC, UUID, UUID, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_price_alert(TEXT, NUMERIC, UUID, UUID, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated;