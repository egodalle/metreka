import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShopifyLogo, TikTokLogo, StoreLogo } from "@/components/StoreLogos";
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, 
  Users, ShoppingCart, Package, Eye, RotateCcw, Star, 
  ArrowUpRight, ArrowDownRight, BarChart3, Activity, Bell, Settings, Search, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const stores = [
  { id: "shopify", name: "Shopify", logo: ShopifyLogo, bgColor: "bg-[#96bf48]" },
  { id: "tiktok", name: "TikTok Shop", logo: TikTokLogo, bgColor: "bg-black" },
];

// Mock data for KPIs
const overviewKPIs = {
  totalRevenue: { value: "$284,532", change: 12.5, trend: "up" },
  totalOrders: { value: "3,847", change: 8.2, trend: "up" },
  avgOrderValue: { value: "$73.95", change: -2.1, trend: "down" },
  totalCustomers: { value: "2,156", change: 15.3, trend: "up" },
  conversionRate: { value: "3.24%", change: 0.8, trend: "up" },
  returnRate: { value: "4.2%", change: -1.2, trend: "down" },
};

const shopifyKPIs = {
  revenue: { value: "$186,234", change: 14.2, trend: "up" },
  orders: { value: "2,341", change: 9.8, trend: "up" },
  avgOrderValue: { value: "$79.54", change: 3.2, trend: "up" },
  customers: { value: "1,456", change: 12.1, trend: "up" },
  newCustomers: { value: "234", change: 18.5, trend: "up" },
  returningCustomers: { value: "1,222", change: 8.4, trend: "up" },
  cartAbandonmentRate: { value: "68.5%", change: -2.3, trend: "down" },
  productViews: { value: "45,234", change: 22.1, trend: "up" },
  topProducts: [
    { name: "Premium Wireless Headphones", revenue: "$12,450", units: 156 },
    { name: "Smart Watch Pro", revenue: "$9,820", units: 89 },
    { name: "Bluetooth Speaker", revenue: "$7,340", units: 234 },
  ],
};

const tiktokKPIs = {
  revenue: { value: "$98,298", change: 28.7, trend: "up" },
  orders: { value: "1,506", change: 34.2, trend: "up" },
  avgOrderValue: { value: "$65.27", change: -4.3, trend: "down" },
  customers: { value: "700", change: 42.1, trend: "up" },
  videoViews: { value: "1.2M", change: 56.3, trend: "up" },
  engagementRate: { value: "8.4%", change: 12.1, trend: "up" },
  affiliateSales: { value: "$23,456", change: 45.2, trend: "up" },
  liveStreamRevenue: { value: "$15,230", change: 67.8, trend: "up" },
  topProducts: [
    { name: "Viral Beauty Serum", revenue: "$8,920", units: 445 },
    { name: "LED Face Mask", revenue: "$6,780", units: 113 },
    { name: "Portable Blender", revenue: "$5,430", units: 271 },
  ],
};

const recentOrders = [
  { id: "#ORD-7834", customer: "Sarah M.", amount: "$127.50", status: "Delivered", store: "shopify", time: "2h ago" },
  { id: "#ORD-7833", customer: "John D.", amount: "$89.99", status: "Processing", store: "tiktok", time: "3h ago" },
  { id: "#ORD-7832", customer: "Emma W.", amount: "$245.00", status: "Shipped", store: "shopify", time: "4h ago" },
  { id: "#ORD-7831", customer: "Mike R.", amount: "$56.75", status: "Delivered", store: "tiktok", time: "5h ago" },
  { id: "#ORD-7830", customer: "Lisa K.", amount: "$312.00", status: "Processing", store: "shopify", time: "6h ago" },
];

