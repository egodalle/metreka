-- Create synced_orders table for normalized order data from all platforms
CREATE TABLE public.synced_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_connection_id UUID REFERENCES public.store_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- shopify, lazada, shopee
  external_order_id TEXT NOT NULL,
  order_number TEXT,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  product_id TEXT,
  product_name TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  order_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  cost_of_goods NUMERIC(12,2) DEFAULT 0,
  platform_fees NUMERIC(12,2) DEFAULT 0,
  net_profit NUMERIC(12,2) DEFAULT 0,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, external_order_id, product_id)
);

-- Create synced_products table for product catalog
CREATE TABLE public.synced_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_connection_id UUID REFERENCES public.store_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(12,2) DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  inventory_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, external_product_id)
);

-- Create synced_customers table
CREATE TABLE public.synced_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_connection_id UUID REFERENCES public.store_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_customer_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, external_customer_id)
);

-- Create sync_logs table for tracking sync history
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_connection_id UUID REFERENCES public.store_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- orders, products, customers
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.synced_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for synced_orders
CREATE POLICY "Users can view own orders" ON public.synced_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage orders" ON public.synced_orders
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for synced_products
CREATE POLICY "Users can view own products" ON public.synced_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage products" ON public.synced_products
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for synced_customers
CREATE POLICY "Users can view own customers" ON public.synced_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage customers" ON public.synced_customers
  FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for sync_logs
CREATE POLICY "Users can view own sync logs" ON public.sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sync logs" ON public.sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_synced_orders_user_platform ON public.synced_orders(user_id, platform);
CREATE INDEX idx_synced_orders_order_date ON public.synced_orders(order_date DESC);
CREATE INDEX idx_synced_orders_store ON public.synced_orders(store_connection_id);
CREATE INDEX idx_synced_products_user_platform ON public.synced_products(user_id, platform);
CREATE INDEX idx_synced_customers_user_platform ON public.synced_customers(user_id, platform);

-- Add updated_at trigger
CREATE TRIGGER update_synced_orders_updated_at
  BEFORE UPDATE ON public.synced_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_synced_products_updated_at
  BEFORE UPDATE ON public.synced_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_synced_customers_updated_at
  BEFORE UPDATE ON public.synced_customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();