import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShopifyLogo, ShopeeLogo, LazadaLogo, StoreLogo } from "@/components/StoreLogos";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, TrendingUp, DollarSign, 
  Users, ShoppingCart, Package, Activity, Bell, Settings, Search, Plus,
  ArrowUpRight, ArrowDownRight, BarChart3, AlertCircle, RefreshCw, PieChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard, useHealthCheck } from "@/hooks/useDashboardData";
import { PlatformData, DailyData, getConnectedDemoStore } from "@/lib/api";
import { ProductAnalyticsSection } from "@/components/dashboard/ProductAnalyticsSection";
import { CustomerAnalyticsSection } from "@/components/dashboard/CustomerAnalyticsSection";
import { ProfitabilitySection } from "@/components/dashboard/ProfitabilitySection";
import { isDemoMode } from "@/lib/integrations";

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
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  
  // In demo mode, only show the connected store
  const connectedDemoStore = isDemoMode() ? getConnectedDemoStore() : null;
  const stores = isDemoMode() && connectedDemoStore 
    ? allStores.filter(s => s.id === connectedDemoStore)
    : allStores;
  
  const [selectedStore, setSelectedStore] = useState(connectedDemoStore || "all");
  
  const { data: healthData, isLoading: healthLoading } = useHealthCheck();
  const { data: dashboardData, isLoading, isError, error, refetch } = useDashboard();

  const isConnected = healthData?.status === "healthy";

  // Get filtered data based on selected store filter
  const getFilteredData = () => {
    if (!dashboardData) {
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

    // If "all" stores selected, return full dashboard data
    if (selectedStore === "all") {
      return {
        totalRevenue: dashboardData.total_revenue,
        totalOrders: dashboardData.total_orders,
        avgOrderValue: dashboardData.avg_order_value,
        totalCustomers: dashboardData.total_customers,
        totalProducts: dashboardData.total_products,
        platforms: dashboardData.platforms,
        dailyData: dashboardData.daily_data,
      };
    }

    // Find the selected platform
    const platform = dashboardData.platforms?.find(p => p.platform === selectedStore);
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

    return {
      totalRevenue: platform.total_revenue,
      totalOrders: platform.total_orders,
      avgOrderValue: platform.avg_order_value,
      totalCustomers: 0,
      totalProducts: 0,
      platforms: [platform],
      dailyData: dashboardData.daily_data, // Daily data is aggregate only for now
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-gradient-primary">GrowthPulse</h1>
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
              
              <Button variant="ghost" size="icon">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
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
            <p className="text-muted-foreground mt-1">Real-time data from your connected stores.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
              {isDemoMode() && connectedDemoStore ? 'Add Another Store' : 'Add Store'}
            </Button>
          </div>
        </div>

        {/* Store Filter - Only show if multiple stores or not in demo mode */}
        {(!isDemoMode() || stores.length > 1) && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground mr-2">Store:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {!isDemoMode() && (
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

        {/* Connected store info in demo mode */}
        {isDemoMode() && connectedDemoStore && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${stores[0]?.bgColor} flex items-center justify-center`}>
                <span className="text-white text-sm font-bold uppercase">{connectedDemoStore.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium capitalize">{connectedDemoStore} Store Connected</p>
                <p className="text-sm text-muted-foreground">Showing demo data for your connected store</p>
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

          {/* Product Analytics Tab */}
          <TabsContent value="products" className="space-y-6">
            <ProductAnalyticsSection 
              isLoading={isLoading} 
              selectedStore={selectedStore}
              onStoreChange={setSelectedStore}
            />
          </TabsContent>


          {/* Customer Analytics Tab */}
          <TabsContent value="customers" className="space-y-6">
            <CustomerAnalyticsSection 
              isLoading={isLoading}
              selectedStore={selectedStore}
              onStoreChange={setSelectedStore}
            />
          </TabsContent>

          {/* Profitability Tab */}
          <TabsContent value="profitability" className="space-y-6">
            <ProfitabilitySection 
              isLoading={isLoading}
              selectedStore={selectedStore}
              onStoreChange={setSelectedStore}
            />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
