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

// API endpoints matching FastAPI structure
export const api = {
  // Dashboard - main KPIs overview
  getDashboard: () =>
    fetchAPI<DashboardData>('/api/v1/kpis/dashboard'),

  // Platforms breakdown
  getPlatforms: () =>
    fetchAPI<{ store: string; revenue: number; orders: number; percentage: number }[]>('/api/v1/kpis/platforms'),

  // Daily data for charts
  getDaily: (days: number = 30) =>
    fetchAPI<RevenueData[]>(`/api/v1/kpis/daily?days=${days}`),

  // Top products
  getProducts: (limit: number = 10) =>
    fetchAPI<Product[]>(`/api/v1/kpis/products?limit=${limit}`),

  // Health check
  healthCheck: () =>
    fetchAPI<{ status: string }>('/health'),
};

export default api;
