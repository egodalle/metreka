import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, ArrowRight, Check, ExternalLink, RefreshCw, ShieldCheck, Package, ShoppingCart, BarChart3, Users, Unlink, ArrowLeft } from 'lucide-react';
import {
  StorePlatform,
  platformConfigs,
  apiKeyFields,
  oauthCapablePlatforms,
  getSyncStatus,
  SyncStatus,
  isDemoMode,
} from '@/lib/integrations';
import { startOAuthConnection, getOAuthStatus } from '@/lib/stores';

import { Badge } from '@/components/ui/badge';
import { useStoreConnections, useConnectStore, useDisconnectStore } from '@/hooks/useStoreConnections';
import { useHasAccess } from '@/hooks/useSubscription';

type OnboardingStep = 'select' | 'permission' | 'connecting' | 'credentials' | 'syncing' | 'complete';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<StorePlatform | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [oauthReady, setOauthReady] = useState<{ shopify: boolean; lazada: boolean } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Database hooks for store management
  const { data: storeConnections = [], refetch: refetchConnections } = useStoreConnections();
  const connectStore = useConnectStore();
  const disconnectStore = useDisconnectStore();
  const { hasAccess, subscription } = useHasAccess();
  const storeLimit = subscription?.storeLimit ?? 0;

  // Disconnect dialog state
  const [disconnectDialog, setDisconnectDialog] = useState<{
    open: boolean;
    storeId: string | null;
    storeName: string | null;
    platform: string | null;
  }>({
    open: false,
    storeId: null,
    storeName: null,
    platform: null,
  });

  // Get connected platforms from database
  const connectedPlatforms = storeConnections
    .filter(c => c.is_active)
    .map(c => c.platform);

  const availablePlatforms = platformConfigs.filter(
    p => !connectedPlatforms.includes(p.id as any)
  );

  // Poll sync status when in syncing step
  useEffect(() => {
    if (step !== 'credentials') return;
    getOAuthStatus()
      .then((status) => setOauthReady({ shopify: status.shopify, lazada: status.lazada }))
      .catch(() => setOauthReady({ shopify: false, lazada: false }));
  }, [step, selectedPlatform]);

  useEffect(() => {
    if (step !== 'syncing' || !storeId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getSyncStatus(storeId);
        setSyncStatus(status);
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          // Refetch connections to update the list
          refetchConnections();
          setStep('complete');
          toast({
            title: 'Store connected!',
            description: 'Your store data has been synced successfully.',
          });
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          toast({
            title: 'Sync failed',
            description: status.error || 'Failed to sync store data',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to poll sync status:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [step, storeId, toast, refetchConnections]);

  const handlePlatformSelect = (platform: StorePlatform) => {
    if (!hasAccess) {
      toast({
        title: 'Subscription required',
        description: 'Start your free trial or subscribe to connect a store.',
        variant: 'destructive',
      });
      return;
    }
    if (connectedPlatforms.length >= storeLimit) {
      toast({
        title: 'Store limit reached',
        description: `Your plan allows ${storeLimit} store(s). Upgrade to add more.`,
        variant: 'destructive',
      });
      return;
    }
    setSelectedPlatform(platform);
    setStep('permission');
  };

  const initiateConnection = async (platform: StorePlatform) => {
    // All platforms collect credentials in-app; OAuth is offered as an
    // alternative on the credentials step when the provider app is configured.
    setStep('credentials');
  };

  const handleOAuthConnect = async () => {
    if (!selectedPlatform) return;

    if (selectedPlatform === 'shopify') {
      const raw = credentials.storeUrl?.trim() ?? '';
      if (!raw) {
        toast({
          title: 'Store domain required',
          description: 'Enter your Shopify store domain first (e.g. my-store.myshopify.com), then click Connect with Shopify.',
          variant: 'destructive',
        });
        return;
      }
    }

    setStep('connecting');
    try {
      const authorizeUrl = await startOAuthConnection(
        selectedPlatform,
        credentials.storeUrl,
      );
      window.location.href = authorizeUrl;
    } catch (error) {
      toast({
        title: 'OAuth unavailable',
        description: error instanceof Error ? error.message : 'Could not start OAuth',
        variant: 'destructive',
      });
      setStep('credentials');
    }
  };

  const handlePermissionGrant = () => {
    if (selectedPlatform) {
      initiateConnection(selectedPlatform);
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    try {
      const connection = await connectStore.mutateAsync({
        platform: selectedPlatform,
        storeUrl: credentials.storeUrl,
        credentials,
      });

      // Clear credentials from state immediately (security)
      setCredentials({});
      setStoreId(connection.id);
      
      // Move to syncing step
      setStep('syncing');
      setSyncStatus({ status: 'pending' });
      
      toast({
        title: 'Credentials saved',
        description: 'Starting data sync...',
      });

    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to save credentials',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = (storeId: string, storeName: string | null, platform: string) => {
    setDisconnectDialog({ 
      open: true, 
      storeId, 
      storeName: storeName || 'this store',
      platform 
    });
  };

  const confirmDisconnect = async () => {
    if (!disconnectDialog.storeId) return;
    try {
      await disconnectStore.mutateAsync(disconnectDialog.storeId);
      setDisconnectDialog({ open: false, storeId: null, storeName: null, platform: null });
      refetchConnections();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleAddAnother = () => {
    setStep('select');
    setSelectedPlatform(null);
    setStoreId(null);
    setSyncStatus(null);
  };

  const selectedPlatformConfig = platformConfigs.find((p) => p.id === selectedPlatform);
  const fields = selectedPlatform ? apiKeyFields[selectedPlatform] || [] : [];

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-4">
            {/* Show already connected stores with disconnect option */}
            {connectedPlatforms.length > 0 && (
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-muted-foreground">Connected stores:</p>
                <div className="space-y-2">
                  {storeConnections.filter(c => c.is_active).map((store) => {
                    const config = platformConfigs.find(p => p.id === store.platform);
                    return (
                      <div
                        key={store.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{config?.icon}</span>
                          <div>
                            <span className="font-medium text-green-700 dark:text-green-400">{config?.name}</span>
                            {store.store_name && (
                              <p className="text-xs text-muted-foreground">{store.store_name}</p>
                            )}
                          </div>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleDisconnect(store.id, store.store_name, store.platform)}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {availablePlatforms.length > 0 ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  {connectedPlatforms.length > 0 ? 'Add another store:' : 'Select a platform:'}
                </p>
                <div className="grid gap-3">
                  {availablePlatforms.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handlePlatformSelect(platform.id)}
                      disabled={connectStore.isPending}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-colors text-left group disabled:opacity-50"
                    >
                      <span className="text-3xl">{platform.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {platform.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                      </div>
                      {platform.connectionMethod === 'oauth' ? (
                        <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      ) : (
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium">All platforms connected!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You've connected all available e-commerce platforms.
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full" onClick={handleSkip}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {connectedPlatforms.length > 0 ? 'Back to Dashboard' : 'Skip for now'}
              </Button>
            </div>
          </div>
        );

      case 'permission':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-3xl">{selectedPlatformConfig?.icon}</span>
              <div>
                <h3 className="font-semibold">{selectedPlatformConfig?.name}</h3>
                <p className="text-sm text-muted-foreground">wants to access your store data</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Metreka will access:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Product Catalog</p>
                    <p className="text-xs text-muted-foreground">View your products, variants, and inventory</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Order History</p>
                    <p className="text-xs text-muted-foreground">Read order details, status, and fulfillment data</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Customer Information</p>
                    <p className="text-xs text-muted-foreground">Access customer profiles and purchase history</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Analytics & Reports</p>
                    <p className="text-xs text-muted-foreground">Sales metrics, revenue data, and trends</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Your data is secure</p>
                <p className="text-xs text-muted-foreground">We use read-only access and encrypt all credentials</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('select');
                  setSelectedPlatform(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handlePermissionGrant} 
                disabled={connectStore.isPending}
              >
                {connectStore.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Allow Access
              </Button>
            </div>
          </div>
        );

      case 'connecting':
        return (
          <div className="flex flex-col items-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Connecting to {selectedPlatformConfig?.name}...</p>
          </div>
        );

      case 'credentials':
        return (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Your credentials are encrypted and stored securely. They are never exposed to the frontend after submission.
              </p>
            </div>

            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                  required
                  disabled={connectStore.isPending}
                />
              </div>
            ))}

            {selectedPlatform && oauthCapablePlatforms.includes(selectedPlatform) && oauthReady?.[selectedPlatform] && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-medium">Prefer one-click authorization?</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPlatform === 'shopify'
                    ? 'Enter your store domain below, then sign in on Shopify — we receive the access token automatically.'
                    : `Sign in on ${selectedPlatformConfig?.name} and we'll receive the access token automatically.`}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOAuthConnect}
                  disabled={selectedPlatform === 'shopify' && !credentials.storeUrl?.trim()}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect with {selectedPlatformConfig?.name}
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('select');
                  setSelectedPlatform(null);
                  setCredentials({});
                }}
                disabled={connectStore.isPending}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={connectStore.isPending}>
                {connectStore.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Connect Store
              </Button>
            </div>
          </form>
        );

      case 'syncing':
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-semibold">Syncing your store data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {syncStatus?.message || 'This may take a few minutes...'}
                </p>
              </div>
            </div>
            
            {syncStatus?.progress !== undefined && (
              <div className="space-y-2">
                <Progress value={syncStatus.progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {syncStatus.progress}% complete
                </p>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full" onClick={handleGoToDashboard}>
                Continue to dashboard (sync in background)
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Store connected!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your {selectedPlatformConfig?.name} store is ready to use.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button className="w-full" onClick={handleGoToDashboard}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              {availablePlatforms.length > 0 && (
                <Button variant="outline" className="w-full" onClick={handleAddAnother}>
                  Add Another Store
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'select':
        return connectedPlatforms.length > 0 ? 'Manage Stores' : 'Connect Your Store';
      case 'permission':
        return 'Grant Access';
      case 'connecting':
        return `Connecting to ${selectedPlatformConfig?.name}`;
      case 'credentials':
        return `Connect ${selectedPlatformConfig?.name}`;
      case 'syncing':
        return 'Syncing Data';
      case 'complete':
        return 'Setup Complete';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'select':
        return connectedPlatforms.length > 0 
          ? 'Add new stores or manage existing connections'
          : 'Select your e-commerce platform to get started with analytics';
      case 'permission':
        return 'Review the data we need to power your analytics';
      case 'connecting':
        return 'Please wait while we establish a secure connection';
      case 'credentials':
        return 'Enter your API credentials to connect your store';
      case 'syncing':
        return 'Importing your products, orders, and analytics';
      case 'complete':
        return 'Your store is connected and data is ready';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {isDemoMode() && (
            <Badge variant="secondary" className="mx-auto mb-2 bg-amber-500/10 text-amber-600 border-amber-500/20">
              Demo Mode
            </Badge>
          )}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialog.open} onOpenChange={(open) => setDisconnectDialog({ ...disconnectDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect Store</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect "{disconnectDialog.storeName}"? This will stop syncing data from this store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog({ open: false, storeId: null, storeName: null, platform: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect} disabled={disconnectStore.isPending}>
              {disconnectStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
