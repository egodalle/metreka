import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { completeOAuthConnection } from '@/lib/stores';
import { useToast } from '@/hooks/use-toast';

/**
 * OAuth callback handler.
 * Exchanges the authorization code for an access token via the
 * `store-connect` edge function, then returns the user to onboarding.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (oauthError) {
      setError(errorDescription || oauthError);
      return;
    }

    if (!code || !state) {
      setError('The authorization response was missing a code or state value.');
      return;
    }

    completeOAuthConnection(code, state)
      .then((connection) => {
        toast({
          title: 'Store connected!',
          description: `${connection.store_name} is now syncing.`,
        });
        navigate('/onboarding', { replace: true });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to complete the connection.');
      });
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{error ? 'Connection failed' : 'Completing Connection'}</CardTitle>
          <CardDescription>
            {error ?? 'Please wait while we finish setting up your store...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {error ? (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" />
              <Button onClick={() => navigate('/onboarding', { replace: true })}>
                Back to store setup
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
