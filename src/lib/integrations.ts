// Store Integration API client
import { getStoredToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://datapulse-fkcq.onrender.com';

// Demo mode for testing without backend
let demoMode: boolean = import.meta.env.VITE_DEMO_MODE === 'true' || true; // Default to true for easy testing

export function setDemoMode(enabled: boolean): void {
  demoMode = enabled;
}

export function isDemoMode() {
  return demoMode;
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
      const progress = Math.min(100, Math.floor(elapsed / 100)); // ~10 seconds to complete
      
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
