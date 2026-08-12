import type {
  DashboardData,
  SalesRecord,
  SalesResponse,
  SalesSummaryResponse,
} from '@/lib/api';
import type { StoreConnection } from '@/lib/stores';

/** Synthetic store rows used when browsing /demo without auth. */
export function getDemoStoreConnections(): StoreConnection[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-shopify',
      user_id: 'demo',
      platform: 'shopify',
      store_name: 'Demo Shopify',
      store_url: 'demo-shop.myshopify.com',
      is_active: true,
      sync_status: 'completed',
      last_sync_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-lazada',
      user_id: 'demo',
      platform: 'lazada',
      store_name: 'Demo Lazada',
      store_url: null,
      is_active: true,
      sync_status: 'completed',
      last_sync_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-shopee',
      user_id: 'demo',
      platform: 'shopee',
      store_name: 'Demo Shopee',
      store_url: null,
      is_active: true,
      sync_status: 'completed',
      last_sync_at: now,
      created_at: now,
      updated_at: now,
    },
  ];
}

function buildDailySeries(days: number): DashboardData['daily_data'] {
  const out: DashboardData['daily_data'] = [];
  const end = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    const wave = 0.7 + 0.3 * Math.sin(i / 3);
    const orders = Math.round(55 + 35 * wave + (i % 5));
    const revenue = Math.round(orders * (150 + 40 * wave));
    out.push({
      date: d.toISOString().slice(0, 10),
      total_orders: orders,
      total_revenue: revenue,
      total_units: Math.round(orders * 1.6),
      avg_order_value: Math.round((revenue / orders) * 100) / 100,
    });
  }
  return out;
}

const DEMO_PLATFORMS = [
  {
    platform: 'shopify',
    total_orders: 100,
    total_revenue: 27500,
    total_units: 142,
    avg_order_value: 275,
    total_customers: 523,
    total_products: 156,
  },
  {
    platform: 'lazada',
    total_orders: 1110,
    total_revenue: 214532,
    total_units: 1890,
    avg_order_value: 193.27,
    total_customers: 987,
    total_products: 189,
  },
  {
    platform: 'shopee',
    total_orders: 1109,
    total_revenue: 162800,
    total_units: 2210,
    avg_order_value: 146.8,
    total_customers: 1456,
    total_products: 234,
  },
] as const;

const DEMO_PRODUCTS = [
  { name: 'Air Purifier HEPA Filter', sku: 'LAZ-001', platform: 'lazada', price: 172, units: 89 },
  { name: 'Hair Dryer Professional', sku: 'SHP-003', platform: 'shopee', price: 20, units: 445 },
  { name: 'Water Bottle Insulated 750ml', sku: 'LAZ-005', platform: 'lazada', price: 24.5, units: 345 },
  { name: 'Makeup Brush Set 12pcs', sku: 'SHP-004', platform: 'shopee', price: 60, units: 113 },
  { name: 'Smart LED Desk Lamp', sku: 'LAZ-003', platform: 'lazada', price: 38.7, units: 178 },
  { name: 'Wireless Earbuds Pro', sku: 'SHO-101', platform: 'shopify', price: 129, units: 86 },
  { name: 'Organic Face Serum', sku: 'SHO-204', platform: 'shopify', price: 48, units: 142 },
  { name: 'Yoga Mat Premium', sku: 'SHP-012', platform: 'shopee', price: 35, units: 210 },
  { name: 'Ceramic Cookware Set', sku: 'LAZ-088', platform: 'lazada', price: 89, units: 64 },
  { name: 'Portable Blender', sku: 'SHO-330', platform: 'shopify', price: 59, units: 97 },
  { name: 'Cotton Tee Pack (3)', sku: 'SHP-021', platform: 'shopee', price: 28, units: 320 },
  { name: 'Skincare Starter Kit', sku: 'LAZ-044', platform: 'lazada', price: 72, units: 156 },
] as const;

const DEMO_CUSTOMERS = [
  { id: 'cus_mike', name: 'Mike J.', email: 'mike.j@example.com', platform: 'shopify' },
  { id: 'cus_sarah', name: 'Sarah S.', email: 'sarah.s@example.com', platform: 'lazada' },
  { id: 'cus_patricia', name: 'Patricia W.', email: 'patricia.w@example.com', platform: 'lazada' },
  { id: 'cus_robert', name: 'robert439', email: 'robert439@example.com', platform: 'shopee' },
  { id: 'cus_jennifer', name: 'jennifer504', email: 'jennifer504@example.com', platform: 'shopee' },
  { id: 'cus_alex', name: 'Alex Chen', email: 'alex.chen@example.com', platform: 'shopify' },
  { id: 'cus_nina', name: 'Nina R.', email: 'nina.r@example.com', platform: 'lazada' },
  { id: 'cus_diego', name: 'Diego M.', email: 'diego.m@example.com', platform: 'shopee' },
  { id: 'cus_emma', name: 'Emma L.', email: 'emma.l@example.com', platform: 'shopify' },
  { id: 'cus_kai', name: 'Kai Tan', email: 'kai.tan@example.com', platform: 'lazada' },
  { id: 'cus_priya', name: 'Priya N.', email: 'priya.n@example.com', platform: 'shopee' },
  { id: 'cus_jordan', name: 'Jordan Lee', email: 'jordan.lee@example.com', platform: 'shopify' },
] as const;

