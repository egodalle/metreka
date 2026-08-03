// Store integration client — sync status, demo mode, platform configs
import { supabase } from '@/integrations/supabase/client';

// Demo mode shows simulated dashboard data on /demo only (set VITE_DEMO_MODE=true)
let demoMode: boolean = import.meta.env.VITE_DEMO_MODE === 'true';

export function setDemoMode(enabled: boolean): void {
  demoMode = enabled;
}

export function isDemoMode() {
  return demoMode;
}

// Connected stores management for demo mode
const DEMO_STORES_KEY = 'demo_connected_stores';

export interface ConnectedDemoStore {
  id: string;
  platform: StorePlatform;
  store_name: string;
  connected_at: number;
}

export function getConnectedDemoStores(): ConnectedDemoStore[] {
  const stored = localStorage.getItem(DEMO_STORES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addConnectedDemoStore(platform: StorePlatform): ConnectedDemoStore {
  const stores = getConnectedDemoStores();
  const newStore: ConnectedDemoStore = {
    id: `store_${platform}_${Date.now()}`,
    platform,
    store_name: `Demo ${platform.charAt(0).toUpperCase() + platform.slice(1)} Store`,
    connected_at: Date.now(),
  };
  
  // Don't add duplicate platforms
  const existing = stores.find(s => s.platform === platform);
  if (existing) {
    return existing;
  }
  
  stores.push(newStore);
  localStorage.setItem(DEMO_STORES_KEY, JSON.stringify(stores));
  return newStore;
}

export function removeConnectedDemoStore(storeId: string): void {
  const stores = getConnectedDemoStores();
  const filtered = stores.filter(s => s.id !== storeId);
  localStorage.setItem(DEMO_STORES_KEY, JSON.stringify(filtered));
}

export function clearAllDemoStores(): void {
  localStorage.removeItem(DEMO_STORES_KEY);
  // Also clear session storage sync data
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('demo_store_')) {
      sessionStorage.removeItem(key);
    }
  });
}

export type StorePlatform = 'shopify' | 'lazada' | 'shopee';

export type ConnectionMethod = 'oauth' | 'api_key';

export interface PlatformConfig {
  id: StorePlatform;
  name: string;
  description: string;
  icon: string;
  connectionMethod: ConnectionMethod;
}

export interface IntegrationStartResponse {
  redirect_url?: string; // For OAuth flows
  requires_credentials?: boolean; // For API key flows
  integration_id: string;
}

export interface StoreConnection {
  id: string;
  platform: StorePlatform;
  store_name?: string;
  connected: boolean;
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  last_sync?: string;
  error_message?: string;
}

export interface SyncStatus {
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  error?: string;
  completed_at?: string;
}

// Platform configurations (single source of truth lives in src/lib/stores.ts)
export { platformConfigs, apiKeyFields, oauthCapablePlatforms } from './stores';

/**
 * Step 5: Poll sync status
 */
export async function getSyncStatus(storeId: string): Promise<SyncStatus> {
  if (demoMode) {
    const storedData = sessionStorage.getItem(`demo_store_${storeId}`);
    if (storedData) {
      const { startTime } = JSON.parse(storedData);
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor(elapsed / 100));

      if (progress >= 100) {
        return { status: 'completed', progress: 100, message: 'Sync complete!' };
      }

      const messages = [
        'Connecting to store...',
        'Fetching products...',
        'Importing orders...',
        'Processing analytics...',
        'Finalizing...',
      ];
      const messageIndex = Math.min(Math.floor(progress / 20), messages.length - 1);

      return { status: 'syncing', progress, message: messages[messageIndex] };
    }
    return { status: 'pending', progress: 0 };
  }

  // Real mode: read the sync state written by the sync-store-data edge function
  const { data: connection, error } = await supabase
    .from('store_connections')
    .select('sync_status, last_sync_at')
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  if (!connection) return { status: 'pending' };

  const { data: log } = await supabase
    .from('sync_logs')
    .select('status, error_message, records_synced, completed_at')
    .eq('store_connection_id', storeId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = connection.sync_status;

  if (status === 'synced' || status === 'completed') {
    return {
      status: 'completed',
      progress: 100,
      message: log?.records_synced
        ? `Imported ${log.records_synced} records`
        : 'Sync complete!',
      completed_at: log?.completed_at ?? connection.last_sync_at ?? undefined,
    };
  }

  if (status === 'error' || status === 'failed') {
    return {
      status: 'failed',
      error: log?.error_message ?? 'Sync failed. Check your store credentials.',
    };
  }

  if (status === 'syncing' || status === 'pending') {
    // Stuck pending usually means the background sync never started
    if (status === 'pending' && connection.last_sync_at) {
      return { status: 'syncing', message: 'Importing your store data...' };
    }
    if (status === 'pending' && log?.status === 'running') {
      return { status: 'syncing', message: 'Importing your store data...' };
    }
    if (status === 'pending') {
      return {
        status: 'pending',
        message: 'Waiting for sync to start... You can continue to the dashboard and refresh in a minute.',
      };
    }
    return { status: 'syncing', message: 'Importing your store data...' };
  }
}

// Store listing/disconnect live in src/lib/stores.ts (Supabase-backed)
export { getStoreConnections, deleteStoreConnection, startOAuthConnection, completeOAuthConnection, triggerStoreSync } from './stores';
