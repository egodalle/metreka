import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';

describe('SUBSCRIPTION_TIERS', () => {
  it('defines starter/growth/scale with expected store limits and prices', () => {
    expect(SUBSCRIPTION_TIERS.starter).toMatchObject({ storeLimit: 1, price: 29, name: 'Starter' });
    expect(SUBSCRIPTION_TIERS.growth).toMatchObject({ storeLimit: 3, price: 59, name: 'Growth' });
    expect(SUBSCRIPTION_TIERS.scale).toMatchObject({ storeLimit: 5, price: 79, name: 'Scale' });
  });

  it('keeps sandbox price IDs in sync with edge functions', () => {
    const root = resolve(process.cwd());
    const files = [
      'supabase/functions/create-checkout/index.ts',
      'supabase/functions/check-subscription/index.ts',
      'supabase/functions/paddle-webhook/index.ts',
    ].map((p) => readFileSync(resolve(root, p), 'utf8'));

    for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
      for (const source of files) {
        expect(source).toContain(tier.priceId);
      }
    }
  });
});
