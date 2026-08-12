-- Normalize legacy store_connections.sync_status values written by older sync-store-data.
-- Canonical values: pending | syncing | completed | failed

UPDATE public.store_connections
SET sync_status = 'completed'
WHERE sync_status = 'synced';

UPDATE public.store_connections
SET sync_status = 'failed'
WHERE sync_status = 'error';
