import { describe, expect, it } from 'vitest';
import { getDemoDashboardData } from './demoData';

describe('getDemoDashboardData period filter', () => {
  it('returns fewer daily points and lower totals for 7d than 30d', () => {
    const week = getDemoDashboardData('7d');
    const month = getDemoDashboardData('30d');

    expect(week.daily_data).toHaveLength(7);
    expect(month.daily_data).toHaveLength(30);
    expect(week.total_orders).toBeLessThan(month.total_orders);
    expect(week.total_revenue).toBeLessThan(month.total_revenue);
  });

  it('scales up for 90d vs 30d', () => {
    const month = getDemoDashboardData('30d');
    const quarter = getDemoDashboardData('90d');

    expect(quarter.daily_data).toHaveLength(90);
    expect(quarter.total_orders).toBeGreaterThan(month.total_orders);
  });
});
