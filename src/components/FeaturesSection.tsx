import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  ShoppingCart,
  PieChart
} from "lucide-react";

const dashboards = [
  {
    title: "Overview",
    subtitle: "Executive View",
    icon: BarChart3,
    color: "from-primary to-cyan",
    kpis: [
      "Total Revenue",
      "Total Orders",
      "Average Order Value",
      "Revenue by Platform",
    ],
  },
  {
    title: "Products",
    subtitle: "Product Analytics",
    icon: Package,
    color: "from-green to-primary",
    kpis: [
      "Total Products",
      "Product Revenue",
      "Units Sold",
      "Top Performing Products",
    ],
  },
  {
    title: "Customers",
    subtitle: "Customer Analytics",
    icon: Users,
    color: "from-purple to-primary",
    kpis: [
      "Total Customers",
      "Customer LTV",
      "Orders per Customer",
      "Top Customers",
    ],
  },
  {
    title: "Profitability",
    subtitle: "Revenue Analysis",
    icon: PieChart,
    color: "from-accent to-orange",
    kpis: [
      "Total Revenue",
      "Platform Breakdown",
      "Order Volume",
      "AOV by Platform",
    ],
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              16+ KPIs Tracked
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            4 Analytics Views, <span className="text-gradient-accent">Real-Time Data</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built dashboards powered by live multi-platform analytics
          </p>
        </div>

        {/* Dashboards Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.title}
              className="glass card-glow rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${dashboard.color} flex items-center justify-center shadow-lg`}>
                  <dashboard.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{dashboard.title}</h3>
                  <p className="text-sm text-muted-foreground">{dashboard.subtitle}</p>
                </div>
              </div>

              {/* KPIs List */}
              <div className="space-y-3">
                {dashboard.kpis.map((kpi) => (
                  <div
                    key={kpi}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {kpi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
