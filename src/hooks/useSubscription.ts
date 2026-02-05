import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Subscription tiers matching Stripe products
export const SUBSCRIPTION_TIERS = {
  starter: {
    priceId: 'price_1SnSnqJLHaTFxreKdAeLcRqM',
    productId: 'prod_TkylEtr5Ni2MCU',
    name: 'Starter',
    storeLimit: 1,
    price: 29,
  },
  growth: {
    priceId: 'price_1SnSo9JLHaTFxreKhQy6QkDh',
    productId: 'prod_TkylIKtbMrM7l4',
    name: 'Growth',
    storeLimit: 3,
    price: 59,
  },
  scale: {
    priceId: 'price_1SnSoMJLHaTFxreK7CBPesPn',
    productId: 'prod_Tkyl24tIxr2ilj',
    name: 'Scale',
    storeLimit: 5,
    price: 79,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

interface SubscriptionStatus {
  subscribed: boolean;
  tier: string | null;
  storeLimit: number;
  subscriptionEnd: string | null;
  stripeCustomerId?: string;
  isTrialing: boolean;
  trialEndsAt: string | null;
}

export function useSubscription() {
  const { session, isAuthenticated } = useAuth();
  
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription', session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }
      
      return data as SubscriptionStatus;
    },
    enabled: isAuthenticated,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

// Helper hook to check if user has active access (subscribed OR trialing)
export function useHasAccess() {
  const { data: subscription, isLoading } = useSubscription();
  
  const hasAccess = subscription?.subscribed || subscription?.isTrialing || false;
  const isTrialing = subscription?.isTrialing || false;
  const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const daysLeftInTrial = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    hasAccess,
    isTrialing,
    trialEndsAt,
    daysLeftInTrial,
    isLoading,
    subscription,
  };
}

export function useCreateCheckout() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }
      
      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }
      
      return data.url as string;
    },
    onSuccess: (url) => {
      // Navigate to Stripe checkout (using location.href to avoid popup blockers)
      window.location.href = url;
    },
    onError: (error) => {
      toast({
        title: 'Checkout failed',
        description: error instanceof Error ? error.message : 'Failed to start checkout',
        variant: 'destructive',
      });
    },
  });
}

export function useCustomerPortal() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message || 'Failed to open customer portal');
      }
      
      if (!data?.url) {
        throw new Error('No portal URL returned');
      }
      
      return data.url as string;
    },
    onSuccess: (url) => {
      window.open(url, '_blank');
    },
    onError: (error) => {
      toast({
        title: 'Portal access failed',
        description: error instanceof Error ? error.message : 'Failed to open subscription management',
        variant: 'destructive',
      });
    },
  });
}
