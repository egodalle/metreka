// Metreka API client — reads from synced Supabase tables (optional external API fallback)
import { StorePlatform } from './integrations';
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || '';
const API_KEY = import.meta.env.VITE_METREKA_API_KEY || import.meta.env.VITE_GROWTHPULSE_API_KEY || '';

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

// Get all connected platforms - uses cached value synchronously
export function getConnectedDemoStorePlatforms(): StorePlatform[] {
  return cachedConnectedPlatforms;
}

// Legacy function for backward compatibility - returns first connected store
export function getConnectedDemoStore(): string | null {
  return cachedConnectedPlatforms.length > 0 ? cachedConnectedPlatforms[0] : null;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('API URL not configured');
  }
  
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

// Types matching API response
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

export interface HealthResponse {
  status: string;
  timestamp: string;
  bigquery_connected: boolean;
  total_records: number | null;
}

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
  total_customers?: number;
  total_products?: number;
}

export type DashboardPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export function periodToDateRange(period: DashboardPeriod): { startDate?: string; endDate?: string } {
  if (period === 'all') return {};
  const end = new Date();
  const start = new Date();
  const days =
    period === '7d' ? 7 :
    period === '30d' ? 30 :
    period === '90d' ? 90 :
    365;
  start.setUTCDate(end.getUTCDate() - days);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export interface DailyData {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_units: number;
  avg_order_value: number;
}

// ============================================
// DATA ACCESS LAYER - Fetches from synced PostgreSQL tables
// ============================================

type OrderRow = {
  platform: string;
  external_order_id: string;
  total_amount: number | string | null;
  order_date: string | null;
  quantity: number | null;
  order_status?: string | null;
};

function orderKey(row: Pick<OrderRow, 'platform' | 'external_order_id'>): string {
  return `${row.platform}:${row.external_order_id}`;
}

function countUniqueOrders(rows: Pick<OrderRow, 'platform' | 'external_order_id'>[]): number {
  return new Set(rows.map(orderKey)).size;
}

type SummaryBucket = {
  orderKeys: Set<string>;
  units: number;
  sales: number;
  dates: string[];
};

function createSummaryBucket(): SummaryBucket {
  return { orderKeys: new Set(), units: 0, sales: 0, dates: [] };
}

function addToSummaryBucket(bucket: SummaryBucket, order: OrderRow): void {
  bucket.orderKeys.add(orderKey(order));
  bucket.units += order.quantity || 0;
  bucket.sales += Number(order.total_amount) || 0;
  if (order.order_date) bucket.dates.push(order.order_date);
}

function summaryBucketToItem(dimension: string, stats: SummaryBucket): SalesSummaryItem {
  const orderCount = stats.orderKeys.size;
  const sortedDates = [...stats.dates].sort();
  return {
    dimension,
    total_orders: orderCount,
    total_units: stats.units,
    total_sales: stats.sales,
    avg_order_value: orderCount > 0 ? stats.sales / orderCount : 0,
    earliest_order: sortedDates[0] || '',
    latest_order: sortedDates[sortedDates.length - 1] || '',
  };
}

async function getStatsFromDB(startDate?: string, endDate?: string): Promise<StatsResponse> {
  const connectedPlatforms = await fetchConnectedPlatforms();
  
  if (connectedPlatforms.length === 0) {
    return {
      success: true,
      data: {
        overview: {
          total_records: 0,
          total_orders: 0,
          total_customers: 0,
          total_products: 0,
          total_revenue: 0,
          avg_order_value: 0,
          earliest_order: '',
          latest_order: '',
          platforms: 0,
        },
        by_source: [],
      },
    };
  }

  // Fetch aggregated order stats (one row per line item)
  let ordersQuery = supabase
    .from('synced_orders')
    .select('platform, external_order_id, total_amount, order_date, quantity')
    .in('platform', connectedPlatforms);

  if (startDate) ordersQuery = ordersQuery.gte('order_date', startDate);
  if (endDate) ordersQuery = ordersQuery.lte('order_date', endDate);

  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error('Failed to fetch orders:', ordersError);
    throw new Error('Failed to fetch order statistics');
  }

  // Fetch unique customer count
  const { data: customers, error: customersError } = await supabase
    .from('synced_customers')
    .select('id, platform')
    .in('platform', connectedPlatforms);

  // Fetch unique product count
  const { data: products, error: productsError } = await supabase
    .from('synced_products')
    .select('id, platform')
    .in('platform', connectedPlatforms);

  if (customersError) console.warn('Failed to fetch customers:', customersError.message);
  if (productsError) console.warn('Failed to fetch products:', productsError.message);

  const orderData = (orders || []) as OrderRow[];
  const totalRevenue = orderData.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOrders = countUniqueOrders(orderData);
  
  const dates = orderData
    .filter(o => o.order_date)
    .map(o => o.order_date!)
    .sort();

  // Group by platform
  const byPlatform = connectedPlatforms.map(platform => {
    const platformOrders = orderData.filter(o => o.platform === platform);
    return {
      source: platform,
      orders: countUniqueOrders(platformOrders),
      revenue: platformOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
    };
  });

  return {
    success: true,
    data: {
      overview: {
        total_records: orderData.length,
        total_orders: totalOrders,
        total_customers: customers?.length || 0,
        total_products: products?.length || 0,
        total_revenue: totalRevenue,
        avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        earliest_order: dates[0] || '',
        latest_order: dates[dates.length - 1] || '',
        platforms: connectedPlatforms.length,
      },
      by_source: byPlatform,
    },
  };
}

