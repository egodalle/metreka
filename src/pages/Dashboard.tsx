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
  ArrowUpRight, ArrowDownRight, BarChart3, AlertCircle, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard, useHealthCheck } from "@/hooks/useDashboardData";
import { KPI, Order, Product } from "@/lib/api";

const stores = [
  { id: "shopify", name: "Shopify", logo: ShopifyLogo, bgColor: "bg-[#96bf48]" },
  { id: "tiktok", name: "TikTok Shop", logo: TikTokLogo, bgColor: "bg-black" },
];

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

const KPICard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  isLoading 
}: {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  isLoading?: boolean;
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

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${changeType === "increase" ? "text-green-500" : "text-red-500"}`}>
              {changeType === "increase" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  );
};

const OrderRow = ({ order }: { order: Order }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-lg ${order.store === "shopify" ? "bg-[#96bf48]" : "bg-black"} flex items-center justify-center p-1.5`}>
        <StoreLogo store={order.store} className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-medium">{order.orderNumber}</p>
        <p className="text-sm text-muted-foreground">{order.customer}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold">{formatCurrency(order.total)}</p>
      <Badge 
        variant={order.status === "delivered" ? "default" : order.status === "shipped" ? "secondary" : "outline"} 
        className="text-xs capitalize"
      >
        {order.status}
      </Badge>
    </div>
  </div>
);

const ProductRow = ({ product, index }: { product: Product; index: number }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
    <div className="flex items-center gap-4">
      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
      <div>
        <p className="font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">{product.unitsSold} units sold</p>
      </div>
    </div>
    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
  </div>
);

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

  // Map KPIs to icons
  const kpiIcons: Record<string, React.ElementType> = {
    revenue: DollarSign,
    orders: ShoppingCart,
    customers: Users,
    aov: TrendingUp,
    conversion: Activity,
    products: Package,
  };

  const getKPIIcon = (kpiId: string) => {
    const id = kpiId.toLowerCase();
    for (const [key, icon] of Object.entries(kpiIcons)) {
      if (id.includes(key)) return icon;
    }
    return Activity;
  };

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
              <h1 className="text-xl font-bold text-gradient-primary">E-com.io</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectionStatus isConnected={isConnected} isLoading={healthLoading} />
              
              {/* Connected Stores */}
              <div className="flex items-center gap-2">
                {stores.map((store) => (
                  <div key={store.id} className={`w-8 h-8 rounded-lg ${store.bgColor} flex items-center justify-center p-1.5`}>
                    <store.logo className="w-5 h-5 text-white" />
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
                    {error?.message || "Failed to connect to API. Make sure FastAPI is running on localhost:8000"}
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
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="shopify" className="gap-2">
              <ShopifyLogo className="w-4 h-4" />
              Shopify
            </TabsTrigger>
            <TabsTrigger value="tiktok" className="gap-2">
              <TikTokLogo className="w-4 h-4" />
              TikTok Shop
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <KPICard key={i} title="" value="" icon={Activity} isLoading />
                ))
              ) : (
                dashboardData?.kpis?.map((kpi: KPI) => (
                  <KPICard 
                    key={kpi.id}
                    title={kpi.name}
                    value={kpi.value}
                    change={kpi.change}
                    changeType={kpi.changeType}
                    icon={getKPIIcon(kpi.id)}
                  />
                ))
              )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <div className="h-48 flex items-end gap-2">
                      {dashboardData?.revenueTimeline?.map((data, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-primary/60 rounded-t hover:bg-primary/80 transition-colors"
                          style={{ height: `${Math.min((data.revenue / Math.max(...(dashboardData.revenueTimeline?.map(d => d.revenue) || [1]))) * 100, 100)}%` }}
                          title={`${data.date}: ${formatCurrency(data.revenue)}`}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Store Breakdown */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue by Store</CardTitle>
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
                            {dashboardData?.storeBreakdown?.map((store, i) => {
                              const offset = dashboardData.storeBreakdown
                                .slice(0, i)
                                .reduce((acc, s) => acc + (s.percentage * 2.51), 0);
                              const colors = ["text-green-500", "text-pink-500", "text-blue-500", "text-yellow-500"];
                              return (
                                <circle 
                                  key={store.store}
                                  cx="50" cy="50" r="40" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="20" 
                                  className={colors[i % colors.length]}
                                  strokeDasharray={`${store.percentage * 2.51} 251`}
                                  strokeDashoffset={-offset}
                                />
                              );
                            })}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">
                              {formatCurrency(dashboardData?.storeBreakdown?.reduce((acc, s) => acc + s.revenue, 0) || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {dashboardData?.storeBreakdown?.map((store, i) => {
                          const colors = ["bg-green-500", "bg-pink-500", "bg-blue-500", "bg-yellow-500"];
                          return (
                            <div key={store.store} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                                <span className="text-sm capitalize">{store.store}</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(store.revenue)} ({store.percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData?.recentOrders?.slice(0, 5).map((order) => (
                        <OrderRow key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Top Products</CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData?.topProducts?.slice(0, 5).map((product, i) => (
                        <ProductRow key={product.id} product={product} index={i} />
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
