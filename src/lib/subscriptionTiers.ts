/** Subscription tiers — keep price IDs in sync with edge functions */
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