async function getSalesSummaryFromDB(
  groupBy: 'source' | 'day' | 'month' | 'status' = 'source',
  startDate?: string,
  endDate?: string
): Promise<SalesSummaryResponse> {
  const connectedPlatforms = await fetchConnectedPlatforms();
  
  if (connectedPlatforms.length === 0) {
    return { success: true, group_by: groupBy, data: [] };
  }

  let query = supabase
    .from('synced_orders')
    .select('platform, external_order_id, order_date, total_amount, quantity, order_status')
    .in('platform', connectedPlatforms);

  if (startDate) {
    query = query.gte('order_date', startDate);
  }
  if (endDate) {
    query = query.lte('order_date', endDate);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('Failed to fetch sales summary:', error);
    throw new Error('Failed to fetch sales summary');
  }

  const orderData = (orders || []) as OrderRow[];

  if (groupBy === 'source') {
    const grouped = new Map<string, SummaryBucket>();

    orderData.forEach(order => {
      const key = order.platform;
      const existing = grouped.get(key) || createSummaryBucket();
      addToSummaryBucket(existing, order);
      grouped.set(key, existing);
    });

    const data: SalesSummaryItem[] = Array.from(grouped.entries()).map(([dimension, stats]) =>
      summaryBucketToItem(dimension, stats),
    );

    return { success: true, group_by: 'source', data };
  }

  if (groupBy === 'day') {
    const grouped = new Map<string, SummaryBucket>();

    orderData.forEach(order => {
      const key = order.order_date?.split('T')[0] || 'unknown';
      const existing = grouped.get(key) || createSummaryBucket();
      addToSummaryBucket(existing, order);
      grouped.set(key, existing);
    });

    const data: SalesSummaryItem[] = Array.from(grouped.entries())
      .filter(([dim]) => dim !== 'unknown')
      .map(([dimension, stats]) => summaryBucketToItem(dimension, stats))
      .sort((a, b) => a.dimension.localeCompare(b.dimension));

    return { success: true, group_by: 'day', data };
  }

  if (groupBy === 'month') {
    const grouped = new Map<string, SummaryBucket>();

    orderData.forEach(order => {
      const date = order.order_date?.split('T')[0];
      const key = date ? date.substring(0, 7) : 'unknown';
      const existing = grouped.get(key) || createSummaryBucket();
      addToSummaryBucket(existing, order);
      grouped.set(key, existing);
    });

    const data: SalesSummaryItem[] = Array.from(grouped.entries())
      .filter(([dim]) => dim !== 'unknown')
      .map(([dimension, stats]) => summaryBucketToItem(dimension, stats))
      .sort((a, b) => a.dimension.localeCompare(b.dimension));

    return { success: true, group_by: 'month', data };
  }

  if (groupBy === 'status') {
    const grouped = new Map<string, SummaryBucket>();

    orderData.forEach(order => {
      const key = order.order_status || 'unknown';
      const existing = grouped.get(key) || createSummaryBucket();
      addToSummaryBucket(existing, order);
      grouped.set(key, existing);
    });

    const data: SalesSummaryItem[] = Array.from(grouped.entries()).map(([dimension, stats]) =>
      summaryBucketToItem(dimension, stats),
    );

    return { success: true, group_by: 'status', data };
  }

  return { success: true, group_by: groupBy, data: [] };
}

