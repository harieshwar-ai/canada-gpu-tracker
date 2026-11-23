CREATE OR REPLACE FUNCTION public.verify_ingest_secret(p_secret text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name = 'ingest_cron_secret'
      AND decrypted_secret = p_secret
  );
$$;

REVOKE ALL ON FUNCTION public.verify_ingest_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_ingest_secret(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_ingest_secret(text) TO service_role;