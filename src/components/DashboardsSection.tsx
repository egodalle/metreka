import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Truck,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Percent,
  Repeat,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  ArrowUpDown
} from "lucide-react";

const dashboards = [
  {
    id: "executive",
    name: "Command Center",
    subtitle: "Executive Dashboard",
    icon: LayoutDashboard,
    description: "CEO/Founder view with real-time business health metrics",
    color: "from-primary to-accent",
    kpis: [
      { name: "Total Revenue & Growth", icon: DollarSign, description: "Revenue with trend data" },
      { name: "Orders Today", icon: ShoppingCart, description: "Real-time order count" },
      { name: "Avg Order Value", icon: Target, description: "Revenue / Orders" },
      { name: "Revenue by Platform", icon: PieChart, description: "Shopify, Amazon, Lazada, Shopee" },
      { name: "Daily Revenue Trends", icon: BarChart3, description: "7-day trend analysis" },
      { name: "MoM Growth", icon: TrendingUp, description: "Month-over-month changes" },
    ],
  },
  {
    id: "sales",
    name: "Sales Engine",
    subtitle: "Sales Performance",
    icon: TrendingUp,
    description: "Deep dive into sales metrics and revenue optimization",
    color: "from-emerald-500 to-teal-500",
    kpis: [
      { name: "Revenue by Channel", icon: DollarSign, description: "Per-platform breakdown" },
      { name: "Orders by Platform", icon: ShoppingCart, description: "Channel comparison" },
      { name: "Sales by Day", icon: Calendar, description: "Daily performance" },
      { name: "7-Day Average", icon: Activity, description: "Rolling weekly average" },
      { name: "30-Day Average", icon: BarChart3, description: "Rolling monthly average" },
      { name: "Revenue Growth Rate", icon: TrendingUp, description: "Growth percentage" },
    ],
  },
  {
    id: "platform",
    name: "Platform Analytics",
    subtitle: "Multi-Channel View",
    icon: Package,
    description: "Compare performance across all connected platforms",
    color: "from-violet-500 to-purple-500",
    kpis: [
      { name: "Shopify Performance", icon: BarChart3, description: "Orders, revenue, AOV" },
      { name: "Amazon Performance", icon: BarChart3, description: "Orders, revenue, AOV" },
      { name: "Lazada Performance", icon: BarChart3, description: "Orders, revenue, AOV" },
      { name: "Shopee Performance", icon: BarChart3, description: "Orders, revenue, AOV" },
      { name: "Platform Comparison", icon: PieChart, description: "Side-by-side metrics" },
      { name: "Active Days", icon: Calendar, description: "Days with sales per platform" },
    ],
  },
  {
    id: "orders",
    name: "Order Insights",
    subtitle: "Operations View",
    icon: ShoppingCart,
    description: "Track order volume, completion rates, and trends",
    color: "from-amber-500 to-orange-500",
    kpis: [
      { name: "Total Orders", icon: ShoppingCart, description: "All-time order count" },
      { name: "Completed Orders", icon: CheckCircle, description: "Successfully fulfilled" },
      { name: "Cancelled Orders", icon: XCircle, description: "Order cancellations" },
      { name: "Items per Order", icon: Package, description: "Average items sold" },
      { name: "Unique Customers", icon: Target, description: "Daily unique buyers" },
      { name: "Order Trends", icon: TrendingUp, description: "7-day order patterns" },
    ],
  },
  {
    id: "fulfillment",
    name: "Fulfillment Tracker",
    subtitle: "Ops Manager View",
    icon: Truck,
    description: "Monitor fulfillment efficiency and operational metrics",
    color: "from-rose-500 to-pink-500",
    kpis: [
      { name: "Fulfillment Rate", icon: Percent, description: "Fulfilled / Total orders" },
      { name: "Fulfilled Today", icon: CheckCircle, description: "Today's completions" },
      { name: "Cancellation Rate", icon: XCircle, description: "Cancel percentage" },
      { name: "Payment Rate", icon: CreditCard, description: "Payment success rate" },
      { name: "Day-over-Day", icon: ArrowUpDown, description: "Daily changes" },
      { name: "Week-over-Week", icon: Repeat, description: "Weekly changes" },
    ],
  },
];

const DashboardsSection = () => {
  return (
    <section id="dashboards" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              5 Production Dashboards
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            30+ <span className="text-gradient-primary">KPIs</span> That Matter
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade analytics dashboards powered by real-time multi-platform data
          </p>
        </div>

        {/* Dashboards Grid */}
        <div className="space-y-8">
          {dashboards.map((dashboard, index) => (
            <div
              key={dashboard.id}
              className={`glass card-glow rounded-2xl p-6 md:p-8 group hover:scale-[1.01] transition-all duration-300 ${
                index % 2 === 0 ? "" : "md:ml-12"
              }`}
            >
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${dashboard.color} flex items-center justify-center shrink-0`}>
                  <dashboard.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      {dashboard.name}
                    </h3>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {dashboard.subtitle}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{dashboard.description}</p>
                </div>
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {dashboard.kpis.map((kpi) => (
                  <div
                    key={kpi.name}
                    className="glass rounded-xl p-4 hover:bg-muted/30 transition-colors group/kpi"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {kpi.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {kpi.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "5", label: "Dashboards" },
            { value: "30+", label: "KPIs Tracked" },
            { value: "<3s", label: "Load Time" },
            { value: "99.5%", label: "Uptime SLA" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardsSection;
