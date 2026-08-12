import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingleChain = {
  select: vi.fn(),
  eq: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => maybeSingleChain),
  },
}));

describe('getPostAuthPath', () => {
  beforeEach(() => {
    vi.resetModules();
    maybeSingleChain.select.mockReset();
    maybeSingleChain.eq.mockReset();
    maybeSingleChain.select.mockReturnValue(maybeSingleChain);
    maybeSingleChain.eq.mockResolvedValue({ count: 0, error: null });
  });

  it('routes to onboarding when no active stores', async () => {
    maybeSingleChain.eq.mockResolvedValue({ count: 0, error: null });
    const { getPostAuthPath } = await import('./postAuth');
    await expect(getPostAuthPath()).resolves.toBe('/onboarding');
  });

  it('routes to dashboard when at least one active store exists', async () => {
    maybeSingleChain.eq.mockResolvedValue({ count: 2, error: null });
    const { getPostAuthPath } = await import('./postAuth');
    await expect(getPostAuthPath()).resolves.toBe('/dashboard');
  });

  it('falls back to onboarding on query error', async () => {
    maybeSingleChain.eq.mockResolvedValue({ count: null, error: { message: 'boom' } });
    const { getPostAuthPath } = await import('./postAuth');
    await expect(getPostAuthPath()).resolves.toBe('/onboarding');
  });
});
