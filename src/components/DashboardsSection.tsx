import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Package, 
  Truck,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Map,
  Clock,
  Percent,
  Heart,
  Repeat,
  Boxes,
  AlertTriangle,
  Timer,
  RotateCcw
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
      { name: "Total Revenue", icon: DollarSign, description: "Sum of all sales with trend" },
      { name: "Orders Today", icon: ShoppingCart, description: "Real-time order count" },
      { name: "Avg Order Value", icon: Target, description: "Revenue / Orders" },
      { name: "Conversion Rate", icon: Percent, description: "Orders / Sessions" },
      { name: "Revenue by Channel", icon: PieChart, description: "Platform breakdown" },
      { name: "Geographic Distribution", icon: Map, description: "Sales by region" },
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
      { name: "Gross Revenue", icon: DollarSign, description: "Total sales amount" },
      { name: "Net Revenue", icon: Activity, description: "After refunds/discounts" },
      { name: "Refund Rate", icon: RotateCcw, description: "Refunds / Orders" },
      { name: "Sales by Hour", icon: Clock, description: "Peak selling times" },
      { name: "Revenue Growth", icon: TrendingUp, description: "MoM, YoY trends" },
      { name: "Category Performance", icon: BarChart3, description: "Revenue by category" },
    ],
  },
  {
    id: "customer",
    name: "Customer Intelligence",
    subtitle: "Customer Analytics",
    icon: Users,
    description: "Understand your customers and maximize lifetime value",
    color: "from-violet-500 to-purple-500",
    kpis: [
      { name: "Customer LTV", icon: Heart, description: "Predicted lifetime revenue" },
      { name: "New vs Returning", icon: Repeat, description: "Customer breakdown" },
      { name: "Acquisition Cost", icon: DollarSign, description: "Marketing spend / New customers" },
      { name: "RFM Segments", icon: Target, description: "Recency, Frequency, Monetary" },
      { name: "Cohort Retention", icon: Users, description: "Retention by signup month" },
      { name: "Purchase Frequency", icon: ShoppingCart, description: "Orders per customer" },
    ],
  },
  {
    id: "product",
    name: "Product Pulse",
    subtitle: "Product & Inventory",
    icon: Package,
    description: "Optimize inventory and identify winning products",
    color: "from-amber-500 to-orange-500",
    kpis: [
      { name: "Inventory Value", icon: Boxes, description: "Stock × Cost" },
      { name: "Stock Turnover", icon: Repeat, description: "COGS / Avg Inventory" },
      { name: "Low Stock Alerts", icon: AlertTriangle, description: "Products below threshold" },
      { name: "Best Sellers", icon: TrendingUp, description: "Top 10 by revenue" },
      { name: "Dead Stock", icon: Package, description: "Products with no sales" },
      { name: "Variant Analysis", icon: BarChart3, description: "Size/Color performance" },
    ],
  },
  {
    id: "operations",
    name: "Fulfillment Tracker",
    subtitle: "Operational Dashboard",
    icon: Truck,
    description: "Monitor fulfillment efficiency and delivery performance",
    color: "from-rose-500 to-pink-500",
    kpis: [
      { name: "Orders Pending", icon: Clock, description: "Unfulfilled orders" },
      { name: "Fulfillment Rate", icon: Percent, description: "Fulfilled / Total" },
      { name: "Avg Fulfillment Time", icon: Timer, description: "Order to ship" },
      { name: "Shipping Costs", icon: DollarSign, description: "Total and per order" },
      { name: "Return Rate", icon: RotateCcw, description: "Returns / Orders" },
      { name: "Perfect Order Rate", icon: Target, description: "Orders without issues" },
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
            50+ <span className="text-gradient-primary">KPIs</span> That Matter
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade analytics dashboards designed for e-commerce decision makers
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
            { value: "50+", label: "KPIs Tracked" },
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
