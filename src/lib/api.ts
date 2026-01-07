// API client for GrowthPulse FastAPI backend
import { isDemoMode, getConnectedDemoStores, StorePlatform } from './integrations';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://growthpulse-api-z5id2gn52a-uc.a.run.app';
const API_KEY = import.meta.env.VITE_GROWTHPULSE_API_KEY || '';

// Demo data for each platform
const demoData: Record<string, { stats: any; platformSummary: any; dailySummary: any }> = {
  shopify: {
    stats: {
      success: true,
      data: {
        overview: {
          total_records: 1250,
          total_orders: 847,
          total_customers: 523,
          total_products: 156,
          total_revenue: 124589.50,
          avg_order_value: 147.10,
          earliest_order: '2024-01-01',
          latest_order: '2024-12-31',
          platforms: 1,
        },
        by_source: [{ source: 'shopify', orders: 847, revenue: 124589.50 }],
      },
    },
    platformSummary: {
      success: true,
      group_by: 'source',
      data: [{
        dimension: 'shopify',
        total_orders: 847,
        total_units: 1523,
        total_sales: 124589.50,
        avg_order_value: 147.10,
        earliest_order: '2024-01-01',
        latest_order: '2024-12-31',
      }],
    },
    dailySummary: {
      success: true,
      group_by: 'day',
      data: Array.from({ length: 7 }, (_, i) => ({
        dimension: `2024-12-${String(25 + i).padStart(2, '0')}`,
        total_orders: 100 + Math.floor(Math.random() * 50),
        total_units: 180 + Math.floor(Math.random() * 80),
        total_sales: 14000 + Math.floor(Math.random() * 6000),
        avg_order_value: 140 + Math.floor(Math.random() * 30),
      })),
    },
  },
  shopee: {
    stats: {
      success: true,
      data: {
        overview: {
          total_records: 2340,
          total_orders: 1892,
          total_customers: 1456,
          total_products: 234,
          total_revenue: 89234.75,
          avg_order_value: 47.17,
          earliest_order: '2024-01-01',
          latest_order: '2024-12-31',
          platforms: 1,
        },
        by_source: [{ source: 'shopee', orders: 1892, revenue: 89234.75 }],
      },
    },
    platformSummary: {
      success: true,
      group_by: 'source',
      data: [{
        dimension: 'shopee',
        total_orders: 1892,
        total_units: 3245,
        total_sales: 89234.75,
        avg_order_value: 47.17,
        earliest_order: '2024-01-01',
        latest_order: '2024-12-31',
      }],
    },
    dailySummary: {
      success: true,
      group_by: 'day',
      data: Array.from({ length: 7 }, (_, i) => ({
        dimension: `2024-12-${String(25 + i).padStart(2, '0')}`,
        total_orders: 250 + Math.floor(Math.random() * 80),
        total_units: 420 + Math.floor(Math.random() * 120),
        total_sales: 11000 + Math.floor(Math.random() * 4000),
        avg_order_value: 42 + Math.floor(Math.random() * 15),
      })),
    },
  },
  lazada: {
    stats: {
      success: true,
      data: {
        overview: {
          total_records: 1567,
          total_orders: 1234,
          total_customers: 987,
          total_products: 189,
          total_revenue: 67892.30,
          avg_order_value: 55.02,
          earliest_order: '2024-01-01',
          latest_order: '2024-12-31',
          platforms: 1,
        },
        by_source: [{ source: 'lazada', orders: 1234, revenue: 67892.30 }],
      },
    },
    platformSummary: {
      success: true,
      group_by: 'source',
      data: [{
        dimension: 'lazada',
        total_orders: 1234,
        total_units: 2156,
        total_sales: 67892.30,
        avg_order_value: 55.02,
        earliest_order: '2024-01-01',
        latest_order: '2024-12-31',
      }],
    },
    dailySummary: {
      success: true,
      group_by: 'day',
      data: Array.from({ length: 7 }, (_, i) => ({
        dimension: `2024-12-${String(25 + i).padStart(2, '0')}`,
        total_orders: 160 + Math.floor(Math.random() * 60),
        total_units: 280 + Math.floor(Math.random() * 100),
        total_sales: 8500 + Math.floor(Math.random() * 3500),
        avg_order_value: 50 + Math.floor(Math.random() * 20),
      })),
    },
  },
};

