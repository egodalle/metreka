import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  DollarSign,
  ShoppingCart,
  Target,
  PieChart
} from "lucide-react";

const dashboards = [
  {
    id: "overview",
    name: "Overview",
    subtitle: "Executive Dashboard",
    icon: LayoutDashboard,
    description: "Real-time business health metrics across all connected stores",
    color: "from-primary to-accent",
    kpis: [
      { name: "Total Revenue", icon: DollarSign, description: "Revenue with trend data" },
      { name: "Total Orders", icon: ShoppingCart, description: "Real-time order count" },
      { name: "Avg Order Value", icon: Target, description: "Revenue / Orders" },
      { name: "Revenue by Platform", icon: PieChart, description: "Platform breakdown" },
    ],
  },
  {
    id: "products",
    name: "Products",
    subtitle: "Product Analytics",
    icon: Package,
    description: "Track product performance and top sellers across platforms",
    color: "from-emerald-500 to-teal-500",
    kpis: [
      { name: "Total Products", icon: Package, description: "Products sold" },
      { name: "Product Revenue", icon: DollarSign, description: "Total revenue from products" },
      { name: "Units Sold", icon: ShoppingCart, description: "Total units sold" },
      { name: "Top Performers", icon: TrendingUp, description: "Best-selling products" },
    ],
  },
  {
    id: "customers",
    name: "Customers",
    subtitle: "Customer Analytics",
    icon: Target,
    description: "Understand your customers and their purchasing behavior",
    color: "from-violet-500 to-purple-500",
    kpis: [
      { name: "Total Customers", icon: Target, description: "Unique customers" },
      { name: "Customer LTV", icon: DollarSign, description: "Avg lifetime value" },
      { name: "Orders/Customer", icon: ShoppingCart, description: "Avg orders per customer" },
      { name: "Top Customers", icon: TrendingUp, description: "Highest spending customers" },
    ],
  },
  {
    id: "profitability",
    name: "Profitability",
    subtitle: "Revenue Analysis",
    icon: PieChart,
    description: "Analyze revenue and platform performance metrics",
    color: "from-amber-500 to-orange-500",
    kpis: [
      { name: "Total Revenue", icon: DollarSign, description: "All platform revenue" },
      { name: "Platform Breakdown", icon: PieChart, description: "Revenue by platform" },
      { name: "Order Volume", icon: ShoppingCart, description: "Orders by platform" },
      { name: "Avg Order Value", icon: Target, description: "AOV by platform" },
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
              4 Analytics Views
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            16+ <span className="text-gradient-primary">KPIs</span> That Matter
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analytics dashboards powered by real-time multi-platform data
          </p>
        </div>

        {/* Dashboards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="glass card-glow rounded-2xl p-6 md:p-8 group hover:scale-[1.01] transition-all duration-300"
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
              <div className="grid grid-cols-2 gap-3">
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

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "4", label: "Analytics Views" },
            { value: "16+", label: "KPIs Tracked" },
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
