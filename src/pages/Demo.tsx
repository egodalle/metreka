import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShopifyLogo, LazadaLogo, ShopeeLogo, StoreLogo } from "@/components/StoreLogos";
import { 
  ArrowLeft, ArrowRight, Check, Eye, EyeOff, Key, Link2, 
  TrendingUp, DollarSign, Users, ShoppingCart, Package, Activity, 
  Bell, Settings, Search, Plus, ArrowUpRight, ArrowDownRight, 
  BarChart3, Globe, PieChart, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type DemoStep = "login" | "stores" | "connect" | "dashboard";

const stores = [
  { id: "shopify", name: "Shopify", logo: ShopifyLogo, bgColor: "bg-[#96bf48]", authType: "oauth" },
  { id: "lazada", name: "Lazada", logo: LazadaLogo, bgColor: "bg-[#0f146d]", authType: "api" },
  { id: "shopee", name: "Shopee", logo: ShopeeLogo, bgColor: "bg-[#ee4d2d]", authType: "api" },
];

// Mock dashboard data
const mockDashboardData = {
  totalRevenue: "$404,832",
  totalOrders: 2319,
  avgOrderValue: "$174.49",
  revenueGrowth: 12.5,
  ordersGrowth: 8.2,
  platforms: [
    { name: "Lazada", revenue: "$212,724", orders: 1110, growth: 22.4 },
    { name: "Shopee", revenue: "$164,521", orders: 1109, growth: 18.7 },
    { name: "Shopify", revenue: "$27,587", orders: 100, growth: 14.2 },
  ],
  recentDays: [
    { day: "Dec 29", revenue: 31160, orders: 204 },
    { day: "Dec 30", revenue: 42307, orders: 258 },
    { day: "Dec 31", revenue: 46309, orders: 281 },
    { day: "Jan 1", revenue: 49257, orders: 291 },
    { day: "Jan 2", revenue: 52952, orders: 305 },
    { day: "Jan 3", revenue: 54505, orders: 304 },
    { day: "Jan 4", revenue: 57286, orders: 282 },
  ],
  topProducts: [
    { name: "Air Purifier HEPA Filter", revenue: "$15,320", units: 89, platform: "lazada" },
    { name: "Hair Dryer Professional", revenue: "$8,920", units: 445, platform: "shopee" },
    { name: "Water Bottle Insulated 750ml", revenue: "$8,450", units: 345, platform: "lazada" },
    { name: "Makeup Brush Set 12pcs", revenue: "$6,780", units: 113, platform: "shopee" },
    { name: "Smart LED Desk Lamp", revenue: "$6,890", units: 178, platform: "lazada" },
  ],
};

const KPICard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  isCurrency = false
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  isCurrency?: boolean;
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  );
};

