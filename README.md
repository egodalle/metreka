# Metreka

Multi-store e-commerce analytics for Shopify, Lazada, and Shopee — one dashboard, subscription billing via Paddle.

**Live app:** https://metreka-zvhr.vercel.app

## What it does

- Connect stores (Shopify Admin API token, Lazada, Shopee)
- Sync orders, products, and customers into Supabase
- Unified KPIs: revenue, orders, AOV, customers, products — with date ranges and per-platform breakdowns
- Auth via Supabase (email/password; Google optional)
- Billing via Paddle (Starter $29 / Growth $59 / Scale $79)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React + TypeScript (Vercel) |
| Backend | Supabase Auth, Postgres, Edge Functions |
| Billing | Paddle (sandbox or live) |
| Sync | `sync-store-data` edge function + optional pg_cron |

> The old FastAPI/`DataPulse`/Airbyte plan is **not** the product. Leftover FastAPI files live under [`archive/fastapi/`](archive/fastapi/) and are unused.

## Quick start

```bash
git clone https://github.com/egodalle/metreka.git
cd metreka
cp .env.example .env   # fill VITE_SUPABASE_* and Paddle client token
npm install
npm run dev            # http://localhost:8080
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local Vite server |
| `npm run build` | Production build |
| `npm test` | Vitest smoke tests |
| `npm run lint` | ESLint |

## Environment

Frontend (`.env` / Vercel):

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — required
- `VITE_APP_URL` — production origin (`https://metreka-zvhr.vercel.app`)
- `VITE_PADDLE_CLIENT_TOKEN` — Paddle client token
- `VITE_PADDLE_ENVIRONMENT` — `sandbox` or `production` (optional; inferred from token)
- `VITE_ENABLE_GOOGLE_AUTH=true` — show Google CTA (provider must be enabled in Supabase)

Edge Function secrets (Supabase Dashboard → Edge Functions → Secrets):

- `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `APP_URL`
- `STORE_CREDENTIALS_KEY` — encrypt store tokens
- Optional: `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET`, Lazada keys, `SYNC_CRON_SECRET`, `RESEND_API_KEY`

See [`.env.example`](.env.example) for the full checklist (auth redirects, Paddle webhook URL, Shopify App URL).

## Deploy

**Frontend:** push to `main` (Vercel). Framework Vite, build `npm run build`, output `dist`.

**Edge functions:**

```bash
npx supabase functions deploy create-checkout check-subscription customer-portal paddle-webhook store-connect sync-store-data send-contact-email billing-history --project-ref wwxhmxrsrqlirjfbmnsk
```

**Migrations:**

```bash
npx supabase db push --linked
```

### Beta ops checklist (required before inviting testers)

1. **`STORE_CREDENTIALS_KEY`** — set on Edge Function secrets. Without it, store connect returns 503 and credentials cannot be saved.
   ```bash
   npx supabase secrets set STORE_CREDENTIALS_KEY="$(openssl rand -base64 32)" --project-ref wwxhmxrsrqlirjfbmnsk
   ```
2. **Scheduled sync (every 6h)** — pricing promises scheduled sync; it is **not** enabled until you run this once in the Supabase SQL editor (after setting `SYNC_CRON_SECRET` on the `sync-store-data` function to the same value):
   ```sql
   SELECT public.schedule_store_sync_jobs(
     'https://wwxhmxrsrqlirjfbmnsk.supabase.co/functions/v1/sync-store-data',
     'your-SYNC_CRON_SECRET-value'
   );
   ```
   Requires `pg_cron` + `pg_net` extensions. Manual “Sync” on the dashboard still works without cron.
3. **Contact form** — deploy `send-contact-email` (included in the deploy command above). Submissions always insert into `contact_submissions`. Optional `RESEND_API_KEY` (+ optional `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL`) emails you a copy; without Resend, check the table in Supabase.

### Auth URLs (Supabase)

- Site URL: `https://metreka-zvhr.vercel.app`
- Redirects: `/auth/callback`, `/oauth/callback` (plus localhost equivalents for dev)

## Plans

| Tier | Price | Stores |
|------|-------|--------|
| Starter | $29/mo | 1 |
| Growth | $59/mo | up to 3 |
| Scale | $79/mo | up to 5 |

Sync is manual + scheduled (not “hourly API access”). Platforms: Shopify, Lazada, Shopee.

## Tests & CI

GitHub Actions runs `npm test` then `npm run build` on every push/PR to `main`.

Smoke coverage today:

- Dashboard date-period helpers
- Post-auth routing (stores → dashboard / else onboarding)
- Paddle client-token presence
- Subscription price IDs stay aligned with edge functions
- Shopee credential parse + HMAC signing
- Marketing honesty (starting price, no hourly/real-time claims, Sync stores label)
- Settings route + billing-history customer scoping
- Shopify sync page cap + incremental `updated_at_min`

## Project layout

```
src/                     React app
supabase/functions/      Edge functions (billing, sync, connect)
supabase/migrations/     SQL migrations
archive/fastapi/         Unused legacy FastAPI backend
scripts/                 One-off helpers (Paddle catalog, etc.)
```

## Support notes

- Prefer Shopify **Admin API access token** connect if OAuth Dev Dashboard Versions isn’t available.
- Password recovery uses `/auth/callback?flow=recovery`.
- Demo: `/demo` opens the dashboard without login (simulated data).
