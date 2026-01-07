import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { saveStoreCredentials, StoreCredentials } from '@/lib/auth';
import { Loader2, Store, ArrowRight, Check } from 'lucide-react';

type StorePlatform = 'shopify' | 'lazada' | 'shopee';

interface PlatformOption {
  id: StorePlatform;
  name: string;
  description: string;
  icon: string;
}

const platforms: PlatformOption[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect your Shopify store',
    icon: '🛒',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    description: 'Connect your Lazada seller account',
    icon: '🛍️',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    description: 'Connect your Shopee seller account',
    icon: '🏪',
  },
];

const platformFields: Record<StorePlatform, { key: string; label: string; placeholder: string; type: string }[]> = {
  shopify: [
    { key: 'store_url', label: 'Store URL', placeholder: 'your-store.myshopify.com', type: 'text' },
    { key: 'api_key', label: 'API Key', placeholder: 'Enter your Shopify API key', type: 'password' },
    { key: 'access_token', label: 'Access Token', placeholder: 'Enter your access token', type: 'password' },
  ],
  lazada: [
    { key: 'app_key', label: 'App Key', placeholder: 'Enter your Lazada App Key', type: 'password' },
    { key: 'app_secret', label: 'App Secret', placeholder: 'Enter your App Secret', type: 'password' },
    { key: 'access_token', label: 'Access Token', placeholder: 'Enter your access token', type: 'password' },
  ],
  shopee: [
    { key: 'partner_id', label: 'Partner ID', placeholder: 'Enter your Partner ID', type: 'text' },
    { key: 'partner_key', label: 'Partner Key', placeholder: 'Enter your Partner Key', type: 'password' },
    { key: 'shop_id', label: 'Shop ID', placeholder: 'Enter your Shop ID', type: 'text' },
    { key: 'access_token', label: 'Access Token', placeholder: 'Enter your access token', type: 'password' },
  ],
};

export default function Onboarding() {
  const [step, setStep] = useState<'select' | 'credentials'>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<StorePlatform | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePlatformSelect = (platform: StorePlatform) => {
    setSelectedPlatform(platform);
    setCredentials({});
    setStep('credentials');
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setIsLoading(true);
    try {
      const storeCredentials: StoreCredentials = {
        platform: selectedPlatform,
        credentials,
      };
      
      await saveStoreCredentials(storeCredentials);
      
      toast({
        title: 'Store connected!',
        description: `Your ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} store has been connected successfully.`,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to save store credentials',
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

  const selectedPlatformData = platforms.find((p) => p.id === selectedPlatform);
  const fields = selectedPlatform ? platformFields[selectedPlatform] : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'select' ? 'Connect Your Store' : `Connect ${selectedPlatformData?.name}`}
          </CardTitle>
          <CardDescription>
            {step === 'select'
              ? 'Select your e-commerce platform to get started with analytics'
              : 'Enter your API credentials to sync your store data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'select' ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformSelect(platform.id)}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-colors text-left group"
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{platform.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t">
                <Button variant="ghost" className="w-full" onClick={handleSkip}>
                  Skip for now
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
