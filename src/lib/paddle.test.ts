import { afterEach, describe, expect, it, vi } from 'vitest';

describe('hasPaddleClientToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns false when token is missing', async () => {
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', '');
    const { hasPaddleClientToken } = await import('./paddle');
    expect(hasPaddleClientToken()).toBe(false);
  });

  it('returns true when token is set', async () => {
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_abc123');
    const { hasPaddleClientToken } = await import('./paddle');
    expect(hasPaddleClientToken()).toBe(true);
  });
});
