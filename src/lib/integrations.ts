// Store Integration API client
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://datapulse-fkcq.onrender.com';

// Demo mode for displaying realistic data when real API sync is not implemented
// Since the actual data pipeline to sync from Shopify/Lazada/Shopee to the backend
// is not yet implemented, we use demo mode to show realistic sample data based on
// which stores the user has connected. This prevents showing zeroes/blanks.
//
// When real sync is implemented, set VITE_DEMO_MODE=false to use actual API data.
let demoMode: boolean = import.meta.env.VITE_DEMO_MODE !== 'false';

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

export async function startIntegration(platform: StorePlatform): Promise<IntegrationStartResponse> {
  if (demoMode) {
    await new Promise((r) => setTimeout(r, 800)); // Simulate network delay
    const config = platformConfigs.find((p) => p.id === platform);
    return {
      integration_id: `demo_${platform}_${Date.now()}`,
      requires_credentials: config?.connectionMethod === 'api_key',
      // OAuth platforms would redirect, but in demo we simulate success
      redirect_url: config?.connectionMethod === 'oauth' ? undefined : undefined,
    };
  }

  const response = await authFetch(`${API_BASE_URL}/api/v1/integrations/start`, {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to start integration');
  }

  return response.json();
}

/**
 * Step 3b: Submit API credentials (for non-OAuth platforms)
 * Credentials are sent ONCE to backend, encrypted, and never returned
 */
export async function submitCredentials(
  integrationId: string,
  platform: StorePlatform,
  credentials: Record<string, string>
): Promise<StoreConnection> {
  if (demoMode) {
    await new Promise((r) => setTimeout(r, 1000)); // Simulate network delay
    const storeId = `store_${platform}_${Date.now()}`;
    // Store in session for demo sync status polling
    sessionStorage.setItem(`demo_store_${storeId}`, JSON.stringify({ startTime: Date.now(), platform }));
    return {
      id: storeId,
      platform,
      store_name: `Demo ${platform.charAt(0).toUpperCase() + platform.slice(1)} Store`,
      connected: true,
      sync_status: 'syncing',
    };
  }

  const response = await authFetch(`${API_BASE_URL}/api/v1/integrations/${integrationId}/credentials`, {
    method: 'POST',
    body: JSON.stringify({ platform, credentials }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to submit credentials');
  }

  return response.json();
}

/**
 * Step 4: Handle OAuth callback (called after redirect back from platform)
 */
export async function completeOAuthCallback(code: string, state: string): Promise<StoreConnection> {
  const response = await authFetch(`${API_BASE_URL}/api/v1/integrations/oauth/callback`, {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to complete OAuth');
  }

  return response.json();
}

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

  if (status === 'syncing') {
    return { status: 'syncing', message: 'Importing your store data...' };
  }

  return { status: 'pending', message: 'Waiting for the first sync to start...' };
}

export async function getConnectedStores(): Promise<StoreConnection[]> {
  const response = await authFetch(`${API_BASE_URL}/api/v1/stores`);

  if (!response.ok) {
    if (response.status === 404) return [];
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to get stores');
  }

  return response.json();
}

/**
 * Disconnect a store
 */
export async function disconnectStore(storeId: string): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}/api/v1/stores/${storeId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to disconnect store');
  }
}
