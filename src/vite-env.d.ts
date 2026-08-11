/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_METREKA_API_KEY?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_PADDLE_CLIENT_TOKEN?: string;
  readonly VITE_PADDLE_ENVIRONMENT?: 'sandbox' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
