import { useQuery } from '@tanstack/react-query';
import api, { 
  DashboardData, 
  StatsResponse,
  SalesSummaryResponse,
  SalesResponse,
  HealthResponse,
} from '@/lib/api';

// Main dashboard data (composite of stats + summaries)
export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    staleTime: 30000,
    retry: 2,
  });
}

// Overall stats
export function useStats() {
  return useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
    staleTime: 30000,
  });
}

// Sales summary by dimension
export function useSalesSummary(
  groupBy: 'source' | 'day' | 'month' | 'status' = 'source',
  startDate?: string,
  endDate?: string
) {
  return useQuery<SalesSummaryResponse>({
    queryKey: ['salesSummary', groupBy, startDate, endDate],
    queryFn: () => api.getSalesSummary(groupBy, startDate, endDate),
    staleTime: 30000,
  });
}

// Sales records with filters
export function useSales(options?: {
  source?: string;
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<SalesResponse>({
    queryKey: ['sales', options],
    queryFn: () => api.getSales(options),
    staleTime: 30000,
  });
}

// Sales by specific platform
export function useSalesBySource(source: string, options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<SalesResponse>({
    queryKey: ['salesBySource', source, options],
    queryFn: () => api.getSalesBySource(source, options),
    staleTime: 30000,
    enabled: !!source,
  });
}

// Health check
export function useHealthCheck() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    staleTime: 60000,
    retry: 1,
  });
}
