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
  sync_progress: number;
  sync_message: string | null;
  last_sync_at: string | null;
  error_message: string | null;
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

export const apiKeyFields: Record<string, { key: string; label: string; placeholder: string; type: string }[]> = {
  shopee: [
    { key: 'partner_id', label: 'Partner ID', placeholder: 'Enter your Partner ID', type: 'text' },
    { key: 'partner_key', label: 'Partner Key', placeholder: 'Enter your Partner Key', type: 'password' },
    { key: 'shop_id', label: 'Shop ID', placeholder: 'Enter your Shop ID', type: 'text' },
  ],
};

// Fetch all store connections for the current user
export async function getStoreConnections(): Promise<StoreConnection[]> {
  const { data, error } = await supabase
    .from('store_connections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as StoreConnection[];
}

// Create a new store connection
export async function createStoreConnection(platform: StorePlatform, storeName?: string): Promise<StoreConnection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('store_connections')
    .insert({
      user_id: user.id,
      platform,
      store_name: storeName || `My ${platform.charAt(0).toUpperCase() + platform.slice(1)} Store`,
      sync_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as StoreConnection;
}

// Update store connection sync status
export async function updateStoreSync(
  storeId: string, 
  updates: Partial<Pick<StoreConnection, 'sync_status' | 'sync_progress' | 'sync_message' | 'error_message' | 'last_sync_at'>>
): Promise<StoreConnection> {
  const { data, error } = await supabase
    .from('store_connections')
    .update(updates)
    .eq('id', storeId)
    .select()
    .single();

  if (error) throw error;
  return data as StoreConnection;
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
  return data as StoreConnection | null;
}

// Simulate sync process (in production, this would be handled by edge function)
export async function simulateSync(storeId: string): Promise<void> {
  // Start syncing
  await updateStoreSync(storeId, { 
    sync_status: 'syncing', 
    sync_progress: 0, 
    sync_message: 'Connecting to store...' 
  });

  const steps = [
    { progress: 20, message: 'Fetching products...' },
    { progress: 40, message: 'Importing orders...' },
    { progress: 60, message: 'Processing customers...' },
    { progress: 80, message: 'Analyzing data...' },
    { progress: 100, message: 'Sync complete!' },
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await updateStoreSync(storeId, { 
      sync_progress: step.progress, 
      sync_message: step.message 
    });
  }

  // Complete
  await updateStoreSync(storeId, { 
    sync_status: 'completed', 
    sync_progress: 100, 
    last_sync_at: new Date().toISOString() 
  });
}