const Demo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<DemoStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Dashboard state
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [storeFilter, setStoreFilter] = useState("all");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("stores");
  };

  const handleStoreSelect = (storeId: string) => {
    setSelectedStore(storeId);
    setStep("connect");
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setTimeout(() => {
        setStep("dashboard");
      }, 1000);
    }, 2000);
  };

  const handleOAuthConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setTimeout(() => {
        setStep("dashboard");
      }, 1000);
    }, 2000);
  };

  const selectedStoreData = stores.find(s => s.id === selectedStore);

  // Dashboard view (full page layout like actual dashboard)
  if (step === "dashboard") {
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
                <Badge variant="outline" className="text-green-500 border-green-500/30">
                  Connected
                </Badge>
                <Badge variant="outline" className="text-primary border-primary/30">
                  Demo Mode
                </Badge>
                
                {/* Connected Stores */}
                <div className="flex items-center gap-2">
                  {stores.slice(0, 4).map((store) => (
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
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground mt-1">Real-time data from your connected stores.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
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

          {/* Store Filter */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground mr-2">Store:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={storeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStoreFilter("all")}
              >
                All Stores
              </Button>
              {stores.slice(0, 4).map(store => (
                <Button
                  key={store.id}
                  variant={storeFilter === store.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStoreFilter(store.id)}
                  className="gap-2"
                >
                  <div className={`w-4 h-4 rounded ${store.bgColor} flex items-center justify-center`}>
                    <store.logo className="w-3 h-3 text-white" />
                  </div>
                  {store.name}
                </Button>
              ))}
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
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard 
                  title="Total Revenue"
                  value={mockDashboardData.totalRevenue}
                  change={mockDashboardData.revenueGrowth}
                  icon={DollarSign}
                  isCurrency
                />
                <KPICard 
                  title="Total Orders"
                  value={mockDashboardData.totalOrders.toLocaleString()}
                  change={mockDashboardData.ordersGrowth}
                  icon={ShoppingCart}
                />
                <KPICard 
                  title="Avg Order Value"
                  value={mockDashboardData.avgOrderValue}
                  icon={TrendingUp}
                  isCurrency
                />
                <KPICard 
                  title="Platforms"
                  value={4}
                  icon={Package}
                />
                <KPICard 
                  title="Today's Orders"
                  value={mockDashboardData.recentDays[6].orders}
                  change={15.3}
                  icon={Activity}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="border-border/50 bg-card/80">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Revenue Trend (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end gap-2">
                      {mockDashboardData.recentDays.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary/80"
                            style={{ height: `${(day.revenue / 26000) * 100}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{day.day}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Breakdown */}
                <Card className="border-border/50 bg-card/80">
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue by Platform</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockDashboardData.platforms.map((platform, i) => {
                      const PlatformLogo = stores[i]?.logo;
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${stores[i]?.bgColor || "bg-gray-500"} flex items-center justify-center p-1.5`}>
                              {PlatformLogo && <PlatformLogo className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                            <p className="font-medium">{platform.name}</p>
                            <p className="text-sm text-muted-foreground">{platform.orders.toLocaleString()} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{platform.revenue}</p>
                          <span className="text-sm text-green-500">+{platform.growth}%</span>
                        </div>
                      </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Top Products</CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockDashboardData.topProducts.map((product, i) => {
                      const platformStore = stores.find(s => s.id === product.platform);
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                            <div className={`w-8 h-8 rounded-lg ${platformStore?.bgColor || "bg-gray-500"} flex items-center justify-center p-1.5`}>
                              {platformStore && <platformStore.logo className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                            </div>
                          </div>
                          <p className="font-semibold text-lg">{product.revenue}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle>Product Analytics</CardTitle>
                  <CardDescription>Detailed product performance across all platforms</CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Product analytics with category breakdown, trends, and insights</p>
                    <p className="text-sm mt-2">Connect your store to see real data</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-6">
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle>Location Analytics</CardTitle>
                  <CardDescription>Geographic distribution of your sales</CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Location heatmaps, regional performance, and shipping analytics</p>
                    <p className="text-sm mt-2">Connect your store to see real data</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle>Customer Analytics</CardTitle>
                  <CardDescription>Customer segments, retention, and lifetime value</CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Customer cohorts, CLV analysis, and retention metrics</p>
                    <p className="text-sm mt-2">Connect your store to see real data</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profitability Tab */}
            <TabsContent value="profitability" className="space-y-6">
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle>Profitability Analytics</CardTitle>
                  <CardDescription>Margins, costs, and profit analysis</CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Profit margins, cost breakdown, and financial insights</p>
                    <p className="text-sm mt-2">Connect your store to see real data</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Onboarding flow (login, stores, connect steps)
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-primary border-primary/30">
              Demo Mode
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-4 mb-12">
          {["login", "stores", "connect", "dashboard"].map((s, i) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === s ? "bg-primary text-primary-foreground scale-110" : 
                ["login", "stores", "connect", "dashboard"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {["login", "stores", "connect", "dashboard"].indexOf(step) > i ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              {i < 3 && <div className={`w-16 h-0.5 ${["login", "stores", "connect", "dashboard"].indexOf(step) > i ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-xl mx-auto">
          {/* Login Step */}
          {step === "login" && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome to E-com.io</CardTitle>
                <CardDescription>Sign in to access your unified dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      type="email" 
                      placeholder="demo@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background/50 pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Store Selection Step */}
          {step === "stores" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Connect Your First Store</h2>
                <p className="text-muted-foreground">Choose a platform to start syncing your data</p>
              </div>
              <div className="grid gap-4">
                {stores.map((store) => (
                  <Card 
                    key={store.id}
                    className="cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur"
                    onClick={() => handleStoreSelect(store.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`w-12 h-12 rounded-lg ${store.bgColor} flex items-center justify-center p-2`}>
                        <store.logo className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {store.authType === "oauth" ? "Connect via OAuth" : "API Key Authentication"}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {store.authType === "oauth" ? (
                          <><Link2 className="w-3 h-3 mr-1" /> OAuth</>
                        ) : (
                          <><Key className="w-3 h-3 mr-1" /> API Key</>
                        )}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Connect Step */}
          {step === "connect" && selectedStoreData && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-xl ${selectedStoreData.bgColor} flex items-center justify-center mx-auto mb-4 p-3`}>
                  <selectedStoreData.logo className="w-9 h-9 text-white" />
                </div>
                <CardTitle>Connect {selectedStoreData.name}</CardTitle>
                <CardDescription>
                  {selectedStoreData.authType === "oauth" 
                    ? "Authorize access to your store securely" 
                    : "Enter your API credentials to connect"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-500">Connected Successfully!</h3>
                    <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
                  </div>
                ) : selectedStoreData.authType === "oauth" ? (
                  <div className="space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium">This will allow E-com.io to:</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Read your store orders and products</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Access customer information</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> View inventory and analytics</li>
                      </ul>
                    </div>
                    <Button onClick={handleOAuthConnect} className="w-full gap-2" disabled={isConnecting}>
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Authorize with {selectedStoreData.name}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="api" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="api">API Keys</TabsTrigger>
                      <TabsTrigger value="oauth">OAuth</TabsTrigger>
                    </TabsList>
                    <TabsContent value="api" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Key</label>
                        <Input 
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="bg-background/50 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Secret</label>
                        <Input 
                          type="password"
                          placeholder="Enter your API secret"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="bg-background/50 font-mono text-sm"
                        />
                      </div>
                      <Button onClick={handleConnect} className="w-full gap-2" disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            Connect Store
                          </>
                        )}
                      </Button>
                    </TabsContent>
                    <TabsContent value="oauth" className="space-y-4 mt-4">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium">This will allow E-com.io to:</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Read your store orders and products</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Access customer information</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> View inventory and analytics</li>
                        </ul>
                      </div>
                      <Button onClick={handleOAuthConnect} className="w-full gap-2" disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Authorize with {selectedStoreData.name}
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                )}
                {!isConnected && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => { setStep("stores"); setSelectedStore(null); }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Choose Different Store
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Demo;
