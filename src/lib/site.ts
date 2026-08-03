/** Canonical production URL — set VITE_APP_URL in hosting env (e.g. Vercel). */
export const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080');

export const AUTH_CALLBACK_URL = `${APP_URL}/auth/callback`;
export const OAUTH_CALLBACK_URL = `${APP_URL}/oauth/callback`;
