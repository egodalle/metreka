import { useQuery } from '@tanstack/react-query';
import api, { DashboardData, KPI, Order, Product, RevenueData } from '@/lib/api';

export function useDashboard(period: string = '7d', store?: string) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', period, store],
    queryFn: () => api.getDashboard(period, store),
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

export function useKPIs(period: string = '7d', store?: string) {
  return useQuery<KPI[]>({
    queryKey: ['kpis', period, store],
    queryFn: () => api.getKPIs(period, store),
    staleTime: 30000,
  });
}

export function useOrders(params?: { limit?: number; offset?: number; store?: string; status?: string }) {
  return useQuery<{ orders: Order[]; total: number }>({
    queryKey: ['orders', params],
    queryFn: () => api.getOrders(params),
    staleTime: 15000, // 15 seconds for more real-time order data
  });
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    enabled: !!id,
  });
}

export function useTopProducts(params?: { limit?: number; store?: string; period?: string }) {
  return useQuery<Product[]>({
    queryKey: ['topProducts', params],
    queryFn: () => api.getTopProducts(params),
    staleTime: 60000, // 1 minute
  });
}

export function useRevenueTimeline(period: string = '7d', store?: string) {
  return useQuery<RevenueData[]>({
    queryKey: ['revenueTimeline', period, store],
    queryFn: () => api.getRevenueTimeline(period, store),
    staleTime: 30000,
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    staleTime: 60000,
    retry: 1,
  });
}
