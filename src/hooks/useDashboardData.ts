import { useQuery } from '@tanstack/react-query';
import api, { 
  DashboardData, 
  PlatformData, 
  DailyData, 
  ProductAnalyticsResponse,
  CustomerAnalyticsResponse,
  ProfitabilityResponse
} from '@/lib/api';

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

// Health check
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    staleTime: 60000,
    retry: 1,
  });
}

// Product Analytics
export function useProductAnalytics(days: number = 30) {
  return useQuery<ProductAnalyticsResponse>({
    queryKey: ['productAnalytics', days],
    queryFn: () => api.getProductAnalytics(days),
    staleTime: 60000,
  });
}

// Customer Analytics
export function useCustomerAnalytics(days: number = 30) {
  return useQuery<CustomerAnalyticsResponse>({
    queryKey: ['customerAnalytics', days],
    queryFn: () => api.getCustomerAnalytics(days),
    staleTime: 60000,
  });
}

// Profitability Analytics
export function useProfitability(days: number = 30) {
  return useQuery<ProfitabilityResponse>({
    queryKey: ['profitability', days],
    queryFn: () => api.getProfitability(days),
    staleTime: 60000,
  });
}
