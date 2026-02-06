import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Subscription tiers - Update these with your Paddle product/price IDs
export const SUBSCRIPTION_TIERS = {
  starter: {
    priceId: 'pri_starter_monthly', // Replace with actual Paddle price ID
    productId: 'pro_starter', // Replace with actual Paddle product ID
    name: 'Starter',
    storeLimit: 1,
    price: 29,
  },
  growth: {
    priceId: 'pri_growth_monthly',
    productId: 'pro_growth',
    name: 'Growth',
    storeLimit: 3,
    price: 59,
  },
  scale: {
    priceId: 'pri_scale_monthly',
    productId: 'pro_scale',
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
  paddleCustomerId?: string;
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
      
      if (data?.useOverlay && data?.transactionId) {
        // For Paddle overlay checkout
        return { type: 'overlay' as const, transactionId: data.transactionId };
      }
      
      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }
      
      return { type: 'redirect' as const, url: data.url as string };
    },
    onSuccess: (result) => {
      if (result.type === 'redirect') {
        // Open Paddle checkout in a new tab
        window.open(result.url, '_blank');
      } else {
        // For overlay, the component will handle it
        toast({
          title: 'Checkout ready',
          description: 'Opening payment form...',
        });
      }
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
      
      if (data?.manageInApp) {
        // Paddle doesn't have a direct portal like Stripe
        return { type: 'inApp' as const, subscriptionId: data.subscriptionId };
      }
      
      if (!data?.url) {
        throw new Error('No portal URL returned');
      }
      
      return { type: 'redirect' as const, url: data.url as string };
    },
    onSuccess: (result) => {
      if (result.type === 'redirect') {
        window.open(result.url, '_blank');
      } else {
        toast({
          title: 'Manage Subscription',
          description: 'You can cancel or modify your subscription from the dashboard settings.',
        });
      }
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
