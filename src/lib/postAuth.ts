import { supabase } from '@/integrations/supabase/client';

/** Where to send the user after a successful auth session. */
export async function getPostAuthPath(): Promise<'/onboarding' | '/dashboard'> {
  try {
    const { count, error } = await supabase
      .from('store_connections')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.warn('getPostAuthPath:', error.message);
      return '/onboarding';
    }

    return (count ?? 0) > 0 ? '/dashboard' : '/onboarding';
  } catch {
    return '/onboarding';
  }
}
