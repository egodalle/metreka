// API client for FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://datapulse-fkcq.onrender.com';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Types matching actual API response
export interface PlatformData {
  platform: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue_usd: string;
  orders_this_month: number;
  revenue_this_month_usd: string;
  orders_last_month: number;
  revenue_last_month_usd: string;
  orders_today: number;
  revenue_today_usd: string;
  avg_order_value_usd: string;
  avg_items_per_order: string;
  payment_rate: string;
  fulfillment_rate: string | null;
  cancellation_rate: string;
  first_order_date: string;
  last_order_date: string;
  active_days: number;
  revenue_mom_growth_pct: string;
  orders_mom_growth_pct: string;
  _generated_at: string;
}

export interface DailyData {
  order_date: string;
  total_orders: number;
  total_revenue_usd: string;
  avg_order_value_usd: string;
  total_items_sold: number;
  shopify_orders: number;
  amazon_orders: number;
  lazada_orders: number;
  shopee_orders: number;
  shopify_revenue_usd: string;
  amazon_revenue_usd: string;
  lazada_revenue_usd: string;
  shopee_revenue_usd: string;
  unique_customers: number;
  fulfilled_orders: number;
  fulfillment_rate: string;
  revenue_7d_avg: string;
  orders_7d_avg: string;
  revenue_30d_avg: string;
  orders_30d_avg: string;
  revenue_dod_change: string;
  orders_dod_change: number;
  revenue_wow_change: string;
  orders_wow_change: number;
  _generated_at: string;
}

export interface DashboardData {
  total_revenue_usd: string;
  total_orders: number;
  avg_order_value_usd: string;
  revenue_growth_pct: string;
  orders_growth_pct: number;
  total_customers: number;
  platforms: PlatformData[];
  recent_days: DailyData[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  store: string;
  revenue: number;
  unitsSold: number;
  inventory?: number;
  imageUrl?: string;
}

// API endpoints matching FastAPI structure
export const api = {
  // Dashboard - main KPIs overview
  getDashboard: () =>
    fetchAPI<DashboardData>('/api/v1/kpis/dashboard'),

  // Platforms breakdown
  getPlatforms: () =>
    fetchAPI<PlatformData[]>('/api/v1/kpis/platforms'),

  // Daily data for charts
  getDaily: (days: number = 30) =>
    fetchAPI<DailyData[]>(`/api/v1/kpis/daily?days=${days}`),

  // Top products
  getProducts: (limit: number = 10) =>
    fetchAPI<Product[]>(`/api/v1/kpis/products?limit=${limit}`),

  // Health check
  healthCheck: () =>
    fetchAPI<{ status: string }>('/health'),
};

export default api;
