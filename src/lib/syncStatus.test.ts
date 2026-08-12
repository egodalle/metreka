import { describe, expect, it } from 'vitest';
import { normalizeSyncStatus } from './syncStatus';

describe('normalizeSyncStatus', () => {
  it('maps canonical statuses', () => {
    expect(normalizeSyncStatus('pending')).toBe('pending');
    expect(normalizeSyncStatus('syncing')).toBe('syncing');
    expect(normalizeSyncStatus('completed')).toBe('completed');
    expect(normalizeSyncStatus('failed')).toBe('failed');
  });

  it('maps legacy edge-function values', () => {
    expect(normalizeSyncStatus('synced')).toBe('completed');
    expect(normalizeSyncStatus('error')).toBe('failed');
  });

  it('defaults unknown/null to pending', () => {
    expect(normalizeSyncStatus(null)).toBe('pending');
    expect(normalizeSyncStatus(undefined)).toBe('pending');
    expect(normalizeSyncStatus('weird')).toBe('pending');
  });
});
