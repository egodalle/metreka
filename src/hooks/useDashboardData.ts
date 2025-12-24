import { useQuery } from '@tanstack/react-query';
import api, { 
  DashboardData, 
  PlatformData, 
  DailyData, 
  Product,
  ProductAnalytics,
  LocationData,
  CustomerMetrics,
  CustomerCohort,
  CustomerSegment,
  ProfitabilityData,
  ProfitabilityBySegment
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

// Product Analytics
export function useProductAnalytics(params?: { category?: string; platform?: string; limit?: number }) {
  return useQuery<ProductAnalytics[]>({
    queryKey: ['productAnalytics', params],
    queryFn: () => api.getProductAnalytics(params),
    staleTime: 60000,
  });
}

// Location Analytics
export function useLocationData(granularity: 'country' | 'region' | 'city' = 'country') {
  return useQuery<LocationData[]>({
    queryKey: ['locations', granularity],
    queryFn: () => api.getLocationData(granularity),
    staleTime: 60000,
  });
}

// Customer Analytics
export function useCustomerMetrics() {
  return useQuery<CustomerMetrics>({
    queryKey: ['customerMetrics'],
    queryFn: () => api.getCustomerMetrics(),
    staleTime: 60000,
  });
}

export function useCustomerCohorts() {
  return useQuery<CustomerCohort[]>({
    queryKey: ['customerCohorts'],
    queryFn: () => api.getCustomerCohorts(),
    staleTime: 120000,
  });
}

export function useCustomerSegments() {
  return useQuery<CustomerSegment[]>({
    queryKey: ['customerSegments'],
    queryFn: () => api.getCustomerSegments(),
    staleTime: 60000,
  });
}

// Profitability Analytics
export function useProfitability(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  return useQuery<ProfitabilityData[]>({
    queryKey: ['profitability', period],
    queryFn: () => api.getProfitability(period),
    staleTime: 60000,
  });
}

export function useProfitabilityBySegment(segmentType: 'category' | 'platform' | 'region') {
  return useQuery<ProfitabilityBySegment[]>({
    queryKey: ['profitabilitySegment', segmentType],
    queryFn: () => api.getProfitabilityBySegment(segmentType),
    staleTime: 60000,
  });
}
