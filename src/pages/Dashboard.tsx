import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShopifyLogo, ShopeeLogo, LazadaLogo, StoreLogo } from "@/components/StoreLogos";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, DollarSign, 
  Users, ShoppingCart, Package, Activity, Settings, Plus, LogOut, CreditCard,
   ArrowUpRight, ArrowDownRight, BarChart3, AlertCircle, RefreshCw, PieChart
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDashboard, useHealthCheck } from "@/hooks/useDashboardData";
import { PlatformData, DailyData } from "@/lib/api";
import { periodToDateRange } from "@/lib/dashboardPeriod";
import { ProductAnalyticsSection } from "@/components/dashboard/ProductAnalyticsSection";
import { CustomerAnalyticsSection } from "@/components/dashboard/CustomerAnalyticsSection";
import { ProfitabilitySection } from "@/components/dashboard/ProfitabilitySection";
import { isDemoMode } from "@/lib/integrations";
import { useStoreConnections, useSyncStore } from "@/hooks/useStoreConnections";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useHasAccess, useCustomerPortal } from "@/hooks/useSubscription";
import { TrialBanner } from "@/components/TrialBanner";
import { PaywallModal } from "@/components/PaywallModal";
import { useQueryClient } from "@tanstack/react-query";

const allStores = [
  { id: "shopify", name: "Shopify", logo: ShopifyLogo, bgColor: "bg-[#96bf48]" },
  { id: "shopee", name: "Shopee", logo: ShopeeLogo, bgColor: "bg-[#ee4d2d]" },
  { id: "lazada", name: "Lazada", logo: LazadaLogo, bgColor: "bg-[#0f146d]" },
];

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

const formatPercent = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};

