// Store Integration API client
import { getStoredToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://datapulse-fkcq.onrender.com';

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

// Platform configurations
export const platformConfigs: PlatformConfig[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect via OAuth (recommended)',
    icon: '🛒',
    connectionMethod: 'oauth',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    description: 'Connect via OAuth',
    icon: '🛍️',
    connectionMethod: 'oauth',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    description: 'Connect with API credentials',
    icon: '🏪',
    connectionMethod: 'api_key',
  },
];

// API key fields for platforms that require manual credential entry
export const apiKeyFields: Record<string, { key: string; label: string; placeholder: string; type: string }[]> = {
  shopee: [
    { key: 'partner_id', label: 'Partner ID', placeholder: 'Enter your Partner ID', type: 'text' },
    { key: 'partner_key', label: 'Partner Key', placeholder: 'Enter your Partner Key', type: 'password' },
    { key: 'shop_id', label: 'Shop ID', placeholder: 'Enter your Shop ID', type: 'text' },
  ],
};

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Step 2: Initiate integration - backend decides OAuth or API key flow
 */
export async function startIntegration(platform: StorePlatform): Promise<IntegrationStartResponse> {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/stores/${storeId}/sync-status`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to get sync status');
  }

  return response.json();
}

/**
 * Get all connected stores for the user
 */
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
