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

// Types matching your e-commerce data
export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email?: string;
  store: 'shopify' | 'tiktok' | 'amazon' | string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: number;
  createdAt: string;
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

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  store?: string;
}

export interface DashboardData {
  kpis: KPI[];
  recentOrders: Order[];
  topProducts: Product[];
  revenueTimeline: RevenueData[];
  storeBreakdown: { store: string; revenue: number; percentage: number }[];
}

// API endpoints
export const api = {
  // Dashboard
  getDashboard: (period: string = '7d', store?: string) =>
    fetchAPI<DashboardData>(`/api/dashboard?period=${period}${store ? `&store=${store}` : ''}`),

  // KPIs
  getKPIs: (period: string = '7d', store?: string) =>
    fetchAPI<KPI[]>(`/api/kpis?period=${period}${store ? `&store=${store}` : ''}`),

  // Orders
  getOrders: (params?: { limit?: number; offset?: number; store?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.store) searchParams.set('store', params.store);
    if (params?.status) searchParams.set('status', params.status);
    return fetchAPI<{ orders: Order[]; total: number }>(`/api/orders?${searchParams}`);
  },

  getOrder: (id: string) =>
    fetchAPI<Order>(`/api/orders/${id}`),

  // Products
  getTopProducts: (params?: { limit?: number; store?: string; period?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.store) searchParams.set('store', params.store);
    if (params?.period) searchParams.set('period', params.period);
    return fetchAPI<Product[]>(`/api/products/top?${searchParams}`);
  },

  // Revenue
  getRevenueTimeline: (period: string = '7d', store?: string) =>
    fetchAPI<RevenueData[]>(`/api/revenue/timeline?period=${period}${store ? `&store=${store}` : ''}`),

  // Health check
  healthCheck: () =>
    fetchAPI<{ status: string; database: string }>('/health'),
};

export default api;
