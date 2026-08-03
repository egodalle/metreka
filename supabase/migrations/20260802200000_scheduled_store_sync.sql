-- Scheduled store sync via pg_cron + pg_net (every 6 hours).
-- Requires SYNC_CRON_SECRET on the sync-store-data edge function.
--
-- After deploying, run once in the Supabase SQL editor (replace placeholders):
--   SELECT public.schedule_store_sync_jobs(
--     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-store-data',
--     'your-sync-cron-secret-matching-edge-env'
--   );

CREATE OR REPLACE FUNCTION public.schedule_store_sync_jobs(
  sync_url text,
  sync_secret text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  job_sql text;
BEGIN
  IF sync_url IS NULL OR sync_url = '' OR sync_secret IS NULL OR sync_secret = '' THEN
    RAISE EXCEPTION 'sync_url and sync_secret are required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron is not enabled — skip scheduling';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE 'pg_net is not enabled — skip scheduling';
    RETURN;
  END IF;

  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'metreka-sync-stores';

  job_sql := format(
    $job$SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Metreka-Sync-Secret', %L
      ),
      body := '{}'::jsonb
    ) AS request_id$job$,
    sync_url,
    sync_secret
  );

  PERFORM cron.schedule('metreka-sync-stores', '0 */6 * * *', job_sql);
END;
$$;

CREATE OR REPLACE FUNCTION public.unschedule_store_sync_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'metreka-sync-stores';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_store_sync_jobs(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unschedule_store_sync_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_store_sync_jobs(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.unschedule_store_sync_jobs() TO service_role;
