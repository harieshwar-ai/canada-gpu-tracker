-- Ingest cron secret (random; never stored in repo). Coordinator must mirror this
-- value into Edge Function env INGEST_CRON_SECRET after migration apply.

DO $$
DECLARE
  secret_text TEXT;
BEGIN
  secret_text := encode(gen_random_bytes(32), 'hex');
  PERFORM vault.create_secret(
    secret_text,
  'ingest_cron_secret',
  'Shared secret for pg_cron → ingest edge function'
  );
END $$;

-- Schedule full ingest every 6 hours (UTC). Uses project URL baked at deploy time.
SELECT cron.schedule(
  'ingest-gpus-every-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://blfiydxlbfuusmcwbgvu.supabase.co/functions/v1/ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-ingest-secret', (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'ingest_cron_secret'
        LIMIT 1
      )
    ),
    body := '{"mode":"full"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Light stock re-check between full runs (no extra SKU budget when mode=stock).
SELECT cron.schedule(
  'ingest-stock-every-2h',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://blfiydxlbfuusmcwbgvu.supabase.co/functions/v1/ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-ingest-secret', (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'ingest_cron_secret'
        LIMIT 1
      )
    ),
    body := '{"mode":"stock","maxSkusPerRetailer":1}'::jsonb,
    timeout_milliseconds := 90000
  );
  $$
);