const KPICard = ({ title, value, change, trend, icon: Icon, subtitle }: {
  title: string;
  value: string;
  change?: number;
  trend?: "up" | "down";
  icon: React.ElementType;
  subtitle?: string;
}) => (
  <Card className="border-border/50 bg-card/80 backdrop-blur hover:shadow-lg transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

const MiniChart = ({ data, color }: { data: number[]; color: string }) => (
  <div className="h-16 flex items-end gap-1">
    {data.map((h, i) => (
      <div 
        key={i}
        className={`flex-1 ${color} rounded-t transition-all hover:opacity-80`}
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

const DemoDashboard = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/demo")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-gradient-primary">E-com.io</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-primary border-primary/30">
                Demo Mode
              </Badge>
              
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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your store performance overview.</p>
          </div>
          
          <div className="flex items-center gap-3">
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KPICard title="Total Revenue" value={overviewKPIs.totalRevenue.value} change={overviewKPIs.totalRevenue.change} trend={overviewKPIs.totalRevenue.trend as "up" | "down"} icon={DollarSign} />
              <KPICard title="Total Orders" value={overviewKPIs.totalOrders.value} change={overviewKPIs.totalOrders.change} trend={overviewKPIs.totalOrders.trend as "up" | "down"} icon={ShoppingCart} />
              <KPICard title="Avg Order Value" value={overviewKPIs.avgOrderValue.value} change={overviewKPIs.avgOrderValue.change} trend={overviewKPIs.avgOrderValue.trend as "up" | "down"} icon={TrendingUp} />
              <KPICard title="Total Customers" value={overviewKPIs.totalCustomers.value} change={overviewKPIs.totalCustomers.change} trend={overviewKPIs.totalCustomers.trend as "up" | "down"} icon={Users} />
              <KPICard title="Conversion Rate" value={overviewKPIs.conversionRate.value} change={overviewKPIs.conversionRate.change} trend={overviewKPIs.conversionRate.trend as "up" | "down"} icon={Activity} />
              <KPICard title="Return Rate" value={overviewKPIs.returnRate.value} change={overviewKPIs.returnRate.change} trend={overviewKPIs.returnRate.trend as "up" | "down"} icon={RotateCcw} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 flex items-center gap-1">
                      <ShopifyLogo className="w-3 h-3" /> Shopify
                    </Badge>
                    <Badge variant="outline" className="bg-pink-500/10 text-pink-500 border-pink-500/30 flex items-center gap-1">
                      <TikTokLogo className="w-3 h-3" /> TikTok
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 90, 75, 95, 70, 85, 60, 100].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-1">
                        <div className="bg-green-500/60 rounded-t" style={{ height: `${h * 0.6}%` }} />
                        <div className="bg-pink-500/60 rounded-t" style={{ height: `${h * 0.4}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>
                </CardContent>
              </Card>

              {/* Store Breakdown */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue by Store</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-muted/20" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-green-500" strokeDasharray="165 251" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-pink-500" strokeDasharray="86 251" strokeDashoffset="-165" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">$284K</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Shopify</span>
                      </div>
                      <span className="font-semibold">$186,234 (65%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <span className="text-sm">TikTok Shop</span>
                      </div>
                      <span className="font-semibold">$98,298 (35%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg ${order.store === "shopify" ? "bg-[#96bf48]" : "bg-black"} flex items-center justify-center p-1.5`}>
                          <StoreLogo store={order.store} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.customer}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.amount}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={order.status === "Delivered" ? "default" : order.status === "Shipped" ? "secondary" : "outline"} className="text-xs">
                            {order.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{order.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shopify Tab */}
          <TabsContent value="shopify" className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#96bf48] flex items-center justify-center p-2">
                <ShopifyLogo className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Shopify Store</h3>
                <p className="text-sm text-muted-foreground">Connected • Last synced 5 mins ago</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Revenue" value={shopifyKPIs.revenue.value} change={shopifyKPIs.revenue.change} trend="up" icon={DollarSign} />
              <KPICard title="Orders" value={shopifyKPIs.orders.value} change={shopifyKPIs.orders.change} trend="up" icon={ShoppingCart} />
              <KPICard title="Avg Order Value" value={shopifyKPIs.avgOrderValue.value} change={shopifyKPIs.avgOrderValue.change} trend="up" icon={TrendingUp} />
              <KPICard title="Total Customers" value={shopifyKPIs.customers.value} change={shopifyKPIs.customers.change} trend="up" icon={Users} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="New Customers" value={shopifyKPIs.newCustomers.value} change={shopifyKPIs.newCustomers.change} trend="up" icon={Users} subtitle="This month" />
              <KPICard title="Returning Customers" value={shopifyKPIs.returningCustomers.value} change={shopifyKPIs.returningCustomers.change} trend="up" icon={RotateCcw} subtitle="This month" />
              <KPICard title="Cart Abandonment" value={shopifyKPIs.cartAbandonmentRate.value} change={shopifyKPIs.cartAbandonmentRate.change} trend="down" icon={ShoppingCart} subtitle="Lower is better" />
              <KPICard title="Product Views" value={shopifyKPIs.productViews.value} change={shopifyKPIs.productViews.change} trend="up" icon={Eye} subtitle="This month" />
            </div>

            {/* Top Products */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shopifyKPIs.topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">{product.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TikTok Tab */}
          <TabsContent value="tiktok" className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center p-2">
                <TikTokLogo className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">TikTok Shop</h3>
                <p className="text-sm text-muted-foreground">Connected • Last synced 2 mins ago</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Revenue" value={tiktokKPIs.revenue.value} change={tiktokKPIs.revenue.change} trend="up" icon={DollarSign} />
              <KPICard title="Orders" value={tiktokKPIs.orders.value} change={tiktokKPIs.orders.change} trend="up" icon={ShoppingCart} />
              <KPICard title="Avg Order Value" value={tiktokKPIs.avgOrderValue.value} change={tiktokKPIs.avgOrderValue.change} trend="down" icon={TrendingDown} />
              <KPICard title="Total Customers" value={tiktokKPIs.customers.value} change={tiktokKPIs.customers.change} trend="up" icon={Users} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Video Views" value={tiktokKPIs.videoViews.value} change={tiktokKPIs.videoViews.change} trend="up" icon={Eye} subtitle="Total views" />
              <KPICard title="Engagement Rate" value={tiktokKPIs.engagementRate.value} change={tiktokKPIs.engagementRate.change} trend="up" icon={Star} subtitle="Likes, comments, shares" />
              <KPICard title="Affiliate Sales" value={tiktokKPIs.affiliateSales.value} change={tiktokKPIs.affiliateSales.change} trend="up" icon={Users} subtitle="From creators" />
              <KPICard title="Live Stream Revenue" value={tiktokKPIs.liveStreamRevenue.value} change={tiktokKPIs.liveStreamRevenue.change} trend="up" icon={Activity} subtitle="This month" />
            </div>

            {/* Top Products */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tiktokKPIs.topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">{product.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DemoDashboard;
