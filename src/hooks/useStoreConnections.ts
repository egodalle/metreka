import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getStoreConnections, 
  createStoreConnection, 
  deleteStoreConnection,
  simulateSync,
  type StoreConnection,
  type StorePlatform 
} from '@/lib/stores';
import { useToast } from '@/hooks/use-toast';

export function useStoreConnections() {
  return useQuery<StoreConnection[]>({
    queryKey: ['storeConnections'],
    queryFn: getStoreConnections,
    staleTime: 30000,
  });
}

export function useConnectStore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ platform, storeName }: { platform: StorePlatform; storeName?: string }) => {
      const connection = await createStoreConnection(platform, storeName);
      // Start sync in background
      simulateSync(connection.id).catch(console.error);
      return connection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeConnections'] });
      toast({
        title: 'Store connected!',
        description: 'Syncing your store data...',
      });
    },
    onError: (error) => {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to connect store',
        variant: 'destructive',
      });
    },
  });
}

export function useDisconnectStore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteStoreConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeConnections'] });
      toast({
        title: 'Store disconnected',
        description: 'The store has been removed from your account.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Disconnect failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect store',
        variant: 'destructive',
      });
    },
  });
}
