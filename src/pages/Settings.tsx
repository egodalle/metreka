import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useHasAccess, useCustomerPortal } from '@/hooks/useSubscription';
import { PaywallModal } from '@/components/PaywallModal';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/integrations';
import {
  ArrowLeft,
  Loader2,
  LogOut,
  ExternalLink,
  RefreshCw,
  Store,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

type BillingItem = {
  id: string;
  billedAt: string | null;
  status: string;
  total: string;
  currency?: string;
  invoiceUrl?: string | null;
};

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isAuthenticated } = useAuth();
  const { subscription, isTrialing, daysLeftInTrial, hasAccess } = useHasAccess();
  const customerPortal = useCustomerPortal();
  const [showPaywall, setShowPaywall] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [billing, setBilling] = useState<BillingItem[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode()) {
      setName('Demo User');
      setEmail('demo@metreka.com');
      setLoadingProfile(false);
      return;
    }
    if (!isAuthenticated || !user) return;

    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setName(user.user_metadata?.name || '');
        setEmail(user.email || '');
      } else {
        setName(data?.name || user.user_metadata?.name || '');
        setEmail(data?.email || user.email || '');
      }
      setLoadingProfile(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isDemoMode() || !isAuthenticated) return;

    let cancelled = false;
    (async () => {
      setBillingLoading(true);
      setBillingError(null);
      const { data, error } = await supabase.functions.invoke('billing-history', { body: {} });
      if (cancelled) return;
      if (error) {
        setBillingError(error.message || 'Could not load billing history');
        setBilling([]);
      } else if (data?.error) {
        setBillingError(data.error);
        setBilling([]);
      } else {
        setBilling((data?.items as BillingItem[]) || []);
      }
      setBillingLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode()) {
      toast({ title: 'Demo mode', description: 'Profile edits are disabled in demo.' });
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({
        title: 'Could not save',
        description: err instanceof Error ? err.message : 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const planLabel = subscription?.subscribed
    ? (subscription.tier || 'paid')
    : isTrialing
      ? 'trial'
      : 'none';

  const canOpenPortal = Boolean(subscription?.subscribed);

  return (
    <div className="min-h-screen bg-background">
      <PaywallModal
        open={showPaywall}
        trialExpired={!isTrialing}
        onOpenChange={setShowPaywall}
      />
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details for Metreka.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={isDemoMode()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} disabled />
                  <p className="text-xs text-muted-foreground">Email is managed by your login provider.</p>
                </div>
                <Button type="submit" disabled={saving || isDemoMode()}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save profile
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Plan access and billing portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Current plan</span>
              <Badge variant="secondary" className="capitalize">{planLabel}</Badge>
              {isTrialing && (
                <span className="text-sm text-muted-foreground">
                  {daysLeftInTrial} day{daysLeftInTrial === 1 ? '' : 's'} left in trial
                </span>
              )}
              {!hasAccess && (
                <span className="text-sm text-destructive">No active access</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {canOpenPortal ? (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => customerPortal.mutate()}
                  disabled={customerPortal.isPending || isDemoMode()}
                >
                  {customerPortal.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Open billing portal
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowPaywall(true)}
                  disabled={isDemoMode()}
                >
                  <TrendingUp className="w-4 h-4" />
                  Choose a plan
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={() => navigate('/onboarding')}>
                <Store className="w-4 h-4" />
                Manage stores
              </Button>
            </div>
            {!canOpenPortal && !isDemoMode() && (
              <p className="text-xs text-muted-foreground">
                The Paddle billing portal is available after you subscribe. Trial accounts manage access by choosing a plan.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing history</CardTitle>
            <CardDescription>Recent Paddle transactions for this account.</CardDescription>
          </CardHeader>
          <CardContent>
            {isDemoMode() ? (
              <p className="text-sm text-muted-foreground">Billing history is unavailable in demo mode.</p>
            ) : billingLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            ) : billingError ? (
              <p className="text-sm text-destructive">{billingError}</p>
            ) : billing.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet. After you subscribe, invoices will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {billing.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.total}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.status}
                        {item.billedAt ? ` · ${new Date(item.billedAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    {item.invoiceUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={item.invoiceUrl} target="_blank" rel="noreferrer" className="gap-1">
                          Invoice
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
