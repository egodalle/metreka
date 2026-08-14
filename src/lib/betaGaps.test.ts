import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

describe('marketing copy honesty (S1–S3)', () => {
  it('hero starts at Starter price $29', () => {
    const hero = read('src/components/HeroSection.tsx');
    expect(hero).toMatch(/value:\s*29/);
    expect(hero).toContain('Starting At');
    expect(hero).not.toMatch(/value:\s*59/);
  });

  it('does not claim hourly or real-time sync on marketing pages', () => {
    const files = [
      'src/components/HowItWorksSection.tsx',
      'src/components/DashboardsSection.tsx',
      'src/components/DashboardPreviewSection.tsx',
    ].map(read);

    for (const source of files) {
      expect(source.toLowerCase()).not.toMatch(/hourly/);
      expect(source.toLowerCase()).not.toMatch(/real-time/);
      expect(source.toLowerCase()).not.toMatch(/realtime/);
    }
  });

  it('dashboard sync button is platform-agnostic', () => {
    const dash = read('src/pages/Dashboard.tsx');
    expect(dash).toContain('Sync stores');
    expect(dash).not.toContain('Sync from Shopify');
  });
});

describe('settings + billing surfaces (S6–S7)', () => {
  it('registers /settings route', () => {
    const app = read('src/App.tsx');
    expect(app).toContain('path="/settings"');
    expect(app).toContain('Settings');
  });

  it('billing-history edge function scopes by customer', () => {
    const fn = read('supabase/functions/billing-history/index.ts');
    expect(fn).toContain('customer_id');
    expect(fn).toContain('transactions');
  });
});

describe('CTA destinations', () => {
  it('does not open broken mailto/_blank or dead Calendly URL', () => {
    const cta = read('src/components/CTASection.tsx');
    expect(cta).not.toContain('mailto:hello@metreka.com?subject=Beta');
    expect(cta).not.toContain('calendly.com/metreka/demo');
    expect(cta).toContain('navigate("/auth")');
    expect(cta).toContain('/contact?topic=demo');
  });
});

describe('shopify sync capacity (S4)', () => {
  it('raises page cap and supports incremental updated_at_min', () => {
    const sync = read('supabase/functions/sync-store-data/index.ts');
    expect(sync).toMatch(/SHOPIFY_MAX_PAGES\s*=\s*40/);
    expect(sync).toContain('updated_at_min');
    expect(sync).toContain('shopifySinceParam');
  });
});
