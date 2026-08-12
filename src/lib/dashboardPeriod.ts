export type DashboardPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

/** Number of days represented by a dashboard period (for demo scaling / series length). */
export function periodToDays(period: DashboardPeriod): number {
  if (period === '7d') return 7;
  if (period === '30d') return 30;
  if (period === '90d') return 90;
  if (period === '1y' || period === 'all') return 365;
  return 30;
}

export function periodToDateRange(period: DashboardPeriod): { startDate?: string; endDate?: string } {
  if (period === 'all') return {};
  const end = new Date();
  const start = new Date();
  const days = periodToDays(period);
  start.setUTCDate(end.getUTCDate() - days);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}
