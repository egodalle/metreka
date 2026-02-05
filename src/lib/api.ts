// API client for GrowthPulse FastAPI backend
import { isDemoMode, StorePlatform } from './integrations';
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://growthpulse-api-z5id2gn52a-uc.a.run.app';
const API_KEY = import.meta.env.VITE_GROWTHPULSE_API_KEY || '';

// Cache for connected platforms (refreshed on each API call)
let cachedConnectedPlatforms: StorePlatform[] = [];

// Fetch connected platforms from Supabase
async function fetchConnectedPlatforms(): Promise<StorePlatform[]> {
  try {
    const { data, error } = await supabase
      .from('store_connections')
      .select('platform')
      .eq('is_active', true);
    
    if (error) {
      console.error('Failed to fetch connected platforms:', error);
      return cachedConnectedPlatforms;
    }
    
    const platforms = [...new Set((data || []).map(row => row.platform as StorePlatform))];
    cachedConnectedPlatforms = platforms;
    return platforms;
  } catch (err) {
    console.error('Error fetching connected platforms:', err);
    return cachedConnectedPlatforms;
  }
}

// Demo sales records for each platform
const generateDemoSalesRecords = (platform: string): SalesRecord[] => {
  const products: Record<string, { name: string; price: number }[]> = {
    shopify: [
      { name: 'Premium Wireless Headphones', price: 149.99 },
      { name: 'Smart Watch Pro', price: 299.99 },
      { name: 'Leather Wallet Classic', price: 59.99 },
      { name: 'Organic Cotton T-Shirt', price: 34.99 },
      { name: 'Running Shoes Ultra', price: 129.99 },
      { name: 'Yoga Mat Premium', price: 49.99 },
      { name: 'Stainless Steel Water Bottle', price: 29.99 },
      { name: 'Bluetooth Speaker Mini', price: 79.99 },
      { name: 'Laptop Backpack Pro', price: 89.99 },
      { name: 'Sunglasses Aviator', price: 119.99 },
    ],
    shopee: [
      { name: 'Phone Case Silicone', price: 12.99 },
      { name: 'USB-C Cable 3-Pack', price: 15.99 },
      { name: 'Wireless Mouse', price: 24.99 },
      { name: 'LED Desk Lamp', price: 32.99 },
      { name: 'Portable Charger 10000mAh', price: 29.99 },
      { name: 'Mechanical Keyboard RGB', price: 69.99 },
      { name: 'Webcam HD 1080p', price: 49.99 },
      { name: 'USB Hub 7-Port', price: 22.99 },
      { name: 'Screen Protector 2-Pack', price: 9.99 },
      { name: 'Earbuds Wireless', price: 39.99 },
    ],
    lazada: [
      { name: 'Kitchen Blender Pro', price: 79.99 },
      { name: 'Air Fryer 5L', price: 99.99 },
      { name: 'Electric Kettle Smart', price: 45.99 },
      { name: 'Non-Stick Cookware Set', price: 149.99 },
      { name: 'Coffee Maker Drip', price: 59.99 },
      { name: 'Vacuum Cleaner Cordless', price: 189.99 },
      { name: 'Rice Cooker Digital', price: 69.99 },
      { name: 'Microwave Oven Compact', price: 119.99 },
      { name: 'Toaster 4-Slice', price: 39.99 },
      { name: 'Food Storage Container Set', price: 29.99 },
    ],
  };

  const customers = [
    { id: 'C001', name: 'John Smith', email: 'john.smith@email.com' },
    { id: 'C002', name: 'Sarah Johnson', email: 'sarah.j@email.com' },
    { id: 'C003', name: 'Michael Brown', email: 'm.brown@email.com' },
    { id: 'C004', name: 'Emily Davis', email: 'emily.d@email.com' },
    { id: 'C005', name: 'David Wilson', email: 'd.wilson@email.com' },
    { id: 'C006', name: 'Jessica Martinez', email: 'j.martinez@email.com' },
    { id: 'C007', name: 'Chris Anderson', email: 'c.anderson@email.com' },
    { id: 'C008', name: 'Amanda Taylor', email: 'a.taylor@email.com' },
    { id: 'C009', name: 'Daniel Thomas', email: 'd.thomas@email.com' },
    { id: 'C010', name: 'Ashley Garcia', email: 'a.garcia@email.com' },
    { id: 'C011', name: 'Matthew Rodriguez', email: 'm.rodriguez@email.com' },
    { id: 'C012', name: 'Olivia Lee', email: 'o.lee@email.com' },
    { id: 'C013', name: 'James Harris', email: 'j.harris@email.com' },
    { id: 'C014', name: 'Sophia Clark', email: 's.clark@email.com' },
    { id: 'C015', name: 'William Lewis', email: 'w.lewis@email.com' },
  ];

  const platformProducts = products[platform] || products.shopify;
  const records: SalesRecord[] = [];

  // Generate 50 sales records per platform
  for (let i = 0; i < 50; i++) {
    const product = platformProducts[Math.floor(Math.random() * platformProducts.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const dayOffset = Math.floor(Math.random() * 30);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - dayOffset);

    records.push({
      source: platform,
      order_id: `${platform.toUpperCase()}-${String(i + 1).padStart(5, '0')}`,
      order_date: orderDate.toISOString().split('T')[0],
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email,
      product_id: `PROD-${platform.toUpperCase()}-${String(platformProducts.indexOf(product) + 1).padStart(3, '0')}`,
      product_name: product.name,
      quantity: quantity,
      unit_price: product.price,
      total_amount: product.price * quantity,
      currency: 'USD',
      order_status: 'completed',
      payment_method: ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)],
      shipping_address: `${Math.floor(Math.random() * 999) + 1} Main Street, City`,
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString(),
    });
  }

  return records;
};

