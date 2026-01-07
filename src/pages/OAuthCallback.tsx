import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback handler page
 * Platforms will redirect here after OAuth authorization
 * This page forwards the OAuth params to the onboarding page
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      // Redirect to onboarding with error
      navigate(`/onboarding?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`);
      return;
    }

    if (code && state) {
      // Forward to onboarding with OAuth params
      navigate(`/onboarding?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
    } else {
      // Invalid callback, redirect to onboarding
      navigate('/onboarding');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Completing Connection</CardTitle>
          <CardDescription>Please wait while we finish setting up your store...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}
