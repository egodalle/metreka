import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShopifyLogo, ShopeeLogo, LazadaLogo, StoreLogo } from "@/components/StoreLogos";
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, 
  Users, ShoppingCart, Package, RotateCcw, 
  ArrowUpRight, ArrowDownRight, BarChart3, Activity, Bell, Settings, Search, Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const stores = [
  { id: "shopify", name: "Shopify", logo: ShopifyLogo, bgColor: "bg-[#96bf48]" },
  { id: "shopee", name: "Shopee", logo: ShopeeLogo, bgColor: "bg-[#ee4d2d]" },
  { id: "lazada", name: "Lazada", logo: LazadaLogo, bgColor: "bg-[#0f146d]" },
];

// Mock data for KPIs
const overviewKPIs = {
  totalRevenue: { value: "$404,832", change: 12.5, trend: "up" },
  totalOrders: { value: "2,319", change: 8.2, trend: "up" },
  avgOrderValue: { value: "$174.49", change: 2.1, trend: "up" },
  totalCustomers: { value: "1,202", change: 15.3, trend: "up" },
  conversionRate: { value: "3.24%", change: 0.8, trend: "up" },
  returnRate: { value: "4.2%", change: -1.2, trend: "down" },
};

const shopifyKPIs = {
  revenue: { value: "$27,587", change: 14.2, trend: "up" },
  orders: { value: "100", change: 9.8, trend: "up" },
  avgOrderValue: { value: "$275.87", change: 3.2, trend: "up" },
  customers: { value: "89", change: 12.1, trend: "up" },
  topProducts: [
    { name: "Premium Wireless Headphones", revenue: "$12,450", units: 156 },
    { name: "Smart Watch Pro", revenue: "$9,820", units: 89 },
    { name: "Bluetooth Speaker", revenue: "$5,317", units: 234 },
  ],
};

const shopeeKPIs = {
  revenue: { value: "$164,521", change: 18.7, trend: "up" },
  orders: { value: "1,109", change: 24.2, trend: "up" },
  avgOrderValue: { value: "$148.21", change: 4.3, trend: "up" },
  customers: { value: "612", change: 32.1, trend: "up" },
  topProducts: [
    { name: "Hair Dryer Professional", revenue: "$8,920", units: 445 },
    { name: "Makeup Brush Set 12pcs", revenue: "$6,780", units: 113 },
    { name: "Resistance Bands Set", revenue: "$5,430", units: 271 },
  ],
};

const lazadaKPIs = {
  revenue: { value: "$212,724", change: 22.4, trend: "up" },
  orders: { value: "1,110", change: 19.5, trend: "up" },
  avgOrderValue: { value: "$191.64", change: 5.1, trend: "up" },
  customers: { value: "501", change: 28.3, trend: "up" },
  topProducts: [
    { name: "Air Purifier HEPA Filter", revenue: "$15,320", units: 89 },
    { name: "Water Bottle Insulated 750ml", revenue: "$8,450", units: 345 },
    { name: "Smart LED Desk Lamp", revenue: "$6,890", units: 178 },
  ],
};

