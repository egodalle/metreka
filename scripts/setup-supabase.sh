#!/usr/bin/env bash
# Metreka — one-time Supabase setup for project wwxhmxrsrqlirjfbmnsk
# Usage: ./scripts/setup-supabase.sh
set -euo pipefail

PROJECT_REF="wwxhmxrsrqlirjfbmnsk"
SYNC_URL="https://${PROJECT_REF}.supabase.co/functions/v1/sync-store-data"

echo "==> Metreka Supabase setup (project: ${PROJECT_REF})"
echo ""

if ! command -v openssl &>/dev/null; then
  echo "openssl is required to generate secrets."
  exit 1
fi

STORE_KEY="${STORE_CREDENTIALS_KEY:-$(openssl rand -hex 32)}"
CRON_SECRET="${SYNC_CRON_SECRET:-$(openssl rand -hex 32)}"

echo "==> 1. Login (browser opens if needed)"
npx supabase login

echo "==> 2. Link project"
npx supabase link --project-ref "${PROJECT_REF}"

echo "==> 3. Push database migrations"
npx supabase db push

echo "==> 4. Set edge function secrets"
npx supabase secrets set \
  "STORE_CREDENTIALS_KEY=${STORE_KEY}" \
  "SYNC_CRON_SECRET=${CRON_SECRET}"

echo ""
echo "Optional — add billing/contact when ready:"
echo "  npx supabase secrets set PADDLE_API_KEY=..."
echo "  npx supabase secrets set PADDLE_WEBHOOK_SECRET=..."
echo "  npx supabase secrets set APP_URL=https://metreka.vercel.app"
echo "  npx supabase secrets set RESEND_API_KEY=..."
echo ""
echo "Also add frontend Paddle client token to .env / Vercel:"
echo "  VITE_PADDLE_CLIENT_TOKEN=test_... or live_..."
echo "  VITE_PADDLE_ENVIRONMENT=sandbox   # only if needed"
echo ""
echo "Paddle webhook URL:"
echo "  https://${PROJECT_REF}.supabase.co/functions/v1/paddle-webhook"
echo ""

echo "==> 5. Deploy edge functions"
npx supabase functions deploy

echo ""
echo "==> 6. Schedule sync every 6 hours"
echo "Run this in Supabase Dashboard → SQL Editor:"
echo ""
cat <<SQL
SELECT public.schedule_store_sync_jobs(
  '${SYNC_URL}',
  '${CRON_SECRET}'
);
SQL
echo ""
echo "SAVE THIS — SYNC_CRON_SECRET: ${CRON_SECRET}"
echo ""
echo "==> 7. Frontend .env"
echo "Dashboard → Project Settings → API → copy anon key into .env:"
echo "  VITE_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
echo "  VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>"
echo ""
echo "==> 8. Auth redirects (Dashboard → Authentication → URL Configuration)"
echo "  Site URL: https://metreka.vercel.app (or your custom domain)"
echo "  Redirect URLs:"
echo "    http://localhost:8080/auth/callback"
echo "    https://metreka.vercel.app/auth/callback"
echo "    http://localhost:8080/oauth/callback"
echo "    https://metreka.vercel.app/oauth/callback"
echo ""
echo "Done. Start app: npm run dev"
