import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kqymzqqqkzuezgkbhexc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxeW16cXFxa3p1ZXpna2JoZXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzA4ODMsImV4cCI6MjA4MzQ0Njg4M30.5o-EK29RHwDamdrgjgBkFihsUr-m1SnqsZ7hogrkAN8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
