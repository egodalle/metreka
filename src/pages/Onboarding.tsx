import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, ArrowRight, Check, ExternalLink, RefreshCw, ShieldCheck, Package, ShoppingCart, BarChart3, Users } from 'lucide-react';
import {
  StorePlatform,
  platformConfigs,
  apiKeyFields,
  startIntegration,
  submitCredentials,
  completeOAuthCallback,
  getSyncStatus,
  SyncStatus,
  isDemoMode,
  addConnectedDemoStore,
} from '@/lib/integrations';
import { Badge } from '@/components/ui/badge';
import { useStoreConnections } from '@/hooks/useStoreConnections';

type OnboardingStep = 'select' | 'permission' | 'connecting' | 'credentials' | 'syncing' | 'complete';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<StorePlatform | null>(null);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  // Poll sync status when in syncing step
  useEffect(() => {
    if (step !== 'syncing' || !storeId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getSyncStatus(storeId);
        setSyncStatus(status);
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          // Save the connected store in demo mode
          if (isDemoMode() && selectedPlatform) {
            addConnectedDemoStore(selectedPlatform);
          }
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
  }, [step, storeId, toast]);

  const handleOAuthCallback = async (code: string, state: string) => {
    setStep('connecting');
    setIsLoading(true);
    
    try {
      const connection = await completeOAuthCallback(code, state);
      setStoreId(connection.id);
      setSelectedPlatform(connection.platform);
      
      if (connection.sync_status === 'syncing' || connection.sync_status === 'pending') {
        setStep('syncing');
        setSyncStatus({ status: connection.sync_status });
      } else if (connection.sync_status === 'completed') {
        setStep('complete');
      }
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to complete OAuth',
        variant: 'destructive',
      });
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  // Get already connected platforms from the database
  const { data: storeConnections = [] } = useStoreConnections();
  const connectedPlatforms = storeConnections
    .filter(c => c.is_active)
    .map(c => c.platform);
  
  const availablePlatforms = platformConfigs.filter(
    p => !connectedPlatforms.includes(p.id as any)
  );

  const handlePlatformSelect = (platform: StorePlatform) => {
    setSelectedPlatform(platform);
    // Go to permission step first in demo mode
    if (isDemoMode()) {
      setStep('permission');
    } else {
      initiateConnection(platform);
    }
  };

  const initiateConnection = async (platform: StorePlatform) => {
    setIsLoading(true);
    
    try {
      const response = await startIntegration(platform);
      setIntegrationId(response.integration_id);
      
      if (response.redirect_url) {
        // OAuth flow - redirect to platform
        window.location.href = response.redirect_url;
      } else if (response.requires_credentials) {
        // API key flow - show credentials form
        setStep('credentials');
      } else if (isDemoMode()) {
        // Demo mode for OAuth platforms - simulate direct connection
        const storeId = `store_${platform}_${Date.now()}`;
        sessionStorage.setItem(`demo_store_${storeId}`, JSON.stringify({ startTime: Date.now(), platform }));
        setStoreId(storeId);
        setStep('syncing');
        setSyncStatus({ status: 'syncing', progress: 0 });
      }
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to start integration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
    if (!selectedPlatform || !integrationId) return;

    setIsLoading(true);
    try {
      // Submit credentials - they're sent ONCE, encrypted, never returned
      const connection = await submitCredentials(integrationId, selectedPlatform, credentials);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Setup skipped',
      description: 'You can connect your store later from the dashboard settings.',
    });
    navigate('/dashboard');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const selectedPlatformConfig = platformConfigs.find((p) => p.id === selectedPlatform);
  const fields = selectedPlatform ? apiKeyFields[selectedPlatform] || [] : [];

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-4">
            {/* Show already connected stores */}
            {connectedPlatforms.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-muted-foreground">Connected stores:</p>
                <div className="flex flex-wrap gap-2">
                  {storeConnections.filter(c => c.is_active).map((store) => {
                    const config = platformConfigs.find(p => p.id === store.platform);
                    return (
                      <div
                        key={store.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30"
                      >
                        <span className="text-xl">{config?.icon}</span>
                        <span className="text-sm font-medium text-green-700">{config?.name}</span>
                        <Check className="h-4 w-4 text-green-600" />
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
                      disabled={isLoading}
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
                {connectedPlatforms.length > 0 ? 'Go to Dashboard' : 'Skip for now'}
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
              <p className="text-sm font-medium text-foreground">DataPulse will access:</p>
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
                <p className="text-sm font-medium text-green-700">Your data is secure</p>
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
              <Button className="flex-1" onClick={handlePermissionGrant} disabled={isLoading}>
                {isLoading ? (
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
                  disabled={isLoading}
                />
              </div>
            ))}
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('select');
                  setSelectedPlatform(null);
                  setCredentials({});
                  setIntegrationId(null);
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
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
            
            <Button className="w-full" onClick={handleGoToDashboard}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'select':
        return 'Connect Your Store';
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
        return 'Select your e-commerce platform to get started with analytics';
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
    </div>
  );
}
