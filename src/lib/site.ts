/** Canonical production URL — set VITE_APP_URL on Vercel. */
export const APP_URL =
  import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://metreka-zvhr.vercel.app');

export const AUTH_CALLBACK_URL = `${APP_URL}/auth/callback`;
export const OAUTH_CALLBACK_URL = `${APP_URL}/oauth/callback`;