const recentOrders = [
  { id: "#SHP950198", customer: "robert439", amount: "$319.96", status: "Pending", store: "shopee", time: "2h ago" },
  { id: "#LAZ551403", customer: "Patricia Williams", amount: "$94.96", status: "Pending", store: "lazada", time: "3h ago" },
  { id: "#LAZ391528", customer: "Sarah Smith", amount: "$541.47", status: "Shipped", store: "lazada", time: "4h ago" },
  { id: "#SHP607760", customer: "jennifer504", amount: "$39.98", status: "Shipped", store: "shopee", time: "5h ago" },
  { id: "#SHO-12345", customer: "Mike Johnson", amount: "$275.00", status: "Completed", store: "shopify", time: "6h ago" },
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

const DemoDashboard = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const platformColors: Record<string, string> = {
    shopify: "#96bf48",
    shopee: "#ee4d2d",
    lazada: "#0f146d",
  };

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
              <h1 className="text-xl font-bold text-gradient-primary">GrowthPulse</h1>
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
            <TabsTrigger value="shopee" className="gap-2">
              <ShopeeLogo className="w-4 h-4" />
              Shopee
            </TabsTrigger>
            <TabsTrigger value="lazada" className="gap-2">
              <LazadaLogo className="w-4 h-4" />
              Lazada
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
                    <Badge variant="outline" className="bg-[#96bf48]/10 text-[#96bf48] border-[#96bf48]/30 flex items-center gap-1">
                      <ShopifyLogo className="w-3 h-3" /> Shopify
                    </Badge>
                    <Badge variant="outline" className="bg-[#ee4d2d]/10 text-[#ee4d2d] border-[#ee4d2d]/30 flex items-center gap-1">
                      <ShopeeLogo className="w-3 h-3" /> Shopee
                    </Badge>
                    <Badge variant="outline" className="bg-[#0f146d]/10 text-[#0f146d] border-[#0f146d]/30 flex items-center gap-1">
                      <LazadaLogo className="w-3 h-3" /> Lazada
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 90, 75, 95].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-0.5">
                        <div className="bg-[#96bf48]/60 rounded-t" style={{ height: `${h * 0.15}%` }} />
                        <div className="bg-[#ee4d2d]/60 rounded-t" style={{ height: `${h * 0.40}%` }} />
                        <div className="bg-[#0f146d]/60 rounded-t" style={{ height: `${h * 0.45}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                    <span>Dec 29</span>
                    <span>Dec 30</span>
                    <span>Dec 31</span>
                    <span>Jan 1</span>
                    <span>Jan 2</span>
                    <span>Jan 3</span>
                    <span>Jan 4</span>
                    <span>Jan 5</span>
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
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#0f146d" strokeWidth="20" strokeDasharray="132 251" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#ee4d2d" strokeWidth="20" strokeDasharray="102 251" strokeDashoffset="-132" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#96bf48" strokeWidth="20" strokeDasharray="17 251" strokeDashoffset="-234" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">$405K</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#0f146d]" />
                        <span className="text-sm">Lazada</span>
                      </div>
                      <span className="font-semibold">$212,724 (53%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ee4d2d]" />
                        <span className="text-sm">Shopee</span>
                      </div>
                      <span className="font-semibold">$164,521 (41%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#96bf48]" />
                        <span className="text-sm">Shopify</span>
                      </div>
                      <span className="font-semibold">$27,587 (7%)</span>
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
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5"
                          style={{ backgroundColor: platformColors[order.store] }}
                        >
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
                          <Badge variant={order.status === "Completed" ? "default" : order.status === "Shipped" ? "secondary" : "outline"} className="text-xs">
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

            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shopifyKPIs.topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#96bf48]/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-[#96bf48]" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                        </div>
                      </div>
                      <p className="font-bold">{product.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shopee Tab */}
          <TabsContent value="shopee" className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#ee4d2d] flex items-center justify-center p-2">
                <ShopeeLogo className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Shopee Store</h3>
                <p className="text-sm text-muted-foreground">Connected • Last synced 2 mins ago</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Revenue" value={shopeeKPIs.revenue.value} change={shopeeKPIs.revenue.change} trend="up" icon={DollarSign} />
              <KPICard title="Orders" value={shopeeKPIs.orders.value} change={shopeeKPIs.orders.change} trend="up" icon={ShoppingCart} />
              <KPICard title="Avg Order Value" value={shopeeKPIs.avgOrderValue.value} change={shopeeKPIs.avgOrderValue.change} trend="up" icon={TrendingUp} />
              <KPICard title="Total Customers" value={shopeeKPIs.customers.value} change={shopeeKPIs.customers.change} trend="up" icon={Users} />
            </div>

            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shopeeKPIs.topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#ee4d2d]/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-[#ee4d2d]" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                        </div>
                      </div>
                      <p className="font-bold">{product.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lazada Tab */}
          <TabsContent value="lazada" className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#0f146d] flex items-center justify-center p-2">
                <LazadaLogo className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Lazada Store</h3>
                <p className="text-sm text-muted-foreground">Connected • Last synced 3 mins ago</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Revenue" value={lazadaKPIs.revenue.value} change={lazadaKPIs.revenue.change} trend="up" icon={DollarSign} />
              <KPICard title="Orders" value={lazadaKPIs.orders.value} change={lazadaKPIs.orders.change} trend="up" icon={ShoppingCart} />
              <KPICard title="Avg Order Value" value={lazadaKPIs.avgOrderValue.value} change={lazadaKPIs.avgOrderValue.change} trend="up" icon={TrendingUp} />
              <KPICard title="Total Customers" value={lazadaKPIs.customers.value} change={lazadaKPIs.customers.change} trend="up" icon={Users} />
            </div>

            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lazadaKPIs.topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#0f146d]/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-[#0f146d]" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                        </div>
                      </div>
                      <p className="font-bold">{product.revenue}</p>
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
