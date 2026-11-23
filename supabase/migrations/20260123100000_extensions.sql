-- Extensions for cron-triggered edge ingest and crypto helpers
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Vault for ingest shared secret (read by pg_cron via decrypted view)
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;