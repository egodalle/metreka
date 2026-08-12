-- Idempotent Paddle webhook processing
CREATE TABLE IF NOT EXISTS public.paddle_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB
);

ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages paddle webhook events" ON public.paddle_webhook_events;
CREATE POLICY "Service role manages paddle webhook events"
  ON public.paddle_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.paddle_webhook_events FROM anon, authenticated;
GRANT ALL ON public.paddle_webhook_events TO service_role;
