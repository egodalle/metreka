import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { login, register, requestPasswordReset } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'forgot-password') {
        await requestPasswordReset(email);
        setResetSent(true);
        toast({
          title: 'Reset email sent!',
          description: 'Check your inbox for password reset instructions.',
        });
      } else if (mode === 'login') {
        await login(email, password);
        await refreshUser();
        toast({
          title: 'Welcome back!',
          description: 'Redirecting to dashboard...',
        });
        navigate('/dashboard');
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        await register(email, password, name);
        await refreshUser();
        toast({
          title: 'Account created!',
          description: 'Let\'s connect your store...',
        });
        navigate('/onboarding');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'forgot-password') return 'Reset Password';
    if (mode === 'register') return 'Create Account';
    return 'Sign In';
  };

  const getDescription = () => {
    if (mode === 'forgot-password') {
      return resetSent
        ? 'Check your email for reset instructions'
        : 'Enter your email to receive a password reset link';
    }
    if (mode === 'register') return 'Fill in your details to get started';
    return 'Enter your credentials to access your dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {mode === 'forgot-password' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setResetSent(false);
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 self-start"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          )}
          <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'forgot-password' && resetSent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                If an account exists with <strong>{email}</strong>, you'll receive an email with instructions to reset your password.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode('login');
                  setResetSent(false);
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
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {mode !== 'forgot-password' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-sm text-primary hover:underline"
                        disabled={isLoading}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'forgot-password' ? 'Send Reset Link' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          )}
          {mode !== 'forgot-password' && (
            <div className="mt-4 text-center text-sm">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
