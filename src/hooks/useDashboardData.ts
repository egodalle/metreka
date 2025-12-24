import { useQuery } from '@tanstack/react-query';
import api, { DashboardData, PlatformData, DailyData, Product } from '@/lib/api';

// Main dashboard data
export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    staleTime: 30000,
    retry: 2,
  });
}

// Platforms breakdown
export function usePlatforms() {
  return useQuery<PlatformData[]>({
    queryKey: ['platforms'],
    queryFn: () => api.getPlatforms(),
    staleTime: 30000,
  });
}

// Daily data for charts
export function useDaily(days: number = 30) {
  return useQuery<DailyData[]>({
    queryKey: ['daily', days],
    queryFn: () => api.getDaily(days),
    staleTime: 30000,
  });
}

// Top products
export function useProducts(limit: number = 10) {
  return useQuery<Product[]>({
    queryKey: ['products', limit],
    queryFn: () => api.getProducts(limit),
    staleTime: 60000,
  });
}

// Health check
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    staleTime: 60000,
    retry: 1,
  });
}