async function getSalesFromDB(options?: {
  source?: string;
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  limit?: number;
  offset?: number;
}): Promise<SalesResponse> {
  const connectedPlatforms = await fetchConnectedPlatforms();
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  if (connectedPlatforms.length === 0) {
    return {
      success: true,
      data: [],
      metadata: { total: 0, limit, offset, count: 0 },
    };
  }

  // Build query with filters
  let query = supabase
    .from('synced_orders')
    .select('*', { count: 'exact' });

  if (options?.source) {
    query = query.eq('platform', options.source);
  } else {
    query = query.in('platform', connectedPlatforms);
  }

  if (options?.startDate) {
    query = query.gte('order_date', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('order_date', options.endDate);
  }
  if (options?.orderStatus) {
    query = query.eq('order_status', options.orderStatus);
  }

  // Apply pagination
  query = query
    .order('order_date', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch sales:', error);
    throw new Error('Failed to fetch sales data');
  }

  // Transform to SalesRecord format
  const salesRecords: SalesRecord[] = (data || []).map(order => ({
    source: order.platform,
    order_id: order.external_order_id,
    order_date: order.order_date,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    product_id: order.product_id,
    product_name: order.product_name,
    quantity: order.quantity,
    unit_price: Number(order.unit_price),
    total_amount: Number(order.total_amount),
    currency: order.currency,
    order_status: order.order_status,
    payment_method: order.payment_status,
    shipping_address: null,
    created_at: order.created_at,
    updated_at: order.updated_at,
  }));

  return {
    success: true,
    data: salesRecords,
    metadata: {
      total: count || 0,
      limit,
      offset,
      count: salesRecords.length,
    },
  };
}

// ============================================
// PUBLIC API - Unified interface
// ============================================

export const api = {
  // Health check
  healthCheck: async (): Promise<HealthResponse> => {
    const connectedPlatforms = await fetchConnectedPlatforms();
    
    // Check if we have synced data
    const { count } = await supabase
      .from('synced_orders')
      .select('*', { count: 'exact', head: true })
      .in('platform', connectedPlatforms.length > 0 ? connectedPlatforms : ['none']);

    return {
      status: connectedPlatforms.length > 0 ? 'healthy' : 'disconnected',
      timestamp: new Date().toISOString(),
      bigquery_connected: connectedPlatforms.length > 0,
      total_records: count || 0,
    };
  },

  // Overall stats - from synced PostgreSQL tables
  getStats: async (startDate?: string, endDate?: string): Promise<StatsResponse> => {
    // Use external FastAPI if configured, otherwise use local DB
    if (API_BASE_URL) {
      try {
        return await fetchAPI<StatsResponse>('/api/v1/stats');
      } catch (error) {
        console.warn('FastAPI unavailable, falling back to local DB:', error);
      }
    }
    return getStatsFromDB(startDate, endDate);
  },

  // Sales summary by different dimensions
  getSalesSummary: async (
    groupBy: 'source' | 'day' | 'month' | 'status' = 'source',
    startDate?: string,
    endDate?: string
  ): Promise<SalesSummaryResponse> => {
    if (API_BASE_URL) {
      try {
        const params = new URLSearchParams({ group_by: groupBy });
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        return await fetchAPI<SalesSummaryResponse>(`/api/v1/sales/summary?${params}`);
      } catch (error) {
        console.warn('FastAPI unavailable, falling back to local DB:', error);
      }
    }
    return getSalesSummaryFromDB(groupBy, startDate, endDate);
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
    if (API_BASE_URL) {
      try {
        const params = new URLSearchParams();
        if (options?.source) params.append('source', options.source);
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);
        if (options?.orderStatus) params.append('order_status', options.orderStatus);
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        return await fetchAPI<SalesResponse>(`/api/v1/sales?${params}`);
      } catch (error) {
        console.warn('FastAPI unavailable, falling back to local DB:', error);
      }
    }
    return getSalesFromDB(options);
  },

  // Get sales by specific source/platform
  getSalesBySource: async (source: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<SalesResponse> => {
    return api.getSales({ ...options, source });
  },

  // Composite endpoint: Get full dashboard data
  getDashboard: async (period: DashboardPeriod = '30d'): Promise<DashboardData> => {
    const { startDate, endDate } = periodToDateRange(period);
    const connectedPlatforms = await fetchConnectedPlatforms();

    const [stats, platformSummary, dailySummary, customersRes, productsRes] = await Promise.all([
      api.getStats(startDate, endDate),
      api.getSalesSummary('source', startDate, endDate),
      api.getSalesSummary('day', startDate, endDate),
      connectedPlatforms.length
        ? supabase.from('synced_customers').select('id, platform').in('platform', connectedPlatforms)
        : Promise.resolve({ data: [] as { id: string; platform: string }[] }),
      connectedPlatforms.length
        ? supabase.from('synced_products').select('id, platform').in('platform', connectedPlatforms)
        : Promise.resolve({ data: [] as { id: string; platform: string }[] }),
    ]);

    const customersByPlatform = new Map<string, number>();
    for (const row of customersRes.data || []) {
      customersByPlatform.set(row.platform, (customersByPlatform.get(row.platform) || 0) + 1);
    }
    const productsByPlatform = new Map<string, number>();
    for (const row of productsRes.data || []) {
      productsByPlatform.set(row.platform, (productsByPlatform.get(row.platform) || 0) + 1);
    }

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
        total_customers: customersByPlatform.get(p.dimension) || 0,
        total_products: productsByPlatform.get(p.dimension) || 0,
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

  // Trigger manual sync for a store
  triggerSync: async (options?: {
    userId?: string;
    storeConnectionId?: string;
    platform?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const { data, error } = await supabase.functions.invoke('sync-store-data', {
      body: {
        user_id: options?.userId,
        store_connection_id: options?.storeConnectionId,
        platform: options?.platform,
      },
    });

    if (error) {
      console.error('Sync failed:', error);
      return { success: false, message: error.message };
    }

    return data;
  },

  // Get sync history
  getSyncLogs: async (storeConnectionId?: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      platform: string;
      sync_type: string;
      status: string;
      records_synced: number;
      error_message: string | null;
      started_at: string;
      completed_at: string | null;
    }>;
  }> => {
    let query = supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    if (storeConnectionId) {
      query = query.eq('store_connection_id', storeConnectionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch sync logs:', error);
      return { success: false, data: [] };
    }

    return { success: true, data: data || [] };
  },
};

export default api;
