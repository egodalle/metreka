import { ShopifyLogo, ShopeeLogo, LazadaLogo } from "./StoreLogos";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Eye, ArrowUpRight } from "lucide-react";

// Dashboard KPIs matching the actual dashboard
const overviewKPIs = [
  { 
    label: "Total Revenue", 
    value: "$404,832", 
    change: "+23.5%", 
    trend: "up",
    icon: DollarSign,
    subtext: "vs $328,000 last period"
  },
  { 
    label: "Total Orders", 
    value: "2,319", 
    change: "+18.2%", 
    trend: "up",
    icon: ShoppingCart,
    subtext: "1,962 last period"
  },
  { 
    label: "Average Order Value", 
    value: "$174.49", 
    change: "+4.5%", 
    trend: "up",
    icon: Package,
    subtext: "$166.99 last period"
  },
];

const channelBreakdown = [
  { name: "Lazada", revenue: "$212,724", orders: "1,110", percentage: 53, logo: LazadaLogo, color: "#0f146d" },
  { name: "Shopee", revenue: "$164,521", orders: "1,109", percentage: 41, logo: ShopeeLogo, color: "#ee4d2d" },
  { name: "Shopify", revenue: "$27,587", orders: "100", percentage: 7, logo: ShopifyLogo, color: "#96bf48" },
];

const topProducts = [
  { name: "Air Purifier HEPA Filter", sku: "LAZ-001", sales: 89, revenue: "$15,320", channel: "Lazada" },
  { name: "Hair Dryer Professional", sku: "SHP-003", sales: 445, revenue: "$8,920", channel: "Shopee" },
  { name: "Water Bottle Insulated 750ml", sku: "LAZ-005", sales: 345, revenue: "$8,450", channel: "Lazada" },
  { name: "Makeup Brush Set 12pcs", sku: "SHP-004", sales: 113, revenue: "$6,780", channel: "Shopee" },
  { name: "Smart LED Desk Lamp", sku: "LAZ-003", sales: 178, revenue: "$6,890", channel: "Lazada" },
];

const recentOrders = [
  { id: "#SHP-950198", customer: "robert439", items: 4, total: "$319.96", status: "Pending", channel: "Shopee", time: "2 min ago" },
  { id: "#LAZ-551403", customer: "Patricia W.", items: 4, total: "$94.96", status: "Pending", channel: "Lazada", time: "5 min ago" },
  { id: "#LAZ-391528", customer: "Sarah S.", items: 3, total: "$541.47", status: "Shipped", channel: "Lazada", time: "12 min ago" },
  { id: "#SHP-607760", customer: "jennifer504", items: 2, total: "$39.98", status: "Shipped", channel: "Shopee", time: "18 min ago" },
  { id: "#SHO-12345", customer: "Mike J.", items: 1, total: "$275.00", status: "Completed", channel: "Shopify", time: "25 min ago" },
];

// Mini sparkline chart component
const MiniChart = ({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <div
          key={i}
          className="w-1.5 rounded-t"
          style={{
            height: `${((value - min) / range) * 100}%`,
            minHeight: '4px',
            backgroundColor: color,
            opacity: 0.3 + (i / data.length) * 0.7
          }}
        />
      ))}
    </div>
  );
};

// Revenue trend data
const revenueTrend = [45, 52, 48, 61, 55, 67, 72, 68, 78, 85, 82, 94, 89, 98];

const DashboardPreviewSection = () => {
  return (
    <section id="dashboard" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <Eye className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              Live Dashboard Preview
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Your Data,{" "}
            <span className="text-gradient-accent">Unified & Beautiful</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See all your store metrics in one place. This is what your dashboard looks like with real data.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Frame */}
          <div className="glass card-glow rounded-2xl overflow-hidden border border-border/50">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-muted/20">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-foreground">Analytics Overview</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f146d]/20 border border-[#0f146d]/30">
                    <LazadaLogo className="w-4 h-4" />
                    <span className="text-xs text-foreground">Lazada</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ee4d2d]/20 border border-[#ee4d2d]/30">
                    <ShopeeLogo className="w-4 h-4" />
                    <span className="text-xs text-foreground">Shopee</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#96bf48]/20 border border-[#96bf48]/30">
                    <ShopifyLogo className="w-4 h-4" />
                    <span className="text-xs text-foreground">Shopify</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last 30 days • Updated 2 min ago
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overviewKPIs.map((kpi) => (
                  <div key={kpi.label} className="glass rounded-xl p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <kpi.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        kpi.trend === "up" ? "text-green-500" : "text-green-500"
                      }`}>
                        {kpi.trend === "up" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {kpi.change}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.subtext}</p>
                  </div>
                ))}
              </div>

              {/* Middle Row: Revenue Trend + Channel Breakdown */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-foreground">Revenue Trend</h4>
                    <div className="flex items-center gap-2 text-xs text-green-500">
                      <ArrowUpRight className="w-3 h-3" />
                      +23.5% vs last period
                    </div>
                  </div>
                  {/* Simplified chart representation */}
                  <div className="h-32 flex items-end gap-1">
                    {revenueTrend.map((value, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-primary/50 to-primary hover:from-primary/70 hover:to-primary transition-colors"
                        style={{ height: `${value}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>Dec 29</span>
                    <span>Dec 31</span>
                    <span>Jan 2</span>
                    <span>Jan 4</span>
                    <span>Jan 6</span>
                  </div>
                </div>

                {/* Channel Breakdown */}
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold text-foreground mb-4">Channel Breakdown</h4>
                  <div className="space-y-4">
                    {channelBreakdown.map((channel) => (
                      <div key={channel.name}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <channel.logo className="w-5 h-5" />
                            <span className="text-sm text-foreground">{channel.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{channel.revenue}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${channel.percentage}%`,
                              backgroundColor: channel.color 
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {channel.orders} orders • {channel.percentage}% of total
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Products + Recent Orders */}
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Top Products */}
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold text-foreground mb-4">Top Products</h4>
                  <div className="space-y-3">
                    {topProducts.map((product, i) => (
                      <div key={product.sku} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">{product.sku} • {product.channel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{product.revenue}</p>
                          <p className="text-[10px] text-muted-foreground">{product.sales.toLocaleString()} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="glass rounded-xl p-4">
                  <h4 className="font-semibold text-foreground mb-4">Recent Orders</h4>
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          {order.channel === "Shopify" ? (
                            <ShopifyLogo className="w-4 h-4" />
                          ) : order.channel === "Shopee" ? (
                            <ShopeeLogo className="w-4 h-4" />
                          ) : (
                            <LazadaLogo className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{order.id}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              order.status === "Completed" ? "bg-green-500/20 text-green-500" :
                              order.status === "Shipped" ? "bg-blue-500/20 text-blue-500" :
                              "bg-yellow-500/20 text-yellow-500"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {order.customer} • {order.items} items • {order.time}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{order.total}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            * Sample data shown. Your actual dashboard will display real-time data from your connected stores.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreviewSection;
