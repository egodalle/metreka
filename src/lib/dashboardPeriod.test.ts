import { describe, expect, it, vi, afterEach } from 'vitest';
import { periodToDateRange, periodToDays, type DashboardPeriod } from './dashboardPeriod';

describe('periodToDateRange', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty range for all', () => {
    expect(periodToDateRange('all')).toEqual({});
  });

  it.each([
    ['7d', 7],
    ['30d', 30],
    ['90d', 90],
    ['1y', 365],
  ] as const)('maps %s to ~%i days', (period: DashboardPeriod, days: number) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-12T12:00:00.000Z'));

    expect(periodToDays(period)).toBe(days);

    const { startDate, endDate } = periodToDateRange(period);
    expect(startDate).toBeTruthy();
    expect(endDate).toBe('2026-08-12T12:00:00.000Z');

    const start = new Date(startDate!);
    const end = new Date(endDate!);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(days);
  });
});
