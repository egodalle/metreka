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