/** Sample multi-platform dashboard payload for /demo. */
export function getDemoDashboardData(): DashboardData {
  const total_orders = DEMO_PLATFORMS.reduce((s, p) => s + p.total_orders, 0);
  const total_revenue = DEMO_PLATFORMS.reduce((s, p) => s + p.total_revenue, 0);

  return {
    total_revenue,
    total_orders,
    avg_order_value: Math.round((total_revenue / total_orders) * 100) / 100,
    total_customers: 2966,
    total_products: 579,
    platforms: DEMO_PLATFORMS.map((p) => ({ ...p })),
    daily_data: buildDailySeries(30),
  };
}

/** Line-item sales used by Products + Customers tabs. */
export function getDemoSales(options?: {
  source?: string;
  limit?: number;
  offset?: number;
}): SalesResponse {
  const now = new Date();
  const records: SalesRecord[] = [];

  DEMO_PRODUCTS.forEach((product, productIdx) => {
    const customers = DEMO_CUSTOMERS.filter((c) => c.platform === product.platform);
    const orderCount = Math.max(4, Math.min(12, Math.round(product.units / 25)));

    for (let i = 0; i < orderCount; i++) {
      const customer = customers[i % customers.length];
      const qty = Math.max(1, Math.round(product.units / orderCount));
      const dayOffset = (productIdx * 3 + i * 2) % 28;
      const orderDate = new Date(now);
      orderDate.setUTCDate(now.getUTCDate() - dayOffset);

      records.push({
        source: product.platform,
        order_id: `${product.platform.slice(0, 3).toUpperCase()}-${100000 + productIdx * 50 + i}`,
        order_date: orderDate.toISOString(),
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        product_id: product.sku,
        product_name: product.name,
        quantity: qty,
        unit_price: product.price,
        total_amount: Math.round(qty * product.price * 100) / 100,
        currency: 'USD',
        order_status: 'completed',
        payment_method: 'card',
        shipping_address: null,
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString(),
      });
    }
  });

  const filtered = options?.source
    ? records.filter((r) => r.source === options.source)
    : records;

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? filtered.length;
  const page = filtered.slice(offset, offset + limit);

  return {
    success: true,
    data: page,
    metadata: {
      total: filtered.length,
      limit,
      offset,
      count: page.length,
    },
  };
}

/** Platform summary used by Profitability tab. */
export function getDemoSalesSummary(
  groupBy: 'source' | 'day' | 'month' | 'status' = 'source',
): SalesSummaryResponse {
  const earliest = new Date();
  earliest.setUTCDate(earliest.getUTCDate() - 29);
  const latest = new Date();

  if (groupBy === 'status') {
    const total_orders = DEMO_PLATFORMS.reduce((s, p) => s + p.total_orders, 0);
    const total_units = DEMO_PLATFORMS.reduce((s, p) => s + p.total_units, 0);
    const total_sales = DEMO_PLATFORMS.reduce((s, p) => s + p.total_revenue, 0);
    return {
      success: true,
      group_by: groupBy,
      data: [{
        dimension: 'completed',
        total_orders,
        total_units,
        total_sales,
        avg_order_value: total_orders > 0 ? total_sales / total_orders : 0,
        earliest_order: earliest.toISOString(),
        latest_order: latest.toISOString(),
      }],
    };
  }

  if (groupBy === 'source') {
    return {
      success: true,
      group_by: groupBy,
      data: DEMO_PLATFORMS.map((p) => ({
        dimension: p.platform,
        total_orders: p.total_orders,
        total_units: p.total_units,
        total_sales: p.total_revenue,
        avg_order_value: p.avg_order_value,
        earliest_order: earliest.toISOString(),
        latest_order: latest.toISOString(),
      })),
    };
  }

  const daily = buildDailySeries(groupBy === 'month' ? 90 : 30);
  const rows = daily.map((d) => ({
    dimension: groupBy === 'month' ? d.date.slice(0, 7) : d.date,
    total_orders: d.total_orders,
    total_units: d.total_units,
    total_sales: d.total_revenue,
    avg_order_value: d.avg_order_value,
    earliest_order: d.date,
    latest_order: d.date,
  }));

  if (groupBy === 'month') {
    const byMonth = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const existing = byMonth.get(row.dimension);
      if (!existing) {
        byMonth.set(row.dimension, { ...row });
        continue;
      }
      existing.total_orders += row.total_orders;
      existing.total_units += row.total_units;
      existing.total_sales += row.total_sales;
      existing.avg_order_value = existing.total_orders > 0
        ? existing.total_sales / existing.total_orders
        : 0;
      existing.latest_order = row.latest_order;
    }
    return { success: true, group_by: groupBy, data: Array.from(byMonth.values()) };
  }

  return { success: true, group_by: groupBy, data: rows };
}
