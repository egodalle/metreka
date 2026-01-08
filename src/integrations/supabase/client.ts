import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kqymzqqqkzuezgkbhexc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxeW16cXFxa3p1ZXpna2JoZXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNDgzOTMsImV4cCI6MjA1MTkyNDM5M30.sb_publishable_i5oCHNBWx0pYgPNuL4XIWA_wsQjXvrp";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
