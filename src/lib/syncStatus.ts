/** Canonical UI/DB values. Legacy edge writes used synced/error — normalize on read. */
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export function normalizeSyncStatus(raw: string | null | undefined): SyncStatus {
  switch (raw) {
    case 'completed':
    case 'synced':
      return 'completed';
    case 'failed':
    case 'error':
      return 'failed';
    case 'syncing':
      return 'syncing';
    case 'pending':
    default:
      return 'pending';
  }
}
