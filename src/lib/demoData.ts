import type { DashboardData } from '@/lib/api';
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

/** Sample multi-platform dashboard payload for /demo. */
export function getDemoDashboardData(): DashboardData {
  const platforms = [
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
  ];

  const total_orders = platforms.reduce((s, p) => s + p.total_orders, 0);
  const total_revenue = platforms.reduce((s, p) => s + p.total_revenue, 0);

  return {
    total_revenue,
    total_orders,
    avg_order_value: Math.round((total_revenue / total_orders) * 100) / 100,
    total_customers: 2966,
    total_products: 579,
    platforms,
    daily_data: buildDailySeries(30),
  };
}
