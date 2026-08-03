// Store connections API using Supabase
import { supabase } from '@/integrations/supabase/client';

export type StorePlatform = 'shopify' | 'lazada' | 'shopee';
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface StoreConnection {
  id: string;
  user_id: string;
  platform: StorePlatform;
  store_name: string | null;
  store_url: string | null;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformConfig {
  id: StorePlatform;
  name: string;
  description: string;
  icon: string;
  connectionMethod: 'oauth' | 'api_key';
}

export const platformConfigs: PlatformConfig[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect with an Admin API access token',
    icon: '🛒',
    connectionMethod: 'api_key',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    description: 'Connect via OAuth or Open Platform API credentials',
    icon: '🛍️',
    connectionMethod: 'api_key',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    description: 'Connect with API credentials',
    icon: '🏪',
    connectionMethod: 'api_key',
  },
];

export const apiKeyFields: Record<string, { key: string; label: string; placeholder: string; type: string }[]> = {
  shopify: [
    { key: 'storeUrl', label: 'Store domain', placeholder: 'my-store.myshopify.com', type: 'text' },
    { key: 'accessToken', label: 'Admin API access token', placeholder: 'shpat_...', type: 'password' },
  ],
  lazada: [
    { key: 'appKey', label: 'App Key', placeholder: 'Enter your App Key', type: 'text' },
    { key: 'appSecret', label: 'App Secret', placeholder: 'Enter your App Secret', type: 'password' },
    { key: 'accessToken', label: 'Access Token', placeholder: 'Enter your Access Token', type: 'password' },
  ],
  shopee: [
    { key: 'partnerId', label: 'Partner ID', placeholder: 'Enter your Partner ID', type: 'text' },
    { key: 'partnerKey', label: 'Partner Key', placeholder: 'Enter your Partner Key', type: 'password' },
    { key: 'shopId', label: 'Shop ID', placeholder: 'Enter your Shop ID', type: 'text' },
    { key: 'accessToken', label: 'Access Token', placeholder: 'Enter your Access Token', type: 'password' },
  ],
};

// Platforms where a hosted OAuth flow is available (needs provider app keys configured)
export const oauthCapablePlatforms: StorePlatform[] = ['shopify', 'lazada'];

export type OAuthStatus = Record<StorePlatform, boolean>;

export async function getOAuthStatus(): Promise<OAuthStatus> {
  const { data, error } = await supabase.functions.invoke('store-connect', {
    body: { action: 'oauth_status' },
  });
  if (error) throw new Error(data?.error || error.message);
  return {
    shopify: Boolean(data?.shopify),
    lazada: Boolean(data?.lazada),
    shopee: false,
  };
}


// Fetch all store connections for the current user
export async function getStoreConnections(): Promise<StoreConnection[]> {
  const { data, error } = await supabase
    .from('store_connections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    platform: row.platform as StorePlatform,
    sync_status: (row.sync_status || 'pending') as SyncStatus,
  })) as StoreConnection[];
}

// Create/update a store connection with credentials.
// Credentials are sent to the `store-connect` edge function, which validates
// them, encrypts them at rest, and kicks off the first sync.
export async function createStoreConnection(
  platform: StorePlatform,
  options: { storeName?: string; storeUrl?: string; credentials?: Record<string, string> } = {},
): Promise<StoreConnection> {
  const { data, error } = await supabase.functions.invoke('store-connect', {
    body: {
      action: 'save_credentials',
      platform,
      storeName: options.storeName,
      storeUrl: options.storeUrl,
      credentials: options.credentials ?? {},
    },
  });

  if (error) throw new Error(data?.error || error.message);
  if (data?.error) throw new Error(data.error);

  return {
    ...data.connection,
    platform: data.connection.platform as StorePlatform,
    sync_status: (data.connection.sync_status || 'pending') as SyncStatus,
  } as StoreConnection;
}

// Begin an OAuth authorization flow; returns the provider URL to redirect to.
export async function startOAuthConnection(
  platform: StorePlatform,
  storeUrl?: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('store-connect', {
    body: {
      action: 'oauth_start',
      platform,
      storeUrl,
      redirectUri: `${window.location.origin}/oauth/callback`,
    },
  });

  if (error) throw new Error(data?.error || error.message);
  if (data?.error) {
    if (data.code === 'oauth_not_configured') {
      throw new Error(
        `${platform === 'shopify' ? 'Shopify' : 'Lazada'} one-click connect is not set up on the server yet. ` +
        'Use the API token fields below, or add OAuth app credentials to Supabase edge function secrets.',
      );
    }
    throw new Error(data.error);
  }
  return data.authorizeUrl as string;
}

// Exchange an OAuth authorization code for an access token and store it.
export async function completeOAuthConnection(
  code: string,
  state: string,
): Promise<StoreConnection> {
  const { data, error } = await supabase.functions.invoke('store-connect', {
    body: {
      action: 'oauth_callback',
      code,
      state,
      redirectUri: `${window.location.origin}/oauth/callback`,
    },
  });

  if (error) throw new Error(data?.error || error.message);
  if (data?.error) throw new Error(data.error);

  return {
    ...data.connection,
    platform: data.connection.platform as StorePlatform,
    sync_status: (data.connection.sync_status || 'pending') as SyncStatus,
  } as StoreConnection;
}

// Trigger a fresh sync for an existing connection
export async function triggerStoreSync(storeId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('store-connect', {
    body: { action: 'sync_now', storeConnectionId: storeId },
  });
  if (error) throw new Error(data?.error || error.message);
  if (data?.error) throw new Error(data.error);
}


// Update store connection sync status
export async function updateStoreSync(
  storeId: string, 
  updates: Partial<Pick<StoreConnection, 'sync_status' | 'last_sync_at' | 'is_active'>>
): Promise<StoreConnection> {
  const { data, error } = await supabase
    .from('store_connections')
    .update(updates)
    .eq('id', storeId)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    platform: data.platform as StorePlatform,
    sync_status: (data.sync_status || 'pending') as SyncStatus,
  } as StoreConnection;
}

// Delete a store connection
export async function deleteStoreConnection(storeId: string): Promise<void> {
  const { error } = await supabase
    .from('store_connections')
    .delete()
    .eq('id', storeId);

  if (error) throw error;
}

// Get a single store connection
export async function getStoreConnection(storeId: string): Promise<StoreConnection | null> {
  const { data, error } = await supabase
    .from('store_connections')
    .select('*')
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    platform: data.platform as StorePlatform,
    sync_status: (data.sync_status || 'pending') as SyncStatus,
  } as StoreConnection;
}

// Simulate sync process (in production, this would be handled by edge function)
export async function simulateSync(storeId: string): Promise<void> {
  // Start syncing
  await updateStoreSync(storeId, { sync_status: 'syncing' });

  // Simulate sync delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Complete
  await updateStoreSync(storeId, {
    sync_status: 'completed',
    last_sync_at: new Date().toISOString(),
  });
}
