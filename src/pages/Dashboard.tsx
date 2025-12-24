import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShopifyLogo, TikTokLogo, StoreLogo } from "@/components/StoreLogos";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, TrendingUp, DollarSign, 
  Users, ShoppingCart, Package, Activity, Bell, Settings, Search, Plus,
  ArrowUpRight, ArrowDownRight, BarChart3, AlertCircle, RefreshCw, Globe, PieChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard, useHealthCheck } from "@/hooks/useDashboardData";
import { PlatformData, DailyData } from "@/lib/api";
import { ProductAnalyticsSection } from "@/components/dashboard/ProductAnalyticsSection";
import { LocationAnalyticsSection } from "@/components/dashboard/LocationAnalyticsSection";
import { CustomerAnalyticsSection } from "@/components/dashboard/CustomerAnalyticsSection";
import { ProfitabilitySection } from "@/components/dashboard/ProfitabilitySection";

const stores = [
  { id: "shopify", name: "Shopify", logo: ShopifyLogo, bgColor: "bg-[#96bf48]" },
  { id: "amazon", name: "Amazon", logo: TikTokLogo, bgColor: "bg-[#ff9900]" },
  { id: "shopee", name: "Shopee", logo: TikTokLogo, bgColor: "bg-[#ee4d2d]" },
  { id: "lazada", name: "Lazada", logo: TikTokLogo, bgColor: "bg-[#0f146d]" },
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

const PlatformRow = ({ platform }: { platform: PlatformData }) => {
  const platformColors: Record<string, string> = {
    shopify: "bg-[#96bf48]",
    amazon: "bg-[#ff9900]",
    shopee: "bg-[#ee4d2d]",
    lazada: "bg-[#0f146d]",
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg ${platformColors[platform.platform] || "bg-gray-500"} flex items-center justify-center`}>
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
        <p className="font-semibold">{formatCurrency(platform.total_revenue_usd)}</p>
        <span className={`text-sm ${parseFloat(platform.revenue_mom_growth_pct) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercent(platform.revenue_mom_growth_pct)} MoM
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
  
  const { data: healthData, isLoading: healthLoading } = useHealthCheck();
  const { data: dashboardData, isLoading, isError, error, refetch } = useDashboard();

  const isConnected = healthData?.status === "healthy";

  // Get filtered data based on active tab
  const getFilteredData = () => {
    if (!dashboardData || activeTab === "overview") {
      return {
        totalRevenue: dashboardData?.total_revenue_usd || "0",
        totalOrders: dashboardData?.total_orders || 0,
        avgOrderValue: dashboardData?.avg_order_value_usd || "0",
        revenueGrowth: dashboardData?.revenue_growth_pct,
        ordersGrowth: dashboardData?.orders_growth_pct,
        platforms: dashboardData?.platforms || [],
        recentDays: dashboardData?.recent_days || [],
      };
    }

    // Find the selected platform
    const platform = dashboardData.platforms?.find(p => p.platform === activeTab);
    if (!platform) {
      return {
        totalRevenue: "0",
        totalOrders: 0,
        avgOrderValue: "0",
        revenueGrowth: undefined,
        ordersGrowth: undefined,
        platforms: [],
        recentDays: [],
      };
    }

    // Map recent days to platform-specific data
    const platformRevenueKey = `${activeTab}_revenue_usd` as keyof DailyData;
    const platformOrdersKey = `${activeTab}_orders` as keyof DailyData;

    const platformDays = dashboardData.recent_days?.map(day => ({
      ...day,
      total_revenue_usd: String(day[platformRevenueKey] || "0"),
      total_orders: Number(day[platformOrdersKey] || 0),
    })) || [];

    return {
      totalRevenue: platform.total_revenue_usd,
      totalOrders: platform.total_orders,
      avgOrderValue: platform.avg_order_value_usd,
      revenueGrowth: platform.revenue_mom_growth_pct,
      ordersGrowth: parseFloat(platform.orders_mom_growth_pct),
      platforms: [platform],
      recentDays: platformDays,
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
              <h1 className="text-xl font-bold text-gradient-primary">DataPulse</h1>
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
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Store
            </Button>
          </div>
        </div>

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
            <TabsTrigger value="locations" className="gap-2">
              <Globe className="w-4 h-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="profitability" className="gap-2">
              <PieChart className="w-4 h-4" />
              Profitability
            </TabsTrigger>
            {stores.map(store => (
              <TabsTrigger key={store.id} value={store.id} className="gap-2 capitalize">
                {store.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Product Analytics Tab */}
          <TabsContent value="products" className="space-y-6">
            <ProductAnalyticsSection isLoading={isLoading} />
          </TabsContent>

          {/* Location Analytics Tab */}
          <TabsContent value="locations" className="space-y-6">
            <LocationAnalyticsSection isLoading={isLoading} />
          </TabsContent>

          {/* Customer Analytics Tab */}
          <TabsContent value="customers" className="space-y-6">
            <CustomerAnalyticsSection isLoading={isLoading} />
          </TabsContent>

          {/* Profitability Tab */}
          <TabsContent value="profitability" className="space-y-6">
            <ProfitabilitySection isLoading={isLoading} />
          </TabsContent>

          <TabsContent value={activeTab} className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <KPICard key={i} title="" value="" icon={Activity} isLoading />
                ))
              ) : (
                <>
                  <KPICard 
                    title={activeTab === "overview" ? "Total Revenue" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Revenue`}
                    value={filteredData.totalRevenue}
                    change={filteredData.revenueGrowth}
                    icon={DollarSign}
                    isCurrency
                  />
                  <KPICard 
                    title={activeTab === "overview" ? "Total Orders" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders`}
                    value={filteredData.totalOrders}
                    change={filteredData.ordersGrowth}
                    icon={ShoppingCart}
                  />
                  <KPICard 
                    title="Avg Order Value"
                    value={filteredData.avgOrderValue}
                    icon={TrendingUp}
                    isCurrency
                  />
                  {activeTab === "overview" ? (
                    <>
                      <KPICard 
                        title="Platforms"
                        value={dashboardData?.platforms?.length || 0}
                        icon={Package}
                      />
                      <KPICard 
                        title="Today's Orders"
                        value={dashboardData?.recent_days?.[0]?.total_orders || 0}
                        icon={Activity}
                      />
                    </>
                  ) : (
                    <>
                      <KPICard 
                        title="This Month Orders"
                        value={filteredData.platforms[0]?.orders_this_month || 0}
                        icon={Package}
                      />
                      <KPICard 
                        title="Today's Orders"
                        value={filteredData.platforms[0]?.orders_today || 0}
                        icon={Activity}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {activeTab === "overview" ? "Revenue Trend (Last 7 Days)" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Revenue (Last 7 Days)`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <div className="h-48 flex items-end gap-2">
                      {filteredData.recentDays?.slice().reverse().map((day, i) => {
                        const revenues = filteredData.recentDays.map(d => parseFloat(d.total_revenue_usd));
                        const maxRevenue = Math.max(...revenues, 1);
                        const height = (parseFloat(day.total_revenue_usd) / maxRevenue) * 100;
                        return (
                          <div 
                            key={i} 
                            className="flex-1 bg-primary/60 rounded-t hover:bg-primary/80 transition-colors cursor-pointer group relative"
                            style={{ height: `${Math.max(height, 5)}%` }}
                          >
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                              <p className="font-medium">{day.order_date}</p>
                              <p>{formatCurrency(day.total_revenue_usd)}</p>
                              <p>{day.total_orders} orders</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Store Breakdown or Platform Details */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {activeTab === "overview" ? "Revenue by Platform" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Metrics`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Skeleton className="w-40 h-40 rounded-full" />
                    </div>
                  ) : activeTab === "overview" ? (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="relative w-40 h-40">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-muted/20" />
                            {dashboardData?.platforms?.map((platform, i) => {
                              const totalRevenue = dashboardData.platforms.reduce((acc, p) => acc + parseFloat(p.total_revenue_usd), 0);
                              const percentage = (parseFloat(platform.total_revenue_usd) / totalRevenue) * 100;
                              const offset = dashboardData.platforms
                                .slice(0, i)
                                .reduce((acc, p) => acc + ((parseFloat(p.total_revenue_usd) / totalRevenue) * 100 * 2.51), 0);
                              const colors = ["text-green-500", "text-orange-500", "text-red-500", "text-blue-500"];
                              return (
                                <circle 
                                  key={platform.platform}
                                  cx="50" cy="50" r="40" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="20" 
                                  className={colors[i % colors.length]}
                                  strokeDasharray={`${percentage * 2.51} 251`}
                                  strokeDashoffset={-offset}
                                />
                              );
                            })}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold">
                              {formatCurrency(dashboardData?.total_revenue_usd || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {dashboardData?.platforms?.map((platform, i) => {
                          const totalRevenue = dashboardData.platforms.reduce((acc, p) => acc + parseFloat(p.total_revenue_usd), 0);
                          const percentage = ((parseFloat(platform.total_revenue_usd) / totalRevenue) * 100).toFixed(1);
                          const colors = ["bg-green-500", "bg-orange-500", "bg-red-500", "bg-blue-500"];
                          return (
                            <div key={platform.platform} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                                <span className="text-sm capitalize">{platform.platform}</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(platform.total_revenue_usd)} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    // Platform-specific metrics
                    <div className="space-y-4">
                      {filteredData.platforms[0] && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Payment Rate</p>
                              <p className="text-2xl font-bold">{parseFloat(filteredData.platforms[0].payment_rate || "0").toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
                              <p className="text-2xl font-bold">{parseFloat(filteredData.platforms[0].fulfillment_rate || "0").toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                              <p className="text-2xl font-bold">{parseFloat(filteredData.platforms[0].cancellation_rate || "0").toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Avg Items/Order</p>
                              <p className="text-2xl font-bold">{parseFloat(filteredData.platforms[0].avg_items_per_order || "0").toFixed(1)}</p>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-2">Month over Month</p>
                            <div className="flex justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">This Month</p>
                                <p className="font-semibold">{formatCurrency(filteredData.platforms[0].revenue_this_month_usd)}</p>
                                <p className="text-sm">{filteredData.platforms[0].orders_this_month} orders</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Last Month</p>
                                <p className="font-semibold">{formatCurrency(filteredData.platforms[0].revenue_last_month_usd)}</p>
                                <p className="text-sm">{filteredData.platforms[0].orders_last_month} orders</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Platform Details / Daily Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeTab === "overview" && (
                <Card className="border-border/50 bg-card/80">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Platform Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dashboardData?.platforms?.map((platform) => (
                          <PlatformRow key={platform.platform} platform={platform} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className={`border-border/50 bg-card/80 ${activeTab !== "overview" ? "lg:col-span-2" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {activeTab === "overview" ? "Daily Summary" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Daily Summary`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className={`space-y-3 ${activeTab !== "overview" ? "grid grid-cols-1 md:grid-cols-2 gap-3" : ""}`}>
                      {filteredData.recentDays?.slice(0, activeTab === "overview" ? 5 : 7).map((day) => (
                        <div key={day.order_date} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{day.order_date}</p>
                            <p className="text-sm text-muted-foreground">{day.total_orders} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(day.total_revenue_usd)}</p>
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