const KPICard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  isLoading,
  isCurrency = false
}: {
  title: string;
  value: string | number;
  change?: number | string;
  icon: React.ElementType;
  isLoading?: boolean;
  isCurrency?: boolean;
}) => {
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-16 h-5" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  const changeNum = typeof change === 'string' ? parseFloat(change) : change;
  const isPositive = changeNum !== undefined && changeNum >= 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {changeNum !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(changeNum).toFixed(2)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">
          {isCurrency ? formatCurrency(value) : (typeof value === 'number' ? formatNumber(value) : value)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  );
};

// Platform brand colors - shared across components
const platformColors: Record<string, { bg: string; text: string; stroke: string }> = {
  shopify: { bg: "bg-[#96bf48]", text: "text-[#96bf48]", stroke: "#96bf48" },
  shopee: { bg: "bg-[#ee4d2d]", text: "text-[#ee4d2d]", stroke: "#ee4d2d" },
  lazada: { bg: "bg-[#0f146d]", text: "text-[#0f146d]", stroke: "#0f146d" },
};

const PlatformRow = ({ platform }: { platform: PlatformData }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg ${platformColors[platform.platform]?.bg || "bg-gray-500"} flex items-center justify-center`}>
          <span className="text-white text-xs font-bold uppercase">
            {platform.platform.charAt(0)}
          </span>
        </div>
        <div>
          <p className="font-medium capitalize">{platform.platform}</p>
          <p className="text-sm text-muted-foreground">{formatNumber(platform.total_orders)} orders</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(platform.total_revenue)}</p>
        <span className="text-sm text-muted-foreground">
          {formatNumber(platform.total_units)} units
        </span>
      </div>
    </div>
  );
};

const ConnectionStatus = ({ isConnected, isLoading }: { isConnected: boolean; isLoading: boolean }) => {
  if (isLoading) {
    return <Badge variant="outline" className="animate-pulse">Connecting...</Badge>;
  }
  return isConnected ? (
    <Badge variant="outline" className="text-green-500 border-green-500/30">
      Connected
    </Badge>
  ) : (
    <Badge variant="outline" className="text-red-500 border-red-500/30">
      Disconnected
    </Badge>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, session } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Check subscription/trial access
  const { hasAccess, isTrialing, isLoading: accessLoading, subscription } = useHasAccess();
  const customerPortal = useCustomerPortal();
  const [showPaywall, setShowPaywall] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // After checkout success, refresh subscription and clear the query flag
  useEffect(() => {
    if (searchParams.get("subscription") !== "success") return;

    toast({
      title: "Payment received",
      description: "We're activating your subscription…",
    });

    void queryClient.invalidateQueries({ queryKey: ["subscription", session?.user?.id] });
    setShowPaywall(false);

    const next = new URLSearchParams(searchParams);
    next.delete("subscription");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, queryClient, session?.user?.id, toast]);

  // Overlay checkout completed (Paddle.js) — refresh without waiting for poll
  useEffect(() => {
    const onCompleted = () => {
      void queryClient.invalidateQueries({ queryKey: ["subscription", session?.user?.id] });
      setShowPaywall(false);
      toast({
        title: "Payment received",
        description: "Your subscription is being activated.",
      });
    };
    window.addEventListener("metreka:checkout-completed", onCompleted);
    return () => window.removeEventListener("metreka:checkout-completed", onCompleted);
  }, [queryClient, session?.user?.id, toast]);

  // Show paywall if access check is done and user has no access (skip in demo)
  useEffect(() => {
    if (isDemoMode()) {
      setShowPaywall(false);
      return;
    }
    if (!accessLoading && !hasAccess) {
      setShowPaywall(true);
    } else if (subscription?.subscribed || subscription?.isTrialing) {
      setShowPaywall(false);
    }
  }, [accessLoading, hasAccess, subscription?.subscribed, subscription?.isTrialing]);
  
  // Get actual store connections from the database
  const { data: storeConnections = [], isLoading: storeConnectionsLoading } = useStoreConnections();
  const syncStore = useSyncStore();
  const connectedPlatforms = storeConnections
    .filter(c => c.is_active)
    .map(c => c.platform);
  
  // Check if any stores are connected (only after loading completes)
  const hasConnectedStores = !storeConnectionsLoading && connectedPlatforms.length > 0;
  
  // Filter stores to show only connected ones (empty if none connected)
  const stores = hasConnectedStores
    ? allStores.filter(s => connectedPlatforms.includes(s.id as any))
    : [];
  
  const [selectedStore, setSelectedStore] = useState("all");
  
  // Sync selectedStore when connections load - if only 1 store, auto-select it
  useEffect(() => {
    if (connectedPlatforms.length === 1) {
      setSelectedStore(connectedPlatforms[0]);
    } else if (connectedPlatforms.length > 1) {
      setSelectedStore("all");
    }
  }, [connectedPlatforms.length]);
  
  const { data: healthData, isLoading: healthLoading } = useHealthCheck();
  const { data: dashboardData, isLoading: dashboardLoading, isError, error, refetch } = useDashboard(selectedPeriod);
  const { startDate: periodStart, endDate: periodEnd } = periodToDateRange(selectedPeriod);
  
  // Combined loading state: still loading if either connections or dashboard data loading
  const isLoading = storeConnectionsLoading || dashboardLoading;
  
  const isConnected = healthData?.status === "healthy";

  const handleSyncFromShopify = async () => {
    const activeStores = storeConnections.filter((c) => c.is_active);
    if (activeStores.length === 0) {
      toast({
        title: "No store connected",
        description: "Connect a store first to sync data.",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const store of activeStores) {
        await syncStore.mutateAsync(store.id);
      }
      toast({
        title: "Syncing stores",
        description: "Pulling your latest orders. This may take 10–20 seconds…",
      });
      // Edge function runs in background; allow time before refetching DB
      await new Promise((resolve) => setTimeout(resolve, 12000));
      await refetch();
      toast({ title: "Dashboard updated", description: "Latest store data loaded." });
    } catch {
      // useSyncStore already toasts errors
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out successfully" });
      navigate("/");
    } catch (error) {
      toast({ 
        title: "Error signing out", 
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive" 
      });
    }
  };

  // Get filtered data based on selected store filter AND connected platforms
  // Uses platform stats from the API - no need for separate sales query
  const getFilteredData = () => {
    // Return empty data if no dashboard data OR no stores connected
    if (!dashboardData || !hasConnectedStores) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        totalCustomers: 0,
        totalProducts: 0,
        platforms: [],
        dailyData: [],
      };
    }

    // First filter platforms to only include connected ones
    const connectedPlatformData = dashboardData.platforms?.filter(
      p => (connectedPlatforms as string[]).includes(p.platform)
    ) || [];

    // If "all" stores selected, aggregate from connected platforms only
    if (selectedStore === "all") {
      const totalRevenue = connectedPlatformData.reduce((acc, p) => acc + p.total_revenue, 0);
      const totalOrders = connectedPlatformData.reduce((acc, p) => acc + p.total_orders, 0);
      
      // Use the dashboard's total_customers and total_products which are already 
      // correctly aggregated from connected stores in demo mode
      return {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalCustomers: dashboardData.total_customers,
        totalProducts: dashboardData.total_products,
        platforms: connectedPlatformData,
        dailyData: dashboardData.daily_data,
      };
    }

    // Find the selected platform (must also be connected)
    const platform = connectedPlatformData.find(p => p.platform === selectedStore);
    if (!platform) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        totalCustomers: 0,
        totalProducts: 0,
        platforms: [],
        dailyData: [],
      };
    }

    // For individual platform, get stats from the per-platform demo data
    // The platform data has orders, revenue, units - we need customers/products from stats
    // Per-platform customer/product counts from synced tables
    const platformStats = getPlatformStats(selectedStore, dashboardData);

    return {
      totalRevenue: platform.total_revenue,
      totalOrders: platform.total_orders,
      avgOrderValue: platform.avg_order_value,
      totalCustomers: platformStats.customers,
      totalProducts: platformStats.products,
      platforms: [platform],
      dailyData: dashboardData.daily_data,
    };
  };

  // Helper to get per-platform customer/product counts from dashboard payload
  const getPlatformStats = (
    platform: string,
    data: typeof dashboardData,
  ): { customers: number; products: number } => {
    if (!data) return { customers: 0, products: 0 };

    if (isDemoMode()) {
      const platformStatsMap: Record<string, { customers: number; products: number }> = {
        shopify: { customers: 523, products: 156 },
        shopee: { customers: 1456, products: 234 },
        lazada: { customers: 987, products: 189 },
      };
      return platformStatsMap[platform] || { customers: 0, products: 0 };
    }

    const row = data.platforms?.find((p) => p.platform === platform);
    if (row) {
      return {
        customers: row.total_customers ?? 0,
        products: row.total_products ?? 0,
      };
    }

    const connectedCount = data.platforms?.length ?? 0;
    if (connectedCount <= 1) {
      return { customers: data.total_customers, products: data.total_products };
    }
    return { customers: 0, products: 0 };
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-background">
      {/* Paywall Modal for expired trials */}
      <PaywallModal open={showPaywall} trialExpired={!isTrialing} onOpenChange={setShowPaywall} />
      
      {/* Trial Banner */}
      <TrialBanner />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gradient-primary">Metreka</h1>
              {isDemoMode() && (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Demo Mode
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectionStatus isConnected={isConnected} isLoading={healthLoading} />
              
              {/* Connected Stores */}
              <div className="flex items-center gap-2">
                {stores.map((store) => (
                  <div key={store.id} className={`w-8 h-8 rounded-lg ${store.bgColor} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold uppercase">{store.id.charAt(0)}</span>
                  </div>
                ))}
              </div>
              
              <div className="h-6 w-px bg-border" />
              
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Settings">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/onboarding")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Manage stores
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (subscription?.subscribed) {
                        customerPortal.mutate();
                      } else {
                        setShowPaywall(true);
                      }
                    }}
                    disabled={customerPortal.isPending}
                  >
                    {customerPortal.isPending ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : subscription?.subscribed ? (
                      <CreditCard className="mr-2 h-4 w-4" />
                    ) : (
                      <TrendingUp className="mr-2 h-4 w-4" />
                    )}
                    {subscription?.subscribed ? 'Manage subscription' : 'Choose a plan'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPaywall(true)}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error State */}
        {isError && (
          <Card className="mb-6 border-red-500/50 bg-red-500/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-500">Connection Error</p>
                  <p className="text-sm text-muted-foreground">
                    {error?.message || "Failed to connect to API"}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Data from your connected stores. Sync to pull the latest orders and catalog.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSyncFromShopify}
              disabled={syncStore.isPending || !hasConnectedStores}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncStore.isPending ? "animate-spin" : ""}`} />
              {syncStore.isPending ? "Syncing…" : "Sync stores"}
            </Button>
            <Button variant="ghost" onClick={() => refetch()} className="gap-2" title="Reload dashboard from database">
              Refresh view
            </Button>
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value as "7d" | "30d" | "90d" | "1y")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2" onClick={() => navigate('/onboarding')}>
              <Plus className="w-4 h-4" />
              {connectedPlatforms.length > 0 ? 'Add Another Store' : 'Add Store'}
            </Button>
          </div>
        </div>

        {/* Store Filter - Only show if stores are connected */}
        {stores.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground mr-2">Store:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {stores.length > 1 && (
                <Button
                  variant={selectedStore === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStore("all")}
                  className="gap-2"
                >
                  All Stores
                </Button>
              )}
              {stores.map(store => (
                <Button
                  key={store.id}
                  variant={selectedStore === store.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStore(store.id)}
                  className="gap-2"
                >
                  <div className={`w-4 h-4 rounded ${store.bgColor} flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-bold uppercase">{store.id.charAt(0)}</span>
                  </div>
                  {store.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Connected stores info banner */}
        {stores.length > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {stores.map((store) => (
                      <div 
                        key={store.id}
                        className={`w-10 h-10 rounded-lg ${store.bgColor} flex items-center justify-center border-2 border-background`}
                      >
                        <span className="text-white text-sm font-bold uppercase">{store.id.charAt(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium">
                      {stores.length === 1 
                        ? `${stores[0].name} Store Connected`
                        : `${stores.length} Stores Connected`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isDemoMode() 
                        ? `Showing demo data for your connected ${stores.length === 1 ? 'store' : 'stores'}`
                        : `Syncing data from your connected ${stores.length === 1 ? 'store' : 'stores'}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="profitability" className="gap-2">
              <PieChart className="w-4 h-4" />
              Profitability
            </TabsTrigger>
          </TabsList>

          {/* Empty State - No Stores Connected */}
          {!isLoading && !hasConnectedStores && (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Stores Connected</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Connect your first store to start seeing your sales data, analytics, and insights across all your platforms.
                </p>
                <Button onClick={() => navigate('/onboarding')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Connect Your First Store
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Product Analytics Tab */}
          <TabsContent value="products" className="space-y-6">
            {hasConnectedStores ? (
              <ProductAnalyticsSection 
                isLoading={isLoading} 
                selectedStore={selectedStore}
                connectedPlatforms={connectedPlatforms}
                onStoreChange={setSelectedStore}
                startDate={periodStart}
                endDate={periodEnd}
              />
            ) : null}
          </TabsContent>


          {/* Customer Analytics Tab */}
          <TabsContent value="customers" className="space-y-6">
            {hasConnectedStores ? (
              <CustomerAnalyticsSection 
                isLoading={isLoading}
                selectedStore={selectedStore}
                connectedPlatforms={connectedPlatforms}
                onStoreChange={setSelectedStore}
                startDate={periodStart}
                endDate={periodEnd}
              />
            ) : null}
          </TabsContent>

          {/* Profitability Tab */}
          <TabsContent value="profitability" className="space-y-6">
            {hasConnectedStores ? (
              <ProfitabilitySection 
                isLoading={isLoading}
                selectedStore={selectedStore}
                connectedPlatforms={connectedPlatforms}
                onStoreChange={setSelectedStore}
                startDate={periodStart}
                endDate={periodEnd}
              />
            ) : null}
          </TabsContent>
 

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {hasConnectedStores && (
            <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <KPICard key={i} title="" value="" icon={Activity} isLoading />
                ))
              ) : (
                <>
                  <KPICard 
                    title="Total Revenue"
                    value={filteredData.totalRevenue}
                    icon={DollarSign}
                    isCurrency
                  />
                  <KPICard 
                    title="Total Orders"
                    value={filteredData.totalOrders}
                    icon={ShoppingCart}
                  />
                  <KPICard 
                    title="Avg Order Value"
                    value={filteredData.avgOrderValue}
                    icon={TrendingUp}
                    isCurrency
                  />
                  <KPICard 
                    title="Total Customers"
                    value={filteredData.totalCustomers}
                    icon={Users}
                  />
                  <KPICard 
                    title="Total Products"
                    value={filteredData.totalProducts}
                    icon={Package}
                  />
                </>
              )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Revenue Trend (Daily)</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <div className="h-48 flex items-end gap-2">
                      {filteredData.dailyData?.map((day, i) => {
                        const revenues = filteredData.dailyData.map(d => d.total_revenue);
                        const maxRevenue = Math.max(...revenues, 1);
                        const totalHeight = (day.total_revenue / maxRevenue) * 100;
                        
                        return (
                          <div 
                            key={i} 
                            className="flex-1 rounded-t hover:opacity-90 transition-opacity cursor-pointer group relative bg-primary"
                            style={{ 
                              height: `${Math.max(totalHeight, 5)}%`,
                            }}
                          >
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                              <p className="font-medium">{day.date}</p>
                              <p>{formatCurrency(day.total_revenue)}</p>
                              <p>{day.total_orders} orders</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue by Platform */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue by Platform</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Skeleton className="w-40 h-40 rounded-full" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="relative w-40 h-40">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-muted/20" />
                            {filteredData.platforms?.map((platform, i) => {
                              const totalRevenue = filteredData.platforms.reduce((acc, p) => acc + p.total_revenue, 0);
                              const percentage = (platform.total_revenue / totalRevenue) * 100;
                              const offset = filteredData.platforms
                                .slice(0, i)
                                .reduce((acc, p) => acc + ((p.total_revenue / totalRevenue) * 100 * 2.51), 0);
                              const strokeColor = platformColors[platform.platform]?.stroke || "#8b5cf6";
                              return (
                                <circle 
                                  key={platform.platform}
                                  cx="50" cy="50" r="40" 
                                  fill="none" 
                                  stroke={strokeColor}
                                  strokeWidth="20" 
                                  strokeDasharray={`${percentage * 2.51} 251`}
                                  strokeDashoffset={-offset}
                                />
                              );
                            })}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold">
                              {formatCurrency(filteredData.totalRevenue || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {filteredData.platforms?.map((platform) => {
                          const totalRevenue = filteredData.platforms.reduce((acc, p) => acc + p.total_revenue, 0);
                          const percentage = ((platform.total_revenue / totalRevenue) * 100).toFixed(1);
                          return (
                            <div key={platform.platform} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: platformColors[platform.platform]?.stroke || "#8b5cf6" }}
                                />
                                <span className="text-sm capitalize">{platform.platform}</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(platform.total_revenue)} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Platform Details / Daily Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Platform Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredData.platforms?.map((platform) => (
                        <PlatformRow key={platform.platform} platform={platform} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Daily Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredData.dailyData?.slice(-5).reverse().map((day) => (
                        <div key={day.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{day.date}</p>
                            <p className="text-sm text-muted-foreground">{day.total_orders} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(day.total_revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            </>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
