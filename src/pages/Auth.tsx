import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getPostAuthPath } from '@/lib/postAuth';
import { Loader2, ArrowLeft, Mail, Lock, User } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'update-password';

/** Google is disabled in supabase/config.toml until provider secrets are configured. */
const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    signIn,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    isAuthenticated,
    isLoading,
  } = useAuth();

  // Password recovery deep-link from email (/auth?reset=true) or AuthCallback
  useEffect(() => {
    const wantsReset = searchParams.get('reset') === 'true';
    if (wantsReset) {
      setMode('update-password');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  // Redirect authenticated users away from login/register (but not password update)
  useEffect(() => {
    if (!isLoading && isAuthenticated && mode !== 'update-password' && mode !== 'forgot-password') {
      void getPostAuthPath().then((path) => navigate(path));
    }
  }, [isAuthenticated, isLoading, navigate, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'forgot-password') {
        await resetPassword(email);
        setResetSent(true);
        toast({
          title: 'Reset email sent!',
          description: 'Check your inbox for password reset instructions.',
        });
      } else if (mode === 'update-password') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await updatePassword(password);
        toast({
          title: 'Password updated',
          description: 'You can now use your new password to sign in.',
        });
        setSearchParams({}, { replace: true });
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        navigate('/dashboard', { replace: true });
      } else if (mode === 'login') {
        await signIn(email, password);
        toast({
          title: 'Welcome back!',
          description: 'Redirecting...',
        });
        navigate(await getPostAuthPath());
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { name: name.trim() },
          },
        });
        if (error) throw error;

        if (data.session) {
          toast({
            title: 'Account created!',
            description: 'Redirecting to store setup...',
          });
          navigate(await getPostAuthPath());
        } else {
          toast({
            title: 'Check your email',
            description:
              'We sent a confirmation link. After confirming, sign in to continue. For local dev, disable email confirmation in Supabase → Authentication → Providers → Email.',
            duration: 10000,
          });
        }
        return;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setResetSent(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTitle = () => {
    if (mode === 'forgot-password') return 'Reset Password';
    if (mode === 'update-password') return 'Choose a New Password';
    if (mode === 'register') return 'Create Account';
    return 'Sign In';
  };

  const getDescription = () => {
    if (mode === 'forgot-password') {
      return resetSent
        ? 'Check your email for reset instructions'
        : 'Enter your email to receive a password reset link';
    }
    if (mode === 'update-password') return 'Enter and confirm your new password';
    if (mode === 'register') return 'Fill in your details to get started';
    return 'Enter your credentials to access your dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gradient-primary">{getTitle()}</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'forgot-password' && resetSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  If an account exists with <strong>{email}</strong>, you'll receive an email with instructions to reset your password.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMode('login');
                    resetForm();
                  }}
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
                {mode !== 'update-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
                {(mode === 'login' || mode === 'register' || mode === 'update-password') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">
                        {mode === 'update-password' ? 'New password' : 'Password'}
                      </Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-sm text-primary hover:underline"
                          disabled={isSubmitting}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
                {mode === 'update-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'forgot-password'
                    ? 'Send Reset Link'
                    : mode === 'update-password'
                      ? 'Update Password'
                      : mode === 'login'
                        ? 'Sign In'
                        : 'Create Account'}
                </Button>
              </form>
            )}
            {mode !== 'forgot-password' && mode !== 'update-password' && GOOGLE_AUTH_ENABLED && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting || isGoogleSubmitting}
                  onClick={async () => {
                    setIsGoogleSubmitting(true);
                    try {
                      await signInWithGoogle();
                    } catch (error) {
                      toast({
                        title: 'Google sign-in failed',
                        description: error instanceof Error ? error.message : 'Something went wrong',
                        variant: 'destructive',
                      });
                      setIsGoogleSubmitting(false);
                    }
                  }}
                >
                  {isGoogleSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>
              </>
            )}
            {mode !== 'forgot-password' && mode !== 'update-password' && (
              <div className="mt-4 text-center text-sm">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    resetForm();
                  }}
                  className="text-primary hover:underline font-medium"
                  disabled={isSubmitting}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