// Demo data for each platform
const demoData: Record<string, { stats: any; platformSummary: any; dailySummary: any; salesRecords: SalesRecord[] }> = {
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
    salesRecords: generateDemoSalesRecords('shopify'),
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
    salesRecords: generateDemoSalesRecords('shopee'),
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
    salesRecords: generateDemoSalesRecords('lazada'),
  },
};

// Get all connected platforms - uses cached value synchronously
export function getConnectedDemoStorePlatforms(): StorePlatform[] {
  return cachedConnectedPlatforms;
}

// Legacy function for backward compatibility - returns first connected store
export function getConnectedDemoStore(): string | null {
  return cachedConnectedPlatforms.length > 0 ? cachedConnectedPlatforms[0] : null;
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
  healthCheck: async (): Promise<HealthResponse> => {
    if (isDemoMode()) {
      const connectedStores = await fetchConnectedPlatforms();
      return {
        status: connectedStores.length > 0 ? 'healthy' : 'disconnected',
        timestamp: new Date().toISOString(),
        bigquery_connected: connectedStores.length > 0,
        total_records: connectedStores.reduce((acc, store) => 
          acc + (demoData[store]?.stats.data.overview.total_records || 0), 0),
      };
    }
    return fetchAPI<HealthResponse>('/health');
  },

  // Overall stats - aggregates all connected stores in demo mode
  getStats: async (): Promise<StatsResponse> => {
    if (isDemoMode()) {
      const connectedStores = await fetchConnectedPlatforms();
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

        return {
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
        };
      }
      return {
        success: false,
        data: {
          overview: { total_records: 0, total_orders: 0, total_customers: 0, total_products: 0, total_revenue: 0, avg_order_value: 0, earliest_order: '', latest_order: '', platforms: 0 },
          by_source: [],
        },
      };
    }
    return fetchAPI<StatsResponse>('/api/v1/stats');
  },

  // Sales summary by different dimensions - aggregates all connected stores
  getSalesSummary: async (groupBy: 'source' | 'day' | 'month' | 'status' = 'source', startDate?: string, endDate?: string): Promise<SalesSummaryResponse> => {
    if (isDemoMode()) {
      const connectedStores = await fetchConnectedPlatforms();
      if (connectedStores.length > 0) {
        if (groupBy === 'source') {
          // Return platform summaries for all connected stores
          const allPlatformData = connectedStores.flatMap(store => 
            demoData[store]?.platformSummary.data || []
          );
          return {
            success: true,
            group_by: 'source',
            data: allPlatformData,
          };
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
          return {
            success: true,
            group_by: 'day',
            data: aggregatedDaily,
          };
        }
      }
      return { success: true, group_by: groupBy, data: [] };
    }
    const params = new URLSearchParams({ group_by: groupBy });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return fetchAPI<SalesSummaryResponse>(`/api/v1/sales/summary?${params}`);
  },

  // Get sales records with filters
  getSales: async (options?: {
    source?: string;
    startDate?: string;
    endDate?: string;
    orderStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<SalesResponse> => {
    if (isDemoMode()) {
      const connectedStores = await fetchConnectedPlatforms();
      if (connectedStores.length > 0) {
        // Get sales records from all connected stores or filter by source
        let allSales: SalesRecord[] = [];
        
        if (options?.source) {
          // Filter to specific source if requested
          allSales = demoData[options.source]?.salesRecords || [];
        } else {
          // Get all sales from connected stores
          connectedStores.forEach(store => {
            allSales = allSales.concat(demoData[store]?.salesRecords || []);
          });
        }

        // Apply limit and offset
        const limit = options?.limit || 100;
        const offset = options?.offset || 0;
        const paginatedSales = allSales.slice(offset, offset + limit);

        return {
          success: true,
          data: paginatedSales,
          metadata: {
            total: allSales.length,
            limit,
            offset,
            count: paginatedSales.length,
          },
        };
      }
      return {
        success: true,
        data: [],
        metadata: { total: 0, limit: options?.limit || 100, offset: options?.offset || 0, count: 0 },
      };
    }
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
