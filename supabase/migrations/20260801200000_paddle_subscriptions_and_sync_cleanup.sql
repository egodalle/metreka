-- Paddle billing columns on subscriptions (webhook + check-subscription)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_price_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_product_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_paddle_subscription_id_idx
  ON public.subscriptions (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

-- Service role manages subscriptions via Paddle webhook
CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Retention: prune sync_logs older than 30 days (callable by cron)
CREATE OR REPLACE FUNCTION public.prune_old_sync_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sync_logs
  WHERE started_at < NOW() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_old_sync_logs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_old_sync_logs(INTEGER) TO service_role;
