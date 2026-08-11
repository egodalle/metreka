import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hasPaddleClientToken, openPaddleCheckout } from '@/lib/paddle';

// Subscription tiers — keep price IDs in sync with edge functions
export const SUBSCRIPTION_TIERS = {
  starter: {
    priceId: 'pri_01kzrcvc58m81n9wr27620ze40',
    productId: 'pro_01kzrcvbvyfm7r3a06s45h8r7v',
    name: 'Starter',
    storeLimit: 1,
    price: 29,
  },
  growth: {
    priceId: 'pri_01kzrcvcs04gr8d4h1as7wmr73',
    productId: 'pro_01kzrcvcg5x68hdvye22hdwdmh',
    name: 'Growth',
    storeLimit: 3,
    price: 59,
  },
  scale: {
    priceId: 'pri_01kzrcvdbqketje8fbs3rzwv18',
    productId: 'pro_01kzrcvd374yj8cdytq3yjeqvc',
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

      if (data?.error) {
        throw new Error(data.error);
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

function extractFunctionError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  return fallback;
}

export function useCreateCheckout() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
      });
      
      if (error) {
        throw new Error(extractFunctionError(data, error.message || 'Failed to create checkout session'));
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const transactionId = data?.transactionId as string | undefined;
      const url = data?.url as string | null | undefined;

      // Prefer Paddle.js overlay when client token is configured
      if (transactionId && hasPaddleClientToken()) {
        await openPaddleCheckout(transactionId);
        return { type: 'overlay' as const, transactionId };
      }

      // Fall back to hosted checkout payment link
      if (url) {
        window.location.assign(url);
        return { type: 'redirect' as const, url };
      }

      if (transactionId) {
        throw new Error(
          'Checkout created but Paddle.js is not configured. Set VITE_PADDLE_CLIENT_TOKEN, or configure a default payment link in Paddle.',
        );
      }
      
      throw new Error('No checkout URL or transaction returned');
    },
    onSuccess: (result) => {
      if (result.type === 'overlay') {
        toast({
          title: 'Checkout ready',
          description: 'Complete payment in the Paddle window.',
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
        throw new Error(extractFunctionError(data, error.message || 'Failed to open customer portal'));
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (!data?.url) {
        throw new Error('No portal URL returned');
      }

      return { url: data.url as string };
    },
    onSuccess: (result) => {
      window.open(result.url, '_blank', 'noopener,noreferrer');
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
