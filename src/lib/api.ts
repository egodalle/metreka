// API client for GrowthPulse FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://growthpulse-api-z5id2gn52a-uc.a.run.app';
const API_KEY = import.meta.env.VITE_GROWTHPULSE_API_KEY || '';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Types matching GrowthPulse API response

// Stats endpoint response
export interface StatsResponse {
  success: boolean;
  data: {
    overview: {
      total_records: number;
      total_orders: number;
      total_customers: number;
      total_products: number;
      total_revenue: number;
      avg_order_value: number;
      earliest_order: string;
      latest_order: string;
      platforms: number;
    };
    by_source: {
      source: string;
      orders: number;
      revenue: number;
    }[];
  };
}

// Sales summary endpoint response
export interface SalesSummaryResponse {
  success: boolean;
  group_by: string;
  data: SalesSummaryItem[];
}

export interface SalesSummaryItem {
  dimension: string;
  total_orders: number;
  total_units: number;
  total_sales: number;
  avg_order_value: number;
  earliest_order: string;
  latest_order: string;
}

// Individual sales record
export interface SalesRecord {
  source: string;
  order_id: string;
  order_date: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  product_id: string | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  currency: string | null;
  order_status: string | null;
  payment_method: string | null;
  shipping_address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SalesResponse {
  success: boolean;
  data: SalesRecord[];
  metadata: {
    total: number;
    limit: number;
    offset: number;
    count: number;
  };
}

// Health check response
export interface HealthResponse {
  status: string;
  timestamp: string;
  bigquery_connected: boolean;
  total_records: number | null;
}

// Dashboard data - transformed from API for UI consumption
export interface DashboardData {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  total_customers: number;
  total_products: number;
  platforms: PlatformData[];
  daily_data: DailyData[];
}

export interface PlatformData {
  platform: string;
  total_orders: number;
  total_revenue: number;
  total_units: number;
  avg_order_value: number;
}

export interface DailyData {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_units: number;
  avg_order_value: number;
}

// API endpoints matching GrowthPulse FastAPI structure
export const api = {
  // Health check
  healthCheck: () =>
    fetchAPI<HealthResponse>('/health'),

  // Overall stats
  getStats: () =>
    fetchAPI<StatsResponse>('/api/v1/stats'),

  // Sales summary by different dimensions
  getSalesSummary: (groupBy: 'source' | 'day' | 'month' | 'status' = 'source', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ group_by: groupBy });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return fetchAPI<SalesSummaryResponse>(`/api/v1/sales/summary?${params}`);
  },

  // Get sales records with filters
  getSales: (options?: {
    source?: string;
    startDate?: string;
    endDate?: string;
    orderStatus?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (options?.source) params.append('source', options.source);
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.orderStatus) params.append('order_status', options.orderStatus);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    return fetchAPI<SalesResponse>(`/api/v1/sales?${params}`);
  },

  // Get sales by specific source/platform
  getSalesBySource: (source: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    return fetchAPI<SalesResponse>(`/api/v1/sales/${source}?${params}`);
  },

  // Composite endpoint: Get full dashboard data
  getDashboard: async (): Promise<DashboardData> => {
    const [stats, platformSummary, dailySummary] = await Promise.all([
      api.getStats(),
      api.getSalesSummary('source'),
      api.getSalesSummary('day'),
    ]);

    return {
      total_revenue: stats.data.overview.total_revenue,
      total_orders: stats.data.overview.total_orders,
      avg_order_value: stats.data.overview.avg_order_value,
      total_customers: stats.data.overview.total_customers,
      total_products: stats.data.overview.total_products,
      platforms: platformSummary.data.map(p => ({
        platform: p.dimension,
        total_orders: p.total_orders,
        total_revenue: p.total_sales,
        total_units: p.total_units,
        avg_order_value: p.avg_order_value,
      })),
      daily_data: dailySummary.data
        .map(d => ({
          date: d.dimension,
          total_orders: d.total_orders,
          total_revenue: d.total_sales,
          total_units: d.total_units,
          avg_order_value: d.avg_order_value,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
};

export default api;
