import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Public callback for Supabase Auth OAuth (Google, etc.).
 * Must NOT be behind ProtectedRoute — session is established here after redirect.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);

      const oauthError =
        params.get('error_description') ||
        params.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (oauthError) {
        setError(oauthError);
        return;
      }

      const code = params.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setError('Sign-in could not be completed. Please try again.');
    };

    completeSignIn();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{error ? 'Sign-in failed' : 'Signing you in'}</CardTitle>
          <CardDescription>
            {error ?? 'Completing Google sign-in...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {error ? (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" />
              <Button onClick={() => navigate('/auth', { replace: true })}>
                Back to sign in
              </Button>
            </>
          ) : (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
