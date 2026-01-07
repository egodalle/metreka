import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, ArrowRight, Check, ExternalLink, RefreshCw } from 'lucide-react';
import {
  StorePlatform,
  platformConfigs,
  apiKeyFields,
  startIntegration,
  submitCredentials,
  completeOAuthCallback,
  getSyncStatus,
  SyncStatus,
} from '@/lib/integrations';

type OnboardingStep = 'select' | 'connecting' | 'credentials' | 'syncing' | 'complete';

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

  const handlePlatformSelect = async (platform: StorePlatform) => {
    setSelectedPlatform(platform);
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
            <div className="grid gap-3">
              {platformConfigs.map((platform) => (
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
            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full" onClick={handleSkip}>
                Skip for now
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