// Get all connected demo stores
export function getConnectedDemoStorePlatforms(): StorePlatform[] {
  return getConnectedDemoStores().map(s => s.platform);
}

// Legacy function for backward compatibility - returns first connected store
export function getConnectedDemoStore(): string | null {
  const stores = getConnectedDemoStores();
  return stores.length > 0 ? stores[0].platform : null;
}

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
  healthCheck: (): Promise<HealthResponse> => {
    if (isDemoMode()) {
      const connectedStores = getConnectedDemoStorePlatforms();
      return Promise.resolve({
        status: connectedStores.length > 0 ? 'healthy' : 'disconnected',
        timestamp: new Date().toISOString(),
        bigquery_connected: connectedStores.length > 0,
        total_records: connectedStores.reduce((acc, store) => 
          acc + (demoData[store]?.stats.data.overview.total_records || 0), 0),
      });
    }
    return fetchAPI<HealthResponse>('/health');
  },

  // Overall stats - aggregates all connected stores in demo mode
  getStats: (): Promise<StatsResponse> => {
    if (isDemoMode()) {
      const connectedStores = getConnectedDemoStorePlatforms();
      if (connectedStores.length > 0) {
        // Aggregate stats from all connected stores
        const aggregated = connectedStores.reduce((acc, store) => {
          const storeData = demoData[store]?.stats.data.overview;
          if (storeData) {
            acc.total_records += storeData.total_records;
            acc.total_orders += storeData.total_orders;
            acc.total_customers += storeData.total_customers;
            acc.total_products += storeData.total_products;
            acc.total_revenue += storeData.total_revenue;
          }
          return acc;
        }, {
          total_records: 0,
          total_orders: 0,
          total_customers: 0,
          total_products: 0,
          total_revenue: 0,
        });

        const by_source = connectedStores.map(store => ({
          source: store,
          orders: demoData[store]?.stats.data.overview.total_orders || 0,
          revenue: demoData[store]?.stats.data.overview.total_revenue || 0,
        }));

        return Promise.resolve({
          success: true,
          data: {
            overview: {
              ...aggregated,
              avg_order_value: aggregated.total_orders > 0 
                ? aggregated.total_revenue / aggregated.total_orders 
                : 0,
              earliest_order: '2024-01-01',
              latest_order: '2024-12-31',
              platforms: connectedStores.length,
            },
            by_source,
          },
        });
      }
      return Promise.resolve({
        success: false,
        data: {
          overview: { total_records: 0, total_orders: 0, total_customers: 0, total_products: 0, total_revenue: 0, avg_order_value: 0, earliest_order: '', latest_order: '', platforms: 0 },
          by_source: [],
        },
      });
    }
    return fetchAPI<StatsResponse>('/api/v1/stats');
  },

  // Sales summary by different dimensions - aggregates all connected stores
  getSalesSummary: (groupBy: 'source' | 'day' | 'month' | 'status' = 'source', startDate?: string, endDate?: string): Promise<SalesSummaryResponse> => {
    if (isDemoMode()) {
      const connectedStores = getConnectedDemoStorePlatforms();
      if (connectedStores.length > 0) {
        if (groupBy === 'source') {
          // Return platform summaries for all connected stores
          const allPlatformData = connectedStores.flatMap(store => 
            demoData[store]?.platformSummary.data || []
          );
          return Promise.resolve({
            success: true,
            group_by: 'source',
            data: allPlatformData,
          });
        } else if (groupBy === 'day') {
          // Aggregate daily data from all connected stores
          const dailyMap = new Map<string, any>();
          connectedStores.forEach(store => {
            const storeDaily = demoData[store]?.dailySummary.data || [];
            storeDaily.forEach((day: any) => {
              if (dailyMap.has(day.dimension)) {
                const existing = dailyMap.get(day.dimension);
                existing.total_orders += day.total_orders;
                existing.total_units += day.total_units;
                existing.total_sales += day.total_sales;
              } else {
                dailyMap.set(day.dimension, { ...day });
              }
            });
          });
          const aggregatedDaily = Array.from(dailyMap.values()).map(d => ({
            ...d,
            avg_order_value: d.total_orders > 0 ? d.total_sales / d.total_orders : 0,
          }));
          return Promise.resolve({
            success: true,
            group_by: 'day',
            data: aggregatedDaily,
          });
        }
      }
      return Promise.resolve({ success: true, group_by: groupBy, data: [] });
    }
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
