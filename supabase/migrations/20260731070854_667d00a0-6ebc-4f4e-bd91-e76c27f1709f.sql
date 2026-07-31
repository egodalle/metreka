-- PROFILES: enforce ownership on update, keep insert/select owner-scoped
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- STORE CONNECTIONS: harden update with WITH CHECK so ownership can't be reassigned
DROP POLICY IF EXISTS "Users can update own stores" ON public.store_connections;
CREATE POLICY "Users can update own stores" ON public.store_connections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.store_connections FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.subscriptions FROM anon;

-- SUBSCRIPTIONS: explicit owner-only delete + ownership check on update
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subscription" ON public.subscriptions;
CREATE POLICY "Users can delete own subscription" ON public.subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- SYNCED CUSTOMERS: remove always-true policy, scope reads to authenticated owner
DROP POLICY IF EXISTS "Service role can manage customers" ON public.synced_customers;
DROP POLICY IF EXISTS "Users can view own customers" ON public.synced_customers;
CREATE POLICY "Users can view own customers" ON public.synced_customers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE ALL ON public.synced_customers FROM anon;
GRANT SELECT ON public.synced_customers TO authenticated;
GRANT ALL ON public.synced_customers TO service_role;

-- SYNCED ORDERS
DROP POLICY IF EXISTS "Service role can manage orders" ON public.synced_orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.synced_orders;
CREATE POLICY "Users can view own orders" ON public.synced_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE ALL ON public.synced_orders FROM anon;
GRANT SELECT ON public.synced_orders TO authenticated;
GRANT ALL ON public.synced_orders TO service_role;

-- SYNCED PRODUCTS
DROP POLICY IF EXISTS "Service role can manage products" ON public.synced_products;
DROP POLICY IF EXISTS "Users can view own products" ON public.synced_products;
CREATE POLICY "Users can view own products" ON public.synced_products
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE ALL ON public.synced_products FROM anon;
GRANT SELECT ON public.synced_products TO authenticated;
GRANT ALL ON public.synced_products TO service_role;

-- SYNC LOGS
DROP POLICY IF EXISTS "Service role can manage sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Users can view own sync logs" ON public.sync_logs;
CREATE POLICY "Users can view own sync logs" ON public.sync_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE ALL ON public.sync_logs FROM anon;
GRANT SELECT ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